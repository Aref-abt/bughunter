class ClaudeClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
  }

  async analyzePageAndDecide(screenshot, pageTitle, pageUrl, testingGoal, navigationHistory, interactiveElements = [], explorationState = null) {
    try {
      const prompt = this.buildPrompt(pageTitle, pageUrl, testingGoal, navigationHistory, interactiveElements, explorationState);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshot
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Parse Claude's response
      return this.parseDecision(content);

    } catch (error) {
      console.error('❌ Claude API error:', error);
      // Fallback to simple exploration
      return {
        action: 'click',
        selector: 'a[href]',
        reasoning: 'Fallback: Exploring links'
      };
    }
  }

  buildPrompt(pageTitle, pageUrl, testingGoal, navigationHistory, interactiveElements = [], explorationState = null) {
    const historyText = navigationHistory.map((h, i) =>
      `${i + 1}. ${h.title} (${h.url})`
    ).join('\n');

    // Get filled fields from exploration state
    const filledFields = explorationState ? explorationState.getFilledFields() : [];
    const filledFieldsSet = new Set(filledFields);

    // Format interactive elements list, marking filled fields
    const elementsText = interactiveElements.length > 0
      ? interactiveElements.map((el, i) => {
          const isFilled = filledFieldsSet.has(el.selector);
          const filledMarker = isFilled ? ' ✅ ALREADY FILLED - SKIP THIS' : '';
          return `${i + 1}. [${el.type.toUpperCase()}] "${el.text}" → ${el.selector}${filledMarker} (${el.details || ''})`;
        }).join('\n')
      : 'No interactive elements detected';

    const filledFieldsSummary = filledFields.length > 0
      ? `\nFILLED FIELDS (DO NOT FILL AGAIN):\n${filledFields.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n⚠️ YOU HAVE FILLED ${filledFields.length} FORM FIELD(S)! If you see a submit button, CLICK IT NOW before doing anything else!`
      : '';

    return `You are a QA tester exploring a web application to find bugs.

CURRENT PAGE:
Title: ${pageTitle}
URL: ${pageUrl}

TESTING GOAL: ${testingGoal || 'General exploration to find bugs'}

🔴 CRITICAL RULE - READ FIRST:
If the testing goal mentions ANY button text or button description (examples: "send message", "yellow button", "submit button", "contact us"), you MUST:
1. Look through AVAILABLE INTERACTIVE ELEMENTS below for [BUTTON] entries
2. Find the button where the TEXT in quotes matches what the goal describes
3. Use that button's EXACT selector - DO NOT guess or use generic selectors like button[type="submit"]
Example: Goal says "click send message" → Find line "[BUTTON] 'Send Message' → #someId" → Use SELECTOR: #someId

NAVIGATION CONTEXT:
- Pages already visited: ${navigationHistory.length}
- Previous pages: ${historyText || 'This is the first page'}
- Current focus: Explore new sections and functionality not yet tested

AVAILABLE INTERACTIVE ELEMENTS ON THIS PAGE (${interactiveElements.length}):
${elementsText}${filledFieldsSummary}

INSTRUCTIONS - FOLLOW THIS PRIORITY ORDER:
1. **ABSOLUTE HIGHEST PRIORITY**: If the testing goal mentions SPECIFIC BUTTON TEXT (e.g., "yellow button", "send message", "submit"), you MUST find and click the button that has that EXACT TEXT in the elements list - DO NOT click any other button with a generic selector!
2. **SECOND PRIORITY**: If you see filled form fields (marked with ✅) AND a submit button, CLICK THE SUBMIT BUTTON IMMEDIATELY - DO NOT navigate away or click other links
3. **THIRD PRIORITY**: If unfilled form fields exist, fill them with realistic test data
4. **CRITICAL**: NEVER fill a field marked "✅ ALREADY FILLED - SKIP THIS"
5. Move to the NEXT unfilled field immediately after filling one
6. For DROPDOWN elements - select an option from them (don't just click)
7. After filling ALL form fields, you MUST submit the form before doing anything else and make sure that it was submitted successfully
8. Only explore other sections (header, sidebar, navigation) if no forms need submission
9. Test one area thoroughly before moving to another
10. For complex apps, navigate progressively deeper into workflows
11. Avoid revisiting the same pages unless testing different functionality
12. Look for console errors, broken links, and UI issues

ELEMENT INTERACTION RULES - CRITICAL:
- **🔴 BUTTON TEXT MATCHING IS MANDATORY**: If testing goal mentions button text (e.g., "send message", "yellow button", "submit"), you MUST:
  1. Read the AVAILABLE INTERACTIVE ELEMENTS list carefully
  2. Find the button whose TEXT field matches (e.g., [BUTTON] "Send Message" → some-selector)
  3. Use that button's EXACT selector - DO NOT use button[type="submit"] or any generic selector!
  Example: Goal says "click send message button" → Find [BUTTON] "Send Message" → #submitBtn → Use SELECTOR: #submitBtn

- **SUBMIT BUTTON ALWAYS FIRST**: If form fields are filled (✅) and submit button exists, click submit BEFORE any other action
- **CHECK BUTTON TEXT BEFORE CLICKING**: Look at the button text in the elements list - don't just click any button[type="submit"]
- For INPUT/TEXTAREA elements: Use "fill" action to enter text with realistic data
- **NEVER fill the same field twice** - check if marked "✅ ALREADY FILLED"
- After filling a field, check if all fields are filled - if yes, SUBMIT immediately
- For DROPDOWN elements: Use "select" action to choose an option
- For LINK/BUTTON elements: Use "click" action to navigate or trigger (BUT NOT if forms need submission)
- Use ONLY selectors from the "AVAILABLE INTERACTIVE ELEMENTS" list
- Prefer specific selectors (IDs, names) over generic ones
- If you navigate to the WRONG page by mistake, note it in your reasoning and continue testing from there

⚠️ CRITICAL WARNING: DO NOT click random buttons with generic selectors like button[type="submit"] or button.some-class!
If the user specifies "yellow button that says 'send message'", you MUST scan the elements list for [BUTTON] "Send Message" and use its selector!

Respond in this EXACT format:
ACTION: [fill|select|click|done]
SELECTOR: [Use EXACT selector from the AVAILABLE INTERACTIVE ELEMENTS list]
VALUE: [For 'fill': realistic text data | For 'select': option value/index or empty for first]
REASONING: [What are you testing and why?]

Examples:
ACTION: fill
SELECTOR: #firstName
VALUE: John Smith
REASONING: Testing first name input field with realistic data

ACTION: fill
SELECTOR: input[name="email"]
VALUE: test@example.com
REASONING: Testing email validation with valid format

ACTION: fill
SELECTOR: #phone
VALUE: (555) 123-4567
REASONING: Testing phone input with formatted number

ACTION: select
SELECTOR: #drawer-select
VALUE:
REASONING: Selecting an option from the drawer dropdown to test POS functionality

ACTION: click
SELECTOR: #sendMessageBtn
REASONING: Clicking the "Send Message" button to submit the contact form (matched text from elements list: [BUTTON] "Send Message" → #sendMessageBtn)

ACTION: click
SELECTOR: button[type="submit"]
REASONING: Submitting the form to test validation and processing (only use generic selector if no specific button text was mentioned in goal)

ACTION: click
SELECTOR: a[href*="reports"]
REASONING: Navigating to reports section to explore analytics features

ACTION: done
SELECTOR: none
VALUE: none
REASONING: Thoroughly explored 25 steps: tested all forms, dropdowns, and navigation. Found sufficient bugs.

CRITICAL:
- For INPUT/TEXTAREA elements, ALWAYS use "fill" action with realistic data (not click!)
- For DROPDOWN elements, ALWAYS use "select" action (not click)
- Navigate systematically through different app sections
- Test forms completely: fill all fields, then submit
- VALUE field is REQUIRED for fill action - provide realistic test data

Now analyze the screenshot and available elements, then decide what to test next.`;
  }

  parseDecision(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const decision = {
      action: 'done',
      selector: null,
      value: null,
      reasoning: 'Unable to parse decision',
      formData: null
    };

    try {
      for (const line of lines) {
        if (line.toUpperCase().startsWith('ACTION:')) {
          const action = line.replace(/ACTION:/i, '').trim().toLowerCase();
          // Normalize action names
          if (action.includes('select')) {
            decision.action = 'select';
          } else if (action.includes('click')) {
            decision.action = 'click';
          } else if (action.includes('fill') || action.includes('form')) {
            decision.action = 'fill-form';
          } else if (action.includes('done') || action.includes('complete') || action.includes('finish')) {
            decision.action = 'done';
          } else {
            decision.action = action;
          }
        } else if (line.toUpperCase().startsWith('SELECTOR:')) {
          decision.selector = line.replace(/SELECTOR:/i, '').trim();
        } else if (line.toUpperCase().startsWith('VALUE:')) {
          const value = line.replace(/VALUE:/i, '').trim();
          // Only set value if it's not empty or "none"
          if (value && value.toLowerCase() !== 'none' && value.toLowerCase() !== 'null') {
            decision.value = value;
          }
        } else if (line.toUpperCase().startsWith('REASONING:')) {
          decision.reasoning = line.replace(/REASONING:/i, '').trim();
        }
      }

      // If selector is "none", "null", empty, or contains invalid patterns, treat as done
      if (!decision.selector ||
          decision.selector.toLowerCase() === 'none' ||
          decision.selector.toLowerCase() === 'null' ||
          decision.selector.includes(':contains(') && decision.action !== 'click') {
        decision.action = 'done';
        decision.selector = null;
      }

      // Validate the decision
      if ((decision.action === 'click' || decision.action === 'select') && !decision.selector) {
        console.log(`⚠️  ${decision.action} action without selector, marking as done`);
        decision.action = 'done';
      }

      return decision;
    } catch (error) {
      console.error('❌ Error parsing decision:', error);
      return {
        action: 'done',
        selector: null,
        value: null,
        reasoning: 'Parse error, stopping exploration'
      };
    }
  }

  async analyzeVisualQuality(screenshot, pageTitle, pageUrl, viewportSize = 'desktop') {
    try {
      const prompt = `You are a professional QA engineer analyzing a website screenshot for visual and design quality issues.

PAGE INFORMATION:
- Title: ${pageTitle}
- URL: ${pageUrl}
- Viewport: ${viewportSize} (${viewportSize === 'mobile' ? '375x667' : '1280x720'})

YOUR TASK: Perform a comprehensive visual QA analysis and identify ALL issues in these categories:

1. **SECURITY ISSUES**:
   - Is the page using HTTP instead of HTTPS? (check URL bar/padlock)
   - Any security warnings visible?
   - Mixed content warnings?

2. **LAYOUT & ALIGNMENT ISSUES**:
   - Misaligned elements (buttons, text, images not properly aligned)
   - Overlapping elements (text over text, images over content)
   - Inconsistent spacing or margins
   - Elements cut off or extending beyond containers
   - Broken grid layouts

3. **TYPOGRAPHY & TEXT ISSUES**:
   - Unreadable text (too small, low contrast)
   - Text overlapping other text or images
   - Inconsistent font sizes or styles
   - Poor line spacing or text overflow
   - Text not properly wrapped

4. **COLOR & CONTRAST**:
   - Poor color contrast (text hard to read against background)
   - Clashing color combinations
   - Accessibility issues (WCAG contrast failures)
   - Inconsistent color usage
   - Color palette issues

5. **DESIGN QUALITY**:
   - Unprofessional or amateur design
   - Outdated UI patterns
   - Poor visual hierarchy
   - Inconsistent styling across sections
   - Missing whitespace or overcrowded layouts

6. **RESPONSIVE DESIGN** (especially for mobile):
   - Elements not fitting viewport width
   - Horizontal scroll required
   - Touch targets too small (buttons < 44x44px on mobile)
   - Text too small on mobile
   - Images not responsive

7. **UI/UX ISSUES**:
   - Broken images or missing assets
   - Low quality or pixelated images
   - Confusing navigation
   - Poor button styling or placement
   - Form elements poorly designed

RESPONSE FORMAT:
For EACH issue you find, respond in this exact format:

ISSUE: [category from above]
SEVERITY: [critical|high|medium|low]
TITLE: [Short descriptive title]
DESCRIPTION: [Detailed description of what's wrong]
LOCATION: [Specific area on page: header/main/footer/sidebar/top-left/center/etc.]
COORDINATES: [Approximate bounding box as percentages: left,top,width,height. Example: "10,5,30,8" means 10% from left edge, 5% from top, 30% wide, 8% tall. Estimate the rectangular area where the issue is visible. If uncertain, use your best estimate.]
---

If you find NO issues in a category, skip it. Only report actual problems you can see.

EXAMPLE:
ISSUE: COLOR & CONTRAST
SEVERITY: high
TITLE: Poor text contrast in hero section
DESCRIPTION: White text on light gray background in the main hero section has insufficient contrast ratio (estimated 2.5:1, needs 4.5:1 minimum). This makes the headline difficult to read and fails WCAG AA accessibility standards.
LOCATION: Hero section, top center of page
COORDINATES: 20,25,60,15
---

ISSUE: LAYOUT & ALIGNMENT
SEVERITY: medium
TITLE: Misaligned navigation menu items
DESCRIPTION: Navigation menu items are not vertically aligned. The "About" link appears 3-4 pixels higher than "Home" and "Contact", creating an unprofessional appearance.
LOCATION: Header navigation, top right
COORDINATES: 65,2,30,5
---

Now analyze the screenshot and identify ALL visual quality issues.`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: screenshot
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        console.error('Failed to analyze visual quality');
        return [];
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Parse the issues from Claude's response
      return this.parseVisualIssues(content, pageUrl, screenshot);

    } catch (error) {
      console.error('❌ Visual analysis error:', error);
      return [];
    }
  }

  parseVisualIssues(content, pageUrl, screenshot) {
    const bugs = [];
    const issueBlocks = content.split('---').filter(block => block.trim());

    for (const block of issueBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);

      const issue = {
        type: '',
        severity: 'medium',
        title: '',
        description: '',
        location: '',
        coordinates: null,
        url: pageUrl,
        screenshot: screenshot
      };

      for (const line of lines) {
        if (line.startsWith('ISSUE:')) {
          const category = line.replace('ISSUE:', '').trim().toLowerCase();
          // Map to bug type
          if (category.includes('security')) issue.type = 'security-issue';
          else if (category.includes('layout') || category.includes('alignment')) issue.type = 'layout-issue';
          else if (category.includes('typography') || category.includes('text')) issue.type = 'text-issue';
          else if (category.includes('color') || category.includes('contrast')) issue.type = 'color-contrast';
          else if (category.includes('design')) issue.type = 'design-issue';
          else if (category.includes('responsive')) issue.type = 'responsive-issue';
          else if (category.includes('ui') || category.includes('ux')) issue.type = 'ux-issue';
          else issue.type = 'visual-issue';
        } else if (line.startsWith('SEVERITY:')) {
          issue.severity = line.replace('SEVERITY:', '').trim().toLowerCase();
        } else if (line.startsWith('TITLE:')) {
          issue.title = line.replace('TITLE:', '').trim();
        } else if (line.startsWith('DESCRIPTION:')) {
          issue.description = line.replace('DESCRIPTION:', '').trim();
        } else if (line.startsWith('LOCATION:')) {
          issue.location = line.replace('LOCATION:', '').trim();
        } else if (line.startsWith('COORDINATES:')) {
          const coords = line.replace('COORDINATES:', '').trim();
          // Parse coordinates format: "left,top,width,height" (as percentages)
          const parts = coords.split(',').map(p => parseFloat(p.trim()));
          if (parts.length === 4 && parts.every(p => !isNaN(p))) {
            issue.coordinates = {
              left: parts[0],
              top: parts[1],
              width: parts[2],
              height: parts[3]
            };
          }
        }
      }

      // Only add if we have a title and description
      if (issue.title && issue.description) {
        bugs.push(issue);
      }
    }

    return bugs;
  }

  async analyzeForBugs(screenshot, pageTitle, consoleErrors) {
    // This method could be extended to do deeper bug analysis
    const bugs = [];

    // Add console errors as bugs
    for (const error of consoleErrors) {
      bugs.push({
        type: 'console-error',
        severity: 'medium',
        description: error.message,
        timestamp: error.timestamp
      });
    }

    return bugs;
  }

  async generateWebsiteBrief(screenshots, navigationHistory, testCases, testingGoal) {
    try {
      // Use the first few screenshots for analysis
      const screenshotsToAnalyze = screenshots.slice(0, 5);

      const navigationSummary = navigationHistory.map((h, i) =>
        `${i + 1}. ${h.title} (${h.url})`
      ).join('\n');

      const testSummary = `Total Tests: ${testCases.length}, Passed: ${testCases.filter(t => t.status === 'PASSED').length}, Failed: ${testCases.filter(t => t.status === 'FAILED').length}`;

      const prompt = `You are a professional QA engineer analyzing a website after comprehensive testing.

TESTING SUMMARY:
Goal: ${testingGoal || 'General exploration and bug detection'}
Pages Explored: ${navigationHistory.length}
${testSummary}

PAGES VISITED:
${navigationSummary}

Based on the screenshots and testing data, provide a comprehensive website analysis in the following format:

## Website Overview
[Describe what this website is, its main purpose, and target audience]

## Key Features Identified
[List 3-5 main features or functionality areas discovered]

## User Flows Tested
[Describe the main user journeys that were tested]

## Technology & Design Observations
[Note any observations about the tech stack, UI/UX, performance, etc.]

## Overall Assessment
[Brief assessment of the website's quality, usability, and any notable strengths or concerns]

Provide a professional, detailed analysis suitable for a QA report.`;

      const content = screenshotsToAnalyze.map((ss, i) => ({
        type: i === 0 ? 'text' : 'image',
        ...(i === 0 ? { text: prompt } : {
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: ss.screenshot
          }
        })
      }));

      // Add text prompt first, then images
      const messages = [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...screenshotsToAnalyze.map(ss => ({
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: ss.screenshot
            }
          }))
        ]
      }];

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: messages
        })
      });

      if (!response.ok) {
        console.error('Failed to generate website brief');
        return 'Website analysis could not be generated.';
      }

      const data = await response.json();
      return data.content[0].text;

    } catch (error) {
      console.error('❌ Error generating website brief:', error);
      return 'Website analysis could not be generated due to an error.';
    }
  }
}

module.exports = ClaudeClient;

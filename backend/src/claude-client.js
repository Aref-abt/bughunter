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

NAVIGATION CONTEXT:
- Pages already visited: ${navigationHistory.length}
- Previous pages: ${historyText || 'This is the first page'}
- Current focus: Explore new sections and functionality not yet tested

AVAILABLE INTERACTIVE ELEMENTS ON THIS PAGE (${interactiveElements.length}):
${elementsText}${filledFieldsSummary}

INSTRUCTIONS - FOLLOW THIS PRIORITY ORDER:
1. **HIGHEST PRIORITY**: If you see filled form fields (marked with ✅) AND a submit button, CLICK THE SUBMIT BUTTON IMMEDIATELY - DO NOT navigate away or click other links
2. **SECOND PRIORITY**: If unfilled form fields exist, fill them with realistic test data
3. **CRITICAL**: NEVER fill a field marked "✅ ALREADY FILLED - SKIP THIS"
4. Move to the NEXT unfilled field immediately after filling one
5. For DROPDOWN elements - select an option from them (don't just click)
6. After filling ALL form fields, you MUST submit the form before doing anything else
7. Only explore other sections (header, sidebar, navigation) if no forms need submission
8. Test one area thoroughly before moving to another
9. For complex apps, navigate progressively deeper into workflows
10. Avoid revisiting the same pages unless testing different functionality
11. Look for console errors, broken links, and UI issues

ELEMENT INTERACTION RULES - CRITICAL:
- **SUBMIT BUTTON ALWAYS FIRST**: If form fields are filled (✅) and submit button exists, click submit BEFORE any other action
- For INPUT/TEXTAREA elements: Use "fill" action to enter text with realistic data
- **NEVER fill the same field twice** - check if marked "✅ ALREADY FILLED"
- After filling a field, check if all fields are filled - if yes, SUBMIT immediately
- For DROPDOWN elements: Use "select" action to choose an option
- For LINK/BUTTON elements: Use "click" action to navigate or trigger (BUT NOT if forms need submission)
- Use ONLY selectors from the "AVAILABLE INTERACTIVE ELEMENTS" list
- Prefer specific selectors (IDs, names) over generic ones

⚠️ WARNING: DO NOT navigate to other pages or click navigation links if form fields are filled but not yet submitted!

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
SELECTOR: button[type="submit"]
REASONING: Submitting the form to test validation and processing

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

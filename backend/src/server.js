const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const PlaywrightRunner = require('./playwright-runner');
const ClaudeClient = require('./claude-client');
const BugDetector = require('./bug-detector');
const ReportGenerator = require('./report-generator');
const ExplorationState = require('./exploration-state');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware here
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Store active test sessions
const activeSessions = new Map();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    claudeApiKey: process.env.CLAUDE_API_KEY ? 'configured' : 'missing' 
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('start-test', async (data) => {
    const sessionId = uuidv4();
    const { targetUrl, cookies, testingGoal } = data;

    console.log(`🚀 Starting test session: ${sessionId}`);
    console.log(`   Target: ${targetUrl}`);
    console.log(`   Cookies: ${cookies.length} provided`);
    console.log(`   Goal: ${testingGoal || 'General exploration'}`);

    // Validate Claude API key
    if (!process.env.CLAUDE_API_KEY) {
      socket.emit('error', { 
        message: 'Claude API key not configured. Please add CLAUDE_API_KEY to your .env file.' 
      });
      return;
    }

    try {
      // Initialize components
      const claudeClient = new ClaudeClient(process.env.CLAUDE_API_KEY);
      const playwrightRunner = new PlaywrightRunner();
      const bugDetector = new BugDetector();
      const reportGenerator = new ReportGenerator();

      // Store session
      const session = {
        id: sessionId,
        targetUrl,
        cookies,
        testingGoal,
        startTime: Date.now(),
        bugs: [],
        testCases: [], // Track all test cases (passed and failed)
        screenshots: [],
        navigationHistory: [],
        websiteBrief: null, // AI-generated website analysis
        userGuidance: null, // User guidance for next AI decision
        status: 'running',
        // Page coverage tracking for scenario-based testing
        currentPageUrl: null,
        currentPageElements: [], // All interactive elements on current page
        testedElements: new Set(), // Selectors of elements we've interacted with
        currentPageCoverage: 0, // Percentage of page elements tested
        testedPages: new Map(), // URL -> coverage percentage
        mobileTestingCompleted: false // Flag to prevent mobile interrupting scenarios
      };
      activeSessions.set(sessionId, session);

      // Emit session started
      socket.emit('session-started', { sessionId });

      // Start browser and inject cookies
      socket.emit('progress', { 
        message: 'Launching browser...', 
        percentage: 10 
      });

      await playwrightRunner.launch();
      
      socket.emit('progress', { 
        message: 'Injecting authentication cookies...', 
        percentage: 20 
      });

      await playwrightRunner.setCookies(cookies);
      
      socket.emit('progress', { 
        message: 'Navigating to target URL...', 
        percentage: 30 
      });

      await playwrightRunner.goto(targetUrl);

      // Verify authentication
      const currentUrl = playwrightRunner.getCurrentUrl();
      if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
        throw new Error('Authentication failed - cookies may be expired or invalid');
      }

      socket.emit('progress', { 
        message: '✅ Successfully authenticated!', 
        percentage: 40 
      });

      // Helper function to check if a bug is similar to existing ones (smart deduplication)
      const isSimilarBug = (newBug, existingBugs) => {
        return existingBugs.some(existing => {
          // Same type is required
          if (existing.type !== newBug.type) return false;

          // For security issues, one per type is enough (e.g., only report HTTP once)
          if (newBug.type === 'security-issue') return true;

          // For other issues, check title similarity using keyword matching
          const existingTitle = existing.title.toLowerCase();
          const newTitle = newBug.title.toLowerCase();

          // Extract key words (ignore common words)
          const commonWords = ['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'mobile:', 'issue', 'problem', 'detected'];
          const getKeyWords = (title) => {
            return title.split(/\s+/)
              .filter(word => word.length > 3 && !commonWords.includes(word))
              .map(word => word.replace(/[^a-z0-9]/g, ''));
          };

          const existingWords = new Set(getKeyWords(existingTitle));
          const newWords = getKeyWords(newTitle);

          // If 50%+ of key words match, consider it a duplicate (stricter deduplication)
          if (newWords.length === 0) return false;
          const matchCount = newWords.filter(word => existingWords.has(word)).length;
          const similarity = matchCount / newWords.length;

          return similarity >= 0.5;
        });
      };

      // Start exploration
      let stepCount = 0;
      const maxSteps = 35; // Increased to ensure tasks complete
      const state = new ExplorationState(); // Initialize exploration state
      session.explorationState = state;
      const testedMobileUrls = new Set(); // Track URLs already tested on mobile

      while (stepCount < maxSteps && session.status === 'running') {
        // Check if exploration should stop early
        const stopCheck = state.shouldStopExploration(stepCount, maxSteps);
        if (stopCheck.shouldStop) {
          console.log(`⏹️ Stopping early: ${stopCheck.reason}`);
          socket.emit('progress', {
            message: `✅ Exploration complete: ${stopCheck.reason}`,
            percentage: 90
          });
          break;
        }
        stepCount++;
        const progress = 40 + (stepCount / maxSteps) * 50;

        socket.emit('progress', { 
          message: `Exploring step ${stepCount}/${maxSteps}...`, 
          percentage: progress 
        });

        // Take screenshot
        const screenshot = await playwrightRunner.takeScreenshot();
        const pageTitle = await playwrightRunner.getPageTitle();
        const pageUrl = playwrightRunner.getCurrentUrl();

        // Record visit for exploration tracking
        state.recordVisit(pageUrl);

        // Check for bugs (console errors, broken elements)
        const consoleErrors = playwrightRunner.getConsoleErrors();
        if (consoleErrors.length > 0) {
          const bug = {
            id: uuidv4(),
            type: 'console-error',
            severity: 'medium',
            title: 'Console Error Detected',
            description: consoleErrors[0].message,
            url: pageUrl,
            screenshot: screenshot,
            timestamp: Date.now()
          };
          session.bugs.push(bug);
          socket.emit('bug-found', bug);
        }

        // === COMPREHENSIVE VISUAL QA ANALYSIS ===

        // 1. Security Analysis (HTTP vs HTTPS)
        socket.emit('progress', {
          message: `🔒 Checking security (HTTP/HTTPS)...`,
          percentage: progress
        });

        const securityIssues = await playwrightRunner.detectSecurityIssues(pageUrl);
        for (const issue of securityIssues) {
          // Check if this issue was already reported (smart similarity check)
          if (!isSimilarBug(issue, session.bugs)) {
            issue.id = uuidv4();
            issue.bugNumber = session.bugs.length + 1;
            issue.screenshot = screenshot;
            session.bugs.push(issue);
            socket.emit('bug-found', issue);
            console.log(`🔒 Security issue detected: ${issue.title}`);
          } else {
            console.log(`⏭️ Skipping duplicate: ${issue.title}`);
          }
        }

        // 2. Visual Quality Analysis by AI (Desktop)
        socket.emit('progress', {
          message: `👁️ AI analyzing visual quality (desktop)...`,
          percentage: progress
        });

        const visualBugs = await claudeClient.analyzeVisualQuality(
          screenshot,
          pageTitle,
          pageUrl,
          'desktop'
        );

        for (const bug of visualBugs) {
          // Check if this visual issue was already reported (smart similarity check)
          if (!isSimilarBug(bug, session.bugs)) {
            bug.id = uuidv4();
            bug.bugNumber = session.bugs.length + 1;

            // Annotate screenshot with red rectangle if coordinates provided
            if (bug.coordinates) {
              console.log(`🔴 Annotating screenshot for: ${bug.title}`);
              bug.screenshot = await playwrightRunner.annotateScreenshot(
                bug.screenshot,
                bug.coordinates,
                { width: 1280, height: 720 }
              );
            }

            session.bugs.push(bug);
            socket.emit('bug-found', bug);
            console.log(`👁️ Visual issue detected: ${bug.title} (${bug.type})`);
          } else {
            console.log(`⏭️ Skipping duplicate visual issue: ${bug.title}`);
          }
        }

        // 3. Mobile Responsiveness Testing (only after page is well-tested to avoid interrupting scenarios)
        // Test mobile when: page coverage >= 70% AND not yet tested on mobile AND not already testing mobile
        if (session.currentPageCoverage >= 70 && !session.mobileTestingCompleted && !testedMobileUrls.has(pageUrl)) {
          testedMobileUrls.add(pageUrl); // Mark this URL as tested on mobile
          session.mobileTestingCompleted = true; // Prevent re-testing mobile on same page

          socket.emit('progress', {
            message: `📱 Testing mobile responsiveness (page ${session.currentPageCoverage}% tested)...`,
            percentage: progress
          });

          // Switch to mobile viewport
          await playwrightRunner.setMobileViewport();
          await playwrightRunner.page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});

          // Take mobile screenshot
          const mobileScreenshot = await playwrightRunner.takeScreenshot();

          // Detect responsive issues
          const responsiveIssues = await playwrightRunner.detectResponsiveIssues();
          for (const problem of responsiveIssues) {
            const issue = {
              type: 'responsive-issue',
              severity: problem.type === 'horizontal-scroll' ? 'high' : 'medium',
              title: `Mobile: ${problem.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
              description: problem.description,
              url: pageUrl,
              screenshot: mobileScreenshot
            };

            // Check for duplicates before adding
            if (!isSimilarBug(issue, session.bugs)) {
              issue.id = uuidv4();
              issue.bugNumber = session.bugs.length + 1;
              session.bugs.push(issue);
              socket.emit('bug-found', issue);
              console.log(`📱 Mobile issue detected: ${issue.title}`);
            } else {
              console.log(`⏭️ Skipping duplicate mobile issue: ${issue.title}`);
            }
          }

          // AI Visual Analysis (Mobile)
          const mobileVisualBugs = await claudeClient.analyzeVisualQuality(
            mobileScreenshot,
            pageTitle,
            pageUrl,
            'mobile'
          );

          for (const bug of mobileVisualBugs) {
            bug.title = `Mobile: ${bug.title}`;

            // Check if this mobile issue was already reported (smart similarity check)
            if (!isSimilarBug(bug, session.bugs)) {
              bug.id = uuidv4();
              bug.bugNumber = session.bugs.length + 1;

              // Annotate mobile screenshot with red rectangle if coordinates provided
              if (bug.coordinates) {
                console.log(`🔴 Annotating mobile screenshot for: ${bug.title}`);
                bug.screenshot = await playwrightRunner.annotateScreenshot(
                  bug.screenshot,
                  bug.coordinates,
                  { width: 375, height: 667 }
                );
              }

              session.bugs.push(bug);
              socket.emit('bug-found', bug);
              console.log(`📱 Mobile visual issue: ${bug.title}`);
            } else {
              console.log(`⏭️ Skipping duplicate mobile issue: ${bug.title}`);
            }
          }

          // Switch back to desktop
          await playwrightRunner.setDesktopViewport();
          await playwrightRunner.page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});
        }

        // 4. Detect Overlapping Elements (programmatically)
        const overlaps = await playwrightRunner.detectOverlappingElements();
        if (overlaps.length > 0) {
          const overlapIssue = {
            type: 'layout-issue',
            severity: 'medium',
            title: 'Overlapping Text Elements Detected',
            description: `Found ${overlaps.length} instances of overlapping text elements: ${overlaps.map(o => `"${o.text1.substring(0, 30)}" overlaps "${o.text2.substring(0, 30)}"`).join('; ')}`,
            url: pageUrl,
            screenshot: screenshot
          };

          // Check for duplicates before adding
          if (!isSimilarBug(overlapIssue, session.bugs)) {
            overlapIssue.id = uuidv4();
            overlapIssue.bugNumber = session.bugs.length + 1;
            session.bugs.push(overlapIssue);
            socket.emit('bug-found', overlapIssue);
            console.log(`⚠️ Layout issue detected: Overlapping elements`);
          } else {
            console.log(`⏭️ Skipping duplicate overlap issue`);
          }
        }

        // Save screenshot and navigation
        session.screenshots.push({
          id: uuidv4(),
          url: pageUrl,
          title: pageTitle,
          screenshot: screenshot,
          timestamp: Date.now()
        });

        session.navigationHistory.push({
          step: stepCount,
          url: pageUrl,
          title: pageTitle
        });

        // Get interactive elements on the page
        const interactiveElements = await playwrightRunner.getInteractiveElements();

        // === PAGE COVERAGE TRACKING FOR SCENARIO-BASED TESTING ===

        // Check if we moved to a new page
        if (session.currentPageUrl !== pageUrl) {
          // Save coverage of previous page
          if (session.currentPageUrl) {
            session.testedPages.set(session.currentPageUrl, session.currentPageCoverage);
            console.log(`✅ Completed page: ${session.currentPageUrl} (${session.currentPageCoverage}% coverage)`);
          }

          // Reset for new page
          session.currentPageUrl = pageUrl;
          session.currentPageElements = interactiveElements.map(e => e.selector);
          session.testedElements = new Set();
          session.currentPageCoverage = 0;
          session.mobileTestingCompleted = false; // Reset mobile testing flag for new page

          console.log(`📄 New page detected: ${pageUrl} (${interactiveElements.length} interactive elements)`);
        }

        // Calculate current page coverage
        if (session.currentPageElements.length > 0) {
          session.currentPageCoverage = Math.round(
            (session.testedElements.size / session.currentPageElements.length) * 100
          );
        }

        console.log(`📊 Page coverage: ${session.currentPageCoverage}% (${session.testedElements.size}/${session.currentPageElements.length} elements tested)`);

        // Ask Claude what to do next
        socket.emit('progress', {
          message: `🤖 AI analyzing page: "${pageTitle}" (${session.currentPageCoverage}% tested)...`,
          percentage: progress
        });

        const decision = await claudeClient.analyzePageAndDecide(
          screenshot,
          pageTitle,
          pageUrl,
          testingGoal,
          session.navigationHistory,
          interactiveElements,
          state,
          session.userGuidance // Include user guidance if available
        );

        // Clear guidance after AI uses it
        if (session.userGuidance) {
          console.log(`✅ AI incorporated user guidance`);
          session.userGuidance = null;
        }

        socket.emit('ai-decision', { 
          step: stepCount,
          decision: decision.action,
          reasoning: decision.reasoning
        });

        // Execute the decision with error handling
        let testCaseResult = null;
        try {
          if (decision.action === 'click') {
            // Detect if this is a submit button
            const isSubmitButton = decision.selector.includes('submit') ||
                                   decision.selector.includes('Submit') ||
                                   decision.reasoning?.toLowerCase().includes('submit');

            const originalUrl = pageUrl;
            const clickResult = await playwrightRunner.clickElement(decision.selector);

            // If submit button was clicked successfully, detect submission result
            let submissionResult = null;
            if (clickResult.success && isSubmitButton) {
              console.log('📋 Detected form submission, checking result...');
              submissionResult = await playwrightRunner.detectFormSubmissionResult(originalUrl);
            }

            // Create test case based on whether it's a submission or regular click
            if (submissionResult) {
              testCaseResult = {
                id: `TC-${stepCount}`,
                type: 'form-submission',
                action: 'submit',
                target: decision.selector,
                description: `Submit form via "${decision.selector}"`,
                expectedResult: `Form should submit successfully and show confirmation`,
                actualResult: submissionResult.message,
                status: submissionResult.status,
                reasoning: decision.reasoning,
                timestamp: Date.now(),
                page: pageTitle,
                url: pageUrl,
                submissionDetails: {
                  urlChanged: submissionResult.urlChanged,
                  newUrl: submissionResult.newUrl,
                  indicators: submissionResult.indicators
                }
              };
            } else {
              testCaseResult = {
                id: `TC-${stepCount}`,
                type: 'navigation',
                action: 'click',
                target: decision.selector,
                description: `Click on "${decision.selector}"`,
                expectedResult: `Element should be clickable and page should respond`,
                actualResult: clickResult.success
                  ? `Element clicked successfully (${clickResult.attempts} attempt${clickResult.attempts > 1 ? 's' : ''})`
                  : `Click failed: ${clickResult.error} (${clickResult.attempts} attempt${clickResult.attempts > 1 ? 's' : ''})`,
                status: clickResult.success ? 'PASSED' : 'FAILED',
                reasoning: decision.reasoning,
                timestamp: Date.now(),
                page: pageTitle,
                url: pageUrl
              };
            }

            if (clickResult.success) {
              state.recordSuccessfulInteraction(decision.selector, 'click');
              // Track element as tested for coverage
              session.testedElements.add(decision.selector);
              console.log(`✅ Tested element: ${decision.selector} (${session.testedElements.size}/${session.currentPageElements.length})`);
              await playwrightRunner.waitForNavigation();
            } else {
              state.recordFailedSelector(decision.selector, clickResult.error);
              console.log(`⚠️  Click failed for: ${decision.selector}, continuing...`);
            }
          } else if (decision.action === 'select') {
            const selectSuccess = await playwrightRunner.selectDropdownOption(decision.selector, decision.value);
            testCaseResult = {
              id: `TC-${stepCount}`,
              type: 'interaction',
              action: 'select',
              target: decision.selector,
              value: decision.value || 'first available option',
              description: `Select option from dropdown "${decision.selector}"`,
              expectedResult: `Dropdown should have selectable options`,
              actualResult: selectSuccess ? `Option selected successfully` : 'Dropdown not found or no valid options',
              status: selectSuccess ? 'PASSED' : 'FAILED',
              reasoning: decision.reasoning,
              timestamp: Date.now(),
              page: pageTitle,
              url: pageUrl
            };
            if (selectSuccess) {
              state.recordSuccessfulInteraction(decision.selector, 'select');
              // Track element as tested for coverage
              session.testedElements.add(decision.selector);
              console.log(`✅ Tested dropdown: ${decision.selector} (${session.testedElements.size}/${session.currentPageElements.length})`);
              await playwrightRunner.waitForNavigation();
              socket.emit('progress', {
                message: `✅ Selected dropdown option`,
                percentage: progress
              });
            } else {
              state.recordFailedSelector(decision.selector, 'Dropdown not found or no valid options');
              console.log(`⚠️  Dropdown selection failed for: ${decision.selector}, continuing...`);
            }
          } else if (decision.action === 'fill-form') {
            // If no formData but has selector and value, create single-field form data
            const formDataToFill = decision.formData || (decision.selector && decision.value ? [{
              selector: decision.selector,
              value: decision.value
            }] : null);

            if (!formDataToFill) {
              console.log('⚠️  No form data to fill, skipping...');
              continue;
            }

            const fillResult = await playwrightRunner.fillForm(formDataToFill, {
              scrollIntoView: true,
              triggerEvents: true,
              validateFill: true
            });
            testCaseResult = {
              id: `TC-${stepCount}`,
              type: 'form-filling',
              action: 'fill-form',
              description: `Fill ${fillResult.filled + fillResult.failed} form field(s)`,
              expectedResult: `All form fields should be filled and validated`,
              actualResult: fillResult.success
                ? `${fillResult.filled} field(s) filled successfully`
                : `${fillResult.filled} filled, ${fillResult.failed} failed: ${fillResult.failures.map(f => f.selector).join(', ')}`,
              status: fillResult.success && fillResult.failed === 0 ? 'PASSED' : 'FAILED',
              reasoning: decision.reasoning,
              timestamp: Date.now(),
              page: pageTitle,
              url: pageUrl
            };
            if (fillResult.success) {
              // Record each successfully filled field
              if (formDataToFill) {
                const fields = Array.isArray(formDataToFill) ? formDataToFill : [formDataToFill];
                fields.forEach(field => {
                  if (field && field.selector) {
                    state.recordSuccessfulInteraction(field.selector, 'fill');
                    // Track each filled field for coverage
                    session.testedElements.add(field.selector);
                  }
                });
                console.log(`✅ Tested ${fields.length} form field(s) (${session.testedElements.size}/${session.currentPageElements.length})`);
              }
              await playwrightRunner.waitForNavigation();
            } else {
              // Record failed fields
              fillResult.failures.forEach(failure => {
                state.recordFailedSelector(failure.selector, failure.error);
              });
            }
          } else if (decision.action === 'done') {
            socket.emit('progress', {
              message: '✅ AI completed exploration',
              percentage: 90
            });
            break;
          } else {
            console.log(`⚠️  Unknown action: ${decision.action}, continuing...`);
          }

          // Record test case
          if (testCaseResult) {
            session.testCases.push(testCaseResult);
          }
        } catch (actionError) {
          console.error(`❌ Error executing action ${decision.action}:`, actionError.message);

          // Record failed test case
          testCaseResult = {
            id: `TC-${stepCount}`,
            type: 'error',
            action: decision.action,
            target: decision.selector,
            description: `Attempt to ${decision.action} on "${decision.selector}"`,
            expectedResult: `Action should execute without errors`,
            actualResult: `Error: ${actionError.message}`,
            status: 'FAILED',
            reasoning: decision.reasoning,
            timestamp: Date.now(),
            page: pageTitle,
            url: pageUrl
          };
          session.testCases.push(testCaseResult);

          // Don't throw, just continue to next step
          socket.emit('progress', {
            message: `⚠️  Step ${stepCount} encountered an error, continuing...`,
            percentage: progress
          });
        }

        // Small delay between steps
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if stop was requested
        if (session.status === 'stopping') {
          console.log(`⏹️ Stopping at step ${stepCount}`);
          socket.emit('progress', {
            message: 'Test stopped by user - generating partial report...',
            percentage: 90
          });
          break;
        }
      }

      // Determine if this was a stopped test
      const isStopped = session.status === 'stopping';

      // Generate website brief (always, even for stopped tests)
      socket.emit('progress', {
        message: isStopped
          ? '📝 Analyzing partial results and generating report...'
          : '📝 Analyzing website and generating comprehensive report...',
        percentage: 92
      });

      const websiteBrief = await claudeClient.generateWebsiteBrief(
        session.screenshots,
        session.navigationHistory,
        session.testCases,
        testingGoal
      );
      session.websiteBrief = websiteBrief;

      // Generate final report (works with partial data)
      socket.emit('progress', {
        message: isStopped ? 'Generating partial report...' : 'Generating visual report...',
        percentage: 95
      });

      const report = await reportGenerator.generate({
        ...session,
        isPartial: isStopped,
        stepsCompleted: stepCount,
        maxStepsPlanned: maxSteps
      });

      socket.emit('progress', {
        message: isStopped ? '✅ Partial results ready!' : '✅ Test complete!',
        percentage: 100
      });

      // Send appropriate event based on completion type
      if (isStopped) {
        socket.emit('test-stopped', {
          sessionId,
          report,
          bugsFound: session.bugs.length,
          pagesVisited: session.navigationHistory.length,
          duration: Date.now() - session.startTime,
          stepsCompleted: stepCount,
          isPartial: true
        });
      } else {
        socket.emit('test-complete', {
          sessionId,
          report,
          bugsFound: session.bugs.length,
          pagesVisited: session.navigationHistory.length,
          duration: Date.now() - session.startTime
        });
      }

      // Cleanup
      await playwrightRunner.close();
      session.status = isStopped ? 'stopped' : 'complete';

    } catch (error) {
      console.error('❌ Test error:', error);
      socket.emit('error', {
        message: error.message,
        stack: error.stack
      });

      // Cleanup on error - ensure browser is closed
      try {
        if (playwrightRunner && playwrightRunner.browser) {
          await playwrightRunner.close();
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError.message);
      }

      const session = activeSessions.get(sessionId);
      if (session) {
        session.status = 'error';
      }
    }
  });

  socket.on('stop-test', async (data) => {
    const { sessionId } = data;
    const session = activeSessions.get(sessionId);

    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    if (session.status !== 'running') {
      socket.emit('progress', {
        message: `Test is already ${session.status}`,
        percentage: 100
      });
      return;
    }

    console.log(`⏹️ Stop requested for session: ${sessionId}`);
    session.status = 'stopping';

    socket.emit('progress', {
      message: 'Stopping test and cleaning up...',
      percentage: 95
    });
  });

  socket.on('send-guidance', async (data) => {
    const { sessionId, guidance } = data;
    const session = activeSessions.get(sessionId);

    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    if (session.status !== 'running') {
      socket.emit('error', { message: 'Cannot send guidance - test is not running' });
      return;
    }

    console.log(`💬 User guidance received for session ${sessionId}: "${guidance}"`);
    session.userGuidance = guidance;

    socket.emit('progress', {
      message: '💬 Guidance received - AI will incorporate in next step...',
      percentage: session.navigationHistory.length * 3
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 BugHunter server running on port ${PORT}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`   Claude API Key: ${process.env.CLAUDE_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log('\n⚠️  Make sure to set CLAUDE_API_KEY in your .env file!\n');
});

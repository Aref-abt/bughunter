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

// Middleware
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
        status: 'running'
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

      // Start exploration
      let stepCount = 0;
      const maxSteps = 35; // Increased to ensure tasks complete
      const state = new ExplorationState(); // Initialize exploration state
      session.explorationState = state;

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

        // Ask Claude what to do next
        socket.emit('progress', {
          message: `🤖 AI analyzing page: "${pageTitle}"...`,
          percentage: progress
        });

        const decision = await claudeClient.analyzePageAndDecide(
          screenshot,
          pageTitle,
          pageUrl,
          testingGoal,
          session.navigationHistory,
          interactiveElements,
          state
        );

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
                  }
                });
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

      // Generate website brief (skip for stopped tests to save time)
      if (!isStopped) {
        socket.emit('progress', {
          message: '📝 Analyzing website and generating comprehensive report...',
          percentage: 92
        });

        const websiteBrief = await claudeClient.generateWebsiteBrief(
          session.screenshots,
          session.navigationHistory,
          session.testCases,
          testingGoal
        );
        session.websiteBrief = websiteBrief;
      } else {
        session.websiteBrief = `Test was stopped by user after ${stepCount} steps. Partial analysis based on collected data.`;
      }

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

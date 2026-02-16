const ScreenshotAnnotator = require('./screenshot-annotator');

class ReportGenerator {
  constructor() {
    this.annotator = new ScreenshotAnnotator();
  }

  async generate(session) {
    const {
      bugs,
      testCases = [],
      screenshots,
      navigationHistory,
      startTime,
      targetUrl,
      websiteBrief,
      isPartial = false,
      stepsCompleted = 0,
      maxStepsPlanned = 25
    } = session;

    const duration = Date.now() - startTime;
    const durationSeconds = Math.floor(duration / 1000);

    // Generate improved Mermaid flow chart
    const flowChart = this.generateFlowChart(navigationHistory, testCases);

    // Annotate bug screenshots
    const annotatedBugs = await this.annotateBugScreenshots(bugs);

    // Test case statistics
    const passedTests = testCases.filter(tc => tc.status === 'PASSED').length;
    const failedTests = testCases.filter(tc => tc.status === 'FAILED').length;
    const testCoverage = {
      navigation: testCases.filter(tc => tc.type === 'navigation').length,
      interaction: testCases.filter(tc => tc.type === 'interaction').length,
      formFilling: testCases.filter(tc => tc.type === 'form-filling').length,
      errors: testCases.filter(tc => tc.type === 'error').length
    };

    // Create summary
    const summary = {
      testDuration: `${durationSeconds}s`,
      targetUrl: targetUrl,
      pagesVisited: navigationHistory.length,
      bugsFound: bugs.length,
      bugsBySeverity: this.countBySeverity(bugs),
      totalTestCases: testCases.length,
      testsPassed: passedTests,
      testsFailed: failedTests,
      passRate: testCases.length > 0 ? Math.round((passedTests / testCases.length) * 100) : 0,
      testCoverage,
      timestamp: new Date().toISOString(),
      isPartial: isPartial,
      stepsCompleted: stepsCompleted,
      maxStepsPlanned: maxStepsPlanned,
      completionPercentage: maxStepsPlanned > 0 ? Math.round((stepsCompleted / maxStepsPlanned) * 100) : 0
    };

    // Create detailed bug reports
    const detailedBugs = annotatedBugs.map((bug, index) => ({
      ...bug,
      bugNumber: index + 1,
      stepsToReproduce: this.generateStepsToReproduce(bug, navigationHistory)
    }));

    // Group test cases by type for better organization
    const organizedTestCases = {
      passed: testCases.filter(tc => tc.status === 'PASSED'),
      failed: testCases.filter(tc => tc.status === 'FAILED'),
      byType: {
        navigation: testCases.filter(tc => tc.type === 'navigation'),
        interaction: testCases.filter(tc => tc.type === 'interaction'),
        formFilling: testCases.filter(tc => tc.type === 'form-filling'),
        errors: testCases.filter(tc => tc.type === 'error')
      }
    };

    return {
      summary,
      websiteBrief: websiteBrief || 'Website analysis not available.',
      flowChart,
      bugs: detailedBugs,
      testCases: organizedTestCases,
      allTestCases: testCases, // Keep all for detailed view
      screenshots: screenshots.slice(0, 10), // Limit screenshots
      navigationPath: navigationHistory,
      isPartial: isPartial,
      partialDataNotice: isPartial
        ? `This report contains partial results. Testing was stopped after ${stepsCompleted} of ${maxStepsPlanned} planned steps (${Math.round((stepsCompleted / maxStepsPlanned) * 100)}% complete).`
        : null
    };
  }

  generateFlowChart(navigationHistory, testCases = []) {
    if (navigationHistory.length === 0) {
      return '';
    }

    let mermaid = 'graph TB\n'; // Top to Bottom for better readability

    // Group pages by URL to avoid duplicates
    const uniquePages = [];
    const seenUrls = new Set();

    for (let i = 0; i < navigationHistory.length; i++) {
      const current = navigationHistory[i];
      if (!seenUrls.has(current.url)) {
        seenUrls.add(current.url);
        uniquePages.push({ ...current, step: i });
      }
    }

    // Create nodes with better styling
    for (let i = 0; i < uniquePages.length; i++) {
      const page = uniquePages[i];
      const nodeId = `step${page.step}`;

      // Get test results for this page
      const pageTests = testCases.filter(tc => tc.url === page.url);
      const passedCount = pageTests.filter(tc => tc.status === 'PASSED').length;
      const failedCount = pageTests.filter(tc => tc.status === 'FAILED').length;

      // Create descriptive label with proper escaping
      const title = this.escapeMermaidLabel(page.title || 'Untitled Page');
      const urlShort = this.escapeMermaidLabel(this.truncateUrl(page.url, 30));
      const testInfo = pageTests.length > 0 ? `<br/>✓${passedCount} ✗${failedCount}` : '';

      const label = `📄 ${title}${testInfo}<br/><small>${urlShort}</small>`;

      // Use different shapes based on page type (wrap labels in quotes for special chars)
      if (i === 0) {
        mermaid += `    ${nodeId}(["${label}"])\n`; // Rounded for start
      } else if (i === uniquePages.length - 1) {
        mermaid += `    ${nodeId}[/"${label}"/]\n`; // Parallelogram for end
      } else {
        mermaid += `    ${nodeId}["${label}"]\n`; // Rectangle for middle pages
      }

      // Add connections
      if (i > 0) {
        const prevPage = uniquePages[i - 1];
        const prevNodeId = `step${prevPage.step}`;

        // Add descriptive edge label
        const edgeLabel = `Step ${i}`;
        mermaid += `    ${prevNodeId} -->|"${edgeLabel}"| ${nodeId}\n`;
      }
    }

    // Add styling based on test results
    for (let i = 0; i < uniquePages.length; i++) {
      const page = uniquePages[i];
      const nodeId = `step${page.step}`;
      const pageTests = testCases.filter(tc => tc.url === page.url);
      const failedCount = pageTests.filter(tc => tc.status === 'FAILED').length;

      let fillColor = '#E3F2FD'; // Default light blue
      let strokeColor = '#2196F3';

      if (i === 0) {
        fillColor = '#C8E6C9'; // Start - light green
        strokeColor = '#4CAF50';
      } else if (i === uniquePages.length - 1) {
        fillColor = '#B2DFDB'; // End - light teal
        strokeColor = '#009688';
      } else if (failedCount > 0) {
        fillColor = '#FFCDD2'; // Has failures - light red
        strokeColor = '#F44336';
      } else if (pageTests.length > 0) {
        fillColor = '#C8E6C9'; // All passed - light green
        strokeColor = '#4CAF50';
      }

      mermaid += `    style ${nodeId} fill:${fillColor},stroke:${strokeColor},stroke-width:2px\n`;
    }

    return mermaid;
  }

  async annotateBugScreenshots(bugs) {
    const annotatedBugs = [];

    for (const bug of bugs) {
      if (bug.screenshot) {
        try {
          // Add bug marker annotation
          const annotatedScreenshot = await this.annotator.createBugAnnotation(
            bug.screenshot,
            { x: 200, y: 200 } // Default position
          );
          
          annotatedBugs.push({
            ...bug,
            originalScreenshot: bug.screenshot,
            screenshot: annotatedScreenshot
          });
        } catch (error) {
          console.error('Error annotating bug screenshot:', error);
          annotatedBugs.push(bug);
        }
      } else {
        annotatedBugs.push(bug);
      }
    }

    return annotatedBugs;
  }

  countBySeverity(bugs) {
    const counts = { high: 0, medium: 0, low: 0 };
    
    for (const bug of bugs) {
      const severity = bug.severity || 'medium';
      if (counts[severity] !== undefined) {
        counts[severity]++;
      }
    }

    return counts;
  }

  generateStepsToReproduce(bug, navigationHistory) {
    const steps = [];
    
    // Add navigation steps
    for (let i = 0; i < navigationHistory.length; i++) {
      const step = navigationHistory[i];
      steps.push(`${i + 1}. Navigate to: ${step.title || step.url}`);
      
      // If this is where the bug occurred, add it
      if (bug.url === step.url) {
        steps.push(`${i + 2}. ⚠️ Bug appears: ${bug.description}`);
        break;
      }
    }

    if (steps.length === 0) {
      steps.push('1. Navigate to the affected page');
      steps.push(`2. Bug: ${bug.description}`);
    }

    return steps;
  }

  escapeMermaidLabel(text) {
    if (!text) return '';
    // Escape quotes and other special characters for Mermaid
    return text
      .replace(/"/g, '#quot;')  // Replace quotes
      .replace(/'/g, '#apos;')   // Replace single quotes
      .replace(/\\/g, '\\\\')    // Escape backslashes
      .replace(/#/g, '&num;')    // Escape hash symbols
      .trim();
  }

  truncateUrl(url, maxLength = 40) {
    if (url.length > maxLength) {
      return url.substring(0, maxLength - 3) + '...';
    }
    return url;
  }

  getSeverityColor(severity) {
    const colors = {
      high: '#F44336',
      medium: '#FF9800',
      low: '#FFC107'
    };
    return colors[severity] || colors.medium;
  }
}

module.exports = ReportGenerator;

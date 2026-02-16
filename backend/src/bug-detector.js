class BugDetector {
  constructor() {
    this.detectedBugs = [];
  }

  detectConsoleErrors(errors, pageUrl) {
    const bugs = [];

    for (const error of errors) {
      bugs.push({
        type: 'console-error',
        severity: this.assessSeverity(error.message),
        title: 'JavaScript Console Error',
        description: error.message,
        location: pageUrl,
        timestamp: error.timestamp,
        recommendation: 'Check browser console and fix JavaScript errors'
      });
    }

    return bugs;
  }

  detectBrokenLinks(links, pageUrl) {
    const bugs = [];

    for (const link of links) {
      if (link.status === 404 || link.status >= 500) {
        bugs.push({
          type: 'broken-link',
          severity: 'high',
          title: 'Broken Link Detected',
          description: `Link returns ${link.status}: ${link.href}`,
          location: pageUrl,
          recommendation: 'Fix or remove broken link'
        });
      }
    }

    return bugs;
  }

  detectAccessibilityIssues(pageData) {
    const bugs = [];

    // Check for images without alt text
    if (pageData.imagesWithoutAlt && pageData.imagesWithoutAlt.length > 0) {
      bugs.push({
        type: 'accessibility',
        severity: 'medium',
        title: 'Images Missing Alt Text',
        description: `Found ${pageData.imagesWithoutAlt.length} images without alt attributes`,
        recommendation: 'Add descriptive alt text for accessibility'
      });
    }

    // Check for missing form labels
    if (pageData.inputsWithoutLabels && pageData.inputsWithoutLabels.length > 0) {
      bugs.push({
        type: 'accessibility',
        severity: 'medium',
        title: 'Form Inputs Missing Labels',
        description: `Found ${pageData.inputsWithoutLabels.length} inputs without labels`,
        recommendation: 'Add labels to form inputs for accessibility'
      });
    }

    return bugs;
  }

  assessSeverity(errorMessage) {
    const highSeverityKeywords = ['fatal', 'critical', 'crash', 'undefined is not'];
    const mediumSeverityKeywords = ['warning', 'deprecated', 'failed'];

    const lowerMessage = errorMessage.toLowerCase();

    if (highSeverityKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    } else if (mediumSeverityKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }

    return 'low';
  }

  categorizeBugs(bugs) {
    const categories = {
      'console-error': [],
      'broken-link': [],
      'accessibility': [],
      'visual': [],
      'performance': []
    };

    for (const bug of bugs) {
      const category = bug.type || 'other';
      if (categories[category]) {
        categories[category].push(bug);
      } else {
        if (!categories.other) {
          categories.other = [];
        }
        categories.other.push(bug);
      }
    }

    return categories;
  }
}

module.exports = BugDetector;

class ExplorationState {
  constructor() {
    this.visitedUrls = new Map(); // URL -> { count, firstVisit, lastVisit }
    this.failedSelectors = new Map(); // selector -> { attempts, errors }
    this.successfulInteractions = new Map(); // selector -> { type, timestamp }
    this.elementCoverage = new Map(); // selector -> visited boolean
    this.consecutiveFailures = 0;
  }

  recordVisit(url) {
    const existing = this.visitedUrls.get(url) || { count: 0 };
    existing.count++;
    existing.lastVisit = Date.now();
    if (!existing.firstVisit) {
      existing.firstVisit = Date.now();
    }
    this.visitedUrls.set(url, existing);
  }

  recordFailedSelector(selector, error) {
    const existing = this.failedSelectors.get(selector) || { attempts: 0, errors: [] };
    existing.attempts++;
    existing.errors.push(error);
    existing.lastAttempt = Date.now();
    this.failedSelectors.set(selector, existing);
    this.consecutiveFailures++;
  }

  recordSuccessfulInteraction(selector, type) {
    this.successfulInteractions.set(selector, {
      type,
      timestamp: Date.now()
    });
    this.elementCoverage.set(selector, true);
    this.consecutiveFailures = 0; // Reset on success
  }

  isFieldFilled(selector) {
    const interaction = this.successfulInteractions.get(selector);
    return interaction && interaction.type === 'fill';
  }

  getFilledFields() {
    const filled = [];
    for (const [selector, data] of this.successfulInteractions.entries()) {
      if (data.type === 'fill') {
        filled.push(selector);
      }
    }
    return filled;
  }

  shouldRetrySelector(selector) {
    const failed = this.failedSelectors.get(selector);
    // Max 2 retries per selector
    return !failed || failed.attempts < 2;
  }

  getDuplicateVisitCount(url) {
    const visit = this.visitedUrls.get(url);
    return visit ? visit.count : 0;
  }

  calculateCoverage() {
    const visited = this.elementCoverage.size;
    const successful = this.successfulInteractions.size;
    const failed = this.failedSelectors.size;
    const total = visited + failed + 10; // Estimate total based on seen + buffer

    return {
      visited,
      successful,
      failed,
      total,
      percentage: total > 0 ? Math.round((successful / total) * 100) : 0
    };
  }

  detectLoopPattern() {
    const urlCounts = Array.from(this.visitedUrls.values());

    // Check if any URL visited 4+ times
    const loopingUrls = Array.from(this.visitedUrls.entries())
      .filter(([_, data]) => data.count >= 4);

    if (loopingUrls.length > 0) {
      return {
        isLoop: true,
        threshold: 4,
        loopingUrls: loopingUrls.map(([url, data]) => ({ url, count: data.count }))
      };
    }

    return { isLoop: false, threshold: 4 };
  }

  getExplorationSummary() {
    const coverage = this.calculateCoverage();
    const loopDetection = this.detectLoopPattern();

    return {
      uniquePages: this.visitedUrls.size,
      totalVisits: Array.from(this.visitedUrls.values()).reduce((sum, v) => sum + v.count, 0),
      successfulInteractions: this.successfulInteractions.size,
      failedSelectors: this.failedSelectors.size,
      coverage: coverage.percentage,
      isLooping: loopDetection.isLoop,
      consecutiveFailures: this.consecutiveFailures
    };
  }

  getUnexploredElements(allElements = []) {
    // Return elements that haven't been successfully interacted with
    return allElements.filter(el => !this.elementCoverage.has(el.selector));
  }

  shouldStopExploration(stepCount, maxSteps) {
    const coverage = this.calculateCoverage();
    const loopDetection = this.detectLoopPattern();

    // Stop if:
    // 1. Max steps reached
    if (stepCount >= maxSteps) {
      return { shouldStop: true, reason: 'Max steps reached' };
    }

    // 2. Loop detected and reasonable coverage
    if (loopDetection.isLoop && coverage.percentage >= 50) {
      return { shouldStop: true, reason: 'Loop detected with 50%+ coverage' };
    }

    // 3. Excellent coverage achieved
    if (coverage.percentage >= 85 && this.visitedUrls.size >= 8) {
      return { shouldStop: true, reason: 'Excellent coverage (85%+)' };
    }

    // 4. Too many consecutive failures (increased threshold for better coverage)
    if (this.consecutiveFailures >= 10) {
      return { shouldStop: true, reason: '10+ consecutive failures' };
    }

    return { shouldStop: false };
  }
}

module.exports = ExplorationState;

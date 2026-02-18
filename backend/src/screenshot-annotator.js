// Screenshot annotator - disabled canvas dependency for Railway deployment
// Returns original screenshots without annotations to avoid native dependencies

class ScreenshotAnnotator {
  async annotate(screenshotBase64, annotations) {
    // Canvas dependency removed for easier deployment
    // Return original screenshot without annotations
    console.log('📸 Screenshot annotation disabled (no canvas dependency)');
    return screenshotBase64;
  }

  async createBugAnnotation(screenshotBase64, bugLocation) {
    // Return original screenshot without bug annotation
    return screenshotBase64;
  }
}

module.exports = ScreenshotAnnotator;

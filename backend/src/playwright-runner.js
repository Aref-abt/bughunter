const { chromium } = require('playwright');

class PlaywrightRunner {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.consoleErrors = [];
  }

  async launch() {
    this.browser = await chromium.launch({
      headless: false, // Show browser for demo purposes
      slowMo: 100 // Slow down for visibility
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    this.page = await this.context.newPage();

    // Capture console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.consoleErrors.push({
          message: msg.text(),
          timestamp: Date.now()
        });
      }
    });

    // Capture page errors
    this.page.on('pageerror', (error) => {
      this.consoleErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
    });

    console.log('✅ Browser launched');
  }

  async setCookies(cookies) {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }
    
    await this.context.addCookies(cookies);
    console.log(`✅ Injected ${cookies.length} cookies`);
  }

  async goto(url) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    this.consoleErrors = []; // Reset errors for new page
    
    await this.page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log(`✅ Navigated to: ${url}`);
  }

  async takeScreenshot() {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const screenshot = await this.page.screenshot({ 
      fullPage: false,
      type: 'png'
    });
    
    return screenshot.toString('base64');
  }

  async getPageTitle() {
    if (!this.page) {
      return 'Unknown';
    }
    return await this.page.title();
  }

  getCurrentUrl() {
    if (!this.page) {
      return '';
    }
    return this.page.url();
  }

  getConsoleErrors() {
    const errors = [...this.consoleErrors];
    this.consoleErrors = []; // Clear after retrieval
    return errors;
  }

  // Helper method to fix problematic CSS selectors
  sanitizeSelector(selector) {
    if (!selector) return null;

    // Check if selector has problematic characters (colons in IDs)
    if (selector.match(/#[^:\s]+:[^:\s]+/)) {
      // ID with colons - use attribute selector instead
      const idMatch = selector.match(/#([^\s]+)/);
      if (idMatch) {
        const id = idMatch[1];
        console.log(`⚠️  Converting problematic ID selector to attribute: [id="${id}"]`);
        return `[id="${id}"]`;
      }
    }

    return selector;
  }

  async clickElement(selector, options = { retries: 3, timeout: 5000 }) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    if (!selector || selector === 'none') {
      console.log('⚠️  Invalid selector provided, skipping click');
      return { success: false, error: 'Invalid selector', attempts: 0 };
    }

    // Sanitize selector first
    selector = this.sanitizeSelector(selector) || selector;

    // Try multiple attempts with increasing sophistication
    for (let attempt = 1; attempt <= options.retries; attempt++) {
      try {
        // Clean up invalid selector syntax (remove :contains() which is not valid CSS)
        let element = null;

        if (selector.includes(':contains(')) {
          // Extract text from :contains() and use getByText instead
          const match = selector.match(/:contains\(['"](.+?)['"]\)/);
          if (match) {
            const text = match[1];
            element = await this.page.getByText(text, { exact: false }).first();
          }
        } else {
          // Try CSS selector first, with better error handling
          try {
            element = await this.page.locator(selector).first();
            // Test if selector is valid by checking count
            const count = await element.count().catch(() => 0);
            if (count === 0) {
              throw new Error('Element not found');
            }
          } catch (selectorError) {
            // Invalid CSS selector or element not found
            console.log(`⚠️  Invalid/not found (attempt ${attempt}): ${selector}`);
            throw selectorError;
          }
        }

        // Scroll into view
        await element.scrollIntoViewIfNeeded();

        // Check visibility
        if (!await element.isVisible()) {
          throw new Error('Element not visible');
        }

        // Check if disabled
        const isDisabled = await element.isDisabled().catch(() => false);
        if (isDisabled) {
          throw new Error('Element is disabled');
        }

        // Wait for stable state on retry attempts
        if (attempt > 1) {
          await element.waitFor({ state: 'stable', timeout: 1000 }).catch(() => {});
        }

        // Try different click strategies based on attempt
        if (attempt < options.retries) {
          // Normal click for first attempts
          await element.click({ timeout: options.timeout });
        } else {
          // Force click via JavaScript as last resort
          await element.evaluate(el => el.click());
        }

        console.log(`✅ Clicked: ${selector} (attempt ${attempt})`);
        return { success: true, attempts: attempt };

      } catch (error) {
        if (attempt === options.retries) {
          console.error(`❌ Click failed after ${attempt} attempts: ${error.message}`);
          return { success: false, error: error.message, attempts: attempt };
        }

        // Exponential backoff between retries
        console.log(`⚠️  Click attempt ${attempt} failed: ${error.message}, retrying...`);
        await new Promise(r => setTimeout(r, 100 * attempt));
      }
    }

    return { success: false, error: 'Max retries exceeded', attempts: options.retries };
  }

  async selectDropdownOption(selector, optionValue = null) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    if (!selector) {
      console.log('⚠️  No selector provided for dropdown');
      return false;
    }

    // Sanitize selector first
    selector = this.sanitizeSelector(selector) || selector;

    try {
      const selectElement = await this.page.locator(selector).first();

      // Safe count check with error handling
      const count = await selectElement.count().catch(() => 0);
      if (count === 0) {
        console.log(`⚠️  Dropdown not found: ${selector}`);
        return false;
      }

      // Get all available options
      const options = await selectElement.locator('option').all();

      if (options.length === 0) {
        console.log(`⚠️  No options found in dropdown: ${selector}`);
        return false;
      }

      // If no specific option provided, select the first non-disabled option
      if (!optionValue) {
        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          const isDisabled = await option.getAttribute('disabled');
          const value = await option.getAttribute('value');
          const text = await option.textContent();

          if (!isDisabled && value) {
            await selectElement.selectOption({ index: i });
            console.log(`✅ Selected dropdown option: "${text?.trim()}" (index ${i}) in ${selector}`);
            return true;
          }
        }
      } else {
        // Try to select by value, label, or index
        try {
          await selectElement.selectOption(optionValue);
          console.log(`✅ Selected dropdown option: "${optionValue}" in ${selector}`);
          return true;
        } catch (selectError) {
          console.log(`⚠️  Could not select option "${optionValue}" in ${selector}`);
          return false;
        }
      }

      console.log(`⚠️  No valid options to select in ${selector}`);
      return false;
    } catch (error) {
      console.error(`❌ Dropdown selection error: ${error.message}`);
      return false;
    }
  }

  async fillForm(formData, options = {}) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    // Validate formData
    if (!formData) {
      console.log('⚠️  No form data provided, skipping form fill');
      return { success: false, filled: 0, failed: 0, failures: [{ error: 'No form data provided' }] };
    }

    // Handle both array and object formats
    const fieldsArray = Array.isArray(formData) ? formData : [formData];

    if (fieldsArray.length === 0) {
      console.log('⚠️  Empty form data, skipping form fill');
      return { success: false, filled: 0, failed: 0, failures: [{ error: 'Empty form data' }] };
    }

    const results = { success: true, filled: 0, failed: 0, failures: [] };

    for (const field of fieldsArray) {
      try {
        if (!field || !field.selector || !field.value) {
          console.log('⚠️  Invalid field data, skipping:', field);
          results.failed++;
          results.failures.push({ selector: field?.selector || 'unknown', error: 'Invalid field data' });
          results.success = false;
          continue;
        }

        const element = await this.page.locator(field.selector).first();

        if (await element.count() === 0) {
          console.log(`⚠️  Field not found: ${field.selector}`);
          results.failed++;
          results.failures.push({ selector: field.selector, error: 'Field not found' });
          results.success = false;
          continue;
        }

        // Scroll into view
        await element.scrollIntoViewIfNeeded();

        // Check visibility
        if (!await element.isVisible()) {
          console.log(`⚠️  Field not visible: ${field.selector}`);
          results.failed++;
          results.failures.push({ selector: field.selector, error: 'Field not visible' });
          results.success = false;
          continue;
        }

        // Focus and clear
        await element.focus();
        await element.fill('');

        // Type with delay (realistic) using pressSequentially
        await element.pressSequentially(field.value, { delay: 30 });

        // Trigger input and change events for React/Vue compatibility
        await element.dispatchEvent('input', { bubbles: true });
        await element.dispatchEvent('change', { bubbles: true });

        // Press Tab to trigger blur
        await element.press('Tab');

        // Validate that the field was actually filled
        const actualValue = await element.inputValue();
        if (actualValue !== field.value) {
          console.log(`⚠️  Validation failed for ${field.selector}: expected "${field.value}", got "${actualValue}"`);
          results.failed++;
          results.failures.push({ selector: field.selector, error: `Validation failed: expected "${field.value}", got "${actualValue}"` });
          results.success = false;
          continue;
        }

        console.log(`✅ Filled field: ${field.selector} with value: "${field.value}"`);
        results.filled++;
      } catch (error) {
        console.error(`❌ Fill error for ${field?.selector || 'unknown'}: ${error.message}`);
        results.failed++;
        results.failures.push({ selector: field?.selector || 'unknown', error: error.message });
        results.success = false;
      }
    }

    return results;
  }

  async typeText(selector, text, options = { delay: 30, clearFirst: true }) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    if (!selector || !text) {
      console.log('⚠️  Invalid selector or text for typing');
      return { success: false, error: 'Invalid selector or text' };
    }

    try {
      const element = await this.page.locator(selector).first();

      if (await element.count() === 0) {
        return { success: false, error: 'Element not found' };
      }

      await element.scrollIntoViewIfNeeded();

      if (!await element.isVisible()) {
        return { success: false, error: 'Element not visible' };
      }

      await element.focus();

      if (options.clearFirst) {
        await element.fill('');
      }

      await element.pressSequentially(text, { delay: options.delay });

      // Trigger events for React/Vue compatibility
      await element.dispatchEvent('input', { bubbles: true });
      await element.dispatchEvent('change', { bubbles: true });

      const actualValue = await element.inputValue();
      console.log(`✅ Typed text into ${selector}: "${text}"`);
      return { success: true, actualValue };
    } catch (error) {
      console.error(`❌ Type error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async hoverElement(selector) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    if (!selector) {
      return { success: false, error: 'Invalid selector' };
    }

    try {
      const element = await this.page.locator(selector).first();

      if (await element.count() === 0) {
        return { success: false, error: 'Element not found' };
      }

      await element.scrollIntoViewIfNeeded();

      if (!await element.isVisible()) {
        return { success: false, error: 'Element not visible' };
      }

      await element.hover();
      console.log(`✅ Hovered over ${selector}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Hover error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async scrollToElement(selector) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    if (!selector) {
      return { success: false, error: 'Invalid selector' };
    }

    try {
      const element = await this.page.locator(selector).first();

      if (await element.count() === 0) {
        return { success: false, error: 'Element not found' };
      }

      await element.scrollIntoViewIfNeeded();
      const isVisible = await element.isVisible();
      console.log(`✅ Scrolled to ${selector}, visible: ${isVisible}`);
      return { success: true, inView: isVisible };
    } catch (error) {
      console.error(`❌ Scroll error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async waitForElement(selector, options = { state: 'visible', timeout: 5000 }) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    if (!selector) {
      return { success: false, error: 'Invalid selector' };
    }

    const startTime = Date.now();
    try {
      const element = await this.page.locator(selector).first();
      await element.waitFor({ state: options.state, timeout: options.timeout });
      const time = Date.now() - startTime;
      console.log(`✅ Element ${selector} became ${options.state} after ${time}ms`);
      return { success: true, time };
    } catch (error) {
      const time = Date.now() - startTime;
      console.error(`❌ Wait timeout: ${error.message}`);
      return { success: false, error: error.message, time };
    }
  }

  async pressKey(selector, key) {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    if (!selector || !key) {
      return { success: false, error: 'Invalid selector or key' };
    }

    try {
      const element = await this.page.locator(selector).first();

      if (await element.count() === 0) {
        return { success: false, error: 'Element not found' };
      }

      await element.focus();
      await element.press(key);
      console.log(`✅ Pressed ${key} on ${selector}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Press key error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async waitForNavigation() {
    if (!this.page) {
      return;
    }

    try {
      await this.page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch (error) {
      // Timeout is okay, page might be SPA
      console.log('⚠️  Navigation timeout (might be SPA)');
    }
  }

  async detectFormSubmissionResult(originalUrl, timeout = 5000) {
    if (!this.page) {
      return { success: false, error: 'Page not initialized' };
    }

    const startTime = Date.now();

    try {
      // Wait a moment for the submission to process
      await this.page.waitForTimeout(1000);

      const currentUrl = this.page.url();
      const urlChanged = currentUrl !== originalUrl;

      // Check for success indicators with intelligent detection
      const successIndicators = await this.page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();

        // Look for success messages in prominent places (alerts, headings, messages)
        const successElements = Array.from(document.querySelectorAll('[role="alert"], .alert, .success, .message, .notification, h1, h2, h3, .confirmation'));
        const successText = successElements.map(el => el.textContent.toLowerCase()).join(' ');

        // Look for error messages ONLY in actual error elements (not just any text)
        const errorElements = Array.from(document.querySelectorAll('.error, .invalid, [role="alert"][class*="error"], .field-error, .form-error, .error-message, .text-red'));
        const visibleErrors = errorElements.filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && el.textContent.trim().length > 0;
        });
        const errorText = visibleErrors.map(el => el.textContent.toLowerCase()).join(' ');

        // Strong success indicators
        const hasSuccessMessage =
          successText.includes('success') ||
          successText.includes('thank you') ||
          successText.includes('submitted') ||
          successText.includes('confirmation') ||
          bodyText.includes('thank you for contacting') ||
          bodyText.includes('thank you for your') ||
          bodyText.includes('successfully submitted') ||
          bodyText.includes('we have received') ||
          bodyText.includes('we\'ll be in touch') ||
          bodyText.includes('message has been sent');

        // Error indicators (ONLY from actual error elements, not general page text)
        const hasErrorMessage = visibleErrors.length > 0 && (
          errorText.includes('error') ||
          errorText.includes('invalid') ||
          errorText.includes('required') ||
          errorText.includes('must be filled') ||
          errorText.includes('please correct')
        );

        // Check if form still exists and is visible
        const forms = document.querySelectorAll('form');
        const visibleForms = Array.from(forms).filter(f => {
          const style = window.getComputedStyle(f);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });

        // Check if submit button is disabled (often disabled after successful submission)
        const submitButtons = Array.from(document.querySelectorAll('button[type="submit"], input[type="submit"]'));
        const disabledSubmit = submitButtons.some(btn => btn.disabled);

        return {
          hasSuccessMessage,
          hasErrorMessage,
          formDisappeared: forms.length > 0 && visibleForms.length === 0,
          submitDisabled: disabledSubmit,
          errorCount: visibleErrors.length
        };
      });

      // Determine submission result with priority logic
      let status = 'UNKNOWN';
      let message = '';

      // Priority 1: If we have clear success indicators, it's a success
      if (successIndicators.hasSuccessMessage || successIndicators.formDisappeared || urlChanged) {
        status = 'PASSED';
        const reasons = [];
        if (successIndicators.hasSuccessMessage) reasons.push('success message detected');
        if (successIndicators.formDisappeared) reasons.push('form disappeared');
        if (urlChanged) reasons.push(`navigated to ${currentUrl}`);
        if (successIndicators.submitDisabled) reasons.push('submit button disabled');
        message = `Form submitted successfully: ${reasons.join(', ')}`;
      }
      // Priority 2: Only report failure if we have actual error elements AND no success indicators
      else if (successIndicators.hasErrorMessage && !successIndicators.hasSuccessMessage) {
        status = 'FAILED';
        message = `Form submission failed - ${successIndicators.errorCount} error message(s) detected`;
      }
      // Priority 3: Unknown if no clear indicators either way
      else {
        status = 'UNKNOWN';
        message = 'Form submission result unclear - no clear success or error indicators';
      }

      const elapsed = Date.now() - startTime;
      console.log(`📋 Form submission detection (${elapsed}ms): ${status} - ${message}`);

      return {
        success: status === 'PASSED',
        status,
        message,
        urlChanged,
        newUrl: currentUrl,
        indicators: successIndicators,
        elapsed
      };
    } catch (error) {
      console.error(`❌ Form submission detection error: ${error.message}`);
      return {
        success: false,
        status: 'ERROR',
        message: `Detection failed: ${error.message}`,
        error: error.message
      };
    }
  }

  async getInteractiveElements() {
    if (!this.page) {
      return [];
    }

    const elements = [];

    try {
      // Get all visible links with their attributes
      const links = await this.page.locator('a[href]:visible').all();
      for (let linkIndex = 0; linkIndex < Math.min(links.length, 15); linkIndex++) {
        try {
          const link = links[linkIndex];
          const text = await link.textContent();
          const href = await link.getAttribute('href');
          const id = await link.getAttribute('id');
          const className = await link.getAttribute('class');

          if (text?.trim() || href) {
            // Always generate a valid CSS selector
            let selector;
            if (id) {
              selector = `#${id}`;
            } else if (href) {
              // Use href attribute for matching
              const hrefPart = href.split('?')[0].split('#')[0];
              selector = `a[href*="${hrefPart.slice(-30)}"]`;
            } else if (className) {
              // Use first class name
              const firstClass = className.split(' ')[0];
              selector = `a.${firstClass}`;
            } else {
              // Use nth-of-type as last resort
              selector = `a:nth-of-type(${linkIndex + 1})`;
            }

            elements.push({
              type: 'link',
              text: text?.trim() || 'Link',
              selector: selector,
              details: `href: ${href}`
            });
          }
        } catch (e) {
          // Skip if element becomes stale
        }
      }

      // Get all visible buttons with their attributes
      const buttons = await this.page.locator('button:visible, input[type="submit"]:visible, input[type="button"]:visible').all();
      for (let btnIndex = 0; btnIndex < Math.min(buttons.length, 15); btnIndex++) {
        try {
          const button = buttons[btnIndex];
          const text = await button.textContent();
          const type = await button.getAttribute('type');
          const id = await button.getAttribute('id');
          const className = await button.getAttribute('class');
          const name = await button.getAttribute('name');
          const tagName = await button.evaluate(el => el.tagName.toLowerCase());

          // Always generate a valid CSS selector
          let selector;
          if (id) {
            selector = `#${id}`;
          } else if (name) {
            selector = `${tagName}[name="${name}"]`;
          } else if (type) {
            selector = `${tagName}[type="${type}"]`;
          } else if (className) {
            const firstClass = className.split(' ')[0];
            selector = `${tagName}.${firstClass}`;
          } else {
            // Use nth-of-type as last resort
            selector = `${tagName}:nth-of-type(${btnIndex + 1})`;
          }

          elements.push({
            type: 'button',
            text: text?.trim() || `Button (${type || 'button'})`,
            selector: selector,
            details: `type: ${type || 'button'}`
          });
        } catch (e) {
          // Skip if element becomes stale
        }
      }

      // Get all visible dropdowns/selects
      const selects = await this.page.locator('select:visible').all();
      for (let selectIndex = 0; selectIndex < Math.min(selects.length, 10); selectIndex++) {
        try {
          const select = selects[selectIndex];
          const id = await select.getAttribute('id');
          const name = await select.getAttribute('name');
          const className = await select.getAttribute('class');
          const label = await this.page.locator(`label[for="${id}"]`).textContent().catch(() => '');

          // Always generate a valid CSS selector
          let selector;
          if (id) {
            selector = `#${id}`;
          } else if (name) {
            selector = `select[name="${name}"]`;
          } else if (className) {
            const firstClass = className.split(' ')[0];
            selector = `select.${firstClass}`;
          } else {
            selector = `select:nth-of-type(${selectIndex + 1})`;
          }

          elements.push({
            type: 'dropdown',
            text: label || name || 'Dropdown',
            selector: selector,
            details: 'select element'
          });
        } catch (e) {
          // Skip if element becomes stale
        }
      }

      // Get visible input fields (for forms)
      const inputs = await this.page.locator('input:visible:not([type="hidden"]):not([type="submit"]):not([type="button"])').all();
      for (let inputIndex = 0; inputIndex < Math.min(inputs.length, 10); inputIndex++) {
        try {
          const input = inputs[inputIndex];
          const type = await input.getAttribute('type') || 'text';
          const id = await input.getAttribute('id');
          const name = await input.getAttribute('name');
          const placeholder = await input.getAttribute('placeholder');
          const className = await input.getAttribute('class');

          // Always generate a valid CSS selector
          let selector;
          if (id) {
            selector = `#${id}`;
          } else if (name) {
            selector = `input[name="${name}"]`;
          } else if (className) {
            const firstClass = className.split(' ')[0];
            selector = `input.${firstClass}[type="${type}"]`;
          } else {
            selector = `input[type="${type}"]:nth-of-type(${inputIndex + 1})`;
          }

          elements.push({
            type: 'input',
            text: placeholder || name || `Input (${type})`,
            selector: selector,
            details: `type: ${type}`
          });
        } catch (e) {
          // Skip if element becomes stale
        }
      }

    } catch (error) {
      console.error('Error getting interactive elements:', error.message);
    }

    return elements;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }
}

module.exports = PlaywrightRunner;

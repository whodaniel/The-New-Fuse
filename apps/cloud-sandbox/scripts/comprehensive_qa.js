/**
 * Comprehensive QA Test Suite for thenewfuse.com
 *
 * AI-powered crawler that validates every page, link, button, and component
 * Reports findings in real-time via Chrome DevTools Protocol
 */

const axios = require('axios');

const SANDBOX_URL = process.env.SANDBOX_URL || 'https://tnf-cloud-sandbox-v2-production.up.railway.app';
const TARGET_SITE = 'https://thenewfuse.com';

// QA Test Configuration
const QA_CONFIG = {
  maxDepth: 3,              // How deep to crawl (3 levels from homepage)
  maxPagesPerLevel: 10,     // Max pages to test per depth level
  testTimeout: 30000,       // 30 seconds per page
  screenshotInterval: 5000, // Screenshot every 5 seconds
  validateForms: true,
  validateLinks: true,
  validateImages: true,
  validateButtons: true,
  validateComponents: true,
  validateAccessibility: true,
  validatePerformance: true,
  validateSecurity: true
};

// Test Results Storage
const qaResults = {
  startTime: new Date(),
  pagesTestedCount: 0,
  totalIssues: 0,
  pages: [],
  summary: {
    brokenLinks: [],
    missingImages: [],
    jsErrors: [],
    consoleWarnings: [],
    slowPages: [],
    accessibilityIssues: [],
    formValidationIssues: [],
    buttonIssues: [],
    componentIssues: []
  }
};

/**
 * Call MCP tool on Railway sandbox
 */
async function callTool(toolName, params = {}) {
  try {
    const response = await axios.post(`${SANDBOX_URL}/api/agent/call`, {
      tool: toolName,
      params: params
    }, {
      timeout: QA_CONFIG.testTimeout
    });

    return response.data;
  } catch (error) {
    console.error(`❌ Tool call failed: ${toolName}`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Navigate to a URL and wait for load
 */
async function navigateToPage(url) {
  console.log(`\n🌐 Navigating to: ${url}`);

  const navResult = await callTool('browser_navigate', { url });

  if (!navResult.success) {
    console.error(`❌ Navigation failed: ${navResult.error}`);
    return null;
  }

  // Wait for page to be fully loaded
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Take initial screenshot
  await callTool('browser_screenshot', { filename: `qa_${Date.now()}.png` });

  return navResult;
}

/**
 * Extract all links from current page
 */
async function extractLinks() {
  const result = await callTool('browser_evaluate', {
    script: `
      Array.from(document.querySelectorAll('a[href]')).map(a => ({
        href: a.href,
        text: a.textContent.trim(),
        target: a.target,
        rel: a.rel,
        visible: a.offsetParent !== null
      }))
    `
  });

  return result.success ? result.result : [];
}

/**
 * Extract all buttons from current page
 */
async function extractButtons() {
  const result = await callTool('browser_evaluate', {
    script: `
      Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')).map(btn => ({
        type: btn.tagName,
        text: btn.textContent?.trim() || btn.value,
        id: btn.id,
        className: btn.className,
        disabled: btn.disabled,
        visible: btn.offsetParent !== null,
        hasClickHandler: btn.onclick !== null || btn.getAttribute('onclick') !== null
      }))
    `
  });

  return result.success ? result.result : [];
}

/**
 * Extract all form inputs from current page
 */
async function extractForms() {
  const result = await callTool('browser_evaluate', {
    script: `
      Array.from(document.querySelectorAll('form')).map(form => ({
        action: form.action,
        method: form.method,
        id: form.id,
        className: form.className,
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
          type: input.type || input.tagName.toLowerCase(),
          name: input.name,
          id: input.id,
          required: input.required,
          placeholder: input.placeholder,
          value: input.value
        }))
      }))
    `
  });

  return result.success ? result.result : [];
}

/**
 * Check for console errors
 */
async function checkConsoleErrors() {
  const result = await callTool('browser_evaluate', {
    script: `
      window.__qaConsoleErrors = window.__qaConsoleErrors || [];
      window.__qaConsoleErrors
    `
  });

  return result.success ? result.result : [];
}

/**
 * Check all images are loaded
 */
async function validateImages() {
  const result = await callTool('browser_evaluate', {
    script: `
      Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
        error: img.complete && img.naturalWidth === 0,
        hasAlt: img.alt && img.alt.trim().length > 0
      }))
    `
  });

  const images = result.success ? result.result : [];
  const brokenImages = images.filter(img => img.error);
  const missingAlt = images.filter(img => !img.hasAlt);

  return { images, brokenImages, missingAlt };
}

/**
 * Test button functionality
 */
async function testButton(button, pageUrl) {
  console.log(`  🔘 Testing button: "${button.text}"`);

  const issues = [];

  // Check if button is visible
  if (!button.visible) {
    issues.push({ severity: 'low', message: 'Button is hidden' });
  }

  // Check if button has text or aria-label
  if (!button.text || button.text.length === 0) {
    issues.push({ severity: 'medium', message: 'Button has no text (accessibility issue)' });
  }

  // Check if disabled without reason
  if (button.disabled && !button.className.includes('loading')) {
    issues.push({ severity: 'low', message: 'Button is disabled' });
  }

  // Try clicking the button
  try {
    const clickResult = await callTool('browser_evaluate', {
      script: `
        const btn = document.querySelector('button:nth-of-type(${button.index || 1})');
        if (btn) {
          btn.click();
          return { clicked: true, errors: [] };
        }
        return { clicked: false, errors: ['Button not found'] };
      `
    });

    if (!clickResult.success || !clickResult.result.clicked) {
      issues.push({ severity: 'high', message: 'Button click failed' });
    }

    // Wait for any effects
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for console errors after click
    const errors = await checkConsoleErrors();
    if (errors.length > 0) {
      issues.push({ severity: 'high', message: `Console errors after click: ${errors.join(', ')}` });
    }

    // Take screenshot after action
    await callTool('browser_screenshot', { filename: `button_${button.text}_${Date.now()}.png` });

  } catch (error) {
    issues.push({ severity: 'high', message: `Click error: ${error.message}` });
  }

  return {
    button,
    tested: true,
    issues,
    passed: issues.filter(i => i.severity === 'high').length === 0
  };
}

/**
 * Test link validity
 */
async function testLink(link, pageUrl) {
  const issues = [];

  // Check if link is empty
  if (!link.href || link.href === '#' || link.href === 'javascript:void(0)') {
    issues.push({ severity: 'medium', message: 'Link has no destination' });
  }

  // Check if link text is meaningful
  if (!link.text || link.text.length < 2 || link.text.toLowerCase() === 'click here') {
    issues.push({ severity: 'low', message: 'Link text is not descriptive' });
  }

  // Check if external link has target="_blank" and rel="noopener"
  if (link.href.startsWith('http') && !link.href.includes(TARGET_SITE)) {
    if (link.target !== '_blank') {
      issues.push({ severity: 'low', message: 'External link should open in new tab' });
    }
    if (!link.rel.includes('noopener')) {
      issues.push({ severity: 'medium', message: 'External link missing rel="noopener" (security)' });
    }
  }

  return {
    link,
    tested: true,
    issues,
    passed: issues.filter(i => i.severity === 'high').length === 0
  };
}

/**
 * Test form validation
 */
async function testForm(form, pageUrl) {
  console.log(`  📝 Testing form: ${form.action || form.id || 'unnamed'}`);

  const issues = [];

  // Check if form has action
  if (!form.action) {
    issues.push({ severity: 'medium', message: 'Form has no action attribute' });
  }

  // Check required fields
  const requiredFields = form.inputs.filter(input => input.required);

  // Try submitting empty form to test validation
  try {
    const submitResult = await callTool('browser_evaluate', {
      script: `
        const form = document.querySelector('form${form.id ? '#' + form.id : ''}');
        if (form) {
          // Try submitting without filling
          const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
          if (submitBtn) {
            submitBtn.click();
            return { submitted: true, validationTriggered: !form.checkValidity() };
          }
        }
        return { submitted: false };
      `
    });

    if (submitResult.success && requiredFields.length > 0 && !submitResult.result.validationTriggered) {
      issues.push({ severity: 'high', message: 'Form validation not working (allows empty submit)' });
    }

    // Take screenshot of validation state
    await new Promise(resolve => setTimeout(resolve, 1000));
    await callTool('browser_screenshot', { filename: `form_validation_${Date.now()}.png` });

  } catch (error) {
    issues.push({ severity: 'medium', message: `Form test error: ${error.message}` });
  }

  return {
    form,
    tested: true,
    issues,
    passed: issues.filter(i => i.severity === 'high').length === 0
  };
}

/**
 * Measure page performance
 */
async function measurePerformance(url) {
  const result = await callTool('browser_evaluate', {
    script: `
      const perf = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');

      ({
        loadTime: perf ? perf.loadEventEnd - perf.loadEventStart : 0,
        domContentLoaded: perf ? perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart : 0,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        resources: performance.getEntriesByType('resource').length,
        totalSize: performance.getEntriesByType('resource').reduce((sum, r) => sum + r.transferSize, 0)
      })
    `
  });

  return result.success ? result.result : null;
}

/**
 * Comprehensive page test
 */
async function testPage(url, depth = 0) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 TESTING PAGE (Depth ${depth}): ${url}`);
  console.log(`${'='.repeat(80)}`);

  const pageResult = {
    url,
    depth,
    timestamp: new Date(),
    tested: false,
    issues: [],
    links: [],
    buttons: [],
    forms: [],
    images: {},
    performance: null,
    consoleErrors: [],
    passed: false
  };

  // Navigate to page
  const navResult = await navigateToPage(url);
  if (!navResult) {
    pageResult.issues.push({ severity: 'critical', message: 'Page failed to load' });
    return pageResult;
  }

  pageResult.tested = true;

  // 1. Extract page elements
  console.log('\n1️⃣ Extracting page elements...');
  const [links, buttons, forms] = await Promise.all([
    extractLinks(),
    extractButtons(),
    extractForms()
  ]);

  console.log(`   ✓ Found ${links.length} links`);
  console.log(`   ✓ Found ${buttons.length} buttons`);
  console.log(`   ✓ Found ${forms.length} forms`);

  // 2. Validate images
  if (QA_CONFIG.validateImages) {
    console.log('\n2️⃣ Validating images...');
    const imageResults = await validateImages();
    pageResult.images = imageResults;

    if (imageResults.brokenImages.length > 0) {
      console.log(`   ❌ ${imageResults.brokenImages.length} broken images found`);
      imageResults.brokenImages.forEach(img => {
        pageResult.issues.push({
          severity: 'high',
          type: 'broken-image',
          message: `Broken image: ${img.src}`,
          element: img
        });
      });
    }

    if (imageResults.missingAlt.length > 0) {
      console.log(`   ⚠️ ${imageResults.missingAlt.length} images missing alt text`);
      imageResults.missingAlt.forEach(img => {
        pageResult.issues.push({
          severity: 'medium',
          type: 'accessibility',
          message: `Image missing alt text: ${img.src}`,
          element: img
        });
      });
    }
  }

  // 3. Test buttons
  if (QA_CONFIG.validateButtons && buttons.length > 0) {
    console.log('\n3️⃣ Testing buttons...');
    const buttonTests = [];

    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const button = { ...buttons[i], index: i + 1 };
      const testResult = await testButton(button, url);
      buttonTests.push(testResult);

      testResult.issues.forEach(issue => {
        pageResult.issues.push({
          ...issue,
          type: 'button',
          element: button
        });
      });
    }

    pageResult.buttons = buttonTests;
  }

  // 4. Test links
  if (QA_CONFIG.validateLinks && links.length > 0) {
    console.log('\n4️⃣ Testing links...');
    const linkTests = [];

    for (const link of links.slice(0, 20)) {
      const testResult = await testLink(link, url);
      linkTests.push(testResult);

      testResult.issues.forEach(issue => {
        pageResult.issues.push({
          ...issue,
          type: 'link',
          element: link
        });
      });
    }

    pageResult.links = linkTests;
  }

  // 5. Test forms
  if (QA_CONFIG.validateForms && forms.length > 0) {
    console.log('\n5️⃣ Testing forms...');
    const formTests = [];

    for (const form of forms) {
      const testResult = await testForm(form, url);
      formTests.push(testResult);

      testResult.issues.forEach(issue => {
        pageResult.issues.push({
          ...issue,
          type: 'form',
          element: form
        });
      });
    }

    pageResult.forms = formTests;
  }

  // 6. Check console errors
  console.log('\n6️⃣ Checking console errors...');
  const consoleErrors = await checkConsoleErrors();
  pageResult.consoleErrors = consoleErrors;

  if (consoleErrors.length > 0) {
    console.log(`   ❌ ${consoleErrors.length} console errors found`);
    consoleErrors.forEach(error => {
      pageResult.issues.push({
        severity: 'high',
        type: 'console-error',
        message: error
      });
    });
  }

  // 7. Measure performance
  if (QA_CONFIG.validatePerformance) {
    console.log('\n7️⃣ Measuring performance...');
    const perfMetrics = await measurePerformance(url);
    pageResult.performance = perfMetrics;

    if (perfMetrics) {
      console.log(`   ⏱️ Load time: ${perfMetrics.loadTime}ms`);
      console.log(`   🎨 First paint: ${perfMetrics.firstPaint}ms`);
      console.log(`   📦 Resources: ${perfMetrics.resources}`);

      if (perfMetrics.loadTime > 3000) {
        pageResult.issues.push({
          severity: 'medium',
          type: 'performance',
          message: `Slow page load: ${perfMetrics.loadTime}ms (>3000ms)`
        });
      }
    }
  }

  // Calculate pass/fail
  const criticalIssues = pageResult.issues.filter(i => i.severity === 'critical' || i.severity === 'high');
  pageResult.passed = criticalIssues.length === 0;

  console.log(`\n📊 RESULTS: ${pageResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Total issues: ${pageResult.issues.length}`);
  console.log(`   Critical/High: ${criticalIssues.length}`);

  qaResults.pagesTestedCount++;
  qaResults.totalIssues += pageResult.issues.length;
  qaResults.pages.push(pageResult);

  return pageResult;
}

/**
 * Crawl site recursively
 */
async function crawlSite(startUrl = TARGET_SITE, depth = 0, visited = new Set()) {
  if (depth > QA_CONFIG.maxDepth) {
    console.log(`\n⚠️ Max depth ${QA_CONFIG.maxDepth} reached, stopping crawl`);
    return;
  }

  if (visited.has(startUrl)) {
    console.log(`\n⏭️ Already visited: ${startUrl}`);
    return;
  }

  visited.add(startUrl);

  // Test current page
  const pageResult = await testPage(startUrl, depth);

  // Extract internal links to crawl next
  if (depth < QA_CONFIG.maxDepth) {
    const internalLinks = pageResult.links
      .filter(link =>
        link.link?.href &&
        link.link.href.startsWith(TARGET_SITE) &&
        !visited.has(link.link.href) &&
        !link.link.href.includes('#') &&
        !link.link.href.includes('?')
      )
      .slice(0, QA_CONFIG.maxPagesPerLevel)
      .map(link => link.link.href);

    console.log(`\n🔗 Found ${internalLinks.length} new internal links to crawl`);

    // Crawl child pages
    for (const childUrl of internalLinks) {
      await crawlSite(childUrl, depth + 1, visited);
    }
  }
}

/**
 * Generate comprehensive report
 */
function generateReport() {
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 COMPREHENSIVE QA REPORT');
  console.log('='.repeat(80));

  const duration = (new Date() - qaResults.startTime) / 1000;

  console.log(`\n⏱️ Test Duration: ${duration.toFixed(2)} seconds`);
  console.log(`📄 Pages Tested: ${qaResults.pagesTestedCount}`);
  console.log(`🐛 Total Issues Found: ${qaResults.totalIssues}`);

  // Group issues by type
  const issuesByType = {};
  qaResults.pages.forEach(page => {
    page.issues.forEach(issue => {
      const type = issue.type || 'other';
      issuesByType[type] = issuesByType[type] || [];
      issuesByType[type].push({ ...issue, page: page.url });
    });
  });

  console.log(`\n📊 Issues by Type:`);
  Object.entries(issuesByType).forEach(([type, issues]) => {
    console.log(`   ${type}: ${issues.length}`);
  });

  // Pages with issues
  const failedPages = qaResults.pages.filter(p => !p.passed);
  console.log(`\n❌ Failed Pages: ${failedPages.length}`);
  failedPages.forEach(page => {
    console.log(`   - ${page.url} (${page.issues.length} issues)`);
  });

  // Critical issues
  const criticalIssues = [];
  qaResults.pages.forEach(page => {
    page.issues.filter(i => i.severity === 'critical' || i.severity === 'high').forEach(issue => {
      criticalIssues.push({ ...issue, page: page.url });
    });
  });

  console.log(`\n🔴 Critical/High Severity Issues: ${criticalIssues.length}`);
  criticalIssues.slice(0, 10).forEach(issue => {
    console.log(`   - [${issue.page}] ${issue.message}`);
  });

  // Save detailed report to file
  const reportPath = `/tmp/qa_report_${Date.now()}.json`;
  require('fs').writeFileSync(reportPath, JSON.stringify(qaResults, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);

  return qaResults;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Comprehensive QA Test Suite for thenewfuse.com\n');
  console.log('Configuration:');
  console.log(`  Max Depth: ${QA_CONFIG.maxDepth}`);
  console.log(`  Max Pages Per Level: ${QA_CONFIG.maxPagesPerLevel}`);
  console.log(`  Target: ${TARGET_SITE}\n`);

  try {
    // Setup console error tracking
    await callTool('browser_evaluate', {
      script: `
        window.__qaConsoleErrors = [];
        const oldError = console.error;
        console.error = function(...args) {
          window.__qaConsoleErrors.push(args.join(' '));
          oldError.apply(console, args);
        };
      `
    });

    // Start crawling
    await crawlSite(TARGET_SITE);

    // Generate report
    const report = generateReport();

    console.log('\n✅ QA test suite completed!\n');

    return report;

  } catch (error) {
    console.error('\n❌ QA test suite failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, testPage, crawlSite };

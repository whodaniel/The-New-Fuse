/**
 * TNF Complete Health Check
 * Run in Chrome DevTools Console for comprehensive system test
 */

(async function TNFHealthCheck() {
  console.group('🔍 TNF Health Check');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // ============================================
  // 1. DOM & React Check
  // ============================================
  console.group('1️⃣ DOM & React Check');

  try {
    const root = document.getElementById('root');
    if (root && root.children.length > 0) {
      results.passed.push('✓ React root mounted');
      console.log('✓ React root mounted');
    } else {
      results.failed.push('✗ React root not found or empty');
      console.error('✗ React root not found or empty');
    }
  } catch (error) {
    results.failed.push('✗ DOM check error: ' + error.message);
  }

  console.groupEnd();

  // ============================================
  // 2. API Connectivity Check
  // ============================================
  console.group('2️⃣ API Connectivity Check');

  const apiEndpoints = [
    'http://localhost:3001/health',
    'http://localhost:3001/api/agents',
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        results.passed.push(`✓ ${endpoint} - ${response.status}`);
        console.log(`✓ ${endpoint} - ${response.status}`);
      } else {
        results.warnings.push(`⚠ ${endpoint} - ${response.status}`);
        console.warn(`⚠ ${endpoint} - ${response.status}`);
      }
    } catch (error) {
      results.failed.push(`✗ ${endpoint} - ${error.message}`);
      console.error(`✗ ${endpoint} - ${error.message}`);
    }
  }

  console.groupEnd();

  // ============================================
  // 3. WebSocket Check
  // ============================================
  console.group('3️⃣ WebSocket Check');

  try {
    const ws = new WebSocket('ws://localhost:3001/ws');

    const wsPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket timeout'));
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve('Connected');
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });

    await wsPromise;
    results.passed.push('✓ WebSocket connection successful');
    console.log('✓ WebSocket connection successful');
  } catch (error) {
    results.failed.push('✗ WebSocket error: ' + error.message);
    console.error('✗ WebSocket error:', error.message);
  }

  console.groupEnd();

  // ============================================
  // 4. Local Storage Check
  // ============================================
  console.group('4️⃣ Local Storage Check');

  try {
    localStorage.setItem('tnf_test', 'value');
    const value = localStorage.getItem('tnf_test');
    localStorage.removeItem('tnf_test');

    if (value === 'value') {
      results.passed.push('✓ LocalStorage working');
      console.log('✓ LocalStorage working');
    } else {
      results.failed.push('✗ LocalStorage read/write failed');
    }
  } catch (error) {
    results.failed.push('✗ LocalStorage error: ' + error.message);
  }

  console.groupEnd();

  // ============================================
  // 5. Extension Check (if applicable)
  // ============================================
  console.group('5️⃣ Chrome Extension Check');

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      // Check if extension context is available
      const manifest = chrome.runtime.getManifest?.();
      if (manifest) {
        results.passed.push('✓ Extension context available');
        console.log('✓ Extension:', manifest.name, 'v' + manifest.version);
      } else {
        results.warnings.push('⚠ Not in extension context');
        console.warn('⚠ Not in extension context');
      }
    } catch (error) {
      results.warnings.push('⚠ Extension check error: ' + error.message);
    }
  } else {
    results.warnings.push('⚠ Not in Chrome extension context');
    console.warn('⚠ Not in Chrome extension context');
  }

  console.groupEnd();

  // ============================================
  // 6. Performance Metrics
  // ============================================
  console.group('6️⃣ Performance Metrics');

  try {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
      const metrics = {
        'DNS Lookup': (perfData.domainLookupEnd - perfData.domainLookupStart).toFixed(2) + 'ms',
        'TCP Connection': (perfData.connectEnd - perfData.connectStart).toFixed(2) + 'ms',
        'Request Time': (perfData.responseStart - perfData.requestStart).toFixed(2) + 'ms',
        'Response Time': (perfData.responseEnd - perfData.responseStart).toFixed(2) + 'ms',
        'DOM Processing': (perfData.domComplete - perfData.domInteractive).toFixed(2) + 'ms',
        'Load Complete': (perfData.loadEventEnd - perfData.loadEventStart).toFixed(2) + 'ms',
      };

      console.table(metrics);
      results.passed.push('✓ Performance metrics collected');
    }
  } catch (error) {
    results.warnings.push('⚠ Performance API error: ' + error.message);
  }

  console.groupEnd();

  // ============================================
  // 7. Memory Check
  // ============================================
  console.group('7️⃣ Memory Check');

  if (performance.memory) {
    const memory = {
      'Used JS Heap': (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      'Total JS Heap': (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      'Heap Limit': (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      'Usage': ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
    };

    console.table(memory);

    if (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit > 0.9) {
      results.warnings.push('⚠ High memory usage (>90%)');
    } else {
      results.passed.push('✓ Memory usage normal');
    }
  } else {
    results.warnings.push('⚠ Memory API not available');
  }

  console.groupEnd();

  // ============================================
  // SUMMARY
  // ============================================
  console.groupEnd(); // End main group

  console.group('📊 SUMMARY');
  console.log(`✓ Passed: ${results.passed.length}`);
  console.log(`⚠ Warnings: ${results.warnings.length}`);
  console.log(`✗ Failed: ${results.failed.length}`);

  if (results.failed.length === 0 && results.warnings.length === 0) {
    console.log('%c🎉 ALL CHECKS PASSED!', 'color: green; font-size: 16px; font-weight: bold;');
  } else if (results.failed.length === 0) {
    console.log('%c✓ Passed with warnings', 'color: orange; font-size: 14px;');
  } else {
    console.log('%c✗ Some checks failed', 'color: red; font-size: 14px;');
  }

  console.groupEnd();

  return { results, summary: { passed: results.passed.length, warnings: results.warnings.length, failed: results.failed.length } };
})();

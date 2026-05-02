const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const inputFile = args.find(arg => arg.startsWith('--input=')).split('=')[1];
const thresholdFile = args.find(arg => arg.startsWith('--threshold-file=')).split('=')[1];
const outputFile = args.find(arg => arg.startsWith('--output=')).split('=')[1];

// Read test results and thresholds
const results = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const thresholds = JSON.parse(fs.readFileSync(thresholdFile, 'utf8'));

// Analyze results
function analyzeResults(results, thresholds) {
  const analysis = {
    summary: {
      totalTests: results.length,
      passed: 0,
      failed: 0,
      performance: {
        acceptable: 0,
        degraded: 0,
        critical: 0
      }
    },
    details: []
  };

  results.suites.forEach(suite => {
    suite.specs.forEach(spec => {
      const testName = spec.title;
      const duration = spec.duration;
      const threshold = thresholds[testName] || thresholds.default;
      
      const performanceStatus = 
        duration <= threshold.target ? 'acceptable' :
        duration <= threshold.warning ? 'degraded' : 'critical';
      
      analysis.summary.performance[performanceStatus]++;
      
      if (spec.ok) analysis.summary.passed++;
      else analysis.summary.failed++;

      analysis.details.push({
        name: testName,
        duration,
        threshold: threshold.target,
        status: performanceStatus,
        metrics: spec.results?.[0]?.attachments?.find(a => a.name === 'metrics')?.body || {}
      });
    });
  });

  return analysis;
}

// Generate markdown report
function generateReport(analysis) {
  const report = [
    '# Performance Test Results\n',
    '## Summary',
    '| Metric | Count |',
    '|--------|-------|',
    `| Total Tests | ${analysis.summary.totalTests} |`,
    `| Passed | ${analysis.summary.passed} |`,
    `| Failed | ${analysis.summary.failed} |`,
    `| Performance Acceptable | ${analysis.summary.performance.acceptable} |`,
    `| Performance Degraded | ${analysis.summary.performance.degraded} |`,
    `| Performance Critical | ${analysis.summary.performance.critical} |`,
    '\n## Detailed Results\n',
    '| Test | Duration (ms) | Threshold (ms) | Status |',
    '|------|---------------|----------------|---------|'
  ];

  analysis.details
    .sort((a, b) => b.duration - a.duration)
    .forEach(detail => {
      report.push(
        `| ${detail.name} | ${detail.duration.toFixed(2)} | ${detail.threshold} | ${detail.status} |`
      );
    });

  // Add performance recommendations if needed
  if (analysis.summary.performance.degraded > 0 || analysis.summary.performance.critical > 0) {
    report.push('\n## Recommendations');
    report.push('The following tests showed degraded performance:');
    
    analysis.details
      .filter(d => d.status !== 'acceptable')
      .forEach(detail => {
        report.push(`- ${detail.name}: ${detail.duration.toFixed(2)}ms (threshold: ${detail.threshold}ms)`);
        
        // Add specific recommendations based on metrics
        if (detail.metrics.resourceCount > 50) {
          report.push('  - Consider reducing the number of network requests');
        }
        if (detail.metrics.domContentLoaded > 2000) {
          report.push('  - Review initial bundle size and consider code splitting');
        }
      });
  }

  return report.join('\n');
}

// Run analysis and generate report
const analysis = analyzeResults(results, thresholds);
const report = generateReport(analysis);

// Write report
fs.writeFileSync(outputFile, report);

// Exit with error if there are critical performance issues
if (analysis.summary.performance.critical > 0) {
  console.error('Critical performance issues detected');
  process.exit(1);
}
/**
 * QA Trigger API Endpoint
 *
 * Provides an HTTP endpoint to trigger comprehensive QA tests from anywhere
 * This allows the QA to be run from the cloud without local execution
 */

const { main: runQA } = require('./comprehensive_qa.js');

/**
 * API Handler for QA trigger
 */
async function handleQATrigger(req, res) {
  console.log('🎯 QA Test triggered via API');

  const config = req.body?.config || {};
  const target = req.body?.target || process.env.TARGET_SITE || 'https://thenewfuse.com';

  res.status(202).json({
    success: true,
    message: 'QA test started',
    status: 'running',
    target: target,
    estimatedDuration: '5-10 minutes',
    monitoring: {
      devtools: `${process.env.RAILWAY_PUBLIC_DOMAIN}/api/browser/devtools`,
      instructions: 'Use Antigravity with Chrome DevTools MCP to monitor in real-time',
    },
  });

  // Run QA in background
  try {
    console.log('Starting comprehensive QA test...');
    const results = await runQA();

    console.log('✅ QA test completed');
    console.log(`Total pages tested: ${results.pagesTestedCount}`);
    console.log(`Total issues found: ${results.totalIssues}`);

    // Save results
    const fs = require('fs');
    const reportPath = ` /tmp/qa_report_latest.json`;
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`Report saved to: ${reportPath}`);
  } catch (error) {
    console.error('❌ QA test failed:', error);
  }
}

/**
 * Get QA status
 */
function handleQAStatus(req, res) {
  const fs = require('fs');
  const reportPath = `/tmp/qa_report_latest.json`;

  try {
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

      res.json({
        success: true,
        status: 'completed',
        summary: {
          pagesTest: report.pagesTestedCount,
          totalIssues: report.totalIssues,
          duration: report.endTime
            ? (new Date(report.endTime) - new Date(report.startTime)) / 1000
            : null,
          timestamp: report.startTime,
        },
        fullReport: report,
      });
    } else {
      res.json({
        success: true,
        status: 'not_run',
        message: 'No QA test has been run yet',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  handleQATrigger,
  handleQAStatus,
};

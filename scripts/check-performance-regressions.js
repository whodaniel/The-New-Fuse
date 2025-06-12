/**
 * Script to check for performance regressions
 * 
 * This script compares the latest performance test results with the baseline
 * and fails if there are significant regressions.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const THRESHOLD_PERCENT = 10; // 10% regression threshold
const REPORTS_DIR = path.join(process.cwd(), 'performance-reports');
const BASELINES_DIR = path.join(process.cwd(), 'performance-baselines');

// Ensure directories exist
if (!fs.existsSync(REPORTS_DIR)) {
  console.error(`Performance reports directory not found: ${REPORTS_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(BASELINES_DIR)) {
  console.log(`Creating baselines directory: ${BASELINES_DIR}`);
  fs.mkdirSync(BASELINES_DIR, { recursive: true });
}

// Get the latest report
const reportFiles = fs.readdirSync(REPORTS_DIR)
  .filter(file => file.endsWith('.json'))
  .sort()
  .reverse();

if (reportFiles.length === 0) {
  console.error('No performance reports found');
  process.exit(1);
}

const latestReportFile = reportFiles[0];
const latestReport = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, latestReportFile), 'utf8'));

// Check for regressions
let hasRegressions = false;
const regressions = [];

for (const [testName, metrics] of Object.entries(latestReport.tests)) {
  const baselineFile = path.join(BASELINES_DIR, `${testName}.json`);
  
  // If no baseline exists, create one
  if (!fs.existsSync(baselineFile)) {
    console.log(`Creating baseline for ${testName}`);
    fs.writeFileSync(baselineFile, JSON.stringify(metrics, null, 2));
    continue;
  }
  
  // Compare with baseline
  const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  
  for (const [metricName, value] of Object.entries(metrics)) {
    if (typeof value !== 'number' || !baseline[metricName]) continue;
    
    const baselineValue = baseline[metricName];
    const percentChange = ((value - baselineValue) / baselineValue) * 100;
    
    // Check for regression
    if (percentChange > THRESHOLD_PERCENT) {
      hasRegressions = true;
      regressions.push({
        test: testName,
        metric: metricName,
        baseline: baselineValue,
        current: value,
        change: `+${percentChange.toFixed(2)}%`
      });
    }
  }
}

// Report results
if (hasRegressions) {
  console.error('⚠️ Performance regressions detected:');
  console.table(regressions);
  process.exit(1);
} else {
  console.log('✅ No performance regressions detected');
  
  // Update baselines with latest results
  for (const [testName, metrics] of Object.entries(latestReport.tests)) {
    const baselineFile = path.join(BASELINES_DIR, `${testName}.json`);
    fs.writeFileSync(baselineFile, JSON.stringify(metrics, null, 2));
  }
  
  console.log('✅ Performance baselines updated');
}

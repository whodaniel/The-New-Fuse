/**
 * Global teardown for Jest tests in The New Fuse
 * This runs once after all test suites
 */

import path from 'path';
import fs from 'fs';

export default async () => {
  console.log('\n🧹 Cleaning up test environment...');
  
  // Generate test run summary
  const runDir = process.env.TEST_RUN_DIR;
  if (runDir && fs.existsSync(runDir)) {
    // Create a summary file with test run information
    const summaryPath = path.join(runDir, 'test-summary.json');
    const summary = {
      runId: process.env.TEST_RUN_ID,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      completed: true
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📊 Test summary saved to: ${summaryPath}`);
  }
  
  console.log('✅ Test environment cleanup complete\n');
};

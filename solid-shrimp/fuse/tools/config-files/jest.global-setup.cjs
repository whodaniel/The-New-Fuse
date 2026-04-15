/**
 * Global setup for Jest tests in The New Fuse
 * This runs once before all test suites
 */

const path = require('path');
const fs = require('fs');

module.exports = async () => {
  console.log('\n🚀 Setting up test environment...');
  
  // Create test artifacts directory if it doesn't exist
  const artifactsDir = path.join(process.cwd(), 'test-artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
    console.log(`📁 Created test artifacts directory: ${artifactsDir}`);
  }
  
  // Set up global environment variables for all tests
  process.env.TEST_ARTIFACTS_DIR = artifactsDir;
  process.env.TEST_RUN_ID = `test-run-${Date.now()}`;
  
  // Create run-specific directory for this test run
  const runDir = path.join(artifactsDir, process.env.TEST_RUN_ID);
  fs.mkdirSync(runDir, { recursive: true });
  process.env.TEST_RUN_DIR = runDir;
  
  console.log(`📝 Test run ID: ${process.env.TEST_RUN_ID}`);
  console.log('✅ Test environment setup complete\n');
  
  // Return the global object
  return {
    testArtifactsDir: artifactsDir,
    testRunId: process.env.TEST_RUN_ID,
    testRunDir: runDir
  };
};

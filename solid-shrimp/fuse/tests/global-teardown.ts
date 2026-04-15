// Jest global teardown file

/**
 * This module exports a function that is run after all tests have completed
 * Used for cleaning up global resources
 */
module.exports = async function globalTeardown(): any {
  // Clean up any global resources that were created in global-setup

  // Add any necessary cleanup code here
  // For example:
  // - Close database connections
  // - Remove temporary files
  // - Shut down test servers
}
/**
 * Global Jest setup file
 * This file runs before all tests
 */

// Import Jest globals
const { jest } = require('@jest/globals');

// Configure Jest environment
global.jest = jest;
global.describe = jest.describe;
global.expect = jest.expect;
global.it = jest.it;
global.test = jest.test;
global.beforeAll = jest.beforeAll;
global.beforeEach = jest.beforeEach;
global.afterAll = jest.afterAll;
global.afterEach = jest.afterEach;

// Mock process.env
process.env.NODE_ENV = 'test';

// Configure Jest options
jest.setTimeout(30000); // 30 second timeout

// Mock console methods to prevent noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Add any global test setup code here
module.exports = async () => {
  // Set up global test environment
  process.env.NODE_ENV = 'test';

  // Increase timeout for all tests
  jest.setTimeout(30000);

  // Configure artifact generation
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  // Create artifacts directory
  const artifactsDir = path.join(process.cwd(), 'test-artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  // Create screenshots directory
  const screenshotsDir = path.join(artifactsDir, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Create logs directory
  const logsDir = path.join(artifactsDir, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Add global helper for saving artifacts
  global.saveArtifact = (name, content, type = 'other') => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const fileName = `${name}-${timestamp}`;
    const typeDir = path.join(artifactsDir, type);

    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }

    const filePath = path.join(typeDir, fileName);
    fs.writeFileSync(filePath, content);

    return filePath;
  };

  // Add global helper for saving screenshots
  global.saveScreenshot = (name, content) => {
    return global.saveArtifact(name, content, 'screenshots');
  };

  // Add global helper for saving logs
  global.saveLog = (name, content) => {
    return global.saveArtifact(name, content, 'logs');
  };

  // Reset mocks automatically between tests
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // Save test results after each test
  afterEach((done) => {
    if (jasmine.currentTest && jasmine.currentTest.failedExpectations && jasmine.currentTest.failedExpectations.length > 0) {
      const testName = jasmine.currentTest.fullName.replace(/\s+/g, '-');
      const failureDetails = jasmine.currentTest.failedExpectations.map(e => e.message).join('\n');
      global.saveLog(`${testName}-failure`, failureDetails);
    }
    done();
  });

  // Clean up after all tests
  afterAll(() => {
    // Add any global cleanup here if needed
  });
};

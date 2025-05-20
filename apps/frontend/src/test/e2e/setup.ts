import { ServerManager } from '../utils/server-manager.js';
import { TestCleanup } from '../utils/cleanup.js';
import { VisualRegression } from '../utils/visual-regression.js';
import { logger } from '../utils/logger.js';
import { PerformanceMonitor } from '../utils/performance.js';

beforeAll(async () => {
  logger.info('Setting up E2E test environment');
  
  if (process.env.START_SERVER) {
    const server = ServerManager.getInstance();
    await server.start();
    TestCleanup.register(() => server.stop());
  }

  await VisualRegression.initialize();
});

afterAll(async () => {
  logger.info('Cleaning up E2E test environment');
  await TestCleanup.cleanupAll();
  PerformanceMonitor.generateReport();
});

export {};

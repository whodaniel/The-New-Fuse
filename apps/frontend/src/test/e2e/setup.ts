import { ServerManager } from '../utils/server-manager.tsx';
import { TestCleanup } from '../utils/cleanup.tsx';
import { VisualRegression } from '../utils/visual-regression.tsx';
import { logger } from '../utils/logger.js';
import { PerformanceMonitor } from '../utils/performance.tsx';

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

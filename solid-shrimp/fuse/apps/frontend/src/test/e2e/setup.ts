import { ServerManager } from '../utils/server-manager';
import { TestCleanup } from '../utils/cleanup';
import { VisualRegression } from '../utils/visual-regression';
import { logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performance';

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

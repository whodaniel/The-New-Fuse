import { logger } from './logger.js';

export class TestCleanup {
  private static cleanupTasks: (() => Promise<void>)[] = [];

  static register(cleanup: () => Promise<void>): void {
    TestCleanup.cleanupTasks.push(cleanup);
  }

  static async cleanupAll(): Promise<void> {
    for (const task of TestCleanup.cleanupTasks) {
      try {
        await task();
      } catch (error) {
        logger.error('Cleanup task failed:', error);
      }
    }
    TestCleanup.cleanupTasks = [];
  }
}
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Utility for managing correlation IDs across distributed components
 * This helps track requests and errors across multiple services
 */
export class CorrelationIdManager {
  private static storage = new AsyncLocalStorage<string>();

  /**
   * Get the current correlation ID from the context, or generate a new one
   */
  static getCurrentId(): string {
    const id = this.storage.getStore();
    return id || this.generateId();
  }

  /**
   * Generate a new correlation ID
   */
  static generateId(): string {
    return randomUUID();
  }

  /**
   * Run a function with a specific correlation ID in context
   * @param id Correlation ID to use
   * @param fn Function to run in the context
   */
  static runWithId<T>(id: string, fn: () => T): T {
    return this.storage.run(id, fn);
  }

  /**
   * Run a function with a new correlation ID in context
   * @param fn Function to run in the context
   * @returns The result of the function and the generated correlation ID
   */
  static runWithNewId<T>(fn: () => T): { result: T; id: string } {
    const id = this.generateId();
    const result = this.storage.run(id, fn);
    return { result, id };
  }
}

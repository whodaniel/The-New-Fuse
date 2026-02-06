import { Injectable } from '@nestjs/common';
import { DrizzleClient, Drizzle } from '@drizzle/client';

// Create a type for the DatabaseService to avoid "private name" error
export type DatabaseService = DrizzleClient;

@Injectable()
export class TransactionManager {
  constructor(private readonly drizzle: DatabaseService) {}

  /**
   * Execute a function within a transaction
   * @param fn Function to execute within the transaction
   * @returns Result of the transaction
   */
  async transaction<T>(fn: (drizzle: DatabaseService) => Promise<T>): Promise<T> {
    return this.drizzle.$transaction(async (drizzle) => {
      try {
        return await fn(drizzle);
      } catch (error) {
        // Log the transaction error
        console.error('Transaction failed:', error);
        throw error;
      }
    });
  }

  /**
   * Execute a function within a transaction with specific options
   * @param fn Function to execute within the transaction
   * @param options Transaction options including timeout and isolation level
   * @returns Result of the transaction
   */
  async transactionWithOptions<T>(
    fn: (drizzle: DatabaseService) => Promise<T>,
    options: Drizzle.TransactionOptions
  ): Promise<T> {
    return this.drizzle.$transaction(async (drizzle) => {
      try {
        return await fn(drizzle);
      } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
      }
    }, options);
  }
}
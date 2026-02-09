import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

// Create a type for the PrismaService to avoid "private name" error
export type PrismaService = PrismaClient;

@Injectable()
export class TransactionManager {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute a function within a transaction
   * @param fn Function to execute within the transaction
   * @returns Result of the transaction
   */
  async transaction<T>(fn: (prisma: PrismaService) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (prisma) => {
      try {
        return await fn(prisma);
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
    fn: (prisma: PrismaService) => Promise<T>,
    options: Prisma.TransactionOptions
  ): Promise<T> {
    return this.prisma.$transaction(async (prisma) => {
      try {
        return await fn(prisma);
      } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
      }
    }, options);
  }
}
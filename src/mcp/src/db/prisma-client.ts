import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

// Singleton pattern for Prisma client
class PrismaClientSingleton {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'error', 'warn'] 
          : ['error'],
      });

      // Optional: Extensions or middleware could be added here
      PrismaClientSingleton.instance.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();
        logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
        return result;
      });
    }
    return PrismaClientSingleton.instance;
  }
}

// Export the prisma client
export const prisma = PrismaClientSingleton.getInstance();

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Helper function to safely serialize/deserialize JSON
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    logger.error(`Error parsing JSON: ${e.message}`);
    return fallback;
  }
};

// Helper to convert Zod schemas to/from JSON
export const zodSchemaToJson = (schema: any): string => {
  return JSON.stringify(schema);
};

export const jsonToZodSchema = (json: string): any => {
  return safeJsonParse(json, {});
};

// Export default client
export default prisma;
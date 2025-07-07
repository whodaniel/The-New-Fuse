import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Instance
 *
 * A singleton instance of the Prisma client to be used across the application.
 * This ensures that only one connection pool is created.
 *
 * @example
 * import { prisma } from '@the-new-fuse/db';
 * const users = await prisma.user.findMany();
 */
export const prisma = new PrismaClient();

/**
 * It can also be useful to export the class for dependency injection systems.
 */
export { PrismaClient };
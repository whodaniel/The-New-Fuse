/**
 * PrismaService - Legacy compatibility layer
 *
 * This service now wraps the DatabaseService from @the-new-fuse/database
 * which uses Drizzle ORM instead of Prisma.
 *
 * @deprecated Use DatabaseService directly from @the-new-fuse/database
 */
import { DatabaseService } from '@the-new-fuse/database';

// Re-export DatabaseService as PrismaService for backwards compatibility
export { DatabaseService, DatabaseService as PrismaService };

/**
 * DatabaseService - Unified Database Access Layer
 *
 * This service provides a centralized interface for all database operations,
 * wrapping Drizzle ORM repositories. It replaces the legacy PrismaService.
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private db: DatabaseService) {}
 *
 *   async getUser(id: string) {
 *     return this.db.users.findById(id);
 *   }
 * }
 * ```
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Database, db, queryClient } from './client';
import {
  drizzleAgentRepository,
  DrizzleAgentRepository,
  drizzleChatRepository,
  DrizzleChatRepository,
  drizzleTaskRepository,
  DrizzleTaskRepository,
  drizzleUserRepository,
  DrizzleUserRepository,
  drizzleWorkflowRepository,
  DrizzleWorkflowRepository,
  drizzleWorkspaceRepository,
  DrizzleWorkspaceRepository,
  drizzleJulesRepository,
  DrizzleJulesRepository,
} from './repositories';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private _isConnected = false;

  constructor() {
    // The singleton db client is always available
    this._isConnected = true;
  }

  /**
   * Initialize the database connection
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.healthCheck();
      console.log('DatabaseService: Database connection verified');
    } catch (error) {
      console.error('DatabaseService: Failed to verify database connection:', error);
    }
  }

  /**
   * Cleanup database connection
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Connect to the database (no-op for singleton pattern)
   */
  async $connect(): Promise<void> {
    // The singleton db is already connected
    this._isConnected = true;
    console.log('DatabaseService: Connected to database');
  }

  /**
   * Disconnect from the database
   */
  async $disconnect(): Promise<void> {
    try {
      await queryClient.end();
      this._isConnected = false;
      console.log('DatabaseService: Disconnected from database');
    } catch (error) {
      console.error('DatabaseService: Error disconnecting:', error);
    }
  }

  /**
   * Get the raw Drizzle client for direct queries
   */
  get client(): Database {
    return db;
  }

  /**
   * Check if connected to database
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  // ==========================================================================
  // REPOSITORY ACCESSORS - Using singleton repository instances
  // ==========================================================================

  /**
   * User repository for user-related operations
   */
  get users(): DrizzleUserRepository {
    return drizzleUserRepository;
  }

  /**
   * Agent repository for agent-related operations
   */
  get agents(): DrizzleAgentRepository {
    return drizzleAgentRepository;
  }

  /**
   * Chat repository for chat/messaging operations
   */
  get chats(): DrizzleChatRepository {
    return drizzleChatRepository;
  }

  /**
   * Task repository for task management
   */
  get tasks(): DrizzleTaskRepository {
    return drizzleTaskRepository;
  }

  /**
   * Workflow repository for workflow operations
   */
  get workflows(): DrizzleWorkflowRepository {
    return drizzleWorkflowRepository;
  }

  /**
   * Workspace repository for workspace management
   */
  get workspaces(): DrizzleWorkspaceRepository {
    return drizzleWorkspaceRepository;
  }

  /**
   * Jules repository for Jules integration operations
   */
  get jules(): DrizzleJulesRepository {
    return drizzleJulesRepository;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Execute a raw SQL query
   */
  async executeRaw<T = unknown>(query: string): Promise<T[]> {
    const result = await db.execute(sql.raw(query));
    return result as T[];
  }

  /**
   * Health check - verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run operations in a transaction
   * @param fn - Function that receives the transaction client
   */
  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return db.transaction(fn as any);
  }
}

/**
 * PrismaService alias for backwards compatibility
 * @deprecated Use DatabaseService instead
 */
export const PrismaService = DatabaseService;
export type PrismaService = DatabaseService;

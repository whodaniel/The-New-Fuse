import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@the-new-fuse/database/client";
import { DatabaseConfig } from './database.config.js';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private config;
  private prisma;
  constructor(config: DatabaseConfig);
  onModuleInit(): Promise<void>;
  onModuleDestroy(): Promise<void>;
  get client(): PrismaClient;
  transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T>;
  cleanDatabase(): Promise<any>;
}

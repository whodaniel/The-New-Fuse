import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaClient } from '../generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { getDatabaseUrl } from './prisma.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Initialize PrismaClient with PostgreSQL adapter as per Prisma 7+ requirements
    // See: https://pris.ly/d/prisma7-client-config
    const databaseUrl = getDatabaseUrl();
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Use process.on instead of deprecated $on('beforeExit')
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  // Model properties are inherited from PrismaClient
  // Accessible via this.task, this.agent, this.user, etc.

  // Expose the PrismaClient instance for security package compatibility
  get prisma() {
    return this;
  }
}

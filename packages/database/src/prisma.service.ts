import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaClient } from '../generated/prisma';

import { getPrismaClientConfig } from './prisma.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Initialize PrismaClient with the new configuration approach
    const config = getPrismaClientConfig();
    super(config);
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

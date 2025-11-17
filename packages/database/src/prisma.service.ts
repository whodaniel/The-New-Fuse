import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Use process.on instead of deprecated $on('beforeExit')
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
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

  // Explicitly expose model access properties for better IDE support and type safety
  // Based on the actual models available in the current Prisma client
  get task() {
    return super.task;
  }

  get agent() {
    return super.agent;
  }

  get user() {
    return super.user;
  }

  get message() {
    return super.message;
  }

  get workflow() {
    return super.workflow;
  }

  get workflowExecution() {
    return super.workflowExecution;
  }

  // registeredEntity model not available in current schema
  // get registeredEntity() {
  //   return super.registeredEntity;
  // }
}
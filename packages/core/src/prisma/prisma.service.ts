import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@the-new-fuse/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}

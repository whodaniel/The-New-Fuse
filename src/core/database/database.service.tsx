import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@the-new-fuse/database';
import { DatabaseConfig } from './database.config.tsx';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor(private config: DatabaseConfig) {
    this.prisma = new PrismaClient(this.config.getPrismaConfig());
  }

  async onModuleInit(): Promise<void> {
    await this.prisma.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }

  getClient(): PrismaClient {
    return this.prisma;
  }

  async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async cleanDatabase(): Promise<any> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this.prisma).filter((key) => {
      return typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$');
    });

    return Promise.all(
      models.map((modelKey) => this.prisma[modelKey as string].deleteMany())
    );
  }
}
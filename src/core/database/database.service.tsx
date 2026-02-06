import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DrizzleClient } from '@the-new-fuse/database';
import { DatabaseConfig } from './database.config.tsx';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private drizzle: DrizzleClient;

  constructor(private config: DatabaseConfig) {
    this.drizzle = new DrizzleClient(this.config.getDrizzleConfig());
  }

  async onModuleInit(): Promise<void> {
    await this.drizzle.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.drizzle.$disconnect();
  }

  getClient(): DrizzleClient {
    return this.drizzle;
  }

  async transaction<T>(
    fn: (drizzle: DrizzleClient) => Promise<T>
  ): Promise<T> {
    return this.drizzle.$transaction(fn);
  }

  async cleanDatabase(): Promise<any> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this.drizzle).filter((key) => {
      return typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$');
    });

    return Promise.all(
      models.map((modelKey) => this.drizzle[modelKey as string].deleteMany())
    );
  }
}
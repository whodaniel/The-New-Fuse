import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@the-new-fuse/database/client';
import { DatabaseConfig } from './database.config.js';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor(private config: DatabaseConfig) {
    this.prisma = new PrismaClient(this.config.getPrismaConfig(): Promise<any> {
    await this.prisma.$connect(): Promise<any> {
    await this.prisma.$disconnect(): PrismaClient {
    return this.prisma;
  }

  async transaction<T>() => Promise<void> {
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(fn): Promise<any> {
    if(process.env.NODE_ENV === 'production': unknown) {
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

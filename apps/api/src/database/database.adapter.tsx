import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongoClient, Db } from 'mongodb';

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getClient(): any;
}

@Injectable()
export class PostgresAdapter implements DatabaseAdapter {
  constructor(private configService: ConfigService) {}

  async connect(): Promise<void> {
    // PostgreSQL connection is handled by TypeORM
  }

  async disconnect(): Promise<void> {
    // PostgreSQL disconnection is handled by TypeORM
  }

  getClient() {
    return TypeOrmModule;
  }
}

@Injectable()
export class MongoAdapter implements DatabaseAdapter {
  private client: MongoClient;
  private db: Db;

  constructor(private configService: ConfigService) {
    const mongoUrl = this.configService.get<string>('MONGODB_URL');
    this.client = new MongoClient(mongoUrl);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db('fuse');
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  getClient() {
    return this.db;
  }
}

@Injectable()
export class DatabaseService {
  private adapter: DatabaseAdapter;

  constructor(
    private configService: ConfigService,
  ) {
    const dbType = this.configService.get<string>('DATABASE_TYPE');
    this.adapter = dbType === 'mongodb' 
      ? new MongoAdapter(configService)
      : new PostgresAdapter(configService);
  }

  async onModuleInit() {
    await this.adapter.connect();
  }

  async onModuleDestroy() {
    await this.adapter.disconnect();
  }

  getClient() {
    return this.adapter.getClient();
  }
}

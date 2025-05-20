import { Injectable } from '@nestjs/common';
import { Collection, MongoClient } from 'mongodb';
import { Logger } from '@the-new-fuse/utils';

@Injectable()
export class DatabaseService {
  private client: MongoClient;
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger(DatabaseService.name);
  }

  async connect(): Promise<void> {
    try {
      const uri = (process as any).env.MONGODB_URI || 'mongodb://localhost:27017';
      this.client = await MongoClient.connect(uri);
    } catch (error) {
      this.logger.error('Failed to connect to database', { error });
    }
  }

  collection(name: string): Collection {
    return this.client.db().collection(name);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }

  async getPendingSyncs(): Promise<any[]> {
    return this.collection('state_syncs').find({ status: 'pending' }).toArray();
  }

  async updateSync(id: string, update: unknown): Promise<void> {
    await this.collection('state_syncs').updateOne({ id }, { $set: update });
  }
}

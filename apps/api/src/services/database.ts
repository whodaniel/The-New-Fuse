import { Injectable } from '@nestjs/common';

export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

@Injectable()
export class DatabaseService {
  private connections: Map<string, DatabaseConnection> = new Map();

  async connect(name: string, config: DatabaseConnection): Promise<void> {
    // Mock implementation
    this.connections.set(name, config);
  }

  async disconnect(name: string): Promise<void> {
    this.connections.delete(name);
  }

  getConnection(name: string): DatabaseConnection | null {
    return this.connections.get(name) || null;
  }

  async query(sql: string, params?: any[]): Promise<any[]> {
    // Mock implementation
    return [];
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    // Mock implementation
    return callback();
  }
}

export const databaseService = new DatabaseService();
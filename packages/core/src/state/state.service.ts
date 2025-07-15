import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class StateService {
  private state: Map<string, any> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return this.state.get(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get state', { error: errorMessage, key });
      throw new Error('Failed to get state');
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      this.state.set(key, value);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to set state', { error: errorMessage, key });
      throw new Error('Failed to set state');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.state.delete(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to delete state', { error: errorMessage, key });
      throw new Error('Failed to delete state');
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return this.state.has(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to check state existence', { error: errorMessage, key });
      return false;
    }
  }

  async increment(key: string): Promise<number> {
    try {
      const current = this.state.get(key) || 0;
      const newValue = Number(current) + 1;
      this.state.set(key, newValue);
      return newValue;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to increment value', { error: errorMessage, key });
      throw new Error('Failed to increment value');
    }
  }

  async decrement(key: string): Promise<number> {
    try {
      const current = this.state.get(key) || 0;
      const newValue = Number(current) - 1;
      this.state.set(key, newValue);
      return newValue;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to decrement value', { error: errorMessage, key });
      throw new Error('Failed to decrement value');
    }
  }

  async getKeys(): Promise<string[]> {
    try {
      return Array.from(this.state.keys());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get keys', { error: errorMessage });
      throw new Error('Failed to get keys');
    }
  }

  async clear(): Promise<void> {
    try {
      this.state.clear();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to clear state', { error: errorMessage });
      throw new Error('Failed to clear state');
    }
  }
}
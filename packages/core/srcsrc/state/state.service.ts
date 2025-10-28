import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StateService {
  private state: Map<string, any> = new Map();
  private readonly logger = new Logger(StateService.name);

  constructor() {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.state.get(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.state.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.state.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.state.has(key);
  }

  async increment(key: string, amount = 1): Promise<number> {
    const current = this.state.get(key) || 0;
    const newValue = Number(current) + amount;
    this.state.set(key, newValue);
    return newValue;
  }

  async decrement(key: string, amount = 1): Promise<number> {
    const current = this.state.get(key) || 0;
    const newValue = Number(current) - amount;
    this.state.set(key, newValue);
    return newValue;
  }

  async getKeys(): Promise<string[]> {
    return Array.from(this.state.keys());
  }

  async clear(): Promise<void> {
    this.state.clear();
  }
}

import { IAgent } from './interfaces/IAgent.js';
import { Message } from '@the-new-fuse/types';
import { MemoryManager } from '@the-new-fuse/core';

export abstract class BaseAgent implements IAgent {
  protected memoryManager: MemoryManager;
  
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: string,
    public readonly capabilities: string[]
  ) {
    this.memoryManager = new MemoryManager();
  }

  abstract process(message: Message): Promise<Message>;
  
  async learn(data: unknown): Promise<void> {
    // Implementation will vary by agent type
    throw new Error('Method not implemented.');
  }

  async store(key: string, value: unknown): Promise<void> {
    await this.memoryManager.store(key, value);
  }

  async retrieve(key: string): Promise<unknown> {
    return await this.memoryManager.retrieve(key);
  }

  async update(key: string, value: unknown): Promise<void> {
    await this.memoryManager.update(key, value);
  }

  async handleMessage(message: Message): Promise<void> {
    // Implementation will be provided by specific agent types
    throw new Error('Method not implemented.');
  }

  async handleError(error: Error): Promise<void> {
    console.error(`Agent ${this.name} encountered an error:`, error);
    // Add error logging and recovery logic
  }
}

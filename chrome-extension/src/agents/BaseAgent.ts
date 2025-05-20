import { IAgent } from './interfaces/IAgent';
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

  /**
   * Process an incoming message
   * @param message Message to process
   */
  abstract process(message: Message): Promise<Message>;

  /**
   * Learn from provided data
   * @param data Data to learn from
   */
  async learn(data: unknown): Promise<void> {
    // Implementation will vary by agent type
    throw new Error('Method not implemented.');
  }

  /**
   * Store data in agent memory
   * @param key Storage key
   * @param value Data to store
   */
  async store(key: string, value: unknown): Promise<void> {
    await this.memoryManager.store(key, value);
  }

  /**
   * Retrieve data from agent memory
   * @param key Storage key
   */
  async retrieve(key: string): Promise<unknown> {
    return await this.memoryManager.retrieve(key);
  }

  /**
   * Update data in agent memory
   * @param key Storage key
   * @param value New data value
   */
  async update(key: string, value: unknown): Promise<void> {
    await this.memoryManager.update(key, value);
  }

  /**
   * Handle incoming message
   * @param message Message to handle
   */
  async handleMessage(message: Message): Promise<void> {
    // Implementation will be provided by specific agent types
    throw new Error('Method not implemented.');
  }

  /**
   * Handle errors
   * @param error Error to handle
   */
  async handleError(error: Error): Promise<void> {
    console.error(`Agent ${this.name} encountered an error:`, error);
    // Additional error logging and recovery logic can be added here
  }
}

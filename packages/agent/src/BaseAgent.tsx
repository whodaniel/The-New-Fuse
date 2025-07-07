import { IAgent } from './interfaces/IAgent';
import { Message } from '@the-new-fuse/types';

// Memory manager implementation
class MemoryManager {
  private storage: Map<string, unknown> = new Map();

  async store(key: string, value: unknown): Promise<void> {
    this.storage.set(key, value);
  }

  async retrieve(key: string): Promise<unknown> {
    return this.storage.get(key);
  }

  async update(key: string, value: unknown): Promise<void> {
    this.storage.set(key, value);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}

export abstract class BaseAgent implements IAgent {
  protected memoryManager: MemoryManager;
  private currentState: any = {};
  
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: string,
    public readonly capabilities: string[]
  ) {
    this.memoryManager = new MemoryManager();
  }

  // IAgent interface implementation
  async initialize(): Promise<void> {
    // Initialize the agent
    this.currentState = { initialized: true, timestamp: Date.now() };
  }

  abstract process(message: Message): Promise<Message>;
  
  async learn(data: unknown): Promise<void> {
    // Store learning data in memory
    const learningKey = `learning_${Date.now()}`;
    await this.memoryManager.store(learningKey, data);
  }

  async saveToMemory(key: string, value: unknown): Promise<void> {
    await this.memoryManager.store(key, value);
  }

  async retrieveFromMemory(key: string): Promise<any> {
    return await this.memoryManager.retrieve(key);
  }

  async getState(): Promise<any> {
    return { ...this.currentState };
  }

  async setState(state: unknown): Promise<void> {
    if (typeof state === 'object' && state !== null) {
      this.currentState = { ...this.currentState, ...(state as Record<string, any>) };
    } else {
      this.currentState = state;
    }
  }

  async sendMessage(message: Message): Promise<void> {
    // Default implementation - can be overridden
    console.log(`Agent ${this.name} sending message:`, message.id);
  }

  async receiveMessage(message: Message): Promise<void> {
    // Default implementation - delegate to handleMessage
    await this.handleMessage(message);
  }

  // Legacy methods for backward compatibility
  async store(key: string, value: unknown): Promise<void> {
    await this.saveToMemory(key, value);
  }

  async retrieve(key: string): Promise<unknown> {
    return await this.retrieveFromMemory(key);
  }

  async update(key: string, value: unknown): Promise<void> {
    await this.saveToMemory(key, value);
  }

  async handleMessage(message: Message): Promise<void> {
    // Default implementation - process the message
    await this.process(message);
  }

  async handleError(error: Error): Promise<void> {
    
    // Store error in state
    this.currentState.lastError = {
      message: error.message,
      timestamp: Date.now()
    };
  }
}

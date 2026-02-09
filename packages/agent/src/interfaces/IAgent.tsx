import { Message } from '@the-new-fuse/types';

export interface IAgent {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  
  // Core methods
  initialize(): Promise<void>;
  process(message: Message): Promise<Message>;
  learn(data: unknown): Promise<void>;
  
  // Memory management
  saveToMemory(key: string, value: unknown): Promise<void>;
  retrieveFromMemory(key: string): Promise<any>;
  
  // State management
  getState(): Promise<any>;
  setState(state: unknown): Promise<void>;
  
  // Communication
  sendMessage(message: Message): Promise<void>;
  receiveMessage(message: Message): Promise<void>;
  
  // Error handling
  handleError(error: Error): Promise<void>;
}

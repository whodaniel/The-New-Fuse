import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger.js';

export interface FunctionCallingAgentConfig {
  name: string;
  instructions: string;
  model: string;
  functions?: any[];
  apiKey: string;
}

interface Task {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: any;
  promise: Promise<any> | null;
}

interface MemoryItem {
  text: string;
  timestamp: number;
}

/**
 * Function-calling agent that can use tools and manage tasks
 * 
 * This agent leverages OpenAI's function calling capabilities to execute
 * tools and manage asynchronous tasks.
 */
export class FunctionCallingAgent extends EventEmitter {
  private name: string;
  private instructions: string;
  private model: string;
  private functions: any[];
  private tasks: Record<string, Task> = {};
  private memory: MemoryItem[] = [];
  private client: OpenAI;
  private logger: Logger;

  constructor(config: FunctionCallingAgentConfig) {
    super();
    this.name = config.name;
    this.instructions = config.instructions;
    this.model = config.model;
    this.functions = config.functions || [];
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.logger = new Logger(`FunctionCallingAgent:${this.name}`);
    
    this.logger.info('Agent initialized', { model: this.model });
  }

  /**
   * Run the agent with the provided messages
   */
  async run(messages: any[]) {
    try {
      this.logger.info('Running agent', { messages });
      this.emit('running', { messages });
      
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: this.functions.length > 0 ? this.functions : undefined,
        tool_choice: 'auto',
      });
      
      const response = completion.choices[0].message;
      this.logger.info('Agent response', { response });
      this.emit('response', { response });
      
      return response;
    } catch (error: any) {
      this.logger.error('Error running agent', { error });
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Add a tool to the agent
   */
  addTool(tool: any) {
    this.functions.push(tool);
    this.logger.info('Tool added', { tool });
    this.emit('toolAdded', { toolName: tool.function?.name });
  }

  /**
   * Remove a tool from the agent
   */
  removeTool(toolName: string): boolean {
    const initialLength = this.functions.length;
    this.functions = this.functions.filter(tool => tool.function?.name !== toolName);
    
    const wasRemoved = initialLength !== this.functions.length;
    
    if (wasRemoved) {
      this.logger.info('Tool removed', { toolName });
      this.emit('toolRemoved', { toolName });
    }
    
    return wasRemoved;
  }

  /**
   * Get all tools for the agent
   */
  getTools(): any[] {
    return [...this.functions];
  }

  /**
   * Get the agent's instructions
   */
  getInstructions(): string {
    return this.instructions;
  }

  /**
   * Create an asynchronous task
   */
  async createTask(description: string): Promise<string> {
    const taskId = uuidv4();
    
    this.tasks[taskId] = {
      id: taskId,
      description,
      status: 'pending',
      result: null,
      promise: null
    };
    
    this.logger.info('Task created', { taskId, description });
    this.emit('taskCreated', { taskId, description });
    
    // Start the task
    this.tasks[taskId].status = 'running';
    this.tasks[taskId].promise = new Promise((resolve, reject) => {
      // Simulate an asynchronous task
      // In a real implementation, this would be replaced with actual task execution
      setTimeout(() => {
        try {
          const result = { message: `Task completed: ${description}`, completedAt: new Date().toISOString() };
          this.tasks[taskId].result = result;
          this.tasks[taskId].status = 'completed';
          
          this.logger.info('Task completed', { taskId, result });
          this.emit('taskCompleted', { taskId, result });
          
          resolve(result);
        } catch (error) {
          this.tasks[taskId].status = 'failed';
          this.tasks[taskId].result = { error: String(error) };
          
          this.logger.error('Task failed', { taskId, error });
          this.emit('taskFailed', { taskId, error });
          
          reject(error);
        }
      }, 5000); // Simulate 5 seconds of work
    });
    
    return taskId;
  }

  /**
   * Check the status of a task
   */
  async checkTask(taskId: string): Promise<any> {
    const task = this.tasks[taskId];
    
    if (!task) {
      const error = `Task ${taskId} not found`;
      this.logger.error(error);
      throw new Error(error);
    }
    
    if (task.status === 'completed') {
      return task.result;
    } else if (task.status === 'failed') {
      return { error: 'Task failed', details: task.result };
    } else {
      return { status: task.status, message: `Task ${taskId} is ${task.status}` };
    }
  }

  /**
   * Add an item to the agent's memory
   */
  addToMemory(text: string): void {
    const memoryItem = { text, timestamp: Date.now() };
    this.memory.push(memoryItem);
    
    this.logger.info('Added to memory', { text });
    this.emit('memoryAdded', { text });
  }

  /**
   * Retrieve all items from the agent's memory
   */
  getMemory(): MemoryItem[] {
    return [...this.memory];
  }

  /**
   * Clear the agent's memory
   */
  clearMemory(): void {
    this.memory = [];
    
    this.logger.info('Memory cleared');
    this.emit('memoryCleared', {});
  }

  /**
   * Get the agent's name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get the agent's model
   */
  getModel(): string {
    return this.model;
  }
}
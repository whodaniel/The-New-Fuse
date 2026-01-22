import { Message } from '@the-new-fuse/types';

/**
 * Interface defining core agent capabilities
 */
export interface IAgent {
  /**
   * Unique identifier for the agent
   */
  readonly id: string;

  /**
   * Display name of the agent
   */
  readonly name: string;

  /**
   * Type of agent (e.g., 'task', 'chat', 'system')
   */
  readonly type: string;

  /**
   * List of agent capabilities
   */
  readonly capabilities: string[];

  /**
   * Process a message and generate a response
   * @param message Message to process
   * @returns Response message
   */
  process(message: Message): Promise<Message>;

  /**
   * Learn from provided data to improve future responses
   * @param data Data to learn from
   */
  learn(data: unknown): Promise<void>;

  /**
   * Store data in agent memory
   * @param key Storage key
   * @param value Data to store
   */
  store(key: string, value: unknown): Promise<void>;

  /**
   * Retrieve data from agent memory
   * @param key Storage key
   */
  retrieve(key: string): Promise<unknown>;

  /**
   * Update existing data in agent memory
   * @param key Storage key
   * @param value New data value
   */
  update(key: string, value: unknown): Promise<void>;

  /**
   * Handle incoming message from other agents/system
   * @param message Message to handle
   */
  handleMessage(message: Message): Promise<void>;

  /**
   * Handle errors encountered during operation
   * @param error Error to handle
   */
  handleError(error: Error): Promise<void>;
}

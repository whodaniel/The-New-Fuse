import { BaseService } from '../core/BaseService.js'; // Corrected import path
import { Logger } from '@packages/utils'; // Assuming Logger is available
import Redis, { RedisOptions, Redis as RedisClient } from 'ioredis';
import { ConfigService } from './ConfigService.js'; // Assuming a ConfigService exists

/**
 * Service for interacting with a Redis instance.
 * Provides basic Redis commands and handles connection management.
 */
export class RedisService extends BaseService {
  private logger: Logger;
  private client: RedisClient | null = null;
  private configService: ConfigService; // Inject or instantiate ConfigService
  private options: RedisOptions;

  constructor(configService: ConfigService) {
    super();
    this.logger = new Logger('RedisService');
    this.configService = configService;

    // Load Redis configuration (example using ConfigService)
    this.options = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string | undefined>('REDIS_PASSWORD', undefined),
      db: this.configService.get<number>('REDIS_DB', 0),
      maxRetriesPerRequest: 3, // Example: retry commands on connection issues
      enableReadyCheck: true,
      // Add other ioredis options as needed
      lazyConnect: true, // Connect only when a command is issued or explicitly called
    };

    this.logger.info(`RedisService configured for ${this.options.host}:${this.options.port}, DB ${this.options.db}`);
    // Don't connect immediately if lazyConnect is true
  }

  /**
   * Explicitly connects to the Redis server if not already connected.
   */
  async connect(): Promise<void> {
    if (this.client && (this.client.status === 'ready' || this.client.status === 'connecting')) {
      this.logger.debug('Already connected or connecting to Redis.');
      return;
    }

    if (!this.client || this.client.status === 'end' || this.client.status === 'close') {
        this.logger.info(`Connecting to Redis at ${this.options.host}:${this.options.port}...`);
        this.client = new Redis(this.options);

        this.client.on('connect', () => {
            this.logger.info('Redis client connected.');
        });

        this.client.on('ready', () => {
            this.logger.info('Redis client ready.');
        });

        this.client.on('error', (error) => {
            this.logger.error(`Redis client error: ${error.message}`, error);
            // Depending on the error, you might want to attempt reconnection or handle specific cases
        });

        this.client.on('close', () => {
            this.logger.warn('Redis connection closed.');
        });

        this.client.on('reconnecting', (delay) => {
            this.logger.info(`Redis client reconnecting in ${delay}ms...`);
        });

        this.client.on('end', () => {
            this.logger.warn('Redis connection ended. No more reconnections will be attempted.');
            // Consider cleanup or state change here
        });
    }

    try {
        // For non-lazy connect or explicit connect, wait for ready state
        if (!this.options.lazyConnect || this.client.status !== 'ready') {
           await this.client.connect(); // ioredis connect() returns the client, use status or events
           // Wait for the 'ready' event might be more robust
           await new Promise<void>((resolve, reject) => {
               const readyListener = () => {
                   this.client?.removeListener('error', errorListener);
                   resolve();
               };
               const errorListener = (err: Error) => {
                   this.client?.removeListener('ready', readyListener);
                   reject(err);
               };
               this.client?.once('ready', readyListener);
               this.client?.once('error', errorListener); // Handle connection errors during initial connect
           });
        }
    } catch (error) {
        this.logger.error(`Failed to connect to Redis: ${error.message}`, error);
        this.client = null; // Ensure client is null on connection failure
        throw error; // Re-throw the error
    }
  }

  /**
   * Disconnects the Redis client.
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      this.logger.info('Disconnecting Redis client...');
      await this.client.quit(); // Gracefully disconnect
      this.client = null;
      this.logger.info('Redis client disconnected.');
    } else {
       this.logger.debug('Redis client already disconnected.');
    }
  }

  /**
   * Returns the underlying ioredis client instance.
   * Ensures connection is established before returning.
   * @returns The RedisClient instance.
   * @throws Error if connection fails.
   */
  async getClient(): Promise<RedisClient> {
    if (!this.client || (this.client.status !== 'ready' && this.client.status !== 'connecting')) {
      await this.connect(); // Ensure connection is established
    }
    if (!this.client) {
        // This should ideally not happen if connect() throws on failure
        throw new Error('Redis client is not available after attempting connection.');
    }
    // Wait if status is 'connecting'
    if (this.client.status === 'connecting') {
        await new Promise<void>((resolve, reject) => {
             const readyListener = () => {
                 this.client?.removeListener('error', errorListener);
                 resolve();
             };
             const errorListener = (err: Error) => {
                 this.client?.removeListener('ready', readyListener);
                 reject(err);
             };
             this.client?.once('ready', readyListener);
             this.client?.once('error', errorListener);
        });
    }
     if (this.client.status !== 'ready') {
        throw new Error(`Redis client is not ready. Status: ${this.client.status}`);
    }
    return this.client;
  }

  // --- Example Redis Commands ---

  async set(key: string, value: string | number | Buffer, expirySeconds?: number): Promise<string | null> {
    const client = await this.getClient();
    if (expirySeconds) {
      return client.set(key, value, 'EX', expirySeconds);
    }
    return client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    const client = await this.getClient();
    return client.get(key);
  }

  async del(key: string | string[]): Promise<number> {
    const client = await this.getClient();
    return client.del(key);
  }

  async incr(key: string): Promise<number> {
    const client = await this.getClient();
    return client.incr(key);
  }

  async decr(key: string): Promise<number> {
    const client = await this.getClient();
    return client.decr(key);
  }

  async publish(channel: string, message: string | Buffer): Promise<number> {
      const client = await this.getClient();
      return client.publish(channel, message);
  }

  // Note: Subscriptions require a dedicated client or careful handling
  // as subscribe/psubscribe put the client in a special mode.
  // Consider creating separate subscriber clients if needed.

  // Add more Redis command wrappers as needed...
}

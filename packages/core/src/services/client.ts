import { createClient, RedisClientType } from 'redis';
import { Logger } from 'winston';
import { setupLogging } from './logging_config';

const logger: Logger = setupLogging('client.ts');
const AI_TASK_CHANNEL = 'ai_task_channel';
const AI_RESULT_CHANNEL = 'ai_result_channel';

export class RedisClient {
  private redisClient: RedisClientType;
  private running: boolean = false;
  private channels: string[] = [AI_TASK_CHANNEL];

  constructor(redisUrl: string = 'redis://localhost:6379') {
    this.redisClient = createClient({ url: redisUrl });
    this.redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  }

  async connect(): Promise<void> {
    try {
      await this.redisClient.connect();
      logger.info(`Connected to Redis and subscribed to channels: ${this.channels.join(', ')}`);
    } catch (err) {
      logger.error('Failed to connect to Redis', err);
    }
  }

  async disconnect(): Promise<void> {
    if (this.running) {
      this.running = false;
      await this.redisClient.quit();
      logger.info('Disconnected from Redis.');
    }
  }

  async start(): Promise<void> {
    this.running = true;
    while (this.running) {
      try {
        const task = await this.redisClient.blPop(AI_TASK_CHANNEL, 0);
        if (task) {
          logger.info(`Received task: ${task.element}`);
          // Process the task and publish the result
          const result = `Processed result for task: ${task.element}`;
          await this.redisClient.publish(AI_RESULT_CHANNEL, result);
        }
      } catch (err) {
        logger.error('Error processing task', err);
      }
    }
  }
}

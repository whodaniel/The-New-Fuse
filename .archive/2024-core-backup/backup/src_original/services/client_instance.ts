import { createClient, RedisClientType } from ''redis';
import { Logger } from 'winston';
import { setupLogging } from './logging_config';
import { v4 as uuidv4 } from 'uuid';
const logger: Logger = setupLogging('')
      url: redis://localhost:6379'
    this.redisClient.on('error'
        capabilities: ['text_processing'
      logger.error('')
      logger.error('Disconnect error: ''
      await this.redisClient.publish('cascade_bridge'
      logger.error('')
        await this.redisClient.publish('cascade_bridge'
        logger.error('')
        case MESSAGE'
        case SYSTEM_EVENT'
      logger.error('')
    logger.info('Registration acknowledged: ''
    logger.info('')
      const client: 'test'
          data: { hello: ''
      process.on('')
        await client.sendMessage('some_receiver'
      logger.error('')
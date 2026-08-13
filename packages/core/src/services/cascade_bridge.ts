import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

@Injectable()
export class CascadeBridge {
  private readonly nestLogger = new Logger(CascadeBridge.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: UnifiedRedisService
  ) {}

  async start(): Promise<void> {
    await this.redisService.subscribe('cascade-in', (message) => {
      const messageStr = typeof message.message === 'string' ? message.message : JSON.stringify(message.message);
      this.handleCascadeMessage(messageStr);
    });
    logger.info('Subscribed to cascade-in channel');
  }

  private handleCascadeMessage(message: string): void {
    try {
      const parsedMessage = JSON.parse(message);
      logger.info('Received cascade message:', parsedMessage);
      // Process the message and publish to cascade-out
      this.redisService.publish('cascade-out', JSON.stringify({ processed: true, ...parsedMessage }));
    } catch (err) {
      logger.error('Error handling cascade message', err);
    }
  }
}

import { Module } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { JulesWebhookHandler } from '@the-new-fuse/jules-integration';
import { Redis } from 'ioredis';
import { JulesWebhookController } from './jules-webhook.controller';

// Placeholder for the JulesUsageTracker
class JulesUsageTracker {
  logUsageStart(julesSessionId: string, taskId: string) {
    console.log(`Usage tracking started for session ${julesSessionId} and task ${taskId}`);
  }
  logUsageEnd(julesSessionId: string) {
    console.log(`Usage tracking ended for session ${julesSessionId}`);
  }
}

@Module({
  controllers: [JulesWebhookController],
  providers: [
    {
      provide: JulesWebhookHandler,
      useFactory: (db: DatabaseService, redis: Redis, usageTracker: JulesUsageTracker) => {
        // We cast redis to any because the handler expects RedisClientType from 'redis'
        // but often we use 'ioredis'. We should ensure compatibility.
        return new JulesWebhookHandler(db as any, redis as any, usageTracker);
      },
      inject: [DatabaseService, 'REDIS_CLIENT', JulesUsageTracker],
    },
    {
      provide: DatabaseService,
      useClass: DatabaseService,
    },
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis(
          process.env.REDIS_URL ||
            'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570'
        );
      },
    },
    {
      provide: Redis,
      useExisting: 'REDIS_CLIENT',
    },
    {
      provide: JulesUsageTracker,
      useClass: JulesUsageTracker,
    },
  ],
})
export class JulesWebhookModule {}

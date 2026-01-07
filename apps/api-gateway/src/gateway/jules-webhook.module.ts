import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
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
    JulesWebhookHandler,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
    {
      provide: Redis,
      useValue: new Redis(),
    },
    {
      provide: JulesUsageTracker,
      useValue: new JulesUsageTracker(),
    },
  ],
})
export class JulesWebhookModule {}

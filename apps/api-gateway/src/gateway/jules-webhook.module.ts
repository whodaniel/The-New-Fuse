// @ts-nocheck
import { Module } from '@nestjs/common';
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
// @ts-ignore
import { RedisModule } from '@the-new-fuse/infrastructure';
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

class NoopJulesWebhookHandler {
  async handleWebhook(): Promise<void> {
    // Intentionally no-op in gateway builds where jules integration package is unavailable.
    return;
  }
}

@Module({
  imports: [RedisModule],
  controllers: [JulesWebhookController],
  providers: [
    {
      provide: 'JULES_WEBHOOK_HANDLER',
      useClass: NoopJulesWebhookHandler,
    },
    {
      provide: DatabaseService,
      useClass: DatabaseService,
    },
    {
      provide: JulesUsageTracker,
      useClass: JulesUsageTracker,
    },
  ],
})
export class JulesWebhookModule {}

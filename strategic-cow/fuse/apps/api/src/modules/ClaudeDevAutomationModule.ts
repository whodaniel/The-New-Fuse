import { Module } from '@nestjs/common';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';
import { ClaudeDevAutomationController } from '../controllers/claude-dev-automation.controller';

@Module({
  controllers: [ClaudeDevAutomationController],
  providers: [ClaudeDevAutomationService],
  exports: [ClaudeDevAutomationService],
})
export class ClaudeDevAutomationModule {}

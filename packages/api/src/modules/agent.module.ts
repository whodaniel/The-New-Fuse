/**
 * Agent Module
 * Organizes all agent-related components using Drizzle ORM
 */

import { Module } from '@nestjs/common';
import { AgentController } from '../controllers/AgentController.js';
import { AgentService } from '../services/agent.service.js';
import { AgentRepository } from '../repositories/agent.repository.js';
import { LocalAIDetectionService } from '../services/agent.service.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentRepository,
    LocalAIDetectionService,
  ],
  exports: [AgentService, AgentRepository]
})
export class AgentModule {}

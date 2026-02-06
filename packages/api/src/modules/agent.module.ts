/**
 * Agent Module
 * Organizes all agent-related components using Drizzle ORM
 */

import { Module } from '@nestjs/common';
import { AgentController } from '../controllers/AgentController';
import { AgentRepository } from '../repositories/agent.repository';
import { AgentService, LocalAIDetectionService } from '../services/agent.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AgentController],
  providers: [AgentService, AgentRepository, LocalAIDetectionService],
  exports: [AgentService, AgentRepository],
})
export class AgentModule {}

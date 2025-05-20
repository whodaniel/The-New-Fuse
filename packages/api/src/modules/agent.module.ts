/**
 * Agent Module
 * Organizes all agent-related components
 */

import { Module } from '@nestjs/common';
import { AgentController } from './controllers/agent.controller.js';
import { AgentService } from './services/agent.service.js';
import { PrismaService } from '../services/prisma.service.js';
import { AuthModule } from './auth/auth.module.js'; // Import AuthModule

@Module({
  imports: [AuthModule], // Import AuthModule here
  controllers: [AgentController],
  providers: [AgentService, PrismaService],
  exports: [AgentService]
})
export class AgentModule {}

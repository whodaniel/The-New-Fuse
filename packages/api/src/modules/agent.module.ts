/**
 * Agent Module
 * Organizes all agent-related components
 */

import { Module } from '@nestjs/common';
import { AgentController } from './controllers/agent.controller';
import { AgentService } from './services/agent.service';
import { PrismaService } from '../services/prisma.service';
import { AuthModule } from './auth/auth.module'; // Import AuthModule

@Module({
  imports: [AuthModule], // Import AuthModule here
  controllers: [AgentController],
  providers: [AgentService, PrismaService],
  exports: [AgentService]
})
export class AgentModule {}

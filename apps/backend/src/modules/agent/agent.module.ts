import { Module } from '@nestjs/common';
import { AgentService } from './agent.service.js';
import { AgentController } from './agent.controller.js';
import { PrismaModule } from '../../lib/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService]
})
export class AgentModule {} 
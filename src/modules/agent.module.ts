import { Module } from "@nestjs/common";
import { AgentController } from '../controllers/agentController.tsx';
import { AgentService } from '../services/agentService.js';
import { PrismaService } from '../lib/prisma.service.tsx';
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule],
  controllers: [AgentController],
  providers: [AgentService, PrismaService],
  exports: [AgentService],
})
export class AgentModule {}

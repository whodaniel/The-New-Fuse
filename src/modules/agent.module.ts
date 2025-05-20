import { Module } from "@nestjs/common";
import { AgentController } from '../controllers/agentController.js';
import { AgentService } from '../services/agentService.js';
import { PrismaService } from '../lib/prisma.service.js';
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule],
  controllers: [AgentController],
  providers: [AgentService, PrismaService],
  exports: [AgentService],
})
export class AgentModule {}

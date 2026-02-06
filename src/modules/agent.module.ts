import { Module } from "@nestjs/common";
import { AgentController } from '../controllers/agentController.tsx';
import { AgentService } from '../services/agentService.js';
import { DatabaseService } from '../lib/drizzle.service.tsx';
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule],
  controllers: [AgentController],
  providers: [AgentService, DatabaseService],
  exports: [AgentService],
})
export class AgentModule {}

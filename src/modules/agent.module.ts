import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AgentController } from '../controllers/agentController.tsx';
import { AgentService } from '../services/agentService.js';

@Module({
  imports: [ConfigModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}

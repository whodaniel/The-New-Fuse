import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseModule } from '@the-new-fuse/database';
import { AgentBankController } from '../controllers/agent-bank.controller.js';
import { AgentCraftingController } from '../controllers/agent-crafting.controller.js';
import { AgentController } from '../controllers/agent.controller.js';
import { SecurityLoggingService } from '../security/security-logging.service.js';
import { AgentBankService } from '../services/agent-bank.service.js';
import { AgentService } from '../services/agent.service.js';
import { BillingModule } from './billing/billing.module.js';

@Module({
  imports: [DatabaseModule, JwtModule, ConfigModule, BillingModule],
  controllers: [AgentController, AgentBankController, AgentCraftingController],
  providers: [AgentService, AgentBankService, SecurityLoggingService],
  exports: [AgentService, AgentBankService],
})
export class AgentModule {}

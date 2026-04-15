import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@the-new-fuse/database';
import { AgentBankController } from '../controllers/agent-bank.controller';
import { AgentController } from '../controllers/agent.controller';
import { SecurityLoggingService } from '../security/security-logging.service';
import { AgentBankService } from '../services/agent-bank.service';
import { AgentService } from '../services/agent.service';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [DatabaseModule, JwtModule, ConfigModule, BillingModule],
  controllers: [AgentController, AgentBankController],
  providers: [AgentService, AgentBankService, SecurityLoggingService],
  exports: [AgentService, AgentBankService],
})
export class AgentModule {}

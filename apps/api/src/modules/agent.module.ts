import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '@the-new-fuse/database';
import { AgentController } from '../controllers/agent.controller';
import { SecurityLoggingService } from '../security/security-logging.service';
import { AgentService } from '../services/agent.service';
import { RegistrySyncService } from '../services/agent/RegistrySyncService';

@Module({
  imports: [DatabaseModule, JwtModule, ConfigModule],
  controllers: [AgentController],
  providers: [AgentService, SecurityLoggingService, RegistrySyncService],
  exports: [AgentService, RegistrySyncService],
})
export class AgentModule {}

// Debugging Module - NestJS module configuration for A2A debugging tools
// Integrates debugger service and controller with dependencies

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { A2ADebuggerService } from './a2a-debugger.service';
import { DebuggerController } from './debugger.controller';

// Import dependency modules
import { CacheModule } from '../../cache/src/cache.module';

@Module({
  imports: [ConfigModule, CacheModule],
  controllers: [DebuggerController],
  providers: [A2ADebuggerService],
  exports: [A2ADebuggerService],
})
export class DebuggingModule {}

import { Module, Global } from '@nestjs/common';
import { LoggingService } from './LoggingService.js';
import { LogAnalyzer } from './LogAnalyzer.js';
import { DatabaseModule } from '@the-new-fuse/database';

@Global()
@Module({
  imports: [
    DatabaseModule
  ],
  providers: [
    LoggingService,
    LogAnalyzer
  ],
  exports: [
    LoggingService,
    LogAnalyzer
  ]
})
export class LoggingModule {}

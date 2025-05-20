import { Module, Global } from '@nestjs/common';
import { ErrorHandlerService } from './ErrorHandlerService.js';
import { ErrorRecoveryService } from './ErrorRecoveryService.js';
import { DatabaseModule } from '@the-new-fuse/database';

@Global()
@Module({
  imports: [
    DatabaseModule
  ],
  providers: [
    ErrorHandlerService,
    ErrorRecoveryService
  ],
  exports: [
    ErrorHandlerService,
    ErrorRecoveryService
  ]
})
export class ErrorModule {}

import { Module, Global } from '@nestjs/common';
import { AuthenticationService } from './AuthenticationService.js';
import { AuthorizationService } from './AuthorizationService.js';
import { DatabaseModule } from '@the-new-fuse/database';

@Global()
@Module({
  imports: [
    DatabaseModule
  ],
  providers: [
    AuthenticationService,
    AuthorizationService
  ],
  exports: [
    AuthenticationService,
    AuthorizationService
  ]
})
export class SecurityModule {}

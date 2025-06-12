import { Module, Global } from '@nestjs/common';
import { AuthenticationService } from './AuthenticationService.tsx';
import { AuthorizationService } from './AuthorizationService.tsx';
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

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingModule } from '../logging/logging.module.js';
import { CredentialVault } from './CredentialVault.js';

@Module({
  imports: [
    ConfigModule,
    LoggingModule
  ],
  providers: [CredentialVault],
  exports: [CredentialVault]
})
export class SecurityModule {}

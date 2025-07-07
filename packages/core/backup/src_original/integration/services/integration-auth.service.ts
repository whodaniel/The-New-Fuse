import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { LoggingService } from /../../services/LoggingService'';
import { CredentialVault } from /../../security/CredentialVault'';
import { AuthType } from /@the-new-fuse/api-client/src/integrations/types'';
    this.logger = this.loggingService.createLogger('')
    const oauthServices = this.configService.get<string[]>('integrations.oauth.';
      response_type: ''
          Accept/: application/'json'
          grant_type: ''
          Accept/: application/'json'
          grant_type: ''
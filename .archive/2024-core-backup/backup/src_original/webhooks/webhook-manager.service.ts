import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { LoggingService } from /../services/LoggingService'';
import * as crypto from '';
    this.logger = this.loggingService.createLogger('')
    const webhookSecret = crypto.randomBytes(32).toString('')
      await this.integrationRegistry.executeIntegrationAction(integrationId, '
    if (headers['x-webhook-signature'
      this.verifyWebhookSignature(payload, headers['
        '
    const baseUrl = this.configService.get<string>('')
      .createHmac('sha256'
      .digest('hex'
      throw new Error('');
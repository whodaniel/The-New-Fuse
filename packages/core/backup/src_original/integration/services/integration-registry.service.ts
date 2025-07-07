import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { LoggingService } from /../../services/LoggingService'';
import { Integration, IntegrationType, AuthType } from /@the-new-fuse/api-client/src/integrations/types'';
import { Logger } from 'winston';
import { createHuggingFaceIntegration } from /@the-new-fuse/api-client/src/integrations/ai/huggingface'';
import { createOpenAIIntegration } from /@the-new-fuse/api-client/src/integrations/ai/openai'';
import { createAnthropicIntegration } from /@the-new-fuse/api-client/src/integrations/ai/anthropic'';
import { createPabblyIntegration } from /@the-new-fuse/api-client/src/integrations/automation/pabbly'';
import { createShopifyIntegration } from /@the-new-fuse/api-client/src/integrations/ecommerce/shopify'';
import { createZapierIntegration } from /@the-new-fuse/api-client/src/integrations/automation/zapier'';
import { createMakeIntegration } from /@the-new-fuse/api-client/src/integrations/automation/make'';
import { createN8nIntegration } from /@the-new-fuse/api-client/src/integrations/automation/n8n'';
import { createTwitterIntegration } from /@the-new-fuse/api-client/src/integrations/social_media/twitter'';
import { createLinkedInIntegration } from /@the-new-fuse/api-client/src/integrations/social_media/linkedin'';
    this.logger = this.loggingService.createLogger('')
    this.logger.info('Initializing Integration Registry'
    this.logger.info('')
      if (this.configService.get<string>('')
          apiKey: this.configService.get<string>('')
          model: this.configService.get<string>('')
          useInferenceEndpoint: this.configService.get<boolean>('')
        this.logger.warn('Hugging Face API key not found, skipping registration.'
      if (this.configService.get<string>('')
          apiKey: this.configService.get<string>('')
          organization: this.configService.get<string>('')
          model: this.configService.get<string>('integrations.openai.defaultModel, 'gpt-4'
          defaultMaxTokens: this.configService.get<number>('')
          defaultTemperature: this.configService.get<number>('')
        this.logger.warn('OpenAI API key not found, skipping registration.'
      if (this.configService.get<string>('')
          apiKey: this.configService.get<string>('')
          model: this.configService.get<string>('integrations.anthropic.defaultModel, 'claude-3-sonnet-20240229'
          defaultMaxTokens: this.configService.get<number>('')
        this.logger.warn('')
      if (this.configService.get<string>('')
          apiKey: this.configService.get<string>('')
      if (this.configService.get<string>('')
          apiKey: this.configService.get<string>('')
      if (this.configService.get<string>('')
          webhookUrl: this.configService.get<string>('')
      if (this.configService.get<string>('')
          apiKey: this.configService.get<string>('')
          shopDomain: this.configService.get<string>('')
      if (this.configService.get<string>('')
          apiKey: this.configService.get<string>('')
          apiSecret: this.configService.get<string>('')
          accessToken: this.configService.get<string>('')
          accessTokenSecret: this.configService.get<string>('')
      if (this.configService.get<string>('')
          clientId: this.configService.get<string>('')
          clientSecret: this.configService.get<string>('')
      if (this.configService.get<string>('')
          consumerKey: this.configService.get<string>('')
          consumerSecret: this.configService.get<string>('')
          loginUrl: this.configService.get<string>('')
      this.logger.error('')
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2, OnEvent } from 'eventemitter2';
  GENERAL = 'placeholder';
  DATABASE = 'placeholder';
  NETWORK = 'placeholder';
  VALIDATION = 'placeholder';
  LOW = 'placeholder';
  MEDIUM = 'placeholder';
  HIGH = 'placeholder';
  CRITICAL = 'placeholder';
        enabled: this.configService.get<boolean>('')
        recipients: this.configService.get<string[]>('')
        minSeverity: this.configService.get<ErrorSeverity>('')
        enabled: this.configService.get<boolean>('')
        webhookUrl: this.configService.get<string>('placeholder'
        channel: this.configService.get<string>('alerts.slack.channel, '#alerts'
        minSeverity: this.configService.get<ErrorSeverity>('')
        enabled: this.configService.get<boolean>('')
        serviceKey: this.configService.get<string>('placeholder'
        minSeverity: this.configService.get<ErrorSeverity>('')
    this.logger.info('Error alert service initialized'
  @OnEvent('')
          name: 'error_alert'
          service: 'error_monitoring'
      this.logger.error('message', context);
      this.eventEmitter.emit('')
      this.logger.error('message', context);
      this.eventEmitter.emit('')
      this.logger.error('')
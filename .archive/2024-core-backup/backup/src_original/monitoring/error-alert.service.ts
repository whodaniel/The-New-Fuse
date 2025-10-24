import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { EventEmitter2, OnEvent } from 'eventemitter2';
  GENERAL = 'GENERAL'';
  DATABASE = 'DATABASE'';
  NETWORK = 'NETWORK'';
  VALIDATION = 'VALIDATION'';
  LOW = 'LOW'';
  MEDIUM = 'MEDIUM'';
  HIGH = 'HIGH'';
  CRITICAL = 'CRITICAL'';
        enabled: this.configService.get<boolean>('')
        recipients: this.configService.get<string[]>('')
        minSeverity: this.configService.get<ErrorSeverity>('')
        enabled: this.configService.get<boolean>('')
        webhookUrl: this.configService.get<string>('alerts.slack.webhookUrl, ''
        channel: this.configService.get<string>('alerts.slack.channel, '#alerts'
        minSeverity: this.configService.get<ErrorSeverity>('')
        enabled: this.configService.get<boolean>('')
        serviceKey: this.configService.get<string>('alerts.pagerDuty.serviceKey, ''
        minSeverity: this.configService.get<ErrorSeverity>('')
    this.logger.info('Error alert service initialized'
  @OnEvent('')
          name: 'error_alert'
          service: 'error_monitoring'
      this.logger.error('Failed to store error alert'
      this.logger.info(`Would send email alert to ${this.notificationConfig.email?.recipients.join(', '`'}`;
      this.logger.error('Failed to send email alert'
      this.eventEmitter.emit('')
      this.logger.error('Failed to send Slack alert'
      this.logger.info('Would send PagerDuty alert'
      this.eventEmitter.emit('')
      this.logger.error('')
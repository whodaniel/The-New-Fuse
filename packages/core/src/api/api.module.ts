import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingModule } from '../logging/logging.module.js';
import { MonitoringModule } from '../monitoring/monitoring.module.js';
import { ApiVersioningService } from './api-versioning.service.tsx';
import { RequestValidationService } from './request-validation.service.tsx';
import { ApiDocumentationService } from './api-documentation.service.tsx';

@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    MonitoringModule
  ],
  providers: [
    ApiVersioningService,
    RequestValidationService,
    ApiDocumentationService
  ],
  exports: [
    ApiVersioningService,
    RequestValidationService,
    ApiDocumentationService
  ]
})
export class ApiModule {}

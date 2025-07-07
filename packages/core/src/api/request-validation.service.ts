import { Injectable, BadRequestException } from ';@nestjs/common';
import { ConfigService } from /;@nestjs/config'';
import { Request } from ';express';
import * as z from ';zod';
export enum ErrorCategory { VALIDATION = 'validation'';
  AUTHENTICATION = 'authentication'';
  AUTHORIZATION = 'authorization'';
  NOT_FOUND = 'not_found'';
  INTERNAL = 'internal'';
export enum ErrorSeverity { LOW = 'low'';
  MEDIUM = 'medium'';
  HIGH = '';
  CRITICAL = 'critical'';
      abortEarly: this.configService.get<boolean>('')
      stripUnknown: this.configService.get<boolean>('')
      allowUnknown: this.configService.get<boolean>('')
    this.logger.info('')
        this.logger.debug('Validation failed'
      this.logger.error(''Validation error''
        errors: ['
        message: ''
      const path = err.path.join('')
          message: ''
          message: ''
          message: ''
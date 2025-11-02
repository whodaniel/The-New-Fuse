import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { Request, Response } from 'express';
  URI = 'uri'';
  HEADER = 'header'';
  MEDIA_TYPE = 'media-type'';
  QUERY_PARAM = '';
      enabled: this.configService.get<boolean>('')
      strategy: this.configService.get<VersioningStrategy>('')
      defaultVersion: this.configService.get<string>('api.versioning.defaultVersion, '1'
      supportedVersions: this.configService.get<string[]>('api.versioning.supportedVersions, ['1'
      headerName: this.configService.get<string>('api.versioning.headerName, 'x-api-version'
      queryParamName: this.configService.get<string>('api.versioning.queryParamName, 'version'
      deprecatedVersions: this.configService.get<string[]>('')
      sunsetVersions: this.configService.get<Record<string, Date>>('')
    this.logger.log('')
    response.header('API-Version'
    response.header('Supported-Versions', this.config.supportedVersions.join('')
      response.header('Deprecation', '
      response.header('')
      errors.push('At least one supported version must be specified'
      errors.push('Default version must be included in supported versions'
      this.logger.error('')
/**
 * Tenant Resolution Middleware
 * Handles subdomain-based tenant resolution and context injection for multi-tenant agencies
 */

import { Injectable, NestMiddleware, Logger } from /@nestjs/common'';
import { Request, Response, NextFunction } from 'express';
import { CacheService } from /../cache/cache.'service';
import { ConfigService } from /@nestjs/config'';
      tenantContext?: TenantContext'
  private readonly logger = new Logger(TenantResolutionMiddleware.name)';
      const host = req.get('')
      if (!subdomain || subdomain === '';
      } else if (subdomain === app' || subdomain === '';
      this.logger.error('')
        error: Internal server error during tenant '
    const baseDomain = this.configService.get<string>('')
    const cleanHost = host.split('')
      /'
      /'
      /api/'
      /api/auth/'
      /'
      /'
      /'
    this.logger.debug('')
      agencyId: ''
          error: Agency not 'found'
          error: Agency 'suspended'
          error:Trial expired'
        userAgent: req.get('')
      // Don'
      req.headers['
      req.headers['
      unknown'
    ).split('')
import { Injectable, CanActivate, ExecutionContext, ForbiddenException  } from /@nestjs/common'';
    const request = context.switchToHttp().getRequest()';
      throw new ForbiddenException('')
  resource:maxUsers' | maxAgents'
/**
 * Tenant Resolution Middleware
 * Handles subdomain-based tenant resolution and context injection for multi-tenant agencies
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AgencyService, AgencyFeatures } from '../services/agency.service';
import { CacheService } from '../cache/cache.service';
import { ConfigService } from '@nestjs/config';
import { Agency, AgencyTier } from '@prisma/client';

export interface TenantContext {
  agencyId: string;
  agency: Agency;
  tier: AgencyTier;
  features: AgencyFeatures;
  subdomain: string;
  isActive: boolean;
}

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
    }
  }
}

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantResolutionMiddleware.name);

  constructor(
    private readonly agencyService: AgencyService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const host = req.get('host') || '';
      const subdomain = this.extractSubdomain(host);

      // Skip tenant resolution for certain paths
      if (this.shouldSkipTenantResolution(req.path)) {
        return next();
      }

      // Handle different subdomain scenarios
      if (!subdomain || subdomain === 'www') {
        // No subdomain or www - this is the main platform
        await this.handleMainPlatform(req, res, next);
      } else if (subdomain === 'app' || subdomain === 'admin') {
        // Admin/app subdomain - handle master admin access
        await this.handleMasterAdmin(req, res, next, subdomain);
      } else {
        // Agency subdomain - resolve and inject tenant context
        await this.handleAgencySubdomain(req, res, next, subdomain);
      }
    } catch (error) {
      this.logger.error('Error in tenant resolution:', error);
      res.status(500).json({
        error: 'Internal server error during tenant resolution'
      });
    }
  }

  /**
   * Extract subdomain from host header
   */
  private extractSubdomain(host: string): string | null {
    const baseDomain = this.configService.get<string>('BASE_DOMAIN', 'thenewfuse.com');
    
    // Remove port if present
    const cleanHost = host.split(':')[0];
    
    // Check if this is a subdomain of our base domain
    if (!cleanHost.endsWith(baseDomain)) {
      return null;
    }
    
    // Extract subdomain
    const subdomain = cleanHost.replace(`.${baseDomain}`, '');
    
    // If subdomain equals the full host, there's no subdomain
    if (subdomain === cleanHost || subdomain === baseDomain) {
      return null;
    }
    
    return subdomain;
  }

  /**
   * Check if tenant resolution should be skipped for certain paths
   */
  private shouldSkipTenantResolution(path: string): boolean {
    const skipPaths = [
      '/health',
      '/metrics',
      '/api/master',
      '/api/auth/master',
      '/webhook',
      '/static',
      '/public'
    ];
    
    return skipPaths.some(skipPath => path.startsWith(skipPath));
  }

  /**
   * Handle main platform access (no subdomain)
   */
  private async handleMainPlatform(req: Request, res: Response, next: NextFunction): Promise<void> {
    // This is the main platform - could be marketing site, master admin, etc.
    // No tenant context needed
    this.logger.debug('Main platform access detected');
    next();
  }

  /**
   * Handle master admin access (admin.thenewfuse.com or app.thenewfuse.com)
   */
  private async handleMasterAdmin(
    req: Request, 
    res: Response, 
    next: NextFunction, 
    subdomain: string
  ): Promise<void> {
    this.logger.debug(`Master admin access detected: ${subdomain}`);
    
    // Could inject master admin context here
    req.tenantContext = {
      agencyId: 'master',
      agency: null as any, // Special case for master admin
      tier: AgencyTier.WHITE_LABEL, // Highest privileges
      features: this.agencyService.getAgencyFeatures(AgencyTier.WHITE_LABEL),
      subdomain,
      isActive: true
    };
    
    next();
  }

  /**
   * Handle agency subdomain access
   */
  private async handleAgencySubdomain(
    req: Request, 
    res: Response, 
    next: NextFunction, 
    subdomain: string
  ): Promise<void> {
    this.logger.debug(`Agency subdomain access: ${subdomain}`);

    try {
      // Resolve agency from subdomain
      const agency = await this.resolveAgencyBySubdomain(subdomain);
      
      if (!agency) {
        this.logger.warn(`Agency not found for subdomain: ${subdomain}`);
        return res.status(404).json({
          error: 'Agency not found',
          code: 'AGENCY_NOT_FOUND',
          subdomain
        });
      }

      if (!agency.isActive) {
        this.logger.warn(`Agency suspended for subdomain: ${subdomain}`);
        return res.status(403).json({
          error: 'Agency suspended',
          code: 'AGENCY_SUSPENDED',
          subdomain,
          message: 'This agency has been suspended. Please contact support.'
        });
      }

      // Check if agency trial has expired
      if (agency.subscriptionTier === AgencyTier.TRIAL && agency.trialEndsAt && new Date() > agency.trialEndsAt) {
        this.logger.warn(`Agency trial expired for subdomain: ${subdomain}`);
        return res.status(402).json({
          error: 'Trial expired',
          code: 'TRIAL_EXPIRED',
          subdomain,
          message: 'Your trial has expired. Please upgrade your subscription.'
        });
      }

      // Inject tenant context
      const features = this.agencyService.getAgencyFeatures(agency.subscriptionTier);
      
      req.tenantContext = {
        agencyId: agency.id,
        agency,
        tier: agency.subscriptionTier,
        features,
        subdomain,
        isActive: agency.isActive
      };

      this.logger.debug(`Tenant context injected for agency: ${agency.id}`);
      
      // Log successful tenant resolution (for analytics)
      await this.logTenantAccess(agency.id, subdomain, req);
      
      next();
    } catch (error) {
      this.logger.error(`Error resolving agency for subdomain ${subdomain}:`, error);
      res.status(500).json({
        error: 'Error resolving agency',
        code: 'AGENCY_RESOLUTION_ERROR'
      });
    }
  }

  /**
   * Resolve agency by subdomain with caching
   */
  private async resolveAgencyBySubdomain(subdomain: string): Promise<Agency | null> {
    const cacheKey = `agency:subdomain:${subdomain}`;
    
    // Check cache first
    let agency = await this.cacheService.get<Agency>(cacheKey);
    
    if (!agency) {
      // Database lookup
      agency = await this.agencyService.getAgencyBySubdomain(subdomain);
      
      // Cache for 5 minutes if found
      if (agency) {
        await this.cacheService.set(cacheKey, agency, 300);
      }
    }
    
    return agency;
  }

  /**
   * Log tenant access for analytics and monitoring
   */
  private async logTenantAccess(
    agencyId: string, 
    subdomain: string, 
    req: Request
  ): Promise<void> {
    try {
      // Create a lightweight access log entry
      const accessLog = {
        agencyId,
        subdomain,
        path: req.path,
        method: req.method,
        userAgent: req.get('user-agent'),
        ip: this.getClientIp(req),
        timestamp: new Date()
      };

      // Could store in Redis for real-time analytics
      await this.cacheService.lpush(`access:logs:${agencyId}`, JSON.stringify(accessLog));
      
      // Keep only last 1000 entries per agency
      await this.cacheService.ltrim(`access:logs:${agencyId}`, 0, 999);
    } catch (error) {
      // Don't fail the request if logging fails
      this.logger.error('Error logging tenant access:', error);
    }
  }

  /**
   * Get client IP address
   */
  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();
  }
}

/**
 * Tenant Context Guard
 * Use this guard to ensure tenant context is available in controllers
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    if (!request.tenantContext) {
      throw new ForbiddenException('Tenant context not available');
    }
    
    return true;
  }
}

/**
 * Get Tenant Context Decorator
 * Use this decorator to inject tenant context into controller methods
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetTenantContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext;
  },
);

/**
 * Tenant Scoped Decorator
 * Use this decorator to automatically scope operations to the current tenant
 */
export function TenantScoped() {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      // This would be implemented to automatically add agency scoping to database queries
      // The implementation depends on your specific ORM/database setup
      return method.apply(this, args);
    };
  };
}

/**
 * Utility function to check if a feature is enabled for the current tenant
 */
export function isFeatureEnabled(tenantContext: TenantContext, feature: keyof AgencyFeatures): boolean {
  return tenantContext.features[feature] === true;
}

/**
 * Utility function to check resource limits for the current tenant
 */
export function checkResourceLimit(
  tenantContext: TenantContext, 
  resource: 'maxUsers' | 'maxAgents' | 'maxStorage',
  currentUsage: number
): { allowed: boolean; limit: number; remaining: number } {
  const limit = tenantContext.features[resource];
  const unlimited = limit === -1;
  const remaining = unlimited ? Infinity : Math.max(0, limit - currentUsage);
  const allowed = unlimited || currentUsage < limit;
  
  return {
    allowed,
    limit: unlimited ? -1 : limit,
    remaining: unlimited ? -1 : remaining
  };
}

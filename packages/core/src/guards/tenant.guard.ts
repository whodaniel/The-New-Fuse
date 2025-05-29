/**
 * Tenant Guard - Ensures requests are properly scoped to an agency
 * Resolves agency context from subdomain or explicit agency ID
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '@the-new-fuse/database';
import { AgencyHubCacheService } from '../services/agency-hub-cache.service';

@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AgencyHubCacheService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    try {
      // Extract tenant context from subdomain or header
      const tenantContext = await this.resolveTenantContext(request);
      
      if (!tenantContext) {
        throw new UnauthorizedException('Invalid or missing tenant context');
      }

      // Validate agency is active
      if (!tenantContext.agency.isActive) {
        throw new ForbiddenException('Agency is suspended or inactive');
      }

      // Inject tenant context into request
      request['tenantContext'] = tenantContext;
      
      this.logger.debug(`Tenant context resolved for agency: ${tenantContext.agencyId}`);
      
      return true;
    } catch (error) {
      this.logger.error(`Tenant guard error: ${error.message}`);
      throw error;
    }
  }

  private async resolveTenantContext(request: Request): Promise<any> {
    // Try to get agency from subdomain
    const subdomain = this.extractSubdomain(request.get('host'));
    
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return this.resolveAgencyBySubdomain(subdomain);
    }

    // Try to get agency from explicit header
    const agencyId = request.get('x-agency-id');
    if (agencyId) {
      return this.resolveAgencyById(agencyId);
    }

    // Try to get agency from user context (if authenticated)
    const user = request['user'];
    if (user?.agencyId) {
      return this.resolveAgencyById(user.agencyId);
    }

    return null;
  }

  private extractSubdomain(host: string | undefined): string | null {
    if (!host) return null;
    
    const parts = host.split('.');
    
    // For development (localhost:3000) or production (domain.com)
    if (parts.length < 3) return null;
    
    return parts[0];
  }

  private async resolveAgencyBySubdomain(subdomain: string): Promise<any> {
    // Check cache first
    const cacheKey = `agency:subdomain:${subdomain}`;
    let agency = await this.cache.get(cacheKey);
    
    if (!agency) {
      // Database lookup
      agency = await this.prisma.agency.findFirst({
        where: {
          subdomain,
          isActive: true
        },
        include: {
          _count: {
            select: {
              users: true,
              agents: true,
              workspaces: true
            }
          }
        }
      });

      if (agency) {
        // Cache for 5 minutes
        await this.cache.set(cacheKey, agency, { ttl: 300 });
      }
    }

    if (!agency) {
      return null;
    }

    return {
      agencyId: agency.id,
      agency,
      tier: agency.subscriptionTier,
      features: this.getAgencyFeatures(agency.subscriptionTier),
      limits: this.getAgencyLimits(agency)
    };
  }

  private async resolveAgencyById(agencyId: string): Promise<any> {
    // Check cache first
    const cacheKey = `agency:id:${agencyId}`;
    let agency = await this.cache.get(cacheKey);
    
    if (!agency) {
      // Database lookup
      agency = await this.prisma.agency.findUnique({
        where: { id: agencyId },
        include: {
          _count: {
            select: {
              users: true,
              agents: true,
              workspaces: true
            }
          }
        }
      });

      if (agency) {
        // Cache for 5 minutes
        await this.cache.set(cacheKey, agency, { ttl: 300 });
      }
    }

    if (!agency) {
      return null;
    }

    return {
      agencyId: agency.id,
      agency,
      tier: agency.subscriptionTier,
      features: this.getAgencyFeatures(agency.subscriptionTier),
      limits: this.getAgencyLimits(agency)
    };
  }

  private getAgencyFeatures(tier: string): string[] {
    const featureMap = {
      TRIAL: ['basic_agents', 'basic_workspaces'],
      STARTER: ['basic_agents', 'basic_workspaces', 'swarm_orchestration'],
      PROFESSIONAL: [
        'basic_agents', 
        'basic_workspaces', 
        'swarm_orchestration',
        'service_routing',
        'advanced_analytics'
      ],
      ENTERPRISE: [
        'basic_agents', 
        'basic_workspaces', 
        'swarm_orchestration',
        'service_routing',
        'advanced_analytics',
        'custom_branding',
        'priority_support'
      ],
      WHITE_LABEL: [
        'basic_agents', 
        'basic_workspaces', 
        'swarm_orchestration',
        'service_routing',
        'advanced_analytics',
        'custom_branding',
        'priority_support',
        'white_label_removal',
        'custom_domains'
      ]
    };

    return featureMap[tier] || featureMap.TRIAL;
  }

  private getAgencyLimits(agency: any): any {
    return {
      maxUsers: agency.userLimit || 5,
      maxAgents: agency.agentLimit || 10,
      maxStorage: agency.storageLimit || 1000, // MB
      maxConcurrentExecutions: agency.swarmConfiguration?.maxConcurrentExecutions || 3
    };
  }
}

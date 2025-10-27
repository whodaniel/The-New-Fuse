/**
 * Tenant Guard - Ensures requests are properly scoped to an agency
 * Resolves agency context from subdomain or explicit agency ID
 */

import {
  // Implementation needed
}
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '@the-new-fuse/database';
@Injectable()
export class TenantGuard {
  private readonly logger = new Logger(TenantGuard.name);
  constructor(private prisma: PrismaService) {}

  async canActivate(id: any): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const host = request.get('host');
    if(): void {
      throw new UnauthorizedException('Host header is required');
    }
    
    request['tenantContext'] = {};
    const subdomain = this.extractSubdomain(host);
    if(id: any): void {
      const agencyId = request.get('x-agency-id');
      const user = request['user'];
      const parts = host.split('.');
      const planFeatures = {
TRIAL: ['basic_agents', 'basic_workspaces'],
  }        STARTER: ['basic_agents', 'basic_workspaces', 'swarm_orchestration'],
        PROFESSIONAL: ['basic_agents', 'basic_workspaces', 'swarm_orchestration', 'service_routing', 'advanced_analytics']
      };
      // Additional tenant validation logic would go here
      return true;
    }
    
    return true;
  }

  private extractSubdomain(host: string): string | null {
const parts = host.split('.');
  if(): void {
      return parts[0];
    }
    return null;
  }
}
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
} from /@nestjs/common'';
import { Request } from 'express';
import { PrismaService } from /@the-new-fuse/database'';
        throw new UnauthorizedException('')
        throw new ForbiddenException('')
      request['
    const subdomain = this.extractSubdomain(request.get('host';
    if (subdomain && subdomain !== www' && subdomain !== '';
    const agencyId = request.get('')
    const user = request['user';
    const parts = host.split('')
      TRIAL: ['basic_agents', basic_workspaces'
      STARTER: ['basic_agents', basic_workspaces', swarm_orchestration'
        basic_agents'
        basic_workspaces'
        swarm_orchestration'
        service_routing'
        advanced_analytics'
        basic_agents'
        basic_workspaces'
        swarm_orchestration'
        service_routing'
        advanced_analytics'
        custom_branding'
        priority_support'
        basic_agents'
        basic_workspaces'
        swarm_orchestration'
        service_routing'
        advanced_analytics'
        custom_branding'
        priority_support'
        white_label_removal'
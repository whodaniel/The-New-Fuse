/**
 * Agency Hub Module - Comprehensive multi-tenant agency management
 * Integrates swarm orchestration, service routing, and enhanced agency features
 */

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseModule } from '@the-new-fuse/database';

// Services
import { AgencyService } from '../services/agency.service';
import { EnhancedAgencyService } from '../services/enhanced-agency.service';
import { AgentSwarmOrchestrationService } from '../services/agent-swarm-orchestration.service';
import { ServiceCategoryRouterService } from '../services/service-category-router.service';
import { AgencyHubCacheService } from '../services/agency-hub-cache.service';

// Controllers
import { AgencyHubController } from '../controllers/agency-hub.controller';
import { SwarmOrchestrationController } from '../controllers/swarm-orchestration.controller';
import { ServiceRoutingController } from '../controllers/service-routing.controller';

// Guards and Decorators
import { TenantGuard } from '../guards/tenant.guard';
import { AgencyRoleGuard } from '../guards/agency-role.guard';

@Module({
  imports: [
    DatabaseModule,
    EventEmitterModule.forRoot(),
    CacheModule.register({
      ttl: 300, // 5 minutes default TTL
      max: 1000, // Maximum number of items in cache
    }),
  ],
  providers: [
    // Core Services
    AgencyService,
    EnhancedAgencyService,
    AgentSwarmOrchestrationService,
    ServiceCategoryRouterService,
    AgencyHubCacheService,
    
    // Guards
    TenantGuard,
    AgencyRoleGuard,
  ],
  controllers: [
    AgencyHubController,
    SwarmOrchestrationController,
    ServiceRoutingController,
  ],
  exports: [
    AgencyService,
    EnhancedAgencyService,
    AgentSwarmOrchestrationService,
    ServiceCategoryRouterService,
    AgencyHubCacheService,
    TenantGuard,
    AgencyRoleGuard,
  ],
})
export class AgencyHubModule {}

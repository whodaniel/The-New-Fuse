/**
 * Agency Hub Module - Comprehensive multi-tenant agency management
 * Integrates swarm orchestration, service routing, and enhanced agency features
 */

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { EnhancedAgencyService } from '../services/enhanced-agency.service';
import { AgentSwarmOrchestrationService } from '../services/agent-swarm-orchestration.service';
import { ServiceCategoryRouterService } from '../services/service-category-router.service';
import { AgencyHubCacheService } from '../services/agency-hub-cache.service';
import { AgencyHubController } from '../controllers/agency-hub.controller';
import { SwarmOrchestrationController } from '../controllers/swarm-orchestration.controller';
import { ServiceRoutingController } from '../controllers/service-routing.controller';
import { TenantGuard } from '../guards/tenant.guard';
import { AgencyRoleGuard } from '../guards/agency-role.guard';
import { Module } from '@nestjs/common';
import { AgencyHubModule as CoreAgencyHubModule } from '@the-new-fuse/core/modules/agency-hub.module';

// Import existing controllers to maintain compatibility
import { AgencyController } from './controllers/agency.controller';
import { SwarmController } from './controllers/swarm.controller';
import { ServiceRequestController } from './controllers/service-request.controller';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  imports: [
    // Import the comprehensive Agency Hub module from core
    CoreAgencyHubModule,
  ],
  controllers: [
    // Keep existing controllers for backward compatibility
    // These will work alongside the core controllers
    AgencyController,
    SwarmController,
    ServiceRequestController,
    AnalyticsController,
  ],
  // Re-export everything from the core module
  exports: [CoreAgencyHubModule],
})
export class AgencyHubModule {}

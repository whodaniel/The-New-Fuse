/**
 * Sync Module
 * Main NestJS module that integrates all sync components with existing infrastructure
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Sync Core Services
import { MasterClockService } from '../services/MasterClockService';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { ConflictManager } from '../services/ConflictManager';

// Watchers
import { EnhancedFileSystemWatcher } from '../watchers/EnhancedFileSystemWatcher';

// Performance
import { PerformanceOptimizationService } from '../performance/PerformanceOptimizationService';
import { HorizontalScalingCoordinator } from '../performance/HorizontalScalingCoordinator';
import { FileChangeBatcher } from '../performance/FileChangeBatcher';
import { SyncLRUCache } from '../performance/SyncLRUCache';

// Error Handling
import { SyncErrorHandler } from '../error/SyncErrorHandler';
import { SyncRetryManager } from '../error/SyncRetryManager';
import { SyncFallbackProcessor } from '../error/SyncFallbackProcessor';

// Deployment Services
import { SyncHealthService } from './SyncHealthService';
import { SyncConfigService } from './SyncConfigService';
import { SyncMetricsService } from './SyncMetricsService';

// Controllers
import { SyncController } from './SyncController';
import { HealthController } from './HealthController';
import { MetricsController } from './MetricsController';

@Module({
  imports: [
    // Configuration management
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // Event system for real-time updates
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
  ],
  
  controllers: [
    SyncController,
    HealthController,
    MetricsController,
  ],
  
  providers: [
    // Configuration and deployment services
    SyncConfigService,
    SyncHealthService,
    SyncMetricsService,
    
    // Core sync services
    MasterClockService,
    SyncOrchestrator,
    ConflictManager,
    
    // File system monitoring
    EnhancedFileSystemWatcher,
    
    // Performance optimization
    PerformanceOptimizationService,
    HorizontalScalingCoordinator,
    FileChangeBatcher,
    SyncLRUCache,
    
    // Error handling
    SyncErrorHandler,
    SyncRetryManager,
    SyncFallbackProcessor,
    
    // Factory for creating service instances
    {
      provide: 'SYNC_SERVICES_FACTORY',
      useFactory: (
        configService: SyncConfigService,
        masterClock: MasterClockService,
        orchestrator: SyncOrchestrator,
        fileWatcher: EnhancedFileSystemWatcher,
        performance: PerformanceOptimizationService,
        errorHandler: SyncErrorHandler
      ) => {
        return {
          configService,
          masterClock,
          orchestrator,
          fileWatcher,
          performance,
          errorHandler,
        };
      },
      inject: [
        SyncConfigService,
        MasterClockService,
        SyncOrchestrator,
        EnhancedFileSystemWatcher,
        PerformanceOptimizationService,
        SyncErrorHandler,
      ],
    },
  ],
  
  exports: [
    // Export services for use in other modules
    SyncConfigService,
    SyncHealthService,
    SyncMetricsService,
    MasterClockService,
    SyncOrchestrator,
    ConflictManager,
    EnhancedFileSystemWatcher,
    PerformanceOptimizationService,
    SyncErrorHandler,
  ],
})
export class SyncModule {
  constructor(
    private readonly configService: SyncConfigService,
    private readonly healthService: SyncHealthService,
    private readonly metricsService: SyncMetricsService
  ) {
    this.initializeModule();
  }

  /**
   * Initialize the sync module
   */
  private async initializeModule(): Promise<void> {
    try {
      // Validate configuration
      const validation = this.configService.validateConfig();
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Start health monitoring
      await this.healthService.checkHealth();

      // Initialize metrics collection
      await this.metricsService.initialize();

      console.log('Sync module initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sync module:', error);
      throw error;
    }
  }
}
"use strict";
/**
 * Unified Discovery Module
 *
 * Main module that orchestrates the unified entity discovery system
 * with adaptive compute scaling and backward compatibility.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UnifiedDiscoveryModule_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedDiscoveryModule = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const cqrs_1 = require("@nestjs/cqrs");
// Core services
const ComputeProfileDetector_1 = require("@adaptive-compute/ComputeProfileDetector");
const AdaptiveResourceManager_1 = require("@adaptive-compute/AdaptiveResourceManager");
const FeatureFlagManager_1 = require("@progressive-enhancement/FeatureFlagManager");
const AdaptiveConfigManager_1 = require("@progressive-enhancement/AdaptiveConfigManager");
// Discovery components
const DiscoveryOrchestrator_1 = require("./orchestration/DiscoveryOrchestrator");
const ClaudeAgentAdapter_1 = require("./adapters/ClaudeAgentAdapter");
const PydanticAgentAdapter_1 = require("./adapters/PydanticAgentAdapter");
// Compatibility layer
const LegacySystemBridge_1 = require("@compatibility/LegacySystemBridge");
const MigrationController_1 = require("@compatibility/MigrationController");
// Repository and persistence
const UnifiedEntityRepository_1 = require("./infrastructure/UnifiedEntityRepository");
const EntityEventStore_1 = require("./infrastructure/EntityEventStore");
// Command and query handlers
const DiscoverEntitiesHandler_1 = require("./application/commands/DiscoverEntitiesHandler");
const GetEntityRelationshipsHandler_1 = require("./application/queries/GetEntityRelationshipsHandler");
// Event handlers
const EntityDiscoveredHandler_1 = require("./application/events/EntityDiscoveredHandler");
const EntityCapabilitiesUpdatedHandler_1 = require("./application/events/EntityCapabilitiesUpdatedHandler");
let UnifiedDiscoveryModule = UnifiedDiscoveryModule_1 = class UnifiedDiscoveryModule {
    computeDetector;
    resourceManager;
    featureFlagManager;
    configManager;
    discoveryOrchestrator;
    logger = new common_1.Logger(UnifiedDiscoveryModule_1.name);
    constructor(computeDetector, resourceManager, featureFlagManager, configManager, discoveryOrchestrator) {
        this.computeDetector = computeDetector;
        this.resourceManager = resourceManager;
        this.featureFlagManager = featureFlagManager;
        this.configManager = configManager;
        this.discoveryOrchestrator = discoveryOrchestrator;
    }
    async onModuleInit() {
        this.logger.log('🚀 Initializing Unified Discovery System...');
        try {
            // Step 1: Detect compute capabilities
            this.logger.log('🔍 Detecting compute capabilities...');
            const capabilities = await this.computeDetector.detectComputeProfile();
            // Step 2: Initialize adaptive resource management
            this.logger.log('⚙️ Initializing adaptive resource management...');
            await this.resourceManager.initialize();
            // Step 3: Generate adaptive configuration
            this.logger.log('🔧 Generating adaptive configuration...');
            const config = await this.configManager.generateConfiguration(capabilities);
            // Step 4: Register discovery adapters
            this.logger.log('📝 Registering discovery adapters...');
            await this.registerAdapters();
            // Step 5: Validate system health
            this.logger.log('🏥 Validating system health...');
            await this.validateSystemHealth();
            this.logger.log('✅ Unified Discovery System initialized successfully!');
            this.logSystemSummary(capabilities, config);
        }
        catch (error) {
            this.logger.error('❌ Failed to initialize Unified Discovery System:', error);
            throw error;
        }
    }
    async registerAdapters() {
        // Register all available adapters with the orchestrator
        const adapters = [
            { name: 'claude', instance: this.discoveryOrchestrator['claudeAdapter'] },
            { name: 'pydantic', instance: this.discoveryOrchestrator['pydanticAdapter'] }
        ];
        for (const adapter of adapters) {
            if (adapter.instance) {
                this.discoveryOrchestrator.registerAdapter(adapter.name, adapter.instance);
            }
        }
    }
    async validateSystemHealth() {
        // Perform basic health checks
        const healthChecks = [
            this.validateComputeResources(),
            this.validateFeatureFlags(),
            this.validateAdapters(),
            this.validateCompatibilityLayer()
        ];
        const results = await Promise.allSettled(healthChecks);
        const failures = results.filter(result => result.status === 'rejected');
        if (failures.length > 0) {
            this.logger.warn(`⚠️ ${failures.length} health check(s) failed);
      failures.forEach((failure, index) => {`, this.logger.warn(`   Health check ${index + 1}`, $, { failure, : .reason }));
        }
        ;
    }
};
exports.UnifiedDiscoveryModule = UnifiedDiscoveryModule;
exports.UnifiedDiscoveryModule = UnifiedDiscoveryModule = UnifiedDiscoveryModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            event_emitter_1.EventEmitterModule.forRoot({
                wildcard: true,
                delimiter: '.',
                newListener: false,
                removeListener: false,
                maxListeners: 20,
                verboseMemoryLeak: true
            }),
            cqrs_1.CqrsModule
        ],
        providers: [
            // Core infrastructure
            ComputeProfileDetector_1.ComputeProfileDetector,
            AdaptiveResourceManager_1.AdaptiveResourceManager,
            FeatureFlagManager_1.FeatureFlagManager,
            AdaptiveConfigManager_1.AdaptiveConfigManager,
            // Discovery system
            DiscoveryOrchestrator_1.DiscoveryOrchestrator,
            ClaudeAgentAdapter_1.ClaudeAgentAdapter,
            PydanticAgentAdapter_1.PydanticAgentAdapter,
            // Compatibility layer
            LegacySystemBridge_1.LegacySystemBridge,
            LegacySystemBridge_1.LegacyApiController,
            MigrationController_1.MigrationController,
            // Persistence
            UnifiedEntityRepository_1.UnifiedEntityRepository,
            EntityEventStore_1.EntityEventStore,
            // CQRS handlers
            DiscoverEntitiesHandler_1.DiscoverEntitiesHandler,
            GetEntityRelationshipsHandler_1.GetEntityRelationshipsHandler,
            EntityDiscoveredHandler_1.EntityDiscoveredHandler,
            EntityCapabilitiesUpdatedHandler_1.EntityCapabilitiesUpdatedHandler
        ],
        controllers: [
            LegacySystemBridge_1.LegacyApiController
        ],
        exports: [
            DiscoveryOrchestrator_1.DiscoveryOrchestrator,
            LegacySystemBridge_1.LegacySystemBridge,
            AdaptiveResourceManager_1.AdaptiveResourceManager,
            FeatureFlagManager_1.FeatureFlagManager
        ]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof ComputeProfileDetector_1.ComputeProfileDetector !== "undefined" && ComputeProfileDetector_1.ComputeProfileDetector) === "function" ? _a : Object, typeof (_b = typeof AdaptiveResourceManager_1.AdaptiveResourceManager !== "undefined" && AdaptiveResourceManager_1.AdaptiveResourceManager) === "function" ? _b : Object, typeof (_c = typeof FeatureFlagManager_1.FeatureFlagManager !== "undefined" && FeatureFlagManager_1.FeatureFlagManager) === "function" ? _c : Object, typeof (_d = typeof AdaptiveConfigManager_1.AdaptiveConfigManager !== "undefined" && AdaptiveConfigManager_1.AdaptiveConfigManager) === "function" ? _d : Object, DiscoveryOrchestrator_1.DiscoveryOrchestrator])
], UnifiedDiscoveryModule);
{
    this.logger.log('✅ All health checks passed');
}
async;
validateComputeResources();
Promise < void  > {
    const: allocation = this.resourceManager.getCurrentAllocation(),
    if(, allocation) {
        throw new Error('Resource allocation not available');
    },
    if(allocation) { }, : .discovery.activeAdapters < 1
};
{
    throw new Error('No discovery adapters allocated');
}
async;
validateFeatureFlags();
Promise < void  > {
    const: enabledFeatures = this.featureFlagManager.getEnabledFeatures(),
    if(enabledFeatures) { }, : .length === 0
};
{
    throw new Error('No features enabled');
}
// Ensure core features are enabled
if (!this.featureFlagManager.isFeatureEnabled('unified_entity_discovery')) {
    throw new Error('Core unified entity discovery feature not enabled');
}
async;
validateAdapters();
Promise < void  > {
    const: availableAdapters = this.discoveryOrchestrator.getAvailableAdapters(),
    if(availableAdapters) { }, : .length === 0
};
{
    throw new Error('No discovery adapters available');
}
async;
validateCompatibilityLayer();
Promise < void  > {
    : .featureFlagManager.isFeatureEnabled('legacy_compatibility')
};
{
    this.logger.warn('Legacy compatibility layer disabled');
}
logSystemSummary(capabilities, any, config, any);
void {
    this: .logger.log('📊 System Summary:')
} `
    this.logger.log(`;
Compute;
Profile: $;
{
    capabilities.profile;
}
`);
    this.logger.log(   CPU Cores: ${capabilities.cpuCores});`;
this.logger.log(Memory, $, { Math, : .round(capabilities.totalMemory / 1024 / 1024 / 1024) }, GB `);
    this.logger.log(   GPU Available: ${capabilities.hasGPU ? 'Yes' : 'No'});`, this.logger.log(Discovery, Adapters, $, { config, : .discovery.enabledAdapters.length }));
`
    this.logger.log(   Parallel Processing: ${config.discovery.parallelAdapters}`;
;
this.logger.log(Features, Enabled, $, { config, : .features.enabledFeatures.length });
`
    this.logger.log(   Legacy Compatibility: ${this.featureFlagManager.isFeatureEnabled('legacy_compatibility') ? 'Enabled' : 'Disabled'});
  }
}

/**
 * Unified Discovery Service
 * 
 * Main service interface for the unified discovery system
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class UnifiedDiscoveryService {
  private readonly logger = new Logger(UnifiedDiscoveryService.name);

  constructor(
    private readonly discoveryOrchestrator: DiscoveryOrchestrator,
    private readonly legacyBridge: LegacySystemBridge,
    private readonly featureFlagManager: FeatureFlagManager,
    private readonly configManager: AdaptiveConfigManager
  ) {}

  /**
   * Discover entities with adaptive configuration
   */
  async discoverEntities(paths: string[], options?: any): Promise<any> {
    this.logger.log(🔍 Starting entity discovery for ${paths.length} paths...);
    
    const config = this.configManager.getCurrentConfiguration();
    if (!config) {
      throw new Error('System configuration not available');
    }
`;
const request = {} `
      id: discovery-${Date.now()}`, paths, includePatterns, includePatterns, excludePatterns, excludePatterns, maxDepth, maxDepth, enabledAdapters, parallelism, timeout;
;
const result = await this.discoveryOrchestrator.discoverEntities(request);
// Convert to legacy format if requested
if (options?.legacyFormat) {
    return this.legacyBridge.convertToLegacyDiscoveryResult(result.entities, result.duration);
}
return result;
/**
 * Get system status and capabilities
 */
getSystemStatus();
any;
{
    const config = this.configManager.getCurrentConfiguration();
    const enabledFeatures = this.featureFlagManager.getEnabledFeatures();
    const activeDiscoveries = this.discoveryOrchestrator.getActiveDiscoveries();
    return {
        status: 'operational',
        configuration: config,
        enabledFeatures: enabledFeatures.map(f => f.name),
        activeDiscoveries: activeDiscoveries.length,
        capabilities: {
            parallelDiscovery: this.featureFlagManager.canUseParallelProcessing(),
            machineLearning: this.featureFlagManager.canUseMachineLearning(),
            advancedAnalysis: this.featureFlagManager.canUseAdvancedAnalysis()
        }
    };
}
/**
 * Update system configuration
 */
async;
updateConfiguration(updates, any);
Promise < void  > {
    this: .logger.log('🔄 Updating system configuration...'),
    this: .configManager.updateConfiguration(updates)
};
/**
 * Enable or disable features
 */
updateFeature(featureName, string, enabled, boolean);
void {
    this: .logger.log($, { enabled, 'Enabling': 'Disabling' }, feature, $, { featureName } `);
    this.featureFlagManager.overrideFeature(featureName, enabled);
  }

  /**
   * Get discovery statistics
   */
  async getDiscoveryStatistics(): Promise<any> {
    // Implementation would aggregate statistics from various sources
    return {
      totalEntitiesDiscovered: 0,
      discoveryTime: 0,
      adaptersUsed: this.discoveryOrchestrator.getAvailableAdapters(),
      lastDiscovery: null
    };
  }
}
    )
};
//# sourceMappingURL=UnifiedDiscoveryModule.js.map
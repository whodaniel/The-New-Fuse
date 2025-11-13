/**
 * Unified Discovery Module
 *
 * Main module that orchestrates the unified entity discovery system
 * with adaptive compute scaling and backward compatibility.
 */
import { OnModuleInit } from '@nestjs/common';
import { ComputeProfileDetector } from '@adaptive-compute/ComputeProfileDetector';
import { AdaptiveResourceManager } from '@adaptive-compute/AdaptiveResourceManager';
import { FeatureFlagManager } from '@progressive-enhancement/FeatureFlagManager';
import { AdaptiveConfigManager } from '@progressive-enhancement/AdaptiveConfigManager';
import { DiscoveryOrchestrator } from './orchestration/DiscoveryOrchestrator';
export declare class UnifiedDiscoveryModule implements OnModuleInit {
    private readonly computeDetector;
    private readonly resourceManager;
    private readonly featureFlagManager;
    private readonly configManager;
    private readonly discoveryOrchestrator;
    private readonly logger;
    constructor(computeDetector: ComputeProfileDetector, resourceManager: AdaptiveResourceManager, featureFlagManager: FeatureFlagManager, configManager: AdaptiveConfigManager, discoveryOrchestrator: DiscoveryOrchestrator);
    onModuleInit(): Promise<void>;
    private registerAdapters;
    private validateSystemHealth;
}
//# sourceMappingURL=UnifiedDiscoveryModule.d.ts.map
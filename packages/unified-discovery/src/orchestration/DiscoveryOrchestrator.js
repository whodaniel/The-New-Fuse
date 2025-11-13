"use strict";
/**
 * Discovery Orchestrator
 *
 * Orchestrates the discovery process across all adapters with
 * sophisticated parallel processing and resource management.
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
var DiscoveryOrchestrator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryOrchestrator = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const ClaudeAgentAdapter_1 = require("../adapters/ClaudeAgentAdapter");
const PydanticAgentAdapter_1 = require("../adapters/PydanticAgentAdapter");
const UnifiedEntity_1 = require("../domain/UnifiedEntity");
const AdaptiveResourceManager_1 = require("../../../adaptive-compute/src/AdaptiveResourceManager");
let DiscoveryOrchestrator = DiscoveryOrchestrator_1 = class DiscoveryOrchestrator {
    claudeAdapter;
    pydanticAdapter;
    resourceManager;
    eventEmitter;
    logger = new common_1.Logger(DiscoveryOrchestrator_1.name);
    adapters = new Map();
    activeDiscoveries = new Map();
    constructor(claudeAdapter, pydanticAdapter, resourceManager, eventEmitter) {
        this.claudeAdapter = claudeAdapter;
        this.pydanticAdapter = pydanticAdapter;
        this.resourceManager = resourceManager;
        this.eventEmitter = eventEmitter;
        this.initializeAdapters();
    }
    initializeAdapters() {
        this.adapters.set('claude', this.claudeAdapter);
        this.adapters.set('pydantic', this.pydanticAdapter);
        // Additional adapters will be registered here
    }
    async discoverEntities(request) {
        const startTime = Date.now();
        this.logger.log(`🚀 Starting discovery request: ${request.id});

    // Check if discovery is already in progress
    if (this.activeDiscoveries.has(request.id)) {`, this.logger.warn(`Discovery ${request.id}`, already in progress));
        return this.activeDiscoveries.get(request.id);
    }
    // Create discovery promise
    discoveryPromise = this.executeDiscovery(request, startTime);
};
exports.DiscoveryOrchestrator = DiscoveryOrchestrator;
exports.DiscoveryOrchestrator = DiscoveryOrchestrator = DiscoveryOrchestrator_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ClaudeAgentAdapter_1.ClaudeAgentAdapter,
        PydanticAgentAdapter_1.PydanticAgentAdapter,
        AdaptiveResourceManager_1.AdaptiveResourceManager,
        event_emitter_1.EventEmitter2])
], DiscoveryOrchestrator);
this.activeDiscoveries.set(request.id, discoveryPromise);
try {
    const result = await discoveryPromise;
    return result;
}
finally {
    this.activeDiscoveries.delete(request.id);
}
async;
executeDiscovery(request, DiscoveryRequest, startTime, number);
Promise < DiscoveryResult > {
    // Emit discovery started event
    this: .eventEmitter.emit('discovery.started', {
        requestId: request.id,
        timestamp: new Date()
    }),
    // Get resource allocation
    const: allocation = this.resourceManager.getCurrentAllocation(),
    const: enabledAdapters = request.enabledAdapters || Array.from(this.adapters.keys()),
    // Limit adapters based on available resources
    const: maxAdapters = Math.min(enabledAdapters.length, allocation.discovery.activeAdapters),
    const: selectedAdapters = enabledAdapters.slice(0, maxAdapters),
    this: .logger.log(Using, $, { selectedAdapters, : .length }, adapters, $, { selectedAdapters, : .join(', ') }),
    // Execute discovery in parallel with resource constraints
    const: adapterPromises = selectedAdapters.map(adapterName => this.executeAdapterDiscovery(adapterName, request, allocation)),
    // Wait for all adapters to complete with timeout
    const: timeout = request.timeout || 300000, // 5 minutes default
    const: adapterResults = await this.executeWithTimeout(adapterPromises, timeout),
    // Aggregate results
    const: result = this.aggregateResults(request.id, adapterResults, startTime),
    // Emit discovery completed event
    this: .eventEmitter.emit('discovery.completed', {
        requestId: request.id,
        result,
        timestamp: new Date()
    })
} `
    this.logger.log(✅ Discovery ${request.id}`;
completed in $;
{
    result.duration;
}
ms;
;
this.logDiscoveryStatistics(result.statistics);
return result;
async;
executeAdapterDiscovery(adapterName, string, request, DiscoveryRequest, allocation, any);
Promise < AdapterResult > {} `
    const adapter = this.adapters.get(adapterName);`;
if (!adapter) {
    throw new Error(Unknown, adapter, $, { adapterName } `);
    }

    const startTime = Date.now();
    this.logger.log(🔍 Starting ${adapterName} adapter discovery...);

    try {
      // Create discovery criteria with resource constraints
      const criteria = {
        paths: request.paths,
        includePatterns: request.includePatterns || [],
        excludePatterns: request.excludePatterns || [],
        maxDepth: request.maxDepth || 10,
        batchSize: allocation.discovery.memoryPerAdapter,
        maxConcurrency: allocation.discovery.cpuPerAdapter
      };

      // Execute adapter discovery
      const entities = await adapter.discoverEntities(criteria);`);
    const duration = Date.now() - startTime;
    `

      this.logger.log(✅ ${adapterName} adapter found ${entities.length}`;
    entities in $;
    {
        duration;
    }
    ms;
    ;
    return {
        adapter: adapterName,
        entities,
        filesProcessed: this.estimateFilesProcessed(entities),
        errors: [],
        duration
    };
    `
    } catch (error) {`;
    const duration = Date.now() - startTime;
    this.logger.error($, { adapterName }, adapter, failed, error);
    return {
        adapter: adapterName,
        entities: [],
        filesProcessed: 0,
        errors: [{
                adapter: adapterName,
                error: error instanceof Error ? error.message : String(error),
                severity: 'error'
            }],
        duration
    };
}
async;
executeWithTimeout(promises, Promise < T > [], timeoutMs, number);
Promise < T[] > {
    const: timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Discovery timeout')), timeoutMs);
    }),
    try: {
        return: await Promise.race([
            Promise.allSettled(promises).then(results => results.map(result => {
                if (result.status === 'fulfilled') {
                    return result.value;
                }
                else {
                    this.logger.error('Adapter discovery failed:', result.reason);
                    throw result.reason;
                }
            })),
            timeoutPromise
        ])
    }, catch(error) {
        this.logger.error('Discovery execution failed:', error);
        throw error;
    }
};
aggregateResults(requestId, string, adapterResults, AdapterResult[], startTime, number);
DiscoveryResult;
{
    const allEntities = [];
    const allErrors = [];
    let totalFilesProcessed = 0;
    // Aggregate entities and errors
    for (const result of adapterResults) {
        allEntities.push(...result.entities);
        allErrors.push(...result.errors);
        totalFilesProcessed += result.filesProcessed;
    }
    // Remove duplicates based on entity identity
    const uniqueEntities = this.deduplicateEntities(allEntities);
    // Calculate statistics
    const statistics = this.calculateStatistics(uniqueEntities, totalFilesProcessed, adapterResults);
    return {
        requestId,
        entities: uniqueEntities,
        statistics,
        errors: allErrors,
        duration: Date.now() - startTime,
        timestamp: new Date()
    };
}
deduplicateEntities(entities, UnifiedEntity_1.UnifiedEntity[]);
UnifiedEntity_1.UnifiedEntity[];
{
    const seen = new Set();
    const unique = [];
    for (const entity of entities) {
        `
      // Create a unique key based on name and source`;
        const key = $, { entity, identity, name };
        `:${entity.metadata.discoverySource}:${entity.metadata.filePath};
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(entity);
      } else {
        this.logger.debug(Duplicate entity detected: ${entity.identity.name});
      }
    }

    if (entities.length !== unique.length) {
      this.logger.log(🔄 Deduplicated ${entities.length - unique.length} duplicate entities);
    }

    return unique;
  }

  private calculateStatistics(
    entities: UnifiedEntity[], 
    filesProcessed: number, 
    adapterResults: AdapterResult[]
  ): DiscoveryStatistics {
    const entitiesBySource: Record<string, number> = {};
    const entitiesByArchetype: Record<string, number> = {};

    for (const entity of entities) {
      // Count by source
      const source = entity.metadata.discoverySource;
      entitiesBySource[source] = (entitiesBySource[source] || 0) + 1;

      // Count by archetype
      const archetype = entity.archetype;
      entitiesByArchetype[archetype] = (entitiesByArchetype[archetype] || 0) + 1;
    }

    const totalProcessingTime = adapterResults.reduce((sum, result) => sum + result.duration, 0);

    return {
      totalEntitiesFound: entities.length,
      entitiesBySource,
      entitiesByArchetype,
      filesProcessed,
      filesSkipped: 0, // TODO: Track skipped files
      processingTimeMs: totalProcessingTime,
      averageProcessingTimePerFile: filesProcessed > 0 ? totalProcessingTime / filesProcessed : 0
    };
  }

  private estimateFilesProcessed(entities: UnifiedEntity[]): number {
    // Estimate based on unique file paths
    const uniquePaths = new Set(
      entities
        .map(e => e.metadata.filePath)
        .filter(path => path !== undefined)
    );
    return uniquePaths.size;
  }
`;
        logDiscoveryStatistics(stats, DiscoveryStatistics);
        void {} `
    this.logger.log('📊 Discovery Statistics:');`;
        this.logger.log(Total, Entities, $, { stats, : .totalEntitiesFound });
        `
    this.logger.log(   Files Processed: ${stats.filesProcessed});`;
        this.logger.log(`   Processing Time: ${stats.processingTimeMs}ms);`, this.logger.log(Avg, Time / File, $, { Math, : .round(stats.averageProcessingTimePerFile) } `ms);
    
    this.logger.log('   Entities by Source:');
    for (const [source, count] of Object.entries(stats.entitiesBySource)) {
      this.logger.log(     ${source}`, $, { count }));
    }
    this.logger.log('   Entities by Archetype:');
    for (const [archetype, count] of Object.entries(stats.entitiesByArchetype)) {
        `
      this.logger.log(     ${archetype}` `: ${count});
    }
  }

  async getDiscoveryStatus(requestId: string): Promise<'running' | 'completed' | 'not_found'> {
    if (this.activeDiscoveries.has(requestId)) {
      return 'running';
    }
    
    // TODO: Check completed discoveries in storage
    return 'not_found';
  }

  async cancelDiscovery(requestId: string): Promise<boolean> {
    if (this.activeDiscoveries.has(requestId)) {
      // TODO: Implement cancellation logic
      this.activeDiscoveries.delete(requestId);`;
        this.logger.log(`🛑 Discovery ${requestId}`, cancelled);
        return true;
    }
    return false;
}
getActiveDiscoveries();
string[];
{
    return Array.from(this.activeDiscoveries.keys());
}
registerAdapter(name, string, adapter, any);
void {
    this: .adapters.set(name, adapter),
    this: .logger.log(Registered, discovery, adapter, $, { name } `);
  }

  getAvailableAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }
}
    )
};
//# sourceMappingURL=DiscoveryOrchestrator.js.map
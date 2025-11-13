"use strict";
/**
 * AgentDiscoveryService.ts
 *
 * Dedicated service for agent discovery and configuration management.
 * Handles agent configuration loading, validation, capability mapping, and health monitoring.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentDiscoveryService = void 0;
const events_1 = require("events");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const errors_1 = require("../utils/errors");
class AgentDiscoveryService extends events_1.EventEmitter {
    options;
    agentRegistry = new Map();
    capabilityMappings = new Map();
    configurationValidators = new Map();
    watchers = new Map();
    healthCheckIntervals = new Map();
    fileToAgentId = new Map(); // filePath -> agentId
    constructor(options = {}) {
        super();
        this.options = options;
        this.initializeCapabilityMappings();
        this.initializeValidators();
    }
    /**
     * Initialize capability mappings between agent capabilities and A2A/MCP
     */
    initializeCapabilityMappings() {
        const mappings = [
            {
                agentCapability: 'CHAT',
                a2aCapability: 'text_generation',
                mcpCapability: 'chat',
                description: 'General chat and conversation capabilities',
            },
            {
                agentCapability: 'CODE_GENERATION',
                a2aCapability: 'code_analysis',
                mcpCapability: 'code_gen',
                description: 'Code generation and programming assistance',
            },
            {
                agentCapability: 'DATA_ANALYSIS',
                a2aCapability: 'data_processing',
                mcpCapability: 'data_analysis',
                description: 'Data processing and analysis capabilities',
            },
            {
                agentCapability: 'WEB_SEARCH',
                a2aCapability: 'web_search',
                mcpCapability: 'web_search',
                description: 'Web search and information retrieval',
            },
        ];
        mappings.forEach(mapping => {
            this.capabilityMappings.set(mapping.agentCapability, mapping);
        });
    }
    /**
     * Initialize configuration validators
     */
    initializeValidators() {
        // Required fields validator
        this.configurationValidators.set('required_fields', (config) => {
            const requiredFields = ['id', 'name', 'type', 'status', 'capabilities', 'configuration'];
            return requiredFields.every(field => config.hasOwnProperty(field));
        });
        // Capabilities validator
        this.configurationValidators.set('capabilities', (config) => {
            if (!Array.isArray(config.capabilities))
                return false;
            return config.capabilities.every((cap) => cap.hasOwnProperty('name') && cap.hasOwnProperty('description'));
        });
        // Configuration validator
        this.configurationValidators.set('configuration', (config) => {
            if (!config.configuration)
                return false;
            return config.configuration.hasOwnProperty('provider') &&
                config.configuration.hasOwnProperty('command');
        });
        // Date fields validator
        this.configurationValidators.set('dates', (config) => {
            const dateFields = ['createdAt', 'updatedAt'];
            return dateFields.every(field => {
                if (!config[field])
                    return false;
                const date = new Date(config[field]);
                return !isNaN(date.getTime());
            });
        });
    }
    /**
     * Discover and load agent configurations from multiple sources
     */
    async discoverAgents() {
        const discoveredAgents = [];
        try {
            // Discover from local directory
            const localAgents = await this.discoverLocalAgents();
            discoveredAgents.push(...localAgents);
            // TODO: Add remote registry discovery
            // const remoteAgents = await this.discoverRemoteAgents();
            // discoveredAgents.push(...remoteAgents);
            // Update registry
            discoveredAgents.forEach(entry => {
                this.agentRegistry.set(entry.id, entry);
            });
            // Start health monitoring if enabled
            if (this.options.hotReload) {
                await this.startHealthMonitoring();
            }
            // Start file watching if enabled
            if (this.options.watchForChanges) {
                await this.startFileWatching();
            }
            this.emit('agentsDiscovered', discoveredAgents);
            return discoveredAgents;
        }
        catch (error) {
            this.emit('discoveryError', error);
            throw error;
        }
    }
    /**
     * Discover agents from local directory
     */
    async discoverLocalAgents() {
        const agentsDir = this.options.agentsDirectory || path.resolve(process.cwd(), 'local-ai-agents');
        const agents = [];
        try {
            const configFiles = await fs.readdir(agentsDir);
            for (const file of configFiles) {
                if (file.endsWith('.json')) {
                    try {
                        const configPath = path.join(agentsDir, file);
                        const configData = await fs.readFile(configPath, 'utf-8');
                        const config = JSON.parse(configData);
                        // Validate configuration
                        const validationResult = this.validateConfiguration(config);
                        if (!validationResult.isValid) {
                            console.warn(`Invalid agent configuration in ${file}:, validationResult.errors);
              if (this.options.validationStrict) {
                continue;
              }
            }

            // Normalize configuration
            const normalizedConfig = this.normalizeConfiguration(config);

            // Create registry entry
            const entry: AgentRegistryEntry = {
              id: normalizedConfig.id,
              configuration: normalizedConfig,
              status: normalizedConfig.status === 'ACTIVE' ? 'active' : 'inactive',
              lastUpdated: new Date(),
              discoverySource: 'local',
            };

            // Track file-to-agent mapping
            this.fileToAgentId.set(configPath, normalizedConfig.id);

            agents.push(entry);`, console.log(`Discovered local agent: ${normalizedConfig.name}`));
                        }
                        try { }
                        catch (error) {
                            console.error(Failed, to, load, agent, configuration, from, $, { file }, (0, errors_1.errorToMessage)(error));
                        }
                    }
                    finally {
                    }
                }
                return agents;
            }
            try { }
            catch (error) {
                console.error('Failed to discover local agents:', error);
                return [];
            }
        }
        /**
         * Validate agent configuration
         */
        finally {
        }
        /**
         * Validate agent configuration
         */
        validateConfiguration(config, any);
        {
            isValid: boolean;
            errors: string[];
        }
        {
            const errors = [];
            // Run all validators
            for (const [name, validator] of this.configurationValidators) {
                try {
                    if (!validator(config)) {
                        `
          errors.push(Validation failed: ${name}`;
                        ;
                    }
                }
                catch (error) {
                    errors.push(Validation, error in $, { name }, $, {} `);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normalize agent configuration to ensure consistency
   */
  private normalizeConfiguration(config: AgentConfiguration): AgentConfiguration {
    // Ensure dates are Date objects
    if (typeof config.createdAt === 'string') {
      config.createdAt = new Date(config.createdAt);
    }
    if (typeof config.updatedAt === 'string') {
      config.updatedAt = new Date(config.updatedAt);
    }

    // Set default values
    config.displayName = config.displayName || config.name;
    config.enabled = config.status === 'ACTIVE';

    // Ensure configuration defaults with sensible A2A settings
    if (typeof config.configuration.a2aEnabled !== 'boolean') {
      const isLocal = !!config.configuration.localAI;
      config.configuration.a2aEnabled = isLocal; // default enable for local CLIs
    }
    if (typeof config.configuration.mcpEnabled !== 'boolean') {
      config.configuration.mcpEnabled = false;
    }

    // Map capabilities to A2A/MCP if needed
    config.capabilities = config.capabilities.map(cap => ({
      ...cap,
      mappings: this.getCapabilityMappings(cap.name),
    }));

    return config;
  }

  /**
   * Get capability mappings for A2A and MCP services
   */
  getCapabilityMappings(capabilityName: string): any {
    const mapping = this.capabilityMappings.get(capabilityName);
    return mapping ? {
      a2a: mapping.a2aCapability,
      mcp: mapping.mcpCapability,
    } : null;
  }

  /**
   * Get all discovered agents
   */
  getAllAgents(): AgentRegistryEntry[] {
    return Array.from(this.agentRegistry.values());
  }

  /**
   * Get agents by filter criteria
   */
  getAgents(filter?: {
    status?: 'active' | 'inactive' | 'error' | 'loading';
    capability?: string;
    source?: 'local' | 'remote' | 'registry';
    healthy?: boolean;
  }): AgentRegistryEntry[] {
    let agents = this.getAllAgents();

    if (filter) {
      if (filter.status) {
        agents = agents.filter(agent => agent.status === filter.status);
      }
      if (filter.capability) {
        agents = agents.filter(agent =>
          agent.configuration.capabilities.some(cap => 
            cap.name.toLowerCase() === filter.capability!.toLowerCase()
          )
        );
      }
      if (filter.source) {
        agents = agents.filter(agent => agent.discoverySource === filter.source);
      }
      if (filter.healthy !== undefined) {
        agents = agents.filter(agent => 
          agent.healthStatus?.isHealthy === filter.healthy
        );
      }
    }

    return agents;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentRegistryEntry | undefined {
    return this.agentRegistry.get(agentId);
  }

  /**
   * Update agent configuration
   */
  async updateAgent(agentId: string, updates: Partial<AgentConfiguration>): Promise<void> {
    const entry = this.agentRegistry.get(agentId);
    if (!entry) {
      throw new Error(Agent ${agentId} not found in registry);
    }

    // Update configuration
    entry.configuration = { ...entry.configuration, ...updates };
    entry.lastUpdated = new Date();

    // Re-validate configuration
    const validationResult = this.validateConfiguration(entry.configuration);`);
                    if (!validationResult.isValid && this.options.validationStrict) {
                        `
      throw new Error(`;
                        Updated;
                        configuration;
                        is;
                        invalid: $;
                        {
                            validationResult.errors.join(', ');
                        }
                        ;
                    }
                    // Normalize updated configuration
                    entry.configuration = this.normalizeConfiguration(entry.configuration);
                    this.emit('agentUpdated', entry);
                }
                /**
                 * Remove agent from registry
                 */
                removeAgent(agentId, string);
                boolean;
                {
                    const removed = this.agentRegistry.delete(agentId);
                    if (removed) {
                        // Stop health monitoring
                        const healthInterval = this.healthCheckIntervals.get(agentId);
                        if (healthInterval) {
                            clearInterval(healthInterval);
                            this.healthCheckIntervals.delete(agentId);
                        }
                        this.emit('agentRemoved', agentId);
                    }
                    return removed;
                }
                /**
                 * Start health monitoring for all agents
                 */
            }
            /**
             * Start health monitoring for all agents
             */
        }
        /**
         * Start health monitoring for all agents
         */
    }
    /**
     * Start health monitoring for all agents
     */
    async startHealthMonitoring() {
        const agents = this.getAllAgents();
        agents.forEach(agent => {
            const interval = setInterval(async () => {
                try {
                    const healthStatus = await this.checkAgentHealth(agent.id);
                    agent.healthStatus = healthStatus;
                    this.emit('healthCheck', { agentId: agent.id, health: healthStatus });
                }
                catch (error) {
                    `
          console.error(Health check failed for agent ${agent.id}:`, error;
                }
            });
        });
    }
    30000;
    ;
} // Check every 30 seconds
exports.AgentDiscoveryService = AgentDiscoveryService;
this.healthCheckIntervals.set(agent.id, interval);
;
async;
checkAgentHealth(agentId, string);
Promise < AgentHealthStatus > {
    const: agent = this.agentRegistry.get(agentId),
    if(, agent) {
        throw new Error(Agent, $, { agentId } ` not found);
    }

    const startTime = Date.now();
    let isHealthy = false;
    let errorMessage: string | undefined;

    try {
      // For now, consider agent healthy if configuration is valid
      const validation = this.validateConfiguration(agent.configuration);
      isHealthy = validation.isValid;
      if (!isHealthy) {
        errorMessage = validation.errors.join(', ');
      }
    } catch (error) {
      isHealthy = false;
      errorMessage = errorToMessage(error);
    }

    const responseTime = Date.now() - startTime;

    const healthStatus: AgentHealthStatus = {
      isHealthy,
      lastCheck: new Date(),
      responseTime,
      errorCount: agent.healthStatus?.errorCount || 0,
      lastError: errorMessage,
    };

    if (!isHealthy) {
      healthStatus.errorCount++;
    }

    return healthStatus;
  }

  /**
   * Start file watching for hot reload
   */
  private async startFileWatching(): Promise<void> {
    const agentsDir = this.options.agentsDirectory || path.resolve(process.cwd(), 'local-ai-agents');

    try {
      const { watch } = await import('chokidar');
      
      const watcher = watch(path.join(agentsDir, '*.json'), {
        ignored: /^\./, 
        persistent: true,
      });

      watcher.on('change', async (filePath) => {
        console.log(Agent configuration changed: ${filePath});
        await this.reloadAgentConfiguration(filePath);
      });

      watcher.on('add', async (filePath) => {`, console.log(New, agent, configuration, added, $, { filePath } ``));
        await this.reloadAgentConfiguration(filePath);
    },
    watcher, : .on('unlink', (filePath) => {
        console.log(Agent, configuration, removed, $, { filePath });
        const agentId = this.fileToAgentId.get(filePath);
        if (agentId) {
            this.removeAgent(agentId);
            this.fileToAgentId.delete(filePath);
        }
    }),
    this: .watchers.set(agentsDir, watcher)
};
try { }
catch (error) {
    console.error('Failed to start file watching:', (0, errors_1.errorToMessage)(error));
}
async;
reloadAgentConfiguration(filePath, string);
Promise < void  > {
    try: {
        const: configData = await fs.readFile(filePath, 'utf-8'),
        const: config, AgentConfiguration: AgentHub_1.AgentConfiguration = JSON.parse(configData),
        const: normalizedConfig = this.normalizeConfiguration(config),
        const: entry, AgentRegistryEntry = {
            id: normalizedConfig.id,
            configuration: normalizedConfig,
            status: normalizedConfig.status === 'ACTIVE' ? 'active' : 'inactive',
            lastUpdated: new Date(),
            discoverySource: 'local',
        },
        // Track file-to-agent mapping when reloading
        this: .fileToAgentId.set(filePath, normalizedConfig.id),
        this: .agentRegistry.set(entry.id, entry),
        this: .emit('agentReloaded', entry)
    }, catch(error) {
        `
      console.error(`;
        Failed;
        to;
        reload;
        agent;
        configuration;
        from;
        $;
        {
            filePath;
        }
        `, errorToMessage(error));
    }
  }

  /**
   * Get discovery statistics
   */
  getDiscoveryStats(): any {
    const agents = this.getAllAgents();
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      inactiveAgents: agents.filter(a => a.status === 'inactive').length,
      errorAgents: agents.filter(a => a.status === 'error').length,
      healthyAgents: agents.filter(a => a.healthStatus?.isHealthy).length,
      bySource: {
        local: agents.filter(a => a.discoverySource === 'local').length,
        remote: agents.filter(a => a.discoverySource === 'remote').length,
        registry: agents.filter(a => a.discoverySource === 'registry').length,
      },
      capabilities: this.getCapabilityStats(),
    };
  }

  /**
   * Get capability statistics
   */
  private getCapabilityStats(): Record<string, number> {
    const agents = this.getAllAgents();
    const stats: Record<string, number> = {};

    agents.forEach(agent => {
      agent.configuration.capabilities.forEach(cap => {
        stats[cap.name] = (stats[cap.name] || 0) + 1;
      });
    });

    return stats;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Clear health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();

    // Close file watchers
    for (const watcher of this.watchers.values()) {
      await watcher.close();
    }
    this.watchers.clear();

    // Clear registry
    this.agentRegistry.clear();
    
    // Clear file-to-agent mapping
    this.fileToAgentId.clear();

    this.emit('cleanup');
  }
}

export default AgentDiscoveryService;;
    }
};
//# sourceMappingURL=AgentDiscoveryService.js.map
import { Injectable } from '@nestjs/common';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Logger } from '../common/logger.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  version: string;
  parameters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  reliability?: number;
  performanceMetrics?: {
    averageLatency: number;
    successRate: number;
    lastUsed: number;
    executionCount?: number;
    errorRate?: number;
    resourceUsage?: {
      cpu?: number;
      memory?: number;
    };
    userRatings?: {
      averageScore?: number;
      ratingCount?: number;
    };
  };
  federatedWith?: string[]; // List of agent IDs that can also provide this capability
  versionInfo?: {
    major: number;
    minor: number;
    patch: number;
    isDeprecated?: boolean;
    deprecationDate?: number;
    supportedUntil?: number;
  };
}

export interface CapabilityRequirement {
  capability: string;
  minReliability?: number;
  preferredAgents?: string[];
  metadata?: Record<string, unknown>;
  userPreferences?: {
    prioritizeSpeed?: boolean;
    prioritizeAccuracy?: boolean;
    prioritizeRecentlyUsed?: boolean;
    customWeights?: {
      reliability?: number;
      successRate?: number;
      latency?: number;
      recentActivity?: number;
    };
  };
}

@Injectable()
export class AgentCapabilityDiscoveryService {
  private capabilityCache = new Map<string, AgentCapability>();
  private agentCapabilities = new Map<string, Set<string>>();
  private capabilityMetrics = new Map<string, Map<string, number>>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate = 0;

  constructor(
    private readonly mcpBroker: MCPBrokerService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: Logger
  ) {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Load initial capabilities from database
      await this.refreshCapabilityCache();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start periodic cache refresh
      setInterval(() => {
        this.refreshCapabilityCache().catch(error => {
          this.logger.error('Failed to refresh capability cache:', error);
        });
      }, this.cacheTimeout);

      this.logger.info('Agent Capability Discovery Service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Agent Capability Discovery Service:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('agent.capability.registered', async (data: any) => {
      await this.handleNewCapability(data);
    });

    this.eventEmitter.on('agent.capability.updated', async (data: any) => {
      await this.handleCapabilityUpdate(data);
    });

    this.eventEmitter.on('agent.performance.updated', async (data: any) => {
      await this.updateCapabilityMetrics(data);
    });
  }

  async discoverCapabilities(requirement: CapabilityRequirement): Promise<AgentCapability[]> {
    try {
      await this.ensureFreshCache();

      const capabilities = Array.from(this.capabilityCache.values())
        .filter(cap => this.matchesRequirement(cap, requirement));

      // Sort by reliability and performance metrics
      return this.rankCapabilities(capabilities, requirement);
    } catch (error) {
      this.logger.error('Error discovering capabilities:', error);
      throw error;
    }
  }

  async registerAgentCapability(
    agentId: string,
    capability: Omit<AgentCapability, 'id'>
  ): Promise<AgentCapability> {
    try {
      const registeredCapability = await this.prisma.capability.create({
        data: {
          name: capability.name,
          description: capability.description,
          version: capability.version,
          parameters: capability.parameters as any,
          metadata: capability.metadata as any,
          agents: {
            connect: { id: agentId }
          }
        }
      });

      const fullCapability: AgentCapability = {
        ...registeredCapability,
        reliability: 1.0, // Initial reliability
        performanceMetrics: {
          averageLatency: 0,
          successRate: 1,
          lastUsed: Date.now()
        }
      };

      this.updateCacheEntry(fullCapability);
      this.addAgentCapability(agentId, fullCapability.id);

      await this.mcpBroker.executeDirective('agent', 'capabilityRegistered', {
        agentId,
        capability: fullCapability
      });

      return fullCapability;
    } catch (error) {
      this.logger.error('Error registering agent capability:', error);
      throw error;
    }
  }

  async updateCapabilityMetrics(data: {
    agentId: string;
    capabilityId: string;
    metrics: {
      latency?: number;
      success?: boolean;
      error?: string;
    };
  }): Promise<void> {
    try {
      const capability = this.capabilityCache.get(data.capabilityId);
      if (!capability) return;

      const metrics = capability.performanceMetrics || {
        averageLatency: 0,
        successRate: 1,
        lastUsed: Date.now()
      };

      // Update metrics
      if (data.metrics.latency !== undefined) {
        metrics.averageLatency = (metrics.averageLatency + data.metrics.latency) / 2;
      }

      if (data.metrics.success !== undefined) {
        const weight = 0.1; // Weight for exponential moving average
        metrics.successRate = metrics.successRate * (1 - weight) + 
          (data.metrics.success ? 1 : 0) * weight;
      }

      metrics.lastUsed = Date.now();

      // Update cache
      capability.performanceMetrics = metrics;
      this.capabilityCache.set(data.capabilityId, capability);

      // Update reliability metrics
      this.updateReliabilityMetrics(data.capabilityId, data.agentId, data.metrics);

      // Persist updates
      await this.prisma.capability.update({
        where: { id: data.capabilityId },
        data: {
          metadata: {
            ...capability.metadata,
            performanceMetrics: metrics
          }
        }
      });
    } catch (error) {
      this.logger.error('Error updating capability metrics:', error);
    }
  }

  private updateReliabilityMetrics(
    capabilityId: string,
    agentId: string,
    metrics: { success?: boolean; error?: string }
  ): void {
    if (!this.capabilityMetrics.has(capabilityId)) {
      this.capabilityMetrics.set(capabilityId, new Map());
    }

    const agentMetrics = this.capabilityMetrics.get(capabilityId)!;
    const currentReliability = agentMetrics.get(agentId) || 1.0;

    if (metrics.success !== undefined) {
      const weight = 0.05; // Weight for reliability adjustment
      const newReliability = currentReliability * (1 - weight) + 
        (metrics.success ? 1 : 0) * weight;
      agentMetrics.set(agentId, newReliability);
    }
  }

  private async refreshCapabilityCache(): Promise<void> {
    try {
      const capabilities = await this.prisma.capability.findMany({
        include: {
          agents: true
        }
      });

      this.capabilityCache.clear();
      this.agentCapabilities.clear();

      for (const cap of capabilities) {
        const capability: AgentCapability = {
          ...cap,
          performanceMetrics: cap.metadata?.performanceMetrics || {
            averageLatency: 0,
            successRate: 1,
            lastUsed: Date.now()
          }
        };

        this.updateCacheEntry(capability);
        cap.agents.forEach(agent => {
          this.addAgentCapability(agent.id, cap.id);
        });
      }

      this.lastCacheUpdate = Date.now();
    } catch (error) {
      this.logger.error('Error refreshing capability cache:', error);
      throw error;
    }
  }

  private async ensureFreshCache(): Promise<void> {
    if (Date.now() - this.lastCacheUpdate > this.cacheTimeout) {
      await this.refreshCapabilityCache();
    }
  }

  private updateCacheEntry(capability: AgentCapability): void {
    this.capabilityCache.set(capability.id, capability);
  }

  private addAgentCapability(agentId: string, capabilityId: string): void {
    const capabilities = this.agentCapabilities.get(agentId) || new Set();
    capabilities.add(capabilityId);
    this.agentCapabilities.set(agentId, capabilities);
  }

  private matchesRequirement(
    capability: AgentCapability,
    requirement: CapabilityRequirement
  ): boolean {
    if (capability.name !== requirement.capability) return false;

    if (requirement.minReliability && 
        (capability.reliability || 0) < requirement.minReliability) {
      return false;
    }

    return true;
  }

  private rankCapabilities(
    capabilities: AgentCapability[],
    requirement: CapabilityRequirement
  ): AgentCapability[] {
    // Get user preference weights or use defaults
    const weights = {
      reliability: 0.4,
      successRate: 0.3, 
      latency: 0.2,
      recentActivity: 0.1,
      ...requirement.userPreferences?.customWeights
    };
    
    // Adjust weights based on user preferences
    if (requirement.userPreferences?.prioritizeSpeed) {
      weights.latency = 0.5;
      weights.reliability *= 0.7;
      weights.successRate *= 0.7;
    }
    
    if (requirement.userPreferences?.prioritizeAccuracy) {
      weights.reliability = 0.5;
      weights.successRate = 0.4;
      weights.latency *= 0.5;
    }
    
    if (requirement.userPreferences?.prioritizeRecentlyUsed) {
      weights.recentActivity = 0.4;
      weights.reliability *= 0.8;
    }
    
    // Normalize weights
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    Object.keys(weights).forEach(key => {
      weights[key as keyof typeof weights] /= sum;
    });
    
    return capabilities.sort((a, b) => {
      // Preferred agents still get highest priority
      if (requirement.preferredAgents) {
        const aPreferred = this.isPreferredCapability(a, requirement.preferredAgents);
        const bPreferred = this.isPreferredCapability(b, requirement.preferredAgents);
        if (aPreferred !== bPreferred) return bPreferred ? 1 : -1;
      }
      
      // Calculate weighted score for each capability
      const scoreA = this.calculateCapabilityScore(a, weights);
      const scoreB = this.calculateCapabilityScore(b, weights);
      
      return scoreB - scoreA; // Higher score is better
    });
  }
  
  private calculateCapabilityScore(
    capability: AgentCapability,
    weights: {
      reliability: number;
      successRate: number;
      latency: number;
      recentActivity: number;
    }
  ): number {
    const metrics = capability.performanceMetrics || {
      averageLatency: 0,
      successRate: 1,
      lastUsed: Date.now()
    };
    
    // Calculate normalized scores (0-1 range)
    const reliabilityScore = capability.reliability || 0;
    const successRateScore = metrics.successRate || 0;
    
    // For latency, lower is better, so invert the score (normalize to 0-1)
    const maxAcceptableLatency = 5000; // 5 seconds
    const latencyScore = Math.max(0, 1 - (metrics.averageLatency / maxAcceptableLatency));
    
    // For recency, calculate a score that decays with time
    const maxRecency = 24 * 60 * 60 * 1000; // 24 hours
    const timeSinceLastUse = Date.now() - metrics.lastUsed;
    const recencyScore = Math.max(0, 1 - (timeSinceLastUse / maxRecency));
    
    // Calculate weighted score
    return (
      weights.reliability * reliabilityScore +
      weights.successRate * successRateScore +
      weights.latency * latencyScore +
      weights.recentActivity * recencyScore
    );
  }

  private isPreferredCapability(
    capability: AgentCapability,
    preferredAgents: string[]
  ): boolean {
    for (const [agentId, capabilities] of this.agentCapabilities.entries()) {
      if (preferredAgents.includes(agentId) && capabilities.has(capability.id)) {
        return true;
      }
    }
    return false;
  }

  async getAgentCapabilities(agentId: string): Promise<AgentCapability[]> {
    await this.ensureFreshCache();
    const capabilityIds = this.agentCapabilities.get(agentId) || new Set();
    return Array.from(capabilityIds)
      .map(id => this.capabilityCache.get(id))
      .filter((cap): cap is AgentCapability => cap !== undefined);
  }

  async validateCapabilityRequirements(
    requirements: CapabilityRequirement[]
  ): Promise<{
    valid: boolean;
    missingCapabilities: string[];
    unreliableCapabilities: string[];
  }> {
    try {
      await this.ensureFreshCache();
      const missingCapabilities: string[] = [];
      const unreliableCapabilities: string[] = [];

      for (const requirement of requirements) {
        const capabilities = await this.discoverCapabilities(requirement);
        
        if (capabilities.length === 0) {
          missingCapabilities.push(requirement.capability);
          continue;
        }

        if (requirement.minReliability && 
            !capabilities.some(cap => (cap.reliability || 0) >= requirement.minReliability!)) {
          unreliableCapabilities.push(requirement.capability);
        }
      }

      return {
        valid: missingCapabilities.length === 0 && unreliableCapabilities.length === 0,
        missingCapabilities,
        unreliableCapabilities
      };
    } catch (error) {
      this.logger.error('Error validating capability requirements:', error);
      throw error;
    }
  }

  private async handleCapabilityUpdate(data: {
    agentId: string;
    capabilityId: string;
    updates: Partial<AgentCapability>;
  }): Promise<void> {
    try {
      const capability = this.capabilityCache.get(data.capabilityId);
      if (!capability) return;

      // Update capability details
      const updatedCapability = {
        ...capability,
        ...data.updates,
        // Preserve existing performance metrics
        performanceMetrics: {
          ...capability.performanceMetrics,
          ...(data.updates.performanceMetrics || {})
        },
        // Handle version updates properly
        versionInfo: this.updateVersionInfo(capability.versionInfo, data.updates.versionInfo)
      };

      // Update cache
      this.capabilityCache.set(data.capabilityId, updatedCapability);

      // Persist updates to database
      await this.prisma.capability.update({
        where: { id: data.capabilityId },
        data: {
          name: updatedCapability.name,
          description: updatedCapability.description,
          version: updatedCapability.version,
          parameters: updatedCapability.parameters as any,
          metadata: {
            ...updatedCapability.metadata,
            performanceMetrics: updatedCapability.performanceMetrics,
            versionInfo: updatedCapability.versionInfo,
            federatedWith: updatedCapability.federatedWith
          }
        }
      });

      // Notify interested parties about the update
      this.eventEmitter.emit('capability.updated', updatedCapability);
    } catch (error) {
      this.logger.error('Error handling capability update:', error);
    }
  }

  private updateVersionInfo(
    currentVersionInfo?: AgentCapability['versionInfo'],
    updatedVersionInfo?: AgentCapability['versionInfo']
  ): AgentCapability['versionInfo'] {
    if (!updatedVersionInfo) return currentVersionInfo;
    if (!currentVersionInfo) return updatedVersionInfo;

    return {
      ...currentVersionInfo,
      ...updatedVersionInfo,
      // If this is a major version update, reset the deprecated flag unless explicitly set
      isDeprecated: updatedVersionInfo.major > currentVersionInfo.major
        ? (updatedVersionInfo.isDeprecated ?? false)
        : (updatedVersionInfo.isDeprecated ?? currentVersionInfo.isDeprecated)
    };
  }

  private async handleNewCapability(data: {
    agentId: string;
    capability: Omit<AgentCapability, 'id'>;
  }): Promise<void> {
    try {
      // Register the new capability in the system
      const registeredCapability = await this.registerAgentCapability(
        data.agentId,
        data.capability
      );
      
      // Notify other components about the new capability
      this.eventEmitter.emit('capability.discovered', {
        agentId: data.agentId,
        capability: registeredCapability
      });
      
      // Log the successful registration
      this.logger.info(`New capability registered: ${registeredCapability.name} by agent ${data.agentId}`);
      
      // Check if this capability can be federated with existing capabilities
      await this.checkForFederationOpportunities(registeredCapability);
    } catch (error) {
      this.logger.error('Error handling new capability registration:', error);
    }
  }
  
  private async checkForFederationOpportunities(capability: AgentCapability): Promise<void> {
    try {
      // Find similar capabilities that might be federated
      const similarCapabilities = Array.from(this.capabilityCache.values())
        .filter(cap => 
          cap.id !== capability.id && 
          cap.name === capability.name &&
          this.areVersionsCompatible(cap.versionInfo, capability.versionInfo)
        );
        
      if (similarCapabilities.length === 0) return;
      
      // Update federation information for all related capabilities
      for (const similarCap of similarCapabilities) {
        // Add mutual federation links
        const federatedWith = new Set([
          ...(capability.federatedWith || []),
          ...(similarCap.federatedWith || []),
          similarCap.id
        ]);
        
        // Update the new capability
        await this.handleCapabilityUpdate({
          agentId: '',  // Not needed for this update
          capabilityId: capability.id,
          updates: {
            federatedWith: Array.from(federatedWith)
          }
        });
        
        // Update the existing capability
        const existingFederated = new Set([
          ...(similarCap.federatedWith || []),
          capability.id
        ]);
        
        await this.handleCapabilityUpdate({
          agentId: '',  // Not needed for this update
          capabilityId: similarCap.id,
          updates: {
            federatedWith: Array.from(existingFederated)
          }
        });
      }
      
      this.logger.info(`Federated capability ${capability.name} with ${similarCapabilities.length} similar capabilities`);
    } catch (error) {
      this.logger.error('Error checking for federation opportunities:', error);
    }
  }
  
  private areVersionsCompatible(
    versionA?: AgentCapability['versionInfo'],
    versionB?: AgentCapability['versionInfo']
  ): boolean {
    if (!versionA || !versionB) return true; // If version info is missing, assume compatible
    
    // Capabilities are compatible if they have the same major version
    return versionA.major === versionB.major;
  }
}
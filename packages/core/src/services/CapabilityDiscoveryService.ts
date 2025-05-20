import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReliabilityMetricsService } from './ReliabilityMetricsService.js';
import { CapabilitySecurityService } from './CapabilitySecurityService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { compareVersions } from '../utils/version.js';

interface SemanticCapability {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  requires?: string[];
  provides?: string[];
  version: string;
  deprecated?: boolean;
  replacedBy?: string;
}

interface CapabilityComposition {
  id: string;
  name: string;
  capabilities: string[];
  workflow: {
    steps: Array<{
      capabilityId: string;
      inputs: Record<string, string>;
      outputs: Record<string, string>;
    }>;
    dependencies: Array<[string, string]>;
  };
}

@Injectable()
export class CapabilityDiscoveryService {
  private semanticIndex = new Map<string, Set<string>>();
  private compositions = new Map<string, CapabilityComposition>();
  private logger = new Logger(CapabilityDiscoveryService.name);

  constructor(
    private prisma: PrismaService,
    private reliabilityService: ReliabilityMetricsService,
    private securityService: CapabilitySecurityService,
    private eventEmitter: EventEmitter2
  ) {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    await this.buildSemanticIndex();
    await this.loadCompositions();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('capability.registered', async (data: SemanticCapability) => {
      await this.indexCapability(data);
    });

    this.eventEmitter.on('capability.deprecated', async (data: { id: string, replacedBy?: string }) => {
      await this.handleDeprecation(data);
    });
  }

  private async buildSemanticIndex(): Promise<void> {
    const capabilities = await this.prisma.capability.findMany({
      where: { deprecated: false }
    });

    for (const capability of capabilities) {
      await this.indexCapability(capability as SemanticCapability);
    }
  }

  private async indexCapability(capability: SemanticCapability): Promise<void> {
    const terms = new Set<string>();

    // Index name terms
    terms.add(...this.tokenize(capability.name));

    // Index description terms
    terms.add(...this.tokenize(capability.description));

    // Index keywords
    terms.add(...capability.keywords);

    // Index input/output schema fields
    if (capability.inputSchema) {
      terms.add(...this.extractSchemaTerms(capability.inputSchema));
    }
    if (capability.outputSchema) {
      terms.add(...this.extractSchemaTerms(capability.outputSchema));
    }

    // Store in index
    for (const term of terms) {
      if (!this.semanticIndex.has(term)) {
        this.semanticIndex.set(term, new Set());
      }
      this.semanticIndex.get(term)!.add(capability.id);
    }
  }

  async findCapabilities(query: string, context?: Record<string, any>): Promise<SemanticCapability[]> {
    const queryTerms = this.tokenize(query);
    const scores = new Map<string, number>();

    // Find matching capabilities
    for (const term of queryTerms) {
      const matches = this.semanticIndex.get(term) || new Set();
      for (const capabilityId of matches) {
        scores.set(
          capabilityId,
          (scores.get(capabilityId) || 0) + this.calculateTermScore(term, query)
        );
      }
    }

    // Get capability details and sort by score
    const capabilities = await Promise.all(
      Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(async ([id]) => {
          const capability = await this.prisma.capability.findUnique({ where: { id } });
          return capability as SemanticCapability;
        })
    );

    // Filter by context if provided
    return context ? this.filterByContext(capabilities, context) : capabilities;
  }

  async composeCapabilities(
    requirements: string[],
    context?: Record<string, any>
  ): Promise<CapabilityComposition | null> {
    try {
      // Find existing composition
      const key = requirements.sort().join(':');
      if (this.compositions.has(key)) {
        return this.compositions.get(key)!;
      }

      // Find capabilities that can fulfill requirements
      const capabilities = await Promise.all(
        requirements.map(req => this.findCapabilities(req, context))
      );

      // Check if we can fulfill all requirements
      if (capabilities.some(matches => matches.length === 0)) {
        return null;
      }

      // Create composition workflow
      const composition = await this.createComposition(
        requirements,
        capabilities.map(matches => matches[0])
      );

      // Cache composition
      this.compositions.set(key, composition);
      return composition;
    } catch (error) {
      this.logger.error('Error composing capabilities:', error);
      return null;
    }
  }

  private async createComposition(
    requirements: string[],
    capabilities: SemanticCapability[]
  ): Promise<CapabilityComposition> {
    const steps = capabilities.map((cap, index) => ({
      capabilityId: cap.id,
      inputs: {},
      outputs: {}
    }));

    // Analyze data flow between capabilities
    const dependencies: Array<[string, string]> = [];
    for (let i = 0; i < capabilities.length; i++) {
      const current = capabilities[i];
      for (let j = i + 1; j < capabilities.length; j++) {
        const next = capabilities[j];
        if (this.hasDataDependency(current, next)) {
          dependencies.push([current.id, next.id]);
        }
      }
    }

    return {
      id: crypto.randomUUID(),
      name: `Composition-${requirements.join('-')}`,
      capabilities: capabilities.map(c => c.id),
      workflow: { steps, dependencies }
    };
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(term => term.length > 2)
    );
  }

  private extractSchemaTerms(schema: Record<string, any>): Set<string> {
    const terms = new Set<string>();
    const extract = (obj: any) => {
      if (typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          terms.add(...this.tokenize(key));
          if (typeof value === 'object') {
            extract(value);
          } else if (typeof value === 'string') {
            terms.add(...this.tokenize(value));
          }
        }
      }
    };
    extract(schema);
    return terms;
  }

  private calculateTermScore(term: string, query: string): number {
    // Implement term scoring logic (e.g., TF-IDF, exact match bonus)
    return 1;
  }

  private filterByContext(
    capabilities: SemanticCapability[],
    context: Record<string, any>
  ): SemanticCapability[] {
    return capabilities.filter(capability => {
      // Check context compatibility
      // Example: language support, platform requirements, etc.
      return true;
    });
  }

  private hasDataDependency(
    source: SemanticCapability,
    target: SemanticCapability
  ): boolean {
    if (!source.provides || !target.requires) {
      return false;
    }
    return target.requires.some(req => source.provides!.includes(req));
  }

  private async handleDeprecation(data: { id: string; replacedBy?: string }): Promise<void> {
    try {
      // Update capability status
      await this.prisma.capability.update({
        where: { id: data.id },
        data: { 
          deprecated: true,
          replacedBy: data.replacedBy
        }
      });

      // Remove from semantic index
      for (const [term, capabilities] of this.semanticIndex.entries()) {
        capabilities.delete(data.id);
        if (capabilities.size === 0) {
          this.semanticIndex.delete(term);
        }
      }

      // Update affected compositions
      for (const [key, composition] of this.compositions.entries()) {
        if (composition.capabilities.includes(data.id)) {
          if (data.replacedBy) {
            // Replace deprecated capability in composition
            composition.capabilities = composition.capabilities.map(
              id => id === data.id ? data.replacedBy! : id
            );
            composition.workflow.steps = composition.workflow.steps.map(step => ({
              ...step,
              capabilityId: step.capabilityId === data.id ? data.replacedBy! : step.capabilityId
            }));
          } else {
            // Remove composition if no replacement
            this.compositions.delete(key);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error handling capability deprecation:', error);
    }
  }
}
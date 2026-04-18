import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { parse as parseTypeScript } from '@typescript-eslint/typescript-estree';
import * as fs from 'fs/promises';
import { glob } from 'glob';
import Redis from 'ioredis';
import * as path from 'path';
import { AgentInbox } from '../shared/agent-inbox.js';

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  location: string;
  metadata: Record<string, any>;
  relationships: {
    dependsOn: string[];
    usedBy: string[];
    synergizesWith: string[];
  };
  health: {
    status: 'healthy' | 'degraded' | 'failed' | 'unknown';
    lastChecked: Date;
    issues: string[];
  };
  metrics: {
    usageFrequency: 'high' | 'medium' | 'low';
    lastUsed: Date;
    performanceScore: number;
  };
}

export type ResourceType =
  | 'agent'
  | 'service'
  | 'package'
  | 'dependency'
  | 'api-endpoint'
  | 'database'
  | 'queue'
  | 'channel'
  | 'skill'
  | 'context'
  | 'prompt'
  | 'visualizer'
  | 'external-site'
  | 'configuration'
  | 'workflow';

export interface SynergyOpportunity {
  id: string;
  type: 'duplicate' | 'complementary' | 'shared-dependency' | 'cross-cutting';
  resources: string[]; // Resource IDs involved
  description: string;
  score: number; // 0-100, how valuable this opportunity is
  suggestedAction: string;
  detectedAt: Date;
}

/**
 * CodebaseIndexer Agent
 *
 * Continuously indexes the TNF codebase, detects resources,
 * analyzes dependencies, and finds synergy opportunities.
 *
 * Runs on cron schedules:
 * - Daily full index (midnight)
 * - Incremental index every 30min
 * - Synergy analysis every 6hr
 */
@Injectable()
export class CodebaseIndexerAgent {
  private readonly logger = new Logger(CodebaseIndexerAgent.name);
  private readonly redis: Redis;
  private readonly eventEmitter: EventEmitter2;
  private readonly agentId = 'codebase-indexer-001';
  private readonly workspaceRoot: string;
  private isIndexing = false;

  constructor(redis: Redis, eventEmitter: EventEmitter2, workspaceRoot: string) {
    this.redis = redis;
    this.eventEmitter = eventEmitter;
    this.workspaceRoot = workspaceRoot;
  }

  // ============ CRON JOBS ============

  /**
   * Full codebase index - Daily at midnight
   */
  @Cron('0 0 * * *', { name: 'full-index' })
  async runFullIndex(): Promise<void> {
    if (this.isIndexing) {
      this.logger.warn('Index already in progress, skipping...');
      return;
    }

    this.isIndexing = true;
    this.logger.log('🔍 Starting FULL codebase index...');

    try {
      const startTime = Date.now();

      // 1. Scan all files
      const files = await this.scanCodebase();
      this.logger.log(`Found ${files.length} files to index`);

      // 2. Parse and extract resources
      const resources = await this.extractResources(files);
      this.logger.log(`Extracted ${resources.length} resources`);

      // 3. Build dependency graph
      await this.buildDependencyGraph(resources);

      // 4. Detect synergies
      const synergies = await this.detectSynergies(resources);
      this.logger.log(`Detected ${synergies.length} synergy opportunities`);

      // 5. Save to registry
      await this.saveToRegistry(resources, synergies);

      // 6. Generate report
      const duration = Date.now() - startTime;
      await this.generateIndexReport({
        type: 'full',
        filesScanned: files.length,
        resourcesFound: resources.length,
        synergiesDetected: synergies.length,
        duration,
      });

      this.logger.log(`✅ Full index complete in ${duration}ms`);
    } catch (error) {
      this.logger.error('Full index failed:', error);
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Incremental index - Every 30 minutes
   */
  @Cron('*/30 * * * *', { name: 'incremental-index' })
  async runIncrementalIndex(): Promise<void> {
    if (this.isIndexing) {
      this.logger.warn('Index already in progress, skipping...');
      return;
    }

    this.isIndexing = true;
    this.logger.log('🔄 Starting INCREMENTAL index...');

    try {
      const startTime = Date.now();

      // Get changed files since last index
      const lastIndexTime = await this.getLastIndexTime();
      const changedFiles = await this.getChangedFiles(lastIndexTime);

      if (changedFiles.length === 0) {
        this.logger.log('No changes detected, skipping index');
        return;
      }

      this.logger.log(`Found ${changedFiles.length} changed files`);

      // Parse only changed files
      const resources = await this.extractResources(changedFiles);

      // Update dependency graph (delta)
      await this.updateDependencyGraph(resources);

      // Quick synergy check
      const synergies = await this.quickSynergyCheck(resources);

      // Update registry
      await this.updateRegistry(resources, synergies);

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Incremental index complete in ${duration}ms`);
    } catch (error) {
      this.logger.error('Incremental index failed:', error);
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Synergy analysis - Every 6 hours
   */
  @Cron('0 */6 * * *', { name: 'synergy-analysis' })
  async runSynergyAnalysis(): Promise<void> {
    this.logger.log('🔗 Starting synergy analysis...');

    try {
      const startTime = Date.now();

      // Load all resources
      const resources = await this.loadAllResources();

      // Run comprehensive synergy detection
      const synergies = await this.detectSynergies(resources);

      // Compare with previous analysis
      const previousSynergies = await this.loadPreviousSynergies();
      const newSynergies = this.compareSynergies(synergies, previousSynergies);

      if (newSynergies.length > 0) {
        this.logger.log(`🆕 Found ${newSynergies.length} NEW synergy opportunities`);

        // Send report to architect agent's inbox
        await this.sendSynergyReport(newSynergies);
      }

      // Save synergies
      await this.saveSynergies(synergies);

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Synergy analysis complete in ${duration}ms`);
    } catch (error) {
      this.logger.error('Synergy analysis failed:', error);
    }
  }

  // ============ CORE INDEXING METHODS ============

  /**
   * Scan entire codebase for relevant files
   */
  private async scanCodebase(): Promise<string[]> {
    const patterns = [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.json',
      '**/*.md',
      '**/package.json',
      '**/tsconfig.json',
    ];

    const ignore = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
    ];

    const files: string[] = [];

    for (const pattern of patterns) {
      const matches: any = await glob(pattern, {
        cwd: this.workspaceRoot,
        ignore,
      });
      // @ts-ignore
      files.push(...matches.map((f: any) => path.join(this.workspaceRoot, f)));
    }

    return files;
  }

  /**
   * Extract resources from files
   */
  private async extractResources(files: string[]): Promise<Resource[]> {
    const resources: Resource[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const ext = path.extname(file);

        if (ext === '.ts' || ext === '.tsx') {
          // Parse TypeScript
          const tsResources = await this.parseTypeScriptFile(file, content);
          resources.push(...tsResources);
        } else if (file.endsWith('package.json')) {
          // Parse package.json
          const pkgResource = await this.parsePackageJson(file, content);
          if (pkgResource) resources.push(pkgResource);
        } else if (file.endsWith('SKILL.md')) {
          // Parse skill
          const skillResource = await this.parseSkillFile(file, content);
          if (skillResource) resources.push(skillResource);
        } else if (file.includes('.agent/context/')) {
          // Parse context
          const contextResource = await this.parseContextFile(file, content);
          if (contextResource) resources.push(contextResource);
        }
      } catch (error) {
        this.logger.warn(`Failed to parse ${file}:`, error);
      }
    }

    return resources;
  }

  /**
   * Parse TypeScript file for resources
   */
  private async parseTypeScriptFile(filePath: string, content: string): Promise<Resource[]> {
    const resources: Resource[] = [];

    try {
      const ast = parseTypeScript(content, {
        loc: true,
        range: true,
        comment: true,
      });

      // Look for:
      // - Classes with @Injectable() → Services
      // - Classes extending specific base classes → Agents
      // - API route handlers → Endpoints
      // - Queue definitions → Queues

      // This is simplified - full implementation would use AST traversal
      // to find specific patterns

      if (content.includes('@Injectable()')) {
        // It's a service
        const className = this.extractClassName(content);
        if (className) {
          resources.push({
            id: `service:${className}`,
            type: 'service',
            name: className,
            location: filePath,
            metadata: {
              framework: 'NestJS',
              injectable: true,
            },
            relationships: {
              dependsOn: this.extractImports(content),
              usedBy: [],
              synergizesWith: [],
            },
            health: {
              status: 'unknown',
              lastChecked: new Date(),
              issues: [],
            },
            metrics: {
              usageFrequency: 'medium',
              lastUsed: new Date(),
              performanceScore: 85,
            },
          });
        }
      }

      // Check for agent classes
      if (content.includes('Agent') && content.includes('class')) {
        const className = this.extractClassName(content);
        if (className?.includes('Agent')) {
          resources.push({
            id: `agent:${className}`,
            type: 'agent',
            name: className,
            location: filePath,
            metadata: {
              capabilities: this.extractCapabilities(content),
              spawnable: !content.includes('singleton'),
            },
            relationships: {
              dependsOn: this.extractImports(content),
              usedBy: [],
              synergizesWith: [],
            },
            health: {
              status: 'healthy',
              lastChecked: new Date(),
              issues: [],
            },
            metrics: {
              usageFrequency: 'high',
              lastUsed: new Date(),
              performanceScore: 90,
            },
          });
        }
      }
    } catch (error) {
      // AST parsing failed, skip
    }

    return resources;
  }

  /**
   * Parse package.json
   */
  private async parsePackageJson(filePath: string, content: string): Promise<Resource | null> {
    try {
      const pkg = JSON.parse(content);

      return {
        id: `package:${pkg.name}`,
        type: 'package',
        name: pkg.name,
        location: filePath,
        metadata: {
          version: pkg.version,
          dependencies: Object.keys(pkg.dependencies || {}),
          devDependencies: Object.keys(pkg.devDependencies || {}),
          scripts: Object.keys(pkg.scripts || {}),
        },
        relationships: {
          dependsOn: Object.keys(pkg.dependencies || {}),
          usedBy: [],
          synergizesWith: [],
        },
        health: {
          status: 'healthy',
          lastChecked: new Date(),
          issues: [],
        },
        metrics: {
          usageFrequency: 'high',
          lastUsed: new Date(),
          performanceScore: 95,
        },
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse SKILL.md file
   */
  private async parseSkillFile(filePath: string, content: string): Promise<Resource | null> {
    const skillName = path.basename(path.dirname(filePath));

    return {
      id: `skill:${skillName}`,
      type: 'skill',
      name: skillName,
      location: filePath,
      metadata: {
        hasScripts: content.includes('```python') || content.includes('```bash'),
        linesOfDocs: content.split('\n').length,
      },
      relationships: {
        dependsOn: [],
        usedBy: [],
        synergizesWith: [],
      },
      health: {
        status: 'healthy',
        lastChecked: new Date(),
        issues: [],
      },
      metrics: {
        usageFrequency: 'medium',
        lastUsed: new Date(),
        performanceScore: 88,
      },
    };
  }

  /**
   * Parse context file
   */
  private async parseContextFile(filePath: string, content: string): Promise<Resource | null> {
    const contextName = path.basename(filePath, '.md');

    return {
      id: `context:${contextName}`,
      type: 'context',
      name: contextName,
      location: filePath,
      metadata: {
        sizeKB: Buffer.byteLength(content, 'utf-8') / 1024,
        sections: (content.match(/^## /gm) || []).length,
      },
      relationships: {
        dependsOn: [],
        usedBy: [],
        synergizesWith: [],
      },
      health: {
        status: 'healthy',
        lastChecked: new Date(),
        issues: [],
      },
      metrics: {
        usageFrequency: 'high',
        lastUsed: new Date(),
        performanceScore: 92,
      },
    };
  }

  // ============ SYNERGY DETECTION ============

  /**
   * Detect synergy opportunities between resources
   */
  private async detectSynergies(resources: Resource[]): Promise<SynergyOpportunity[]> {
    const synergies: SynergyOpportunity[] = [];

    // 1. Detect duplicate functionality
    synergies.push(...this.detectDuplicates(resources));

    // 2. Detect complementary capabilities
    synergies.push(...this.detectComplementary(resources));

    // 3. Detect shared dependencies
    synergies.push(...this.detectSharedDependencies(resources));

    return synergies;
  }

  /**
   * Detect duplicate functionality
   */
  private detectDuplicates(resources: Resource[]): SynergyOpportunity[] {
    const synergies: SynergyOpportunity[] = [];

    // Group by similar names
    const nameGroups = new Map<string, Resource[]>();

    for (const resource of resources) {
      const baseName = resource.name
        .toLowerCase()
        .replace(/service|agent|manager/gi, '')
        .trim();
      if (!nameGroups.has(baseName)) {
        nameGroups.set(baseName, []);
      }
      nameGroups.get(baseName)!.push(resource);
    }

    // Find groups with multiple resources
    for (const [baseName, group] of nameGroups) {
      if (group.length > 1) {
        synergies.push({
          id: `dup-${baseName}`,
          type: 'duplicate',
          resources: group.map((r) => r.id),
          description: `Potential duplicate functionality: ${group.map((r) => r.name).join(', ')}`,
          score: 70,
          suggestedAction: 'Review for consolidation or clarify distinct purposes',
          detectedAt: new Date(),
        });
      }
    }

    return synergies;
  }

  /**
   * Detect complementary capabilities
   */
  private detectComplementary(resources: Resource[]): SynergyOpportunity[] {
    const synergies: SynergyOpportunity[] = [];

    // Example: Browser automation + Relay communication = Inter-LLM messenger
    const browserAgent = resources.find((r) => r.name.includes('BrowserAutomation'));
    const relayAgent = resources.find((r) => r.name.includes('Relay'));

    if (browserAgent && relayAgent) {
      synergies.push({
        id: 'comp-browser-relay',
        type: 'complementary',
        resources: [browserAgent.id, relayAgent.id],
        description: 'Browser automation + Relay = Inter-LLM communication capability',
        score: 85,
        suggestedAction: 'Create integrated Inter-LLM Messenger agent',
        detectedAt: new Date(),
      });
    }

    return synergies;
  }

  /**
   * Detect shared dependencies
   */
  private detectSharedDependencies(resources: Resource[]): SynergyOpportunity[] {
    const synergies: SynergyOpportunity[] = [];

    const depMap = new Map<string, Resource[]>();

    for (const resource of resources) {
      for (const dep of resource.relationships.dependsOn) {
        if (!depMap.has(dep)) {
          depMap.set(dep, []);
        }
        depMap.get(dep)!.push(resource);
      }
    }

    for (const [dep, users] of depMap) {
      if (users.length >= 3) {
        synergies.push({
          id: `shared-${dep}`,
          type: 'shared-dependency',
          resources: users.map((r) => r.id),
          description: `${users.length} resources depend on ${dep} - consider extracting shared logic`,
          score: 60,
          suggestedAction: 'Create shared utility package',
          detectedAt: new Date(),
        });
      }
    }

    return synergies;
  }

  // ============ HELPER METHODS ============

  private extractClassName(content: string): string | null {
    const match = content.match(/class\s+(\w+)/);
    return match ? match[1] : null;
  }

  private extractImports(content: string): string[] {
    const importRegex = /import\s+.*from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private extractCapabilities(content: string): string[] {
    // Look for capability arrays in metadata
    const match = content.match(/capabilities:\s*\[(.*?)\]/s);
    if (match) {
      return match[1]
        .split(',')
        .map((c) => c.trim().replace(/['"]/g, ''))
        .filter(Boolean);
    }
    return [];
  }

  // ... Additional helper methods would go here

  /**
   * Save resources to registry
   */
  private async saveToRegistry(
    resources: Resource[],
    synergies: SynergyOpportunity[]
  ): Promise<void> {
    // Save to Redis
    for (const resource of resources) {
      await this.redis.set(
        `registry:resources:${resource.type}:${resource.id}`,
        JSON.stringify(resource)
      );
      await this.redis.sadd(`registry:index:${resource.type}`, resource.id);
    }

    // Save synergies
    await this.saveSynergies(synergies);

    // Update last index time
    await this.redis.set('registry:last-index', new Date().toISOString());
  }

  /**
   * Generate and send index report
   */
  private async generateIndexReport(data: any): Promise<void> {
    // Create inbox for reports
    const inbox = new AgentInbox('system-architect', this.redis, this.eventEmitter);

    await inbox.receiveTask({
      id: `index-report-${Date.now()}`,
      type: 'index-report',
      priority: 5,
      data,
      metadata: {
        generatedBy: 'codebase-indexer',
      },
    });
  }

  private async getLastIndexTime(): Promise<Date> {
    const time = await this.redis.get('registry:last-index');
    return time ? new Date(time) : new Date(0);
  }

  private async getChangedFiles(since: Date): Promise<string[]> {
    // Use git to find changed files
    // Simplified - would use actual git commands
    return [];
  }

  private async buildDependencyGraph(resources: Resource[]): Promise<void> {
    // Build relationships
    // Would implement actual graph building logic
  }

  private async updateDependencyGraph(resources: Resource[]): Promise<void> {
    // Update graph with delta
  }

  private async quickSynergyCheck(resources: Resource[]): Promise<SynergyOpportunity[]> {
    // Quick check for obvious synergies
    return [];
  }

  private async updateRegistry(
    resources: Resource[],
    synergies: SynergyOpportunity[]
  ): Promise<void> {
    // Update existing entries
  }

  private async loadAllResources(): Promise<Resource[]> {
    // Load from Redis
    return [];
  }

  private async loadPreviousSynergies(): Promise<SynergyOpportunity[]> {
    return [];
  }

  private compareSynergies(
    current: SynergyOpportunity[],
    previous: SynergyOpportunity[]
  ): SynergyOpportunity[] {
    return current.filter((c) => !previous.find((p) => p.id === c.id));
  }

  private async sendSynergyReport(synergies: SynergyOpportunity[]): Promise<void> {
    const inbox = new AgentInbox('system-architect', this.redis, this.eventEmitter);

    await inbox.receiveTask({
      id: `synergy-report-${Date.now()}`,
      type: 'synergy-report',
      priority: 7,
      data: {
        synergies,
        count: synergies.length,
      },
    });
  }

  private async saveSynergies(synergies: SynergyOpportunity[]): Promise<void> {
    await this.redis.set('registry:synergies', JSON.stringify(synergies));

    // Also save with scores for ranking
    for (const synergy of synergies) {
      await this.redis.zadd('registry:synergies:ranked', synergy.score, synergy.id);
    }
  }
}

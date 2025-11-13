"use strict";
/**
 * Agent Discovery Service
 *
 * Discovers, parses, and loads all agents from the .claude/agents directory,
 * integrating with the existing agent registry infrastructure and Claude Agent SDK.
 *
 * This service bridges the gap between the documented agent registry system
 * and the runtime agent management, making all 111+ specialized agents available
 * to the framework.
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
var AgentDiscoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentDiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const events_1 = require("events");
/**
 * Agent Discovery Service
 *
 * Loads and manages all agents from .claude/agents directory
 */
let AgentDiscoveryService = AgentDiscoveryService_1 = class AgentDiscoveryService extends events_1.EventEmitter {
    logger = new common_1.Logger(AgentDiscoveryService_1.name);
    agents = new Map();
    agentsDirectory;
    taxonomy = null;
    searchIndex = null;
    isInitialized = false;
    constructor(agentsDirectory = '.claude/agents') {
        super();
        this.agentsDirectory = agentsDirectory;
    }
    async onModuleInit() {
        this.logger.log('🔍 Initializing Agent Discovery Service...');
        try {
            // Load taxonomy
            await this.loadTaxonomy();
            // Load search index
            await this.loadSearchIndex();
            // Discover and parse all agents
            await this.discoverAgents();
            this.isInitialized = true;
            this.logger.log(`✅ Agent Discovery Service initialized with ${this.agents.size} agents);

      this.emit('initialized', {
        totalAgents: this.agents.size,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error('Failed to initialize Agent Discovery Service', error);
      throw error;
    }
  }

  /**
   * Load taxonomy from .claude/agent-registry/taxonomy.yaml
   */
  private async loadTaxonomy(): Promise<void> {
    try {
      const taxonomyPath = join(process.cwd(), '.claude/agent-registry/taxonomy.yaml');
      const taxonomyContent = await readFile(taxonomyPath, 'utf-8');
      this.taxonomy = yaml.load(taxonomyContent) as AgentTaxonomy;

      this.logger.log('✅ Taxonomy loaded');
    } catch (error) {
      this.logger.warn('Could not load taxonomy file, using defaults');
      this.taxonomy = this.getDefaultTaxonomy();
    }
  }

  /**
   * Load search index from .claude/agent-registry/search-index.json
   */
  private async loadSearchIndex(): Promise<void> {
    try {
      const indexPath = join(process.cwd(), '.claude/agent-registry/search-index.json');
      const indexContent = await readFile(indexPath, 'utf-8');
      this.searchIndex = JSON.parse(indexContent);

      this.logger.log('✅ Search index loaded');
    } catch (error) {
      this.logger.warn('Could not load search index, will generate on demand');
      this.searchIndex = this.getDefaultSearchIndex();
    }
  }

  /**
   * Discover all agent definition files
   */
  private async discoverAgents(): Promise<void> {
    try {
      const agentsPath = join(process.cwd(), this.agentsDirectory);
      const files = await readdir(agentsPath);

      const agentFiles = files.filter(file =>
        file.endsWith('.md') && !file.startsWith('.')
      );
`, this.logger.log(`📂 Found ${agentFiles.length}`, agent, definition, files));
            // Parse each agent file
            const parsePromises = agentFiles.map(file => this.parseAgentFile((0, path_1.join)(agentsPath, file)));
            const results = await Promise.allSettled(parsePromises);
            let successCount = 0;
            let failureCount = 0;
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    this.agents.set(result.value.name, result.value);
                    successCount++;
                }
                else {
                    failureCount++;
                    this.logger.warn(Failed, to, parse, agent, $, { agentFiles, [index]:  });
                }
            });
            `
      this.logger.log(✅ Successfully parsed ${successCount}`;
            agents;
            ;
            if (failureCount > 0) {
                this.logger.warn(Failed, to, parse, $, { failureCount }, agents);
            }
        }
        catch (error) {
            this.logger.error('Error discovering agents', error);
            throw error;
        }
    }
    /**
     * Parse an individual agent definition file
     */
    async parseAgentFile(filePath) {
        try {
            const content = await (0, promises_1.readFile)(filePath, 'utf-8');
            // Extract YAML frontmatter
            const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)$/);
            `
`;
            if (!frontmatterMatch) {
                this.logger.warn(No, frontmatter, found in $, { filePath } `);
        return null;
      }

      const [, frontmatter, systemPrompt] = frontmatterMatch;
      const metadata = yaml.load(frontmatter) as any;

      // Build agent metadata
      const agentMetadata: AgentMetadata = {
        name: metadata.name || basename(filePath, '.md'),
        displayName: metadata.display_name || metadata.name,
        description: metadata.description || '',
        tools: Array.isArray(metadata.tools) ? metadata.tools : [],
        color: metadata.color,
        author: metadata.author,
        version: metadata.version || '1.0.0',
        systemPrompt: systemPrompt.trim(),
        filePath,
        tags: this.extractTags(metadata, systemPrompt),
        metadata: {
          created: metadata.created,
          updated: metadata.updated,
          usageCount: 0,
          effectivenessScore: 0,
          toolsRequired: Array.isArray(metadata.tools) ? metadata.tools : [],
          relatedAgents: []
        },
        searchableText: this.generateSearchableText(metadata, systemPrompt),
        searchKeywords: this.extractKeywords(metadata, systemPrompt)
      };

      return agentMetadata;

    } catch (error) {
      this.logger.error(Error parsing agent file: ${filePath}, error);
      return null;
    }
  }

  /**
   * Extract taxonomy tags from agent metadata and content
   */
  private extractTags(metadata: any, systemPrompt: string): AgentMetadata['tags'] {
    const tags: AgentMetadata['tags'] = {
      domain: [],
      capability: [],
      tools: [],
      complexity: [],
      workflowStage: []
    };` `
    // Determine domain based on description and content
    const text = ${metadata.description} ${systemPrompt}`.toLowerCase());
                // Domain detection
                if (text.match(/content|writing|blog|article|script/i)) {
                    tags.domain?.push('content-creation');
                }
                if (text.match(/marketing|promotion|campaign|seo|social media/i)) {
                    tags.domain?.push('marketing');
                }
                if (text.match(/technical|development|api|system|automation/i)) {
                    tags.domain?.push('technical');
                }
                if (text.match(/business|strategy|financial|analytics|management/i)) {
                    tags.domain?.push('business');
                }
                if (text.match(/video|audio|podcast|media|production/i)) {
                    tags.domain?.push('media-production');
                }
                // Capability detection
                if (text.match(/writ(e|ing)/i))
                    tags.capability?.push('writing');
                if (text.match(/analy(ze|sis)/i))
                    tags.capability?.push('analysis');
                if (text.match(/automat(e|ion)/i))
                    tags.capability?.push('automation');
                if (text.match(/optimiz(e|ation)/i))
                    tags.capability?.push('optimization');
                if (text.match(/monitor(ing)?/i))
                    tags.capability?.push('monitoring');
                if (text.match(/integrat(e|ion)/i))
                    tags.capability?.push('integration');
                if (text.match(/manag(e|ement)/i))
                    tags.capability?.push('management');
                if (text.match(/research/i))
                    tags.capability?.push('research');
                // Tool-based categories
                const tools = metadata.tools || [];
                if (tools.some((t) => ['Read', 'Write', 'Edit'].includes(t))) {
                    tags.tools?.push('file-operations');
                }
                if (tools.some((t) => ['WebFetch', 'WebSearch'].includes(t))) {
                    tags.tools?.push('web-access');
                }
                if (tools.some((t) => ['Bash', 'BashOutput'].includes(t))) {
                    tags.tools?.push('system-commands');
                }
                if (tools.some((t) => ['Grep', 'Glob'].includes(t))) {
                    tags.tools?.push('search-capabilities');
                }
                if (tools.length === 0) {
                    tags.tools?.push('no-tools');
                }
                if (tools.length > 3) {
                    tags.tools?.push('multi-tool');
                }
                // Complexity based on tool count and description
                const toolCount = tools.length;
                const isComplex = text.length > 1000 || text.match(/complex|advanced|enterprise/i);
                if (toolCount <= 2 && !isComplex) {
                    tags.complexity?.push('beginner-friendly');
                }
                else if (toolCount <= 4) {
                    tags.complexity?.push('intermediate');
                }
                else {
                    tags.complexity?.push('advanced');
                }
                // Workflow stage detection
                if (text.match(/plan(ning)?|strategy|design|research/i)) {
                    tags.workflowStage?.push('planning');
                }
                if (text.match(/execut(e|ion)|implement|create|build/i)) {
                    tags.workflowStage?.push('execution');
                }
                if (text.match(/analy(ze|sis)|review|evaluate|assess/i)) {
                    tags.workflowStage?.push('analysis');
                }
                if (text.match(/optimiz(e|ation)|improve|enhance/i)) {
                    tags.workflowStage?.push('optimization');
                }
                if (text.match(/maintain|monitor|manage|track/i)) {
                    tags.workflowStage?.push('maintenance');
                }
                return tags;
            }
            /**
             * Generate searchable text from agent metadata
             */
        }
        /**
         * Generate searchable text from agent metadata
         */
        finally {
        }
        /**
         * Generate searchable text from agent metadata
         */
    }
    /**
     * Generate searchable text from agent metadata
     */
    generateSearchableText(metadata, systemPrompt) {
        return [
            metadata.name,
            metadata.display_name,
            metadata.description,
            systemPrompt.substring(0, 500), // First 500 chars of prompt
            ...(metadata.tools || [])
        ].filter(Boolean).join(' ').toLowerCase();
    }
    /**
     * Extract keywords for search
     */
    extractKeywords(metadata, systemPrompt) {
        const text = $, { metadata, description };
        ` ${systemPrompt}`;
        const words = text.toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 3)
            .filter(word => !this.isStopWord(word));
        // Get unique words
        return [...new Set(words)].slice(0, 50);
    }
    /**
     * Check if word is a stop word
     */
    isStopWord(word) {
        const stopWords = [
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
            'with', 'from', 'this', 'that', 'your', 'will', 'they', 'have',
            'been', 'their', 'were', 'about', 'would', 'there', 'when'
        ];
        return stopWords.includes(word);
    }
    /**
     * Search agents by criteria
     */
    searchAgents(criteria) {
        let results = Array.from(this.agents.values());
        // Text search
        if (criteria.text) {
            const searchText = criteria.text.toLowerCase();
            results = results.filter(agent => agent.searchableText?.includes(searchText) ||
                agent.searchKeywords?.some(keyword => keyword.includes(searchText)));
        }
        // Domain filter
        if (criteria.domain && criteria.domain.length > 0) {
            results = results.filter(agent => criteria.domain.some(domain => agent.tags?.domain?.includes(domain)));
        }
        // Capability filter
        if (criteria.capability && criteria.capability.length > 0) {
            results = results.filter(agent => criteria.capability.some(cap => agent.tags?.capability?.includes(cap)));
        }
        // Tools filter
        if (criteria.tools && criteria.tools.length > 0) {
            results = results.filter(agent => criteria.tools.some(tool => agent.tags?.tools?.includes(tool)));
        }
        // Complexity filter
        if (criteria.complexity && criteria.complexity.length > 0) {
            results = results.filter(agent => criteria.complexity.some(complexity => agent.tags?.complexity?.includes(complexity)));
        }
        // Workflow stage filter
        if (criteria.workflowStage && criteria.workflowStage.length > 0) {
            results = results.filter(agent => criteria.workflowStage.some(stage => agent.tags?.workflowStage?.includes(stage)));
        }
        // Pagination
        const total = results.length;
        const limit = criteria.limit || 50;
        const offset = criteria.offset || 0;
        const page = Math.floor(offset / limit) + 1;
        results = results.slice(offset, offset + limit);
        return {
            agents: results,
            total,
            page,
            pageSize: limit
        };
    }
    /**
     * Get agent by name
     */
    getAgent(name) {
        return this.agents.get(name);
    }
    /**
     * List all agents
     */
    listAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get agents by domain
     */
    getAgentsByDomain(domain) {
        return Array.from(this.agents.values()).filter(agent => agent.tags?.domain?.includes(domain));
    }
    /**
     * Get agents by capability
     */
    getAgentsByCapability(capability) {
        return Array.from(this.agents.values()).filter(agent => agent.tags?.capability?.includes(capability));
    }
    /**
     * Get taxonomy
     */
    getTaxonomy() {
        return this.taxonomy;
    }
    /**
     * Get search index
     */
    getSearchIndex() {
        return this.searchIndex;
    }
    /**
     * Get statistics
     */
    getStatistics() {
        const agents = Array.from(this.agents.values());
        const domainCounts = {};
        const capabilityCounts = {};
        const complexityCounts = {};
        agents.forEach(agent => {
            agent.tags?.domain?.forEach(domain => {
                domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            });
            agent.tags?.capability?.forEach(cap => {
                capabilityCounts[cap] = (capabilityCounts[cap] || 0) + 1;
            });
            agent.tags?.complexity?.forEach(comp => {
                complexityCounts[comp] = (complexityCounts[comp] || 0) + 1;
            });
        });
        return {
            totalAgents: agents.length,
            byDomain: domainCounts,
            byCapability: capabilityCounts,
            byComplexity: complexityCounts,
            isInitialized: this.isInitialized
        };
    }
    /**
     * Get default taxonomy
     */
    getDefaultTaxonomy() {
        return {
            version: '1.0.0',
            domains: {
                'content-creation': {},
                'marketing': {},
                'technical': {},
                'business': {},
                'media-production': {}
            },
            capabilities: {
                'writing': {},
                'analysis': {},
                'automation': {},
                'optimization': {},
                'monitoring': {},
                'integration': {},
                'management': {},
                'research': {}
            },
            toolCategories: {},
            complexityLevels: {},
            workflowStages: {}
        };
    }
    /**
     * Get default search index
     */
    getDefaultSearchIndex() {
        return {
            version: '1.0.0',
            agents: {},
            search_indices: {}
        };
    }
    /**
     * Reload agents from disk
     */
    async reload() {
        this.logger.log('🔄 Reloading agents...');
        this.agents.clear();
        await this.discoverAgents();
        this.emit('reloaded', {
            totalAgents: this.agents.size,
            timestamp: new Date()
        });
    }
};
exports.AgentDiscoveryService = AgentDiscoveryService;
exports.AgentDiscoveryService = AgentDiscoveryService = AgentDiscoveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String])
], AgentDiscoveryService);
//# sourceMappingURL=AgentDiscoveryService.js.map
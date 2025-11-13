"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentCatalogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCatalogService = void 0;
const common_1 = require("@nestjs/common");
/**
 * AgentCatalogService - Manages agent discovery and semantic search
 *
 * This service integrates the agent catalog with the vector database,
 * enabling semantic search across agents, skills, and domains.
 */
let AgentCatalogService = AgentCatalogService_1 = class AgentCatalogService {
    logger = new common_1.Logger(AgentCatalogService_1.name);
    vectorService;
    catalogLoaded = false;
    agentIndex = new Map();
    edgeIndex = new Map();
    constructor(vectorService) {
        this.vectorService = vectorService;
    }
    /**
     * Initialize the catalog service with vector database
     */
    async initialize(config) {
        try {
            this.logger.log('Initializing AgentCatalogService...');
            if (config?.vectorService) {
                this.vectorService = config.vectorService;
            }
            this.logger.log('AgentCatalogService initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize AgentCatalogService', error);
            throw error;
        }
    }
    /**
     * Ingest agent catalog into vector database
     */
    async ingestCatalog(catalog) {
        try {
            this.logger.log('Ingesting agent catalog into vector database...');
            if (!this.vectorService) {
                throw new Error('Vector service not available');
            }
            let totalAgents = 0;
            const edges = catalog.edges || [];
            // Process each category
            for (const [category, data] of Object.entries(catalog)) {
                if (category === 'edges')
                    continue;
                this.logger.log(`Processing category: ${category} (${data.nodes?.length || 0} agents));

        for (const agent of data.nodes || []) {
          // Add category to agent
          agent.category = category;

          // Create rich content for embedding
          const content = this.createAgentContent(agent);

          // Store in vector database
          await this.vectorService.addDocuments('agent_catalog', [{
            id: agent.id,
            content,
            metadata: {
              agentNodeId: agent.id,
              role: agent.role,
              domain: agent.domain,
              category,
              skills: agent.key_skills,
              type: 'agent_catalog',
              importance: 0.8
            }
          }]);

          // Index in memory for fast lookup
          this.agentIndex.set(agent.id, agent);
          totalAgents++;
        }
      }

      // Index edges
      for (const edge of edges) {
        if (!this.edgeIndex.has(edge.source)) {
          this.edgeIndex.set(edge.source, []);
        }
        this.edgeIndex.get(edge.source)!.push(edge);
      }

      this.catalogLoaded = true;`, this.logger.log(Catalog, ingestion, complete, $, { totalAgents } ` agents, ${edges.length}`, edges));
            }
            try { }
            catch (error) {
                this.logger.error('Failed to ingest catalog', error);
                throw error;
            }
        }
        /**
         * Create rich content for agent embedding
         */
        finally {
        }
        /**
         * Create rich content for agent embedding
         */
    }
    /**
     * Create rich content for agent embedding
     */
    createAgentContent(agent) {
        return;
        Role: $;
        {
            agent.role;
        }
        `
Domain: ${agent.domain}`;
        Category: $;
        {
            agent.category || 'Uncategorized';
        }
        Skills: $;
        {
            agent.key_skills.join(', ');
        }
        `
Agent ID: ${agent.id}`;
        This;
        agent;
        specializes in $;
        {
            agent.domain;
        }
        and;
        has;
        expertise in ;
        $;
        {
            agent.key_skills.join(', ');
        }
        `
The ${agent.role} is part of the ${agent.category || 'general'} category.`
            .trim();
    }
    /**
     * Search for agents using semantic search
     */
    async searchAgents(params) {
        try {
            if (!this.vectorService) {
                throw new Error('Vector service not available');
            }
            this.logger.debug(Searching, agents, "${params.query}");
            // Build search query
            let enhancedQuery = params.query;
            if (params.category) {
                enhancedQuery += category;
                $;
                {
                    params.category;
                }
                ;
            }
            `
      if (params.domain) {`;
            enhancedQuery += domain;
            $;
            {
                params.domain;
            }
            `;
      }

      // Search vector database
      const results = await this.vectorService.searchByText('agent_catalog', enhancedQuery, {
        limit: params.limit || 10,
        threshold: params.threshold || 0.6
      });

      // Transform results
      const agents = results.map((result: any) => {
        const agentId = result.metadata?.agentNodeId;
        const agent = this.agentIndex.get(agentId);

        return {
          agent: agent || this.reconstructAgentFromMetadata(result.metadata),
          similarity: result.similarity || 0
        };
      });

      this.logger.debug(Found ${agents.length} matching agents);
      return agents;
    } catch (error) {
      this.logger.error('Failed to search agents', error);
      throw error;
    }
  }

  /**
   * Find agents by skill
   */
  async findBySkill(skill: string, limit: number = 10): Promise<AgentNode[]> {
    const results = await this.searchAgents({
      query: skill: ${skill},
      limit,
      threshold: 0.7
    });

    return results.map(r => r.agent);
  }

  /**
   * Find agents by domain
   */
  async findByDomain(domain: string, limit: number = 10): Promise<AgentNode[]> {`;
            const results = await this.searchAgents({} `
      query: domain: ${domain}`, domain, limit, threshold, 0.7);
        }
        finally { }
        ;
        return results.map(r => r.agent);
    }
    /**
     * Find agents by category
     */
    async findByCategory(category, limit = 50) {
        const results = await this.searchAgents({
            query: category,
            category,
            limit,
            threshold: 0.5
        });
        return results.map(r => r.agent);
    }
    /**
     * Get agent by ID
     */
    getAgentById(agentId) {
        return this.agentIndex.get(agentId);
    }
    /**
     * Get all agents in a category
     */
    getAgentsByCategory(category) {
        return Array.from(this.agentIndex.values()).filter(agent => agent.category === category);
    }
    /**
     * Get agent relationships (edges)
     */
    getAgentRelationships(agentId) {
        return this.edgeIndex.get(agentId) || [];
    }
    /**
     * Find collaborating agents (connected via edges)
     */
    findCollaborators(agentId) {
        const edges = this.getAgentRelationships(agentId);
        const collaborators = [];
        for (const edge of edges) {
            const targetAgent = this.agentIndex.get(edge.target);
            if (targetAgent) {
                collaborators.push(targetAgent);
            }
        }
        return collaborators;
    }
    /**
     * Get catalog statistics
     */
    getStats() {
        const categoryCounts = {};
        const domainCounts = {};
        for (const agent of this.agentIndex.values()) {
            categoryCounts[agent.category || 'Uncategorized'] =
                (categoryCounts[agent.category || 'Uncategorized'] || 0) + 1;
            domainCounts[agent.domain] = (domainCounts[agent.domain] || 0) + 1;
        }
        return {
            totalAgents: this.agentIndex.size,
            totalEdges: Array.from(this.edgeIndex.values()).reduce((sum, edges) => sum + edges.length, 0),
            categoryCounts,
            domainCounts,
            catalogLoaded: this.catalogLoaded
        };
    }
    /**
     * Recommend agents based on a task description
     */
    async recommendAgents(params) {
        try {
            this.logger.log(Recommending, agents);
            for (task; ; )
                : "${params.taskDescription}";
            ;
            // Search for matching agents
            const results = await this.searchAgents({
                query: params.taskDescription,
                limit: params.limit || 5,
                threshold: 0.65
            });
            // Include collaborators if requested
            if (params.includeCollaborators) {
                return results.map(result => ({
                    ...result,
                    collaborators: this.findCollaborators(result.agent.id)
                }));
            }
            return results;
        }
        catch (error) {
            this.logger.error('Failed to recommend agents', error);
            throw error;
        }
    }
    /**
     * Build agent team for complex task
     */
    async buildTeam(params) {
        try {
            this.logger.log(Building, team);
            for (; ; )
                : "${params.taskDescription}";
            ;
            const maxTeamSize = params.maxTeamSize || 5;
            const requiredSkills = params.requiredSkills || [];
            // Find primary agents
            const primaryAgents = await this.searchAgents({
                query: params.taskDescription,
                limit: maxTeamSize * 2,
                threshold: 0.6
            });
            const team = [];
            const coveredSkills = new Set();
            // Add agents to team based on skill coverage
            for (const { agent } of primaryAgents) {
                if (team.length >= maxTeamSize)
                    break;
                // Check if agent adds new skills
                const newSkills = agent.key_skills.filter(skill => !coveredSkills.has(skill));
                if (newSkills.length > 0 || team.length === 0) {
                    team.push(agent);
                    agent.key_skills.forEach(skill => coveredSkills.add(skill));
                }
            }
            // Check skill coverage
            const skillCoverage = {};
            for (const skill of requiredSkills) {
                skillCoverage[skill] = coveredSkills.has(skill);
            }
            // Generate recommendations
            const recommendations = [];
            const missingSkills = requiredSkills.filter(skill => !coveredSkills.has(skill));
            `
      if (missingSkills.length > 0) {`;
            recommendations.push(`
          Missing skills: ${missingSkills.join(', ')}. Consider adding specialized agents.
        );
      }

      if (team.length < 2) {
        recommendations.push('Team size is small. Consider adding collaborating agents.');
      }` `
      this.logger.log(Team built: ${team.length} agents, ${coveredSkills.size}`, skills, covered `);

      return {
        team,
        skillCoverage,
        recommendations
      };
    } catch (error) {
      this.logger.error('Failed to build team', error);
      throw error;
    }
  }

  /**
   * Reconstruct agent from metadata (fallback)
   */
  private reconstructAgentFromMetadata(metadata: any): AgentNode {
    return {
      id: metadata?.agentNodeId || 'unknown',
      role: metadata?.role || 'Unknown Role',
      domain: metadata?.domain || 'Unknown Domain',
      key_skills: metadata?.skills || [],
      category: metadata?.category
    };
  }

  /**
   * Check if catalog is loaded
   */
  isCatalogLoaded(): boolean {
    return this.catalogLoaded;
  }
}

export default AgentCatalogService;
            );
        }
        finally { }
    }
};
exports.AgentCatalogService = AgentCatalogService;
exports.AgentCatalogService = AgentCatalogService = AgentCatalogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], AgentCatalogService);
//# sourceMappingURL=AgentCatalogService.js.map
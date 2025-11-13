import { BaseCommand } from '@the-new-fuse/commands-core';
import chalk from 'chalk';
import Table from 'cli-table3';
/**
 * Agent Catalog Ingest Command - Load agent catalog into vector DB
 */
export class AgentCatalogIngestCommand extends BaseCommand {
    constructor(data) {
        super('agent:catalog:ingest', data, {
            name: 'Agent Catalog Ingest',
            description: 'Ingest agent catalog into vector database',
            category: 'agent',
            version: '1.0.0',
            arguments: [
                {
                    name: 'catalogPath',
                    description: 'Path to agent catalog JSON file',
                    required: true
                }
            ]
        });
    }
    async executeInternal(context) {
        const catalogService = context.dependencies?.catalogService;
        if (!catalogService) {
            throw new Error('Agent catalog service not available');
        }
        console.log(chalk.blue(`📥 Loading catalog from: ${this.data.catalogPath}));

    // Load catalog file
    const catalogContent = await fs.readFile(this.data.catalogPath, 'utf-8');
    const catalog = JSON.parse(catalogContent);

    // Ingest into vector database
    await catalogService.ingestCatalog(catalog);

    // Get stats
    const stats = catalogService.getStats();

    console.log(chalk.green('\n✅ Catalog ingestion complete!\n'));`, console.log(chalk.cyan(`  Total Agents: ${stats.totalAgents}`))));
        console.log(chalk.cyan(Total, Relationships, $, { stats, : .totalEdges }));
        `
    console.log(chalk.cyan(  Categories: ${Object.keys(stats.categoryCounts).length}`;
        ;
        console.log(chalk.cyan(Domains, $, { Object, : .keys(stats.domainCounts).length }));
        return {
            success: true,
            stats
        };
    }
}
/**
 * Agent Search Command - Search for agents semantically
 */
export class AgentSearchCommand extends BaseCommand {
    constructor(data) {
        super('agent:search', data, {
            name: 'Agent Search',
            description: 'Search for agents using semantic search',
            category: 'agent',
            version: '1.0.0',
            arguments: [
                {
                    name: 'query',
                    description: 'Search query',
                    required: true
                }
            ],
            options: [
                {
                    name: 'limit',
                    short: 'l',
                    description: 'Maximum results',
                    value: 'limit'
                },
                {
                    name: 'threshold',
                    short: 't',
                    description: 'Similarity threshold (0-1)',
                    value: 'threshold'
                },
                {
                    name: 'category',
                    short: 'c',
                    description: 'Filter by category',
                    value: 'category'
                },
                {
                    name: 'json',
                    description: 'Output in JSON format'
                }
            ]
        });
    }
    async executeInternal(context) {
        const catalogService = context.dependencies?.catalogService;
        if (!catalogService) {
            throw new Error('Agent catalog service not available');
        }
        const results = await catalogService.searchAgents({
            query: this.data.query,
            limit: parseInt(this.data.limit || '10'),
            threshold: parseFloat(this.data.threshold || '0.6'),
            category: this.data.category
        });
        if (this.data.json) {
            console.log(JSON.stringify(results, null, 2));
            return results;
            `
    }`;
            console.log(chalk.blue.bold(n, Agent, Search, Results($, { results, : .length } ` found):\n));

    results.forEach((result, idx) => {
      const { agent, similarity } = result;
      console.log(chalk.green([${idx + 1}] ${agent.role}`($, {}(similarity * 100).toFixed(1)))));
        }
         % match;
        ;
        `
      console.log(chalk.white(  ID: ${agent.id}`;
        ;
        console.log(chalk.gray(Domain, $, { agent, : .domain } ` | Category: ${agent.category || 'N/A'}));`, console.log(chalk.cyan(Skills, $, { agent, : .key_skills.slice(0, 3).join(', ') } `${agent.key_skills.length > 3 ? '...' : ''}`))));
        console.log();
    }
    ;
}
return { results, count: results.length };
/**
 * Agent Recommend Command - Get agent recommendations for a task
 */
export class AgentRecommendCommand extends BaseCommand {
    constructor(data) {
        super('agent:recommend', data, {
            name: 'Agent Recommend',
            description: 'Get agent recommendations for a task',
            category: 'agent',
            version: '1.0.0',
            arguments: [
                {
                    name: 'taskDescription',
                    description: 'Description of the task',
                    required: true
                }
            ],
            options: [
                {
                    name: 'limit',
                    short: 'l',
                    description: 'Maximum recommendations',
                    value: 'limit'
                },
                {
                    name: 'collaborators',
                    description: 'Include collaborating agents'
                }
            ]
        });
    }
    async executeInternal(context) {
        const catalogService = context.dependencies?.catalogService;
        if (!catalogService) {
            throw new Error('Agent catalog service not available');
        }
        const recommendations = await catalogService.recommendAgents({
            taskDescription: this.data.taskDescription,
            limit: parseInt(this.data.limit || '5'),
            includeCollaborators: this.data.collaborators
        });
        console.log(chalk.blue.bold(n, Agent, Recommendations));
        for (; ; )
            : ;
        n;
        "${this.data.taskDescription}";
        n;
        ;
        recommendations.forEach((rec, idx) => {
            const { agent, similarity, collaborators } = rec;
            `
      console.log(chalk.green(`[$];
            {
                idx + 1;
            }
            $;
            {
                agent.role;
            }
            ` (${(similarity * 100).toFixed(1)}% match)));`;
            console.log(chalk.white(ID, $, { agent, : .id } `));
      console.log(chalk.gray(`, Domain, $, { agent, : .domain }));
            `
      console.log(chalk.cyan(`;
            Skills: $;
            {
                agent.key_skills.join(', ');
            }
            `));

      if (collaborators && collaborators.length > 0) {
        console.log(chalk.magenta(  Collaborators: ${collaborators.map(c => c.role).join(', ')}));
      }
      console.log();
    });

    return { recommendations, count: recommendations.length };
  }
}

/**
 * Agent Team Build Command - Build team for complex task
 */
export class AgentTeamBuildCommand extends BaseCommand {
  constructor(data: any) {
    super('agent:team:build', data, {
      name: 'Agent Team Build',
      description: 'Build an agent team for a complex task',
      category: 'agent',
      version: '1.0.0',
      arguments: [
        {
          name: 'taskDescription',
          description: 'Description of the task',
          required: true
        }
      ],
      options: [
        {
          name: 'skills',
          short: 's',
          description: 'Required skills (comma-separated)',
          value: 'skills'
        },
        {
          name: 'size',
          description: 'Max team size',
          value: 'size'
        }
      ]
    });
  }

  protected async executeInternal(context: ICommandContext): Promise<any> {
    const catalogService = context.dependencies?.catalogService as AgentCatalogService;

    if (!catalogService) {
      throw new Error('Agent catalog service not available');
    }

    const requiredSkills = this.data.skills
      ? this.data.skills.split(',').map((s: string) => s.trim())
      : [];

    const result = await catalogService.buildTeam({
      taskDescription: this.data.taskDescription,
      requiredSkills,
      maxTeamSize: parseInt(this.data.size || '5')
    });
`;
            console.log(chalk.blue.bold(n, Agent, Team));
            for (; ; )
                : ;
            n;
            "${this.data.taskDescription}`";
            n;
        });
        ;
        // Display team
        const table = new Table({
            head: ['Role', 'Domain', 'Key Skills'],
            colWidths: [30, 25, 45]
        });
        result.team.forEach(agent => {
            table.push([
                agent.role,
                agent.domain,
                agent.key_skills.slice(0, 3).join(', ') + (agent.key_skills.length > 3 ? '...' : '')
            ]);
        });
        console.log(table.toString());
        // Display skill coverage
        if (requiredSkills.length > 0) {
            console.log(chalk.blue.bold('\n📊 Skill Coverage:\n'));
            for (const [skill, covered] of Object.entries(result.skillCoverage)) {
                const icon = covered ? chalk.green('✓') : chalk.red('✗');
                console.log($, { icon }, $, { skill } `);
      }
    }

    // Display recommendations
    if (result.recommendations.length > 0) {
      console.log(chalk.yellow.bold('\n⚠️  Recommendations:\n'));
      result.recommendations.forEach(rec => {
        console.log(chalk.yellow(  • ${rec}));
      });
    }

    console.log();

    return result;
  }
}

/**
 * Agent List Categories Command
 */
export class AgentListCategoriesCommand extends BaseCommand {
  constructor(data: any) {
    super('agent:categories', data, {
      name: 'Agent List Categories',
      description: 'List all agent categories',
      category: 'agent',
      version: '1.0.0'
    });
  }

  protected async executeInternal(context: ICommandContext): Promise<any> {
    const catalogService = context.dependencies?.catalogService as AgentCatalogService;

    if (!catalogService) {
      throw new Error('Agent catalog service not available');
    }

    const stats = catalogService.getStats();

    console.log(chalk.blue.bold('\n📚 Agent Categories:\n'));

    const table = new Table({
      head: ['Category', 'Agent Count'],
      colWidths: [40, 15]
    });

    Object.entries(stats.categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        table.push([category, count.toString()]);
      });
`, console.log(table.toString()));
                `
    console.log(chalk.cyan(`;
                nTotal: $;
                {
                    stats.totalAgents;
                }
                agents;
                across;
                $;
                {
                    Object.keys(stats.categoryCounts).length;
                }
                categories;
                n;
                ;
                return { categoryCounts: stats.categoryCounts, totalAgents: stats.totalAgents };
            }
        }
        /**
         * Agent Stats Command
         */
        export class AgentStatsCommand extends BaseCommand {
            constructor(data) {
                super('agent:stats', data, {
                    name: 'Agent Stats',
                    description: 'Show agent catalog statistics',
                    category: 'agent',
                    version: '1.0.0'
                });
            }
            async executeInternal(context) {
                const catalogService = context.dependencies?.catalogService;
                if (!catalogService) {
                    throw new Error('Agent catalog service not available');
                }
                const stats = catalogService.getStats();
                `
    console.log(chalk.blue.bold('\n📊 Agent Catalog Statistics:\n'));`;
                console.log(chalk.cyan(Total, Agents, $, { stats, : .totalAgents } `));
    console.log(chalk.cyan(  Total Relationships: ${stats.totalEdges}));`, console.log(chalk.cyan(Categories, $, { Object, : .keys(stats.categoryCounts).length } `));
    console.log(chalk.cyan(`, Domains, $, { Object, : .keys(stats.domainCounts).length }))));
                `
    console.log(chalk.cyan(`;
                Catalog;
                Loaded: $;
                {
                    stats.catalogLoaded ? 'Yes' : 'No';
                }
                `));

    // Top categories
    console.log(chalk.blue.bold('\nTop Categories:'));
    Object.entries(stats.categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([category, count]) => {
        console.log(chalk.gray(  ${category}: ${count} agents));
      });

    // Top domains
    console.log(chalk.blue.bold('\nTop Domains:'));
    Object.entries(stats.domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([domain, count]) => {`;
                console.log(chalk.gray($, { domain } `: ${count} agents`));
            }
            ;
            console;
        }
        return stats;
    }
}
/**
 * Command Handlers
 */
export class AgentCatalogIngestHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            return {
                success: true,
                data: result,
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'EXECUTION_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                    type: 'INTERNAL'
                },
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
    }
    canHandle(command) {
        return command.type === 'agent:catalog:ingest';
    }
    getMetadata() {
        return {
            name: 'Agent Catalog Ingest Handler',
            description: 'Handles agent catalog ingestion',
            commandTypes: ['agent:catalog:ingest'],
            version: '1.0.0'
        };
    }
}
export class AgentSearchHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            return {
                success: true,
                data: result,
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'EXECUTION_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                    type: 'INTERNAL'
                },
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
    }
    canHandle(command) {
        return command.type === 'agent:search';
    }
    getMetadata() {
        return {
            name: 'Agent Search Handler',
            description: 'Handles agent search commands',
            commandTypes: ['agent:search'],
            version: '1.0.0'
        };
    }
}
export class AgentRecommendHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            return {
                success: true,
                data: result,
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'EXECUTION_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                    type: 'INTERNAL'
                },
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
    }
    canHandle(command) {
        return command.type === 'agent:recommend';
    }
    getMetadata() {
        return {
            name: 'Agent Recommend Handler',
            description: 'Handles agent recommendation commands',
            commandTypes: ['agent:recommend'],
            version: '1.0.0'
        };
    }
}
export class AgentTeamBuildHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            return {
                success: true,
                data: result,
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'EXECUTION_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                    type: 'INTERNAL'
                },
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
    }
    canHandle(command) {
        return command.type === 'agent:team:build';
    }
    getMetadata() {
        return {
            name: 'Agent Team Build Handler',
            description: 'Handles agent team building commands',
            commandTypes: ['agent:team:build'],
            version: '1.0.0'
        };
    }
}
export class AgentListCategoriesHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            return {
                success: true,
                data: result,
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'EXECUTION_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                    type: 'INTERNAL'
                },
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
    }
    canHandle(command) {
        return command.type === 'agent:categories';
    }
    getMetadata() {
        return {
            name: 'Agent List Categories Handler',
            description: 'Handles agent list categories commands',
            commandTypes: ['agent:categories'],
            version: '1.0.0'
        };
    }
}
export class AgentStatsHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            return {
                success: true,
                data: result,
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'EXECUTION_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                    type: 'INTERNAL'
                },
                metadata: {
                    executionTime: 0,
                    completedAt: new Date(),
                    eventCount: 0
                },
                events: []
            };
        }
    }
    canHandle(command) {
        return command.type === 'agent:stats';
    }
    getMetadata() {
        return {
            name: 'Agent Stats Handler',
            description: 'Handles agent stats commands',
            commandTypes: ['agent:stats'],
            version: '1.0.0'
        };
    }
}
//# sourceMappingURL=agent-catalog-commands.js.map
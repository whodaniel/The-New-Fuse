import { BaseCommand } from '@the-new-fuse/commands-core';
import chalk from 'chalk';
/**
 * Memory Store Command - Store data in vector memory
 */
export class MemoryStoreCommand extends BaseCommand {
    constructor(data) {
        super('memory.store', data, {
            name: 'Memory Store',
            description: 'Store data in vector memory',
            category: 'memory',
            version: '1.0.0',
            arguments: [
                {
                    name: 'content',
                    description: 'Content to store',
                    required: true
                }
            ],
            options: [
                {
                    name: 'agentId',
                    short: 'a',
                    description: 'Agent ID to associate with memory',
                    value: 'agentId'
                },
                {
                    name: 'importance',
                    short: 'i',
                    description: 'Importance score (0-1)',
                    value: 'importance'
                },
                {
                    name: 'namespace',
                    short: 'n',
                    description: 'Memory namespace',
                    value: 'namespace'
                },
                {
                    name: 'metadata',
                    short: 'm',
                    description: 'Additional metadata (JSON string)',
                    value: 'metadata'
                }
            ]
        });
    }
    async executeInternal(context) {
        const vectorService = context.dependencies?.vectorService;
        if (!vectorService) {
            throw new Error('Vector service not available. Please ensure vector database is initialized.');
        }
        const metadata = this.data.metadata ? JSON.parse(this.data.metadata) : {};
        const result = await vectorService.storeMemory({
            agentId: this.data.agentId,
            content: this.data.content,
            importance: parseFloat(this.data.importance || '0.5'),
            metadata,
            namespace: this.data.namespace || 'default'
        });
        console.log(chalk.green('✅ Memory stored successfully'));
        console.log(chalk.gray(`  ID: ${result.id}));`, console.log(chalk.gray(`  Namespace: ${this.data.namespace || 'default'}`))));
        return {
            success: true,
            memoryId: result.id
        };
    }
}
/**
 * Memory Search Command - Search vector memory semantically
 */
export class MemorySearchCommand extends BaseCommand {
    constructor(data) {
        super('memory.search', data, {
            name: 'Memory Search',
            description: 'Search vector memory using semantic similarity',
            category: 'memory',
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
                    name: 'agentId',
                    short: 'a',
                    description: 'Filter by agent ID',
                    value: 'agentId'
                },
                {
                    name: 'limit',
                    short: 'l',
                    description: 'Maximum results to return',
                    value: 'limit'
                },
                {
                    name: 'threshold',
                    short: 't',
                    description: 'Similarity threshold (0-1)',
                    value: 'threshold'
                },
                {
                    name: 'namespace',
                    short: 'n',
                    description: 'Memory namespace',
                    value: 'namespace'
                },
                {
                    name: 'json',
                    description: 'Output in JSON format'
                }
            ]
        });
    }
    async executeInternal(context) {
        const vectorService = context.dependencies?.vectorService;
        if (!vectorService) {
            throw new Error('Vector service not available. Please ensure vector database is initialized.');
        }
        const results = await vectorService.searchMemories({
            queryText: this.data.query,
            agentId: this.data.agentId,
            topK: parseInt(this.data.limit || '10'),
            threshold: parseFloat(this.data.threshold || '0.7'),
            namespace: this.data.namespace
        });
        if (this.data.json) {
            console.log(JSON.stringify(results, null, 2));
            return results;
        }
        console.log(chalk.blue.bold(n, Search, Results($, { results, : .length }, found), n));
        results.forEach((result, idx) => {
            `
      console.log(chalk.green([${idx + 1}`;
            Similarity: $;
            {
                (result.similarity * 100).toFixed(1);
            }
             % ;
        });
        ;
        `
      console.log(chalk.white(Content: ${result.content.substring(0, 200)}${result.content.length > 200 ? '...' : ''}));`;
        console.log(chalk.gray(Agent, $, { result, : .agentId || 'N/A' } | Importance, $, { result, : .importance?.toFixed(2) || 'N/A' } `));
      console.log(chalk.gray(Created: ${new Date(result.createdAt).toLocaleString()}));
      console.log();
    });

    return {
      results,
      count: results.length
    };
  }
}

/**
 * Memory List Command - List memories for an agent
 */
export class MemoryListCommand extends BaseCommand {
  constructor(data: any) {
    super('memory.list', data, {
      name: 'Memory List',
      description: 'List memories for an agent',
      category: 'memory',
      version: '1.0.0',
      options: [
        {
          name: 'agentId',
          short: 'a',
          description: 'Agent ID',
          value: 'agentId'
        },
        {
          name: 'namespace',
          short: 'n',
          description: 'Memory namespace',
          value: 'namespace'
        },
        {
          name: 'limit',
          short: 'l',
          description: 'Maximum results',
          value: 'limit'
        },
        {
          name: 'important',
          description: 'Show only important memories'
        }
      ]
    });
  }

  protected async executeInternal(context: ICommandContext): Promise<any> {
    const vectorService = context.dependencies?.vectorService as PrismaVectorService;

    if (!vectorService) {
      throw new Error('Vector service not available. Please ensure vector database is initialized.');
    }

    let memories: any[];

    if (this.data.important) {
      memories = await vectorService.getImportantMemories({
        agentId: this.data.agentId,
        limit: parseInt(this.data.limit || '10'),
        threshold: 0.7
      });
    } else {
      memories = await vectorService.searchMemories({
        queryText: '',
        agentId: this.data.agentId,
        topK: parseInt(this.data.limit || '20'),
        namespace: this.data.namespace
      });
    }

    const table = new Table({
      head: ['Created', 'Importance', 'Namespace', 'Content Preview'],
      colWidths: [22, 12, 15, 50]
    });

    memories.forEach((mem: any) => {
      table.push([
        new Date(mem.createdAt).toLocaleString(),
        mem.importance?.toFixed(2) || 'N/A',
        mem.metadata?.namespace || 'default',
        mem.content.substring(0, 45) + '...'
      ]);
    });` `
    console.log(chalk.blue.bold(\n📋 Memories (${memories.length} found):\n));
    console.log(table.toString());

    return {
      memories,
      count: memories.length
    };
  }
}

/**
 * Memory Stats Command - Show memory statistics
 */
export class MemoryStatsCommand extends BaseCommand {
  constructor(data: any) {
    super('memory.stats', data, {
      name: 'Memory Stats',
      description: 'Show vector memory statistics',
      category: 'memory',
      version: '1.0.0',
      options: [
        {
          name: 'agentId',
          short: 'a',
          description: 'Agent ID',
          value: 'agentId'
        }
      ]
    });
  }

  protected async executeInternal(context: ICommandContext): Promise<any> {
    const vectorService = context.dependencies?.vectorService as PrismaVectorService;

    if (!vectorService) {
      throw new Error('Vector service not available. Please ensure vector database is initialized.');
    }

    // Get various memory statistics
    const allMemories = await vectorService.searchMemories({
      queryText: '',
      agentId: this.data.agentId,
      topK: 1000
    });

    const namespaces = new Map<string, number>();
    let totalImportance = 0;
    let importantCount = 0;

    allMemories.forEach((mem: any) => {
      const ns = mem.metadata?.namespace || 'default';
      namespaces.set(ns, (namespaces.get(ns) || 0) + 1);
      totalImportance += mem.importance || 0;
      if (mem.importance && mem.importance > 0.7) {
        importantCount++;
      }
    });

    console.log(chalk.blue.bold('\n📊 Vector Memory Statistics:\n'));`, console.log(chalk.cyan(Total, Memories, $, { allMemories, : .length } `));
    console.log(chalk.cyan(  Important Memories (>0.7): ${importantCount}));`, console.log(chalk.cyan(Average, Importance, $, {}(totalImportance / allMemories.length).toFixed(2)))))));
    }
    ;
    console;
    log(chalk, cyan) { }
}
(Namespaces, { namespaces, size }) => ;
;
console.log();
`
    console.log(chalk.blue.bold('Breakdown by Namespace:'));`;
namespaces.forEach((count, ns) => {
    `
      console.log(chalk.gray(  ${ns}: ${count} memories));
    });

    return {
      totalMemories: allMemories.length,
      importantCount,
      averageImportance: totalImportance / allMemories.length,
      namespaces: Object.fromEntries(namespaces)
    };
  }
}

/**
 * Memory Delete Command - Delete memories
 */
export class MemoryDeleteCommand extends BaseCommand {
  constructor(data: any) {
    super('memory.delete', data, {
      name: 'Memory Delete',
      description: 'Delete memories from vector database',
      category: 'memory',
      version: '1.0.0',
      options: [
        {
          name: 'agentId',
          short: 'a',
          description: 'Delete all memories for agent',
          value: 'agentId'
        },
        {
          name: 'namespace',
          short: 'n',
          description: 'Delete all memories in namespace',
          value: 'namespace'
        },
        {
          name: 'confirm',
          description: 'Confirm deletion (required)'
        }
      ]
    });
  }

  protected async executeInternal(context: ICommandContext): Promise<any> {
    const vectorService = context.dependencies?.vectorService as PrismaVectorService;

    if (!vectorService) {
      throw new Error('Vector service not available. Please ensure vector database is initialized.');
    }

    if (!this.data.confirm) {
      throw new Error('Deletion requires --confirm flag for safety');
    }

    console.log(chalk.yellow('⚠️  Deleting memories...'));

    // Implementation would call vectorService.deleteMemories()
    // For now, show what would be deleted
    const memoriesToDelete = await vectorService.searchMemories({
      queryText: '',
      agentId: this.data.agentId,
      namespace: this.data.namespace,
      topK: 1000`;
});
`
`;
console.log(chalk.red(Would, delete $, { memoriesToDelete, : .length }, memories `));
    console.log(chalk.gray('(Actual deletion not implemented yet - add to PrismaVectorService)'));

    return {
      deleted: memoriesToDelete.length,
      agentId: this.data.agentId,
      namespace: this.data.namespace
    };
  }
}

/**
 * Command Handlers
 */

export class MemoryStoreHandler implements ICommandHandler<any, any> {
  async handle(command: MemoryStoreCommand, context: ICommandContext): Promise<ICommandResult<any>> {
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
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
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

  canHandle(command: any): boolean {
    return command.type === 'memory.store';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Memory Store Handler',
      description: 'Handles memory store commands',
      commandTypes: ['memory.store'],
      version: '1.0.0'
    };
  }
}

export class MemorySearchHandler implements ICommandHandler<any, any> {
  async handle(command: MemorySearchCommand, context: ICommandContext): Promise<ICommandResult<any>> {
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
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
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

  canHandle(command: any): boolean {
    return command.type === 'memory.search';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Memory Search Handler',
      description: 'Handles memory search commands',
      commandTypes: ['memory.search'],
      version: '1.0.0'
    };
  }
}

export class MemoryListHandler implements ICommandHandler<any, any> {
  async handle(command: MemoryListCommand, context: ICommandContext): Promise<ICommandResult<any>> {
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
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
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

  canHandle(command: any): boolean {
    return command.type === 'memory.list';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Memory List Handler',
      description: 'Handles memory list commands',
      commandTypes: ['memory.list'],
      version: '1.0.0'
    };
  }
}

export class MemoryStatsHandler implements ICommandHandler<any, any> {
  async handle(command: MemoryStatsCommand, context: ICommandContext): Promise<ICommandResult<any>> {
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
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
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

  canHandle(command: any): boolean {
    return command.type === 'memory.stats';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Memory Stats Handler',
      description: 'Handles memory stats commands',
      commandTypes: ['memory.stats'],
      version: '1.0.0'
    };
  }
}

export class MemoryDeleteHandler implements ICommandHandler<any, any> {
  async handle(command: MemoryDeleteCommand, context: ICommandContext): Promise<ICommandResult<any>> {
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
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
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

  canHandle(command: any): boolean {
    return command.type === 'memory.delete';
  }

  getMetadata(): HandlerMetadata {
    return {
      name: 'Memory Delete Handler',
      description: 'Handles memory delete commands',
      commandTypes: ['memory.delete'],
      version: '1.0.0'
    };
  }
}
));
//# sourceMappingURL=vector-memory-commands.js.map
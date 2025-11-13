var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BaseCommand, ICommandContext, ICommandResult, HandlerMetadata } from '@the-new-fuse/commands-core';
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import chalk from 'chalk';
/**
 * MCP Server List Command
 */
export class MCPListCommand extends BaseCommand {
    configPath;
    verbose;
    type = 'mcp:list';
    constructor(configPath, verbose = false) {
        super();
        this.configPath = configPath;
        this.verbose = verbose;
    }
    async execute(context) {
        const configPaths = [
            'config/mcp_config.json',
            'config/claude_desktop_config.json',
            'config/enhanced_mcp_config.json'
        ];
        const servers = [];
        for (const configPath of configPaths) {
            try {
                const configData = await fs.readFile(configPath, 'utf-8');
                const config = JSON.parse(configData);
                if (config.mcpServers) {
                    Object.entries(config.mcpServers).forEach(([name, serverConfig]) => {
                        servers.push({
                            name,
                            config: serverConfig,
                            source: configPath
                        });
                    });
                }
            }
            catch (error) {
                // Config file doesn't exist or is invalid
            }
        }
        return { servers };
    }
}
/**
 * MCP Server Start Command
 */
export class MCPStartCommand extends BaseCommand {
    serverName;
    background;
    type = 'mcp:start';
    constructor(serverName, background = false) {
        super();
        this.serverName = serverName;
        this.background = background;
    }
    async execute(context) {
        // Load server configuration
        const listCommand = new MCPListCommand();
        const { servers } = await listCommand.execute(context);
        const server = servers.find((s) => s.name === this.serverName);
        if (!server) {
            throw new Error(`MCP server '${this.serverName}' not found);
    }

    // Start the server
    const process = spawn(server.config.command, server.config.args, {
      env: { ...process.env, ...server.config.env },
      stdio: this.background ? 'pipe' : 'inherit',
      detached: this.background
    });

    return {
      serverName: this.serverName,
      pid: process.pid,
      background: this.background
    };
  }
}

/**
 * MCP Server Test Command
 */
export class MCPTestCommand extends BaseCommand {
  public readonly type = 'mcp:test';
  
  constructor(
    public readonly serverName: string
  ) {
    super();
  }

  async execute(context: ICommandContext): Promise<any> {
    // Load server configuration
    const listCommand = new MCPListCommand();
    const { servers } = await listCommand.execute(context);
    
    const server = servers.find((s: any) => s.name === this.serverName);
    if (!server) {`);
            throw new Error(`MCP server '${this.serverName}`, ' not found););
        }
        // Test the server by running it with --help or --version
        try {
            const output = execSync($, { server, : .config.command }, $, { server, : .config.args.join(' ') }--, help, {
                encoding: 'utf-8',
                timeout: 10000
            });
            return {
                serverName: this.serverName,
                success: true,
                output: output.substring(0, 500) // Limit output
            };
        }
        catch (error) {
            return {
                serverName: this.serverName,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}
/**
 * MCP Server Status Command
 */
export class MCPStatusCommand extends BaseCommand {
    type = 'mcp:status';
    async execute(context) {
        const listCommand = new MCPListCommand();
        const { servers } = await listCommand.execute(context);
        const status = {
            totalServers: servers.length,
            configFiles: [...new Set(servers.map((s) => s.source))],
            servers: servers.map((s) => ({
                name: s.name,
                command: s.config.command,
                description: s.config.description || 'No description',
                source: s.source
            }))
        };
        return status;
    }
}
/**
 * MCP List Handler
 */
let MCPListHandler = class MCPListHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            console.log(chalk.blue('\n📋 Available MCP Servers:\n'));
            if (result.servers.length === 0) {
                console.log(chalk.yellow('   No MCP servers found'));
                console.log(chalk.gray('   Add servers using: tnf mcp add'));
            }
            else {
                result.servers.forEach((server, index) => {
                    `
          console.log(chalk.cyan(   ${index + 1}`.$;
                    {
                        server.name;
                    }
                });
                ;
                `
          console.log(chalk.gray(      Command: ${server.config.command} ${server.config.args.join(' ')}));`;
                console.log(chalk.gray(Source, $, { server, : .source } `));
          if (server.config.description) {
            console.log(chalk.gray(      Description: ${server.config.description}));
          }
          console.log();
        });
      }

      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - context.timestamp.getTime(),
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MCP_LIST_FAILED',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
        },
        metadata: {
          executionTime: Date.now() - context.timestamp.getTime(),
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: any): boolean {
    return command.type === 'mcp:list';
  }
}

/**
 * MCP Start Handler
 */
@HandlerMetadata({
  description: 'Start an MCP server',
  category: 'mcp',
  version: '1.0.0'
})
export class MCPStartHandler implements ICommandHandler<MCPStartCommand, any> {`, async, handle(command, MCPStartCommand, context, ICommandContext), Promise < ICommandResult < any >> {} `
    const spinner = ora(Starting MCP server '${command.serverName}'...`).start());
                try {
                    const result = await command.execute(context);
                    spinner.succeed(chalk.green(MCP, server, '${command.serverName}', started, successfully));
                    `
      if (result.background) {`;
                    console.log(chalk.blue(Running in background));
                    with (PID)
                        : $;
                    {
                        result.pid;
                    }
                    `));
      } else {
        console.log(chalk.blue(   Running in foreground));
      }

      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - context.timestamp.getTime(),
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      spinner.fail(chalk.red(Failed to start MCP server '${command.serverName}'));
      
      return {
        success: false,
        error: {
          code: 'MCP_START_FAILED',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
        },
        metadata: {
          executionTime: Date.now() - context.timestamp.getTime(),
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: any): boolean {
    return command.type === 'mcp:start';
  }
}

/**
 * MCP Test Handler
 */
@HandlerMetadata({
  description: 'Test an MCP server',
  category: 'mcp',
  version: '1.0.0'
})
export class MCPTestHandler implements ICommandHandler<MCPTestCommand, any> {
  async handle(command: MCPTestCommand, context: ICommandContext): Promise<ICommandResult<any>> {
    const spinner = ora(Testing MCP server '${command.serverName}'...).start();
    
    try {
      const result = await command.execute(context);
      `;
                    if (result.success) {
                        `
        spinner.succeed(chalk.green(MCP server '${command.serverName}' test passed`;
                        ;
                        if (command.serverName === 'auggie-server') {
                            console.log(chalk.blue('   🤖 Auggie server is ready for use!'));
                        }
                    }
                    else {
                        spinner.fail(chalk.yellow(MCP, server, '${command.serverName}', test, failed));
                        console.log(chalk.red(Error, $, { result, : .error }));
                    }
                    return {
                        success: true,
                        data: result,
                        metadata: {
                            executionTime: Date.now() - context.timestamp.getTime(),
                            completedAt: new Date(),
                            eventCount: 0
                        },
                        events: []
                    };
                    `
    } catch (error) {`;
                    spinner.fail(chalk.red(Failed, to, test, MCP, server, '${command.serverName}`'));
                    return {
                        success: false,
                        error: {
                            code: 'MCP_TEST_FAILED',
                            message: error instanceof Error ? error.message : String(error),
                            type: 'INTERNAL'
                        },
                        metadata: {
                            executionTime: Date.now() - context.timestamp.getTime(),
                            completedAt: new Date(),
                            eventCount: 0
                        },
                        events: []
                    };
                }
                finally {
                }
            }
            canHandle(command, any);
            boolean;
            {
                return command.type === 'mcp:test';
            }
        }
        /**
         * MCP Status Handler
         */
        finally {
        }
        /**
         * MCP Status Handler
         */
        let MCPStatusHandler = class MCPStatusHandler {
            async handle(command, context) {
                try {
                    const result = await command.execute(context);
                    console.log(chalk.blue('\n📊 MCP Server Status:\n'));
                    console.log(chalk.cyan(Total, servers, $, { result, : .totalServers }));
                    `
      console.log(chalk.cyan(   Configuration files: ${result.configFiles.length}`;
                    ;
                    console.log(chalk.blue('\n📋 Configured Servers:\n'));
                    result.servers.forEach((server, index) => {
                        console.log(chalk.cyan($, { index } + 1));
                    }, $, { server, : .name } `));
        console.log(chalk.gray(      Command: ${server.command}));`, console.log(chalk.gray(Description, $, { server, : .description } `));
        console.log(chalk.gray(      Source: ${server.source}` `));
        console.log();
      });

      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - context.timestamp.getTime(),
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MCP_STATUS_FAILED',
          message: error instanceof Error ? error.message : String(error),
          type: 'INTERNAL' as any
        },
        metadata: {
          executionTime: Date.now() - context.timestamp.getTime(),
          completedAt: new Date(),
          eventCount: 0
        },
        events: []
      };
    }
  }

  canHandle(command: any): boolean {
    return command.type === 'mcp:status';
  }
}
                    )));
                }
                finally { }
            }
        };
        MCPStatusHandler = __decorate([
            HandlerMetadata({
                description: 'Show MCP server status',
                category: 'mcp',
                version: '1.0.0'
            })
        ], MCPStatusHandler);
        export { MCPStatusHandler };
    }
};
MCPListHandler = __decorate([
    HandlerMetadata({
        description: 'List available MCP servers',
        category: 'mcp',
        version: '1.0.0'
    })
], MCPListHandler);
export { MCPListHandler };
//# sourceMappingURL=mcp-commands.js.map
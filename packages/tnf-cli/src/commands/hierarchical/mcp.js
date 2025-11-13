import { CategoryCommand, SubcommandCommand } from './base.js';
import { Command } from 'commander';
import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import { promises as fs } from 'fs';
/**
 * MCP category command implementation
 */
export class MCPCommand extends CategoryCommand {
    constructor(program) {
        super('mcp', 'Model Context Protocol operations', program);
        this.initializeSubcommands();
    }
    initializeSubcommands() {
        // List subcommand
        this.registerSubcommand('list', new MCPListSubcommand('mcp', 'list', 'List MCP servers', this.program).createSubcommand());
        // Start subcommand
        this.registerSubcommand('start', new MCPStartSubcommand('mcp', 'start', 'Start MCP server', this.program).createSubcommand());
        // Stop subcommand
        this.registerSubcommand('stop', new MCPStopSubcommand('mcp', 'stop', 'Stop MCP server', this.program).createSubcommand());
        // Test subcommand
        this.registerSubcommand('test', new MCPTestSubcommand('mcp', 'test', 'Test MCP server', this.program).createSubcommand());
        // Status subcommand
        this.registerSubcommand('status', new MCPStatusSubcommand('mcp', 'status', 'Show MCP status', this.program).createSubcommand());
        // Add subcommand
        this.registerSubcommand('add', new MCPAddSubcommand('mcp', 'add', 'Add MCP server', this.program).createSubcommand());
    }
}
/**
 * MCP List subcommand
 */
class MCPListSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-v, --verbose', 'Show detailed information')
            .option('-c, --config <path>', 'Specific config file to check');
    }
    async handleCommand(options) {
        try {
            const servers = await this.loadMCPServers(options.config);
            console.log(chalk.blue('\n📋 Available MCP Servers:\n'));
            if (servers.length === 0) {
                console.log(chalk.yellow('   No MCP servers found'));
                console.log(chalk.gray('   Add servers using: tnf mcp add'));
                return;
            }
            servers.forEach((server, index) => {
                console.log(chalk.cyan(`   ${index + 1}. ${server.name}));`, console.log(chalk.gray(Command, $, { server, : .config.command } ` ${server.config.args?.join(' ') || ''}`))));
                console.log(chalk.gray(Source, $, { server, : .source }));
                if (options.verbose) {
                    if (server.config.description) {
                        `
            console.log(chalk.gray(      Description: ${server.config.description}`;
                    }
                }
            });
            ;
        }
        finally {
        }
        if (server.config.env && Object.keys(server.config.env).length > 0) {
            console.log(chalk.gray(Environment, $, { Object, : .keys(server.config.env).join(', ') } `));
          }
        }
        console.log();
      });

      // Highlight auggie-server if present
      const auggieServer = servers.find((s: any) => s.name === 'auggie-server');
      if (auggieServer) {
        console.log(chalk.green('🤖 Auggie server is configured and ready!'));
        console.log(chalk.blue('   Use: tnf mcp start auggie-server'));
      }
    } catch (error) {
      console.error(chalk.red('Failed to list MCP servers:'), error instanceof Error ? error.message : String(error));
    }
  }

  private async loadMCPServers(configPath?: string): Promise<any[]> {
    const configPaths = configPath ? [configPath] : [
      'config/mcp_config.json',
      'config/claude_desktop_config.json',
      'config/enhanced_mcp_config.json'
    ];

    const servers = [];
    
    for (const path of configPaths) {
      try {
        const configData = await fs.readFile(path, 'utf-8');
        const config = JSON.parse(configData);
        
        if (config.mcpServers) {
          Object.entries(config.mcpServers).forEach(([name, serverConfig]: [string, any]) => {
            servers.push({
              name,
              config: serverConfig,
              source: path
            });
          });
        }
      } catch (error) {
        // Config file doesn't exist or is invalid
      }
    }

    return servers;
  }
}

/**
 * MCP Start subcommand
 */
class MCPStartSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('<server-name>', 'Name of the MCP server to start')
      .option('-b, --background', 'Run in background')
      .option('-l, --logs', 'Show server logs');
  }

  protected async handleCommand(serverName: string, options: any): Promise<void> {
    try {
      const servers = await this.loadMCPServers();
      const server = servers.find((s: any) => s.name === serverName);
      
      if (!server) {
        console.error(chalk.red(MCP server '${serverName}' not found));
        console.log(chalk.blue('\nAvailable servers:'));
        servers.forEach((s: any) => console.log(chalk.cyan(   - ${s.name})));
        return;
      }` `
      console.log(chalk.blue(`, Starting, MCP, server, '${serverName}', ...));
            if (serverName === 'auggie-server') {
                console.log(chalk.green('🤖 Starting Auggie AI assistant server...'));
            }
            const process = spawn(server.config.command, server.config.args || [], {
                env: { ...process.env, ...server.config.env },
                stdio: options.background ? 'pipe' : 'inherit',
                detached: options.background
            });
            if (options.background) {
                `
        console.log(chalk.green(✅ MCP server '${serverName}' started in background (PID: ${process.pid}`;
                ;
            }
            else {
                console.log(chalk.green(MCP, server, '${serverName}`', started in foreground));
            }
        }
        try { }
        catch (error) {
            console.error(chalk.red(Failed, to, start, MCP, server, '${serverName}'), error instanceof Error ? error.message : String(error));
        }
    }
    async loadMCPServers() {
        // Same implementation as MCPListSubcommand
        const configPaths = [
            'config/mcp_config.json',
            'config/claude_desktop_config.json'
        ];
        const servers = [];
        for (const path of configPaths) {
            try {
                const configData = await fs.readFile(path, 'utf-8');
                const config = JSON.parse(configData);
                if (config.mcpServers) {
                    Object.entries(config.mcpServers).forEach(([name, serverConfig]) => {
                        servers.push({
                            name,
                            config: serverConfig,
                            source: path
                        });
                    });
                }
            }
            catch (error) {
                // Config file doesn't exist or is invalid
            }
        }
        return servers;
    }
}
/**
 * MCP Stop subcommand
 */
class MCPStopSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<server-name>', 'Name of the MCP server to stop')
            .option('-f, --force', 'Force stop the server');
    }
    async handleCommand(serverName, options) {
        `
    console.log(chalk.yellow(🛑 Stopping MCP server '${serverName}`;
        '...));;
        try {
            // Find and kill processes by name
            const killCommand = options.force ? 'pkill -9 -f' : 'pkill -f';
            execSync($, { killCommand } ` "${serverName}", { stdio: 'pipe' });
      
      console.log(chalk.green(✅ MCP server '${serverName}' stopped));`);
        }
        catch (error) {
            `
      console.log(chalk.yellow(⚠️  No running processes found for '${serverName}`;
            '));;
        }
    }
}
/**
 * MCP Test subcommand
 */
class MCPTestSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<server-name>', 'Name of the MCP server to test')
            .option('-t, --timeout <ms>', 'Test timeout in milliseconds', '10000');
    }
    async handleCommand(serverName, options) {
        try {
            const servers = await this.loadMCPServers();
            const server = servers.find((s) => s.name === serverName);
            if (!server) {
                console.error(chalk.red(MCP, server, '${serverName}', not, found));
                return;
            }
            `
`;
            console.log(chalk.blue(Testing, MCP, server, '${serverName}`', ...));
            if (serverName === 'auggie-server') {
                console.log(chalk.green('🤖 Testing Auggie AI assistant server...'));
            }
            try {
                const testArgs = [...(server.config.args || []), '--help'];
                const output = execSync($, { server, : .config.command }, $, { testArgs, : .join(' ') }, {
                    encoding: 'utf-8',
                    timeout: parseInt(options.timeout),
                    env: { ...process.env, ...server.config.env }
                });
                `
        console.log(chalk.green(✅ MCP server '${serverName}`;
                ' test passed));;
                if (serverName === 'auggie-server') {
                    console.log(chalk.blue('   🤖 Auggie server is ready for use!'));
                    console.log(chalk.gray('   You can now use Auggie through Claude Desktop or MCP clients'));
                }
            }
            catch (error) {
                console.log(chalk.yellow(MCP, server, '${serverName}', test, failed));
                `
        console.log(chalk.red(   Error: ${error instanceof Error ? error.message : String(error)}));
      }

    } catch (error) {
      console.error(chalk.red(Failed to test MCP server '${serverName}':), error instanceof Error ? error.message : String(error));
    }
  }

  private async loadMCPServers(): Promise<any[]> {
    // Same implementation as MCPListSubcommand
    const configPaths = [
      'config/mcp_config.json',
      'config/claude_desktop_config.json'
    ];

    const servers = [];
    
    for (const path of configPaths) {
      try {
        const configData = await fs.readFile(path, 'utf-8');
        const config = JSON.parse(configData);
        
        if (config.mcpServers) {
          Object.entries(config.mcpServers).forEach(([name, serverConfig]: [string, any]) => {
            servers.push({
              name,
              config: serverConfig,
              source: path
            });
          });
        }
      } catch (error) {
        // Config file doesn't exist or is invalid
      }
    }

    return servers;
  }
}

/**
 * MCP Status subcommand
 */
class MCPStatusSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .option('-d, --detailed', 'Show detailed status information');
  }

  protected async handleCommand(options: any): Promise<void> {
    try {
      const servers = await this.loadMCPServers();` `
      console.log(chalk.blue('\n📊 MCP Server Status:\n'));`;
                console.log(chalk.cyan(Total, configured, servers, $, { servers, : .length }));
                const configFiles = [...new Set(servers.map((s) => s.source))];
                `
      console.log(chalk.cyan(   Configuration files: ${configFiles.length}`;
                ;
                configFiles.forEach(file => {
                    console.log(chalk.gray(-$, { file }));
                });
                if (options.detailed && servers.length > 0) {
                    console.log(chalk.blue('\n📋 Server Details:\n'));
                    `
        servers.forEach((server: any, index: number) => {`;
                    console.log(chalk.cyan($, { index } + 1));
                }
                $;
                {
                    server.name;
                }
                ;
                `
          console.log(chalk.gray(      Command: ${server.config.command}`;
                ;
                console.log(chalk.gray(Args, $, { server, : .config.args?.join(' ') || 'none' }));
                `
          console.log(chalk.gray(      Source: ${server.source}));
          if (server.config.description) {`;
                console.log(chalk.gray(Description, $, { server, : .config.description } `));
          }
          console.log();
        });
      }

      // Check for auggie-server
      const auggieServer = servers.find((s: any) => s.name === 'auggie-server');
      if (auggieServer) {
        console.log(chalk.green('🤖 Auggie server is configured!'));
        console.log(chalk.blue('   Test with: tnf mcp test auggie-server'));
        console.log(chalk.blue('   Start with: tnf mcp start auggie-server'));
      }

    } catch (error) {
      console.error(chalk.red('Failed to get MCP status:'), error instanceof Error ? error.message : String(error));
    }
  }

  private async loadMCPServers(): Promise<any[]> {
    // Same implementation as MCPListSubcommand
    const configPaths = [
      'config/mcp_config.json',
      'config/claude_desktop_config.json',
      'config/enhanced_mcp_config.json'
    ];

    const servers = [];
    
    for (const path of configPaths) {
      try {
        const configData = await fs.readFile(path, 'utf-8');
        const config = JSON.parse(configData);
        
        if (config.mcpServers) {
          Object.entries(config.mcpServers).forEach(([name, serverConfig]: [string, any]) => {
            servers.push({
              name,
              config: serverConfig,
              source: path
            });
          });
        }
      } catch (error) {
        // Config file doesn't exist or is invalid
      }
    }

    return servers;
  }
}

/**
 * MCP Add subcommand
 */
class MCPAddSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('<server-name>', 'Name of the MCP server')
      .argument('<package>', 'Package name (e.g., @org/mcp-server)')
      .option('-d, --description <desc>', 'Server description')
      .option('-c, --config <path>', 'Target config file')
      .option('--env <vars>', 'Environment variables (JSON format)');
  }

  protected async handleCommand(serverName: string, packageName: string, options: any): Promise<void> {
    try {
      console.log(chalk.blue(📝 Adding MCP server '${serverName}'...));` `
      const configPath = options.config || 'config/mcp_config.json';
      const description = options.description || `, $, { serverName }, MCP, server));
                const env = options.env ? JSON.parse(options.env) : { LOG_LEVEL: 'info' };
                // Load existing config
                let config;
                try {
                    const configData = await fs.readFile(configPath, 'utf-8');
                    config = JSON.parse(configData);
                }
                catch (error) {
                    config = { mcpServers: {} };
                }
                if (!config.mcpServers) {
                    config.mcpServers = {};
                }
                // Add the server
                config.mcpServers[serverName] = {
                    command: 'npx',
                    args: ['-y', packageName],
                    env,
                    description
                };
                // Save config
                await fs.writeFile(configPath, JSON.stringify(config, null, 2));
                `
      `;
                console.log(chalk.green(MCP, server, '${serverName}', added, to, $, { configPath }));
                if (serverName === 'auggie-server') {
                    console.log(chalk.blue('🤖 Auggie server added successfully!'));
                    console.log(chalk.gray('   Test with: tnf mcp test auggie-server'));
                }
            }
            try { }
            catch (error) {
                `
      console.error(chalk.red(Failed to add MCP server '${serverName}`;
                ':`), error instanceof Error ? error.message : String(error));;
            }
        }
        finally {
        }
    }
}
/**
 * Register the MCP category command
 */
export function registerMCPCommands(program) {
    const mcpCommand = new MCPCommand(program);
    return mcpCommand.getCommand();
}
//# sourceMappingURL=mcp.js.map
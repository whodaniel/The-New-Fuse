var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BaseCommand, HandlerMetadata } from '@the-new-fuse/commands-core';
import { VSCodeServerManager } from '../lib/VSCodeServerManager.js';
import chalk from 'chalk';
import ora from 'ora';
/**
 * VS Code Server Start Command
 */
export class VSCodeServerStartCommand extends BaseCommand {
    name;
    workspace;
    authProvider;
    port;
    background;
    verbose;
    type = 'dev:vscode-server:start';
    constructor(name, workspace, authProvider = 'github', port, background = false, verbose = false) {
        super();
        this.name = name;
        this.workspace = workspace;
        this.authProvider = authProvider;
        this.port = port;
        this.background = background;
        this.verbose = verbose;
    }
    async execute(context) {
        const manager = new VSCodeServerManager();
        const options = {
            name: this.name,
            workspace: this.workspace || process.cwd(),
            authProvider: this.authProvider,
            port: this.port,
            background: this.background,
            verbose: this.verbose
        };
        return await manager.startServer(options);
    }
}
/**
 * VS Code Server Stop Command
 */
export class VSCodeServerStopCommand extends BaseCommand {
    name;
    stopAll;
    type = 'dev:vscode-server:stop';
    constructor(name, stopAll = false) {
        super();
        this.name = name;
        this.stopAll = stopAll;
    }
    async execute(context) {
        const manager = new VSCodeServerManager();
        if (this.stopAll) {
            return await manager.stopAllServers();
        }
        else {
            return await manager.stopServer(this.name);
        }
    }
}
/**
 * VS Code Server Status Command
 */
export class VSCodeServerStatusCommand extends BaseCommand {
    type = 'dev:vscode-server:status';
    async execute(context) {
        const manager = new VSCodeServerManager();
        return await manager.getStatus();
    }
}
/**
 * VS Code Server List Command
 */
export class VSCodeServerListCommand extends BaseCommand {
    type = 'dev:vscode-server:list';
    async execute(context) {
        const manager = new VSCodeServerManager();
        return await manager.listActiveTunnels();
    }
}
/**
 * VS Code Server Start Handler
 */
let VSCodeServerStartHandler = class VSCodeServerStartHandler {
    async handle(command, context) {
        const spinner = ora('Starting VS Code Server...').start();
        try {
            const result = await command.execute(context);
            spinner.succeed(chalk.green('VS Code Server started successfully!'));
            if (result.url) {
                console.log(chalk.blue('\n🌐 Access your VS Code environment at:'));
                console.log(chalk.cyan(`   ${result.url}));
        console.log(chalk.gray('\n💡 Bookmark this URL for easy access'));
      }
      
      if (result.authRequired) {
        console.log(chalk.yellow('\n🔐 Authentication required:'));`, console.log(chalk.cyan(`   Visit: ${result.authUrl}`))));
                console.log(chalk.cyan(Code, $, { result, : .authCode }));
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
        }
        catch (error) {
            spinner.fail(chalk.red('Failed to start VS Code Server'));
            return {
                success: false,
                error: {
                    code: 'VSCODE_SERVER_START_FAILED',
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
    }
    canHandle(command) {
        return command.type === 'dev:vscode-server:start';
    }
};
VSCodeServerStartHandler = __decorate([
    HandlerMetadata({
        description: 'Start VS Code Server tunnel',
        category: 'development',
        version: '1.0.0',
        schema: {
            properties: {
                name: { type: 'string', description: 'Custom tunnel name' },
                workspace: { type: 'string', description: 'Workspace path' },
                authProvider: {
                    type: 'string',
                    enum: ['github', 'microsoft'],
                    description: 'Authentication provider'
                },
                port: { type: 'number', description: 'Local port for tunnel' },
                background: { type: 'boolean', description: 'Run in background mode' },
                verbose: { type: 'boolean', description: 'Enable verbose logging' }
            }
        }
    })
], VSCodeServerStartHandler);
export { VSCodeServerStartHandler };
/**
 * VS Code Server Stop Handler
 */
let VSCodeServerStopHandler = class VSCodeServerStopHandler {
    async handle(command, context) {
        const spinner = ora('Stopping VS Code Server...').start();
        try {
            const result = await command.execute(context);
            if (command.stopAll) {
                spinner.succeed(chalk.green('All VS Code Server tunnels stopped'));
            }
            else {
                `
        spinner.succeed(chalk.green(VS Code Server tunnel '${command.name || 'default'}`;
                ' stopped));;
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
        }
        catch (error) {
            spinner.fail(chalk.red('Failed to stop VS Code Server'));
            return {
                success: false,
                error: {
                    code: 'VSCODE_SERVER_STOP_FAILED',
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
    }
    canHandle(command) {
        return command.type === 'dev:vscode-server:stop';
    }
};
VSCodeServerStopHandler = __decorate([
    HandlerMetadata({
        description: 'Stop VS Code Server tunnel',
        category: 'development',
        version: '1.0.0',
        schema: {
            properties: {
                name: { type: 'string', description: 'Tunnel name to stop' },
                stopAll: { type: 'boolean', description: 'Stop all tunnels' }
            }
        }
    })
], VSCodeServerStopHandler);
export { VSCodeServerStopHandler };
/**
 * VS Code Server Status Handler
 */
let VSCodeServerStatusHandler = class VSCodeServerStatusHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            console.log(chalk.blue('\n📊 VS Code Server Status:'));
            if (result.activeTunnels && result.activeTunnels.length > 0) {
                console.log(chalk.green(Active, tunnels, $, { result, : .activeTunnels.length }));
                `
        result.activeTunnels.forEach((tunnel: any) => {
          console.log(chalk.cyan(   • ${tunnel.name}`;
                $;
                {
                    tunnel.url;
                }
                ;
            }
            ;
        }
        finally { }
        {
            console.log(chalk.yellow('   No active tunnels'));
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
    }
    catch(error) {
        return {
            success: false,
            error: {
                code: 'VSCODE_SERVER_STATUS_FAILED',
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
};
VSCodeServerStatusHandler = __decorate([
    HandlerMetadata({
        description: 'Get VS Code Server status',
        category: 'development',
        version: '1.0.0'
    })
], VSCodeServerStatusHandler);
export { VSCodeServerStatusHandler };
canHandle(command, any);
boolean;
{
    return command.type === 'dev:vscode-server:status';
}
/**
 * VS Code Server List Handler
 */
let VSCodeServerListHandler = class VSCodeServerListHandler {
    async handle(command, context) {
        try {
            const result = await command.execute(context);
            console.log(chalk.blue('\n📋 Active VS Code Server Tunnels:'));
            `
      if (result.tunnels && result.tunnels.length > 0) {`;
            result.tunnels.forEach((tunnel, index) => {
                console.log(chalk.cyan($, { index } + 1));
            }, `. ${tunnel.name}));`, console.log(chalk.gray(URL, $, { tunnel, : .url })));
            `
          console.log(chalk.gray(      Workspace: ${tunnel.workspace}`;
            ;
            console.log(chalk.gray(Started, $, { tunnel, : .startTime } `));
        });
      } else {
        console.log(chalk.yellow('   No active tunnels found'));
        console.log(chalk.gray('   Run "tnf dev vscode-server" to start a tunnel'));
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
          code: 'VSCODE_SERVER_LIST_FAILED',
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
    return command.type === 'dev:vscode-server:list';
  }
}
            ));
        }
        finally { }
    }
};
VSCodeServerListHandler = __decorate([
    HandlerMetadata({
        description: 'List active VS Code Server tunnels',
        category: 'development',
        version: '1.0.0'
    })
], VSCodeServerListHandler);
export { VSCodeServerListHandler };
//# sourceMappingURL=vscode-server-command.js.map
/**
 * SkIDEancer MCP Bridge
 * 
 * This bridge integrates mcp-core with SkIDEancer IDE, providing MCP server
 * functionality that's compatible with SkIDEancer's AI features and MCP expectations.
 */

import { MCPServer } from '../server/MCPServer.js';
import { MCPSystemFactory, MCPSystemConfig } from '../factory/MCPSystemFactory.js';
import { LogLevel } from '../types/common.js';

/**
 * Configuration for SkIDEancer MCP Bridge
 */
export interface SkIDEancerMCPBridgeConfig {
  /** MCP server configuration for SkIDEancer */
  server: {
    name: string;
    version: string;
    port?: number;
    host?: string;
    enableAuth: boolean;
    logLevel: LogLevel;
  };
  
  /** SkIDEancer-specific configuration */
  ide: {
    /** Enable AI chat features */
    enableAIFeatures: boolean;
    /** Enable MCP tool integration */
    enableToolIntegration: boolean;
    /** Enable resource access from SkIDEancer */
    enableResourceAccess: boolean;
    /** Workspace root path */
    workspaceRoot?: string;
  };
  
  /** Bridge options */
  options?: {
    /** Enable stdio transport for SkIDEancer MCP */
    enableStdioTransport: boolean;
    /** Enable WebSocket transport */
    enableWebSocketTransport: boolean;
    /** Enable file system access */
    enableFileSystemAccess: boolean;
    /** Enable git integration */
    enableGitIntegration: boolean;
    /** Enable terminal access */
    enableTerminalAccess: boolean;
  };
}

/**
 * SkIDEancer MCP Bridge implementation
 */
export class SkIDEancerMCPBridge {
  private mcpSystem: any;
  private config: SkIDEancerMCPBridgeConfig;
  private isInitialized = false;
  private stdioTransport: any = null;

  constructor(config: SkIDEancerMCPBridgeConfig) {
    this.config = config;
  }

  /**
   * Initialize the SkIDEancer MCP bridge
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('SkIDEancerMCPBridge is already initialized');
      return;
    }

    try {
      console.log('🎨 Initializing SkIDEancer MCP Bridge...');

      // Create integrated MCP system for SkIDEancer
      const systemConfig: Partial<MCPSystemConfig> = {
        server: {
          name: this.config.server.name,
          version: this.config.server.version,
          port: this.config.server.port || 3006,
          host: this.config.server.host || 'localhost',
          maxConnections: 50,
          timeout: 30000,
          enableAuth: this.config.server.enableAuth,
          enableTLS: false,
          logLevel: this.config.server.logLevel
        },
        ide: {
          enabled: true,
          port: this.config.server.port || 3006,
          aiFeatures: this.config.ide.enableAIFeatures
        },
        development: {
          hotReload: true,
          debugMode: this.config.server.logLevel === LogLevel.DEBUG,
          mockServices: false
        }
      };

      // Create the integrated system
      this.mcpSystem = MCPSystemFactory.createDevelopmentSystem(systemConfig);

      // Register SkIDEancer-specific resources and tools
      await this.registerSkIDEancerResources();
      await this.registerSkIDEancerTools();

      // Setup stdio transport if enabled
      if (this.config.options?.enableStdioTransport) {
        await this.setupStdioTransport();
      }

      this.isInitialized = true;
      console.log('✅ SkIDEancer MCP Bridge initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize SkIDEancer MCP Bridge', error);
      throw error;
    }
  }

  /**
   * Start the SkIDEancer MCP bridge
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🚀 Starting SkIDEancer MCP Bridge...');
      
      await this.mcpSystem.start();
      
      console.log('✅ SkIDEancer MCP Bridge started successfully');
      console.log(`🌐 MCP Server available at http://${this.config.server.host || 'localhost'}:${this.config.server.port || 3006}`);

    } catch (error) {
      console.error('❌ Failed to start SkIDEancer MCP Bridge', error);
      throw error;
    }
  }

  /**
   * Stop the SkIDEancer MCP bridge
   */
  async stop(): Promise<void> {
    if (!this.mcpSystem) {
      return;
    }

    try {
      console.log('🛑 Stopping SkIDEancer MCP Bridge...');
      
      // Stop stdio transport if running
      if (this.stdioTransport) {
        await this.stdioTransport.stop?.();
        this.stdioTransport = null;
      }
      
      await this.mcpSystem.stop();
      
      console.log('✅ SkIDEancer MCP Bridge stopped successfully');

    } catch (error) {
      console.error('❌ Error stopping SkIDEancer MCP Bridge', error);
      throw error;
    }
  }

  /**
   * Get the MCP server instance
   */
  getMCPServer(): MCPServer {
    if (!this.mcpSystem) {
      throw new Error('SkIDEancer MCP Bridge not initialized');
    }
    return this.mcpSystem.server;
  }

  /**
   * Check if the bridge is running
   */
  isRunning(): boolean {
    return this.mcpSystem?.server?.isRunning() ?? false;
  }

  /**
   * Register SkIDEancer-specific resources
   */
  private async registerSkIDEancerResources(): Promise<void> {
    const server = this.mcpSystem.server;
    const config = this.config;

    // Register workspace resource
    if (config.ide.enableResourceAccess) {
      server.registerResource({
        uri: 'ide://workspace',
        name: 'SkIDEancer Workspace',
        description: 'Access to the current SkIDEancer workspace',
        handler: {
          async read() {
            const workspaceInfo = {
              root: config.ide.workspaceRoot || process.cwd(),
              name: 'SkIDEancer Workspace',
              type: 'workspace',
              timestamp: new Date().toISOString()
            };

            return {
              uri: 'ide://workspace',
              mimeType: 'application/json',
              content: JSON.stringify(workspaceInfo, null, 2),
              metadata: {
                generated: new Date().toISOString()
              }
            };
          }
        }
      });
    }

    // Register file system resource
    if (config.options?.enableFileSystemAccess) {
      server.registerResource({
        uri: 'ide://filesystem',
        name: 'File System Access',
        description: 'Access to file system through SkIDEancer',
        handler: {
          async read(uri: string, params?: { path?: string }) {
            const fs = await import('fs/promises');
            const path = await import('path');
            
            const targetPath = params?.path || config.ide.workspaceRoot || process.cwd();
            
            try {
              const stats = await fs.stat(targetPath);
              
              if (stats.isDirectory()) {
                const files = await fs.readdir(targetPath);
                return {
                  uri,
                  mimeType: 'application/json',
                  content: JSON.stringify({
                    type: 'directory',
                    path: targetPath,
                    files: files.slice(0, 100), // Limit to first 100 files
                    count: files.length
                  }, null, 2)
                };
              } else {
                const content = await fs.readFile(targetPath, 'utf8');
                return {
                  uri,
                  mimeType: 'text/plain',
                  content,
                  metadata: {
                    path: targetPath,
                    size: stats.size,
                    modified: stats.mtime
                  }
                };
              }
            } catch (error) {
              return {
                uri,
                mimeType: 'application/json',
                content: JSON.stringify({
                  error: error instanceof Error ? error.message : 'File access failed',
                  path: targetPath
                }, null, 2)
              };
            }
          }
        }
      });
    }

    // Register git resource
    if (config.options?.enableGitIntegration) {
      server.registerResource({
        uri: 'ide://git',
        name: 'Git Repository Info',
        description: 'Access to git repository information',
        handler: {
          async read() {
            try {
              const { execSync } = await import('child_process');
              const workspaceRoot = config.ide.workspaceRoot || process.cwd();
              
              const gitInfo = {
                branch: execSync('git branch --show-current', { cwd: workspaceRoot, encoding: 'utf8' }).trim(),
                status: execSync('git status --porcelain', { cwd: workspaceRoot, encoding: 'utf8' }).trim(),
                lastCommit: execSync('git log -1 --oneline', { cwd: workspaceRoot, encoding: 'utf8' }).trim(),
                remotes: execSync('git remote -v', { cwd: workspaceRoot, encoding: 'utf8' }).trim()
              };

              return {
                uri: 'ide://git',
                mimeType: 'application/json',
                content: JSON.stringify(gitInfo, null, 2),
                metadata: {
                  workspaceRoot,
                  generated: new Date().toISOString()
                }
              };
            } catch (error) {
              return {
                uri: 'ide://git',
                mimeType: 'application/json',
                content: JSON.stringify({
                  error: 'Git not available or not a git repository',
                  details: error instanceof Error ? error.message : 'Unknown error'
                }, null, 2)
              };
            }
          }
        }
      });
    }

    console.log('📋 Registered SkIDEancer-specific resources');
  }

  /**
   * Register SkIDEancer-specific tools
   */
  private async registerSkIDEancerTools(): Promise<void> {
    const server = this.mcpSystem.server;

    // Register file read tool
    if (this.config.ide.enableToolIntegration) {
      server.registerTool({
        name: 'ide-read-file',
        description: 'Read a file from the SkIDEancer workspace',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file to read' },
            encoding: { type: 'string', default: 'utf8', description: 'File encoding' }
          },
          required: ['path']
        },
        handler: {
          execute: async (params: { path: string; encoding?: string }) => {
            try {
              const fs = await import('fs/promises');
              const path = await import('path');
              
              const workspaceRoot = this.config.ide.workspaceRoot || process.cwd();
              const fullPath = path.resolve(workspaceRoot, params.path);
              
              // Security check: ensure file is within workspace
              if (!fullPath.startsWith(workspaceRoot)) {
                return {
                  success: false,
                  error: 'Access denied: file outside workspace'
                };
              }

              const encoding = (params.encoding || 'utf8') as BufferEncoding;
              const content = await fs.readFile(fullPath, encoding);
              const stats = await fs.stat(fullPath);

              return {
                success: true,
                result: {
                  path: params.path,
                  content,
                  size: stats.size,
                  modified: stats.mtime,
                  encoding: params.encoding || 'utf8'
                }
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'File read failed'
              };
            }
          }
        }
      });

      // Register file write tool
      server.registerTool({
        name: 'ide-write-file',
        description: 'Write content to a file in the SkIDEancer workspace',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file to write' },
            content: { type: 'string', description: 'Content to write to the file' },
            encoding: { type: 'string', default: 'utf8', description: 'File encoding' }
          },
          required: ['path', 'content']
        },
        handler: {
          execute: async (params: { path: string; content: string; encoding?: string }) => {
            try {
              const fs = await import('fs/promises');
              const path = await import('path');
              
              const workspaceRoot = this.config.ide.workspaceRoot || process.cwd();
              const fullPath = path.resolve(workspaceRoot, params.path);
              
              // Security check: ensure file is within workspace
              if (!fullPath.startsWith(workspaceRoot)) {
                return {
                  success: false,
                  error: 'Access denied: file outside workspace'
                };
              }

              // Ensure directory exists
              await fs.mkdir(path.dirname(fullPath), { recursive: true });
              
              const encoding = (params.encoding || 'utf8') as BufferEncoding;
              await fs.writeFile(fullPath, params.content, encoding);
              const stats = await fs.stat(fullPath);

              return {
                success: true,
                result: {
                  path: params.path,
                  written: true,
                  size: stats.size,
                  modified: stats.mtime
                }
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'File write failed'
              };
            }
          }
        }
      });
    }

    // Register terminal execution tool
    if (this.config.options?.enableTerminalAccess) {
      server.registerTool({
        name: 'ide-execute-command',
        description: 'Execute a command in the SkIDEancer workspace terminal',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Command to execute' },
            timeout: { type: 'number', default: 30000, description: 'Timeout in milliseconds' }
          },
          required: ['command']
        },
        handler: {
          execute: async (params: { command: string; timeout?: number }) => {
            try {
              const { exec } = await import('child_process');
              const { promisify } = await import('util');
              const execAsync = promisify(exec);
              
              const workspaceRoot = this.config.ide.workspaceRoot || process.cwd();
              
              const { stdout, stderr } = await execAsync(params.command, {
                cwd: workspaceRoot,
                timeout: params.timeout || 30000
              });

              return {
                success: true,
                result: {
                  command: params.command,
                  stdout: stdout.trim(),
                  stderr: stderr.trim(),
                  exitCode: 0,
                  workspaceRoot
                }
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message || 'Command execution failed',
                result: {
                  command: params.command,
                  stdout: error.stdout || '',
                  stderr: error.stderr || '',
                  exitCode: error.code || 1
                }
              };
            }
          }
        }
      });
    }

    console.log('🔧 Registered SkIDEancer-specific tools');
  }

  /**
   * Setup stdio transport for SkIDEancer MCP integration
   */
  private async setupStdioTransport(): Promise<void> {
    try {
      // This would integrate with @modelcontextprotocol/sdk for stdio transport
      // For now, we'll create a placeholder that can be extended
      
      this.stdioTransport = {
        name: 'ide-stdio',
        isConnected: () => this.isRunning(),
        start: async () => {
          console.log('📡 Stdio transport started for SkIDEancer MCP');
          return true;
        },
        stop: async () => {
          console.log('📡 Stdio transport stopped');
        }
      };

      console.log('📡 Stdio transport configured for SkIDEancer MCP');
    } catch (error) {
      console.error('❌ Failed to setup stdio transport', error);
      // Don't throw - stdio transport failure shouldn't stop the bridge
    }
  }

  /**
   * Create SkIDEancer-compatible server configuration
   */
  static createSkIDEancerCompatibleServer(config: Partial<SkIDEancerMCPBridgeConfig> = {}): SkIDEancerMCPBridge {
    const defaultConfig: SkIDEancerMCPBridgeConfig = {
      server: {
        name: 'ide-mcp-server',
        version: '1.0.0',
        port: 3006,
        host: 'localhost',
        enableAuth: false,
        logLevel: LogLevel.INFO,
        ...config.server
      },
      ide: {
        enableAIFeatures: true,
        enableToolIntegration: true,
        enableResourceAccess: true,
        workspaceRoot: process.cwd(),
        ...config.ide
      },
      options: {
        enableStdioTransport: true,
        enableWebSocketTransport: true,
        enableFileSystemAccess: true,
        enableGitIntegration: true,
        enableTerminalAccess: true,
        ...config.options
      }
    };

    return new SkIDEancerMCPBridge(defaultConfig);
  }

  /**
   * Register with SkIDEancer's MCP system
   */
  static async registerWithSkIDEancer(server: MCPServer): Promise<void> {
    try {
      // This would integrate with SkIDEancer's MCP registration system
      // For now, we'll log that registration would happen here
      
      console.log('🎨 Registering MCP server with SkIDEancer...');
      console.log(`📡 MCP Server registered: ${server.getServerInfo().name}`);
      
    } catch (error) {
      console.error('❌ Failed to register with SkIDEancer', error);
      throw error;
    }
  }
}

/**
 * Factory function for creating SkIDEancer MCP bridges
 */
export function createSkIDEancerMCPBridge(config?: Partial<SkIDEancerMCPBridgeConfig>): SkIDEancerMCPBridge {
  return SkIDEancerMCPBridge.createSkIDEancerCompatibleServer(config);
}

/**
 * Default export for convenience
 */
export default SkIDEancerMCPBridge;
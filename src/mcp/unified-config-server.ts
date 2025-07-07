#!/usr/bin/env node

/**
 * Unified MCP Configuration Server
 * Combines Enhanced Config Manager with OAuth Integration
 * 
 * Features:
 * - Traditional MCP protocol via stdio
 * - OAuth-protected HTTP API
 * - Integration with TNF OAuth Authorization Server
 * - Modern MCP protocol 2025-06-18
 * - Configuration discovery and health monitoring
 * - Template and backup management
 */

import express from 'express';
import cors from 'cors';
import { MCPOAuthServer } from '../auth/MCPOAuthServer.js';
import { Logger } from '../common/logger.service.js';
import EnhancedMCPConfigManager from './enhanced-config-manager.js';
import OAuthConfigIntegration from './oauth-config-integration.js';

interface UnifiedServerOptions {
  http_port?: number;
  oauth_port?: number;
  enable_oauth?: boolean;
  enable_discovery?: boolean;
  enable_health_monitoring?: boolean;
  config_paths?: string[];
}

class UnifiedMCPConfigServer {
  private logger: Logger;
  private mcpServer: EnhancedMCPConfigManager;
  private oauthServer: MCPOAuthServer;
  private oauthIntegration: OAuthConfigIntegration;
  private httpApp: express.Application;
  private options: UnifiedServerOptions;

  constructor(options: UnifiedServerOptions = {}) {
    this.logger = new Logger('UnifiedMCPConfigServer');
    this.options = {
      http_port: 3773,
      oauth_port: 3001,
      enable_oauth: true,
      enable_discovery: true,
      enable_health_monitoring: true,
      config_paths: ['./mcp_config.json'],
      ...options
    };

    this.initializeComponents();
    this.setupHttpServer();
  }

  private initializeComponents() {
    // Initialize MCP Config Manager
    this.mcpServer = new EnhancedMCPConfigManager();

    // Initialize OAuth Server if enabled
    if (this.options.enable_oauth) {
      this.oauthServer = new MCPOAuthServer(this.logger);
      this.oauthIntegration = new OAuthConfigIntegration(this.oauthServer, {
        oauth_server_url: `http://localhost:${this.options.oauth_port}`,
        required_scopes: ['mcp:read'],
        admin_scopes: ['mcp:admin', 'tnf:config:admin'],
        config_management_scopes: ['mcp:write', 'tnf:config:manage']
      });
    }

    this.logger.log('Components initialized successfully');
  }

  private setupHttpServer() {
    this.httpApp = express();

    // Basic middleware
    this.httpApp.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
      credentials: true
    }));
    this.httpApp.use(express.json({ limit: '10mb' }));
    this.httpApp.use(express.urlencoded({ extended: true }));

    // Request logging
    this.httpApp.use((req, res, next) => {
      this.logger.log(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });

    // Health check endpoint
    this.httpApp.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'unified-mcp-config-server',
        version: '2.0.0',
        mcp_protocol_version: '2025-06-18',
        oauth_enabled: this.options.enable_oauth,
        discovery_enabled: this.options.enable_discovery,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // Service information endpoint
    this.httpApp.get('/info', (req, res) => {
      res.json({
        service: {
          name: 'unified-mcp-config-server',
          description: 'OAuth-enabled MCP configuration management server',
          version: '2.0.0',
          mcp_protocol_version: '2025-06-18'
        },
        capabilities: [
          'mcp-server-management',
          'oauth-authentication',
          'configuration-validation',
          'health-monitoring',
          'template-management',
          'backup-restore',
          'server-discovery'
        ],
        endpoints: {
          health: '/health',
          info: '/info',
          config_api: '/api/config',
          oauth_discovery: this.options.enable_oauth ? '/.well-known/oauth-authorization-server' : null,
          mcp_discovery: '/mcp/discovery'
        },
        oauth: {
          enabled: this.options.enable_oauth,
          authorization_server: this.options.enable_oauth ? `http://localhost:${this.options.oauth_port}` : null,
          scopes_supported: [
            'mcp:read', 'mcp:write', 'mcp:admin',
            'tnf:config:read', 'tnf:config:manage', 'tnf:config:admin'
          ]
        }
      });
    });

    // MCP Discovery endpoint
    if (this.options.enable_discovery) {
      this.httpApp.get('/mcp/discovery', async (req, res) => {
        try {
          const discovery = await this.generateDiscoveryResponse();
          res.json(discovery);
        } catch (error) {
          this.logger.error('Discovery endpoint error:', error);
          res.status(500).json({ error: 'Discovery service unavailable' });
        }
      });
    }

    // OAuth endpoints
    if (this.options.enable_oauth && this.oauthServer) {
      this.httpApp.use('/', this.oauthServer.getRouter());
      
      // OAuth-protected configuration API
      this.httpApp.use('/api/config', this.oauthIntegration.createProtectedEndpoints());
    } else {
      // Public configuration API (if OAuth is disabled)
      this.setupPublicConfigAPI();
    }

    // Error handling middleware
    this.httpApp.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('HTTP server error:', error);
      res.status(500).json({
        error: 'internal_server_error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      });
    });

    this.logger.log('HTTP server setup completed');
  }

  private setupPublicConfigAPI() {
    const router = express.Router();

    router.get('/servers', async (req, res) => {
      try {
        // Call MCP server list method
        const result = await this.callMCPMethod('list_mcp_servers', req.query);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    router.post('/servers', async (req, res) => {
      try {
        const result = await this.callMCPMethod('add_mcp_server', req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    router.delete('/servers/:name', async (req, res) => {
      try {
        const result = await this.callMCPMethod('remove_mcp_server', { 
          name: req.params.name,
          ...req.body 
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    router.post('/validate', async (req, res) => {
      try {
        const result = await this.callMCPMethod('validate_configuration', req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.httpApp.use('/api/config', router);
    this.logger.log('Public configuration API setup completed');
  }

  private async callMCPMethod(method: string, params: any): Promise<any> {
    // This would interface with the MCP server's tool calling mechanism
    // For now, return a placeholder response
    return {
      method,
      params,
      result: 'Method call would be processed by MCP server',
      timestamp: new Date().toISOString()
    };
  }

  private async generateDiscoveryResponse() {
    const baseInfo = {
      service: 'unified-mcp-config-server',
      version: '2.0.0',
      mcp_protocol_version: '2025-06-18',
      description: 'OAuth-enabled MCP configuration management server',
      
      capabilities: {
        configuration_management: {
          add_servers: true,
          remove_servers: true,
          list_servers: true,
          validate_configuration: true,
          backup_restore: true,
          template_management: true
        },
        security: {
          oauth_required: this.options.enable_oauth,
          authentication_methods: this.options.enable_oauth ? ['oauth2', 'bearer_token'] : ['none'],
          authorization_scopes: this.options.enable_oauth ? [
            'mcp:read', 'mcp:write', 'mcp:admin',
            'tnf:config:read', 'tnf:config:manage', 'tnf:config:admin'
          ] : []
        },
        monitoring: {
          health_checks: this.options.enable_health_monitoring,
          server_discovery: this.options.enable_discovery,
          configuration_validation: true
        }
      },

      endpoints: {
        mcp_stdio: {
          transport: 'stdio',
          description: 'Traditional MCP protocol via stdin/stdout',
          authentication: 'none'
        },
        http_api: {
          base_url: `http://localhost:${this.options.http_port}/api/config`,
          transport: 'http',
          description: 'RESTful configuration management API',
          authentication: this.options.enable_oauth ? 'oauth2' : 'none',
          endpoints: {
            list_servers: 'GET /servers',
            add_server: 'POST /servers',
            remove_server: 'DELETE /servers/{name}',
            validate_config: 'POST /validate',
            backup_config: 'POST /backup',
            restore_config: 'POST /restore'
          }
        }
      }
    };

    // Add OAuth-specific discovery information
    if (this.options.enable_oauth) {
      return {
        ...baseInfo,
        oauth_integration: {
          enabled: true,
          authorization_server: `http://localhost:${this.options.oauth_port}`,
          discovery_endpoints: {
            authorization_server_metadata: `http://localhost:${this.options.oauth_port}/.well-known/oauth-authorization-server`,
            protected_resource_metadata: `http://localhost:${this.options.oauth_port}/.well-known/oauth-protected-resource`
          },
          client_registration: {
            dynamic_registration_supported: true,
            registration_endpoint: `http://localhost:${this.options.oauth_port}/oauth/register`
          }
        }
      };
    }

    return baseInfo;
  }

  async start() {
    try {
      // Start MCP server on stdio
      this.logger.log('Starting MCP server on stdio...');
      this.mcpServer.start();

      // Start HTTP server
      this.httpApp.listen(this.options.http_port, () => {
        this.logger.log(`🚀 HTTP server listening on port ${this.options.http_port}`);
        this.logger.log(`📋 Health check: http://localhost:${this.options.http_port}/health`);
        this.logger.log(`ℹ️  Service info: http://localhost:${this.options.http_port}/info`);
        
        if (this.options.enable_discovery) {
          this.logger.log(`🔍 MCP discovery: http://localhost:${this.options.http_port}/mcp/discovery`);
        }
        
        if (this.options.enable_oauth) {
          this.logger.log(`🔐 OAuth protected API: http://localhost:${this.options.http_port}/api/config`);
          this.logger.log(`🔑 OAuth server: http://localhost:${this.options.oauth_port}`);
        } else {
          this.logger.log(`🔓 Public API: http://localhost:${this.options.http_port}/api/config`);
        }
      });

      // Setup graceful shutdown
      process.on('SIGINT', () => this.gracefulShutdown());
      process.on('SIGTERM', () => this.gracefulShutdown());

      this.logger.log('✅ Unified MCP Config Server started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown() {
    this.logger.log('🛑 Shutting down Unified MCP Config Server...');
    
    try {
      // Stop health monitoring
      // Stop HTTP server
      // Close any other resources
      
      this.logger.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// CLI interface
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const options: UnifiedServerOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--http-port':
        options.http_port = parseInt(args[++i]);
        break;
      case '--oauth-port':
        options.oauth_port = parseInt(args[++i]);
        break;
      case '--no-oauth':
        options.enable_oauth = false;
        break;
      case '--no-discovery':
        options.enable_discovery = false;
        break;
      case '--no-health-monitoring':
        options.enable_health_monitoring = false;
        break;
      case '--config-path':
        options.config_paths = [args[++i]];
        break;
      case '--help':
        console.log(`
Unified MCP Configuration Server

Usage: node unified-config-server.ts [options]

Options:
  --http-port <port>        HTTP server port (default: 3773)
  --oauth-port <port>       OAuth server port (default: 3001)
  --no-oauth               Disable OAuth authentication
  --no-discovery           Disable MCP discovery endpoint
  --no-health-monitoring   Disable health monitoring
  --config-path <path>     Configuration file path
  --help                   Show this help message

Examples:
  node unified-config-server.ts
  node unified-config-server.ts --http-port 8080 --no-oauth
  node unified-config-server.ts --config-path ./custom-config.json
        `);
        process.exit(0);
    }
  }

  return options;
}

// Start server if run directly
if (require.main === module) {
  const options = parseCommandLineArgs();
  const server = new UnifiedMCPConfigServer(options);
  server.start();
}

export default UnifiedMCPConfigServer;
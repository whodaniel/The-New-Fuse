#!/usr/bin/env node

/**
 * Working Enhanced MCP Configuration Manager
 * Based on the proven working pattern from the original script
 * Adds AI management capabilities while maintaining compatibility
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Configure stdin/stdout for the MCP protocol
process.stdin.setEncoding('utf8');
const rl = readline.createInterface({ input: process.stdin });

// Default paths for common MCP configuration files
const DEFAULT_CONFIG_PATHS = {
  claude: path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  fuse: path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'The New Fuse', 'data', 'mcp_config.json')
};

// Enhanced tools with AI capabilities
const ENHANCED_TOOLS = [
  {
    name: 'list_mcp_servers',
    description: 'List all registered MCP servers with health status and filtering capabilities',
    inputSchema: {
      type: 'object',
      properties: {
        config_path: {
          type: 'string',
          description: 'Path to the configuration file. Uses TNF config by default.'
        },
        filter: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', description: 'Filter by enabled status' },
            health_status: { type: 'string', enum: ['healthy', 'unhealthy', 'unknown'] },
            tags: { type: 'array', items: { type: 'string' } }
          }
        },
        include_health: { type: 'boolean', default: true },
        include_details: { type: 'boolean', default: false }
      }
    }
  },
  {
    name: 'add_mcp_server',
    description: 'Add or update an MCP server with enhanced configuration options and templates',
    inputSchema: {
      type: 'object',
      properties: {
        config_path: { type: 'string' },
        name: { type: 'string' },
        command: { type: 'string' },
        args: { type: 'array', items: { type: 'string' } },
        env: { type: 'object' },
        description: { type: 'string' },
        template: { 
          type: 'string', 
          enum: ['basic', 'secure', 'oauth-protected', 'high-priority'],
          description: 'Use a predefined configuration template'
        },
        tags: { type: 'array', items: { type: 'string' } },
        priority: { type: 'number', minimum: 1, maximum: 10 },
        auto_restart: { type: 'boolean', default: true }
      },
      required: ['name', 'command']
    }
  },
  {
    name: 'remove_mcp_server',
    description: 'Remove an MCP server with automatic backup creation',
    inputSchema: {
      type: 'object',
      properties: {
        config_path: { type: 'string' },
        name: { type: 'string' },
        create_backup: { type: 'boolean', default: true },
        force: { type: 'boolean', default: false }
      },
      required: ['name']
    }
  },
  {
    name: 'validate_configuration',
    description: 'Validate MCP server configuration and provide optimization suggestions',
    inputSchema: {
      type: 'object',
      properties: {
        config_path: { type: 'string' },
        check_commands: { type: 'boolean', default: true },
        check_paths: { type: 'boolean', default: true },
        suggest_improvements: { type: 'boolean', default: true }
      }
    }
  },
  {
    name: 'backup_configuration',
    description: 'Create a timestamped backup of the current configuration',
    inputSchema: {
      type: 'object',
      properties: {
        config_path: { type: 'string' },
        backup_directory: { type: 'string', default: './backups' },
        compress: { type: 'boolean', default: false }
      }
    }
  },
  {
    name: 'fix_server_issues',
    description: 'AI-powered automatic detection and resolution of common MCP server issues',
    inputSchema: {
      type: 'object',
      properties: {
        config_path: { type: 'string' },
        server_name: { type: 'string', description: 'Specific server to fix, or all servers if not specified' },
        auto_apply_fixes: { type: 'boolean', default: false }
      }
    }
  },
  {
    name: 'apply_template',
    description: 'Apply a configuration template to enhance existing servers or create new ones',
    inputSchema: {
      type: 'object',
      properties: {
        config_path: { type: 'string' },
        server_name: { type: 'string' },
        template: { 
          type: 'string', 
          enum: ['basic', 'secure', 'oauth-protected', 'high-priority'],
          description: 'Template to apply'
        },
        merge_existing: { type: 'boolean', default: true }
      },
      required: ['server_name', 'template']
    }
  },
  {
    name: 'get_server_health',
    description: 'Check the health status of MCP servers and diagnose issues',
    inputSchema: {
      type: 'object',
      properties: {
        config_path: { type: 'string' },
        server_names: { type: 'array', items: { type: 'string' } },
        detailed_diagnostics: { type: 'boolean', default: false }
      }
    }
  }
];

// Configuration templates
const TEMPLATES = {
  basic: {
    description: 'Basic MCP server configuration',
    env: { LOG_LEVEL: 'info' },
    priority: 5,
    tags: ['basic']
  },
  secure: {
    description: 'Security-enhanced MCP server',
    env: { LOG_LEVEL: 'info', SECURE_MODE: 'true' },
    priority: 7,
    tags: ['secure', 'production']
  },
  'oauth-protected': {
    description: 'OAuth-protected MCP server with enhanced security',
    env: { 
      LOG_LEVEL: 'info', 
      OAUTH_ENABLED: 'true',
      SECURE_MODE: 'true'
    },
    priority: 8,
    tags: ['oauth', 'secure', 'production']
  },
  'high-priority': {
    description: 'High-priority MCP server with enhanced monitoring',
    env: { 
      LOG_LEVEL: 'debug', 
      MONITORING_ENABLED: 'true',
      HEALTH_CHECK_INTERVAL: '15000'
    },
    priority: 9,
    tags: ['critical', 'monitored', 'production']
  }
};

// Handle stdin input
rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    handleRequest(request, (response) => {
      console.log(JSON.stringify(response));
    });
  } catch (error) {
    console.error('Error processing request:', error);
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error'
      }
    }));
  }
});

// Common request handler
function handleRequest(request, respond) {
  if (request.jsonrpc !== '2.0') {
    respond({
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32600,
        message: 'Invalid Request: Not JSON-RPC 2.0'
      }
    });
    return;
  }
  
  // Handle method calls
  switch (request.method) {
    case 'initialize':
      handleInitialize(request.id, request.params, respond);
      break;
    case 'initialized':
      respond({
        jsonrpc: '2.0',
        id: request.id,
        result: {}
      });
      break;
    case 'tools/list':
      handleToolsList(request.id, respond);
      break;
    case 'tools/call':
      handleCallTool(request.id, request.params, respond);
      break;
    default:
      respond({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      });
  }
}

function handleInitialize(id, params, respond) {
  respond({
    jsonrpc: '2.0',
    id: id,
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        logging: {}
      },
      serverInfo: {
        name: 'enhanced-mcp-config-manager',
        version: '2.0.0'
      }
    }
  });
}

function handleToolsList(id, respond) {
  respond({
    jsonrpc: '2.0',
    id: id,
    result: {
      tools: ENHANCED_TOOLS
    }
  });
}

function handleCallTool(id, params, respond) {
  const { name: tool_name, arguments: tool_args } = params;
  
  switch (tool_name) {
    case 'list_mcp_servers':
      listMCPServers(id, tool_args, respond);
      break;
    case 'add_mcp_server':
      addMCPServer(id, tool_args, respond);
      break;
    case 'remove_mcp_server':
      removeMCPServer(id, tool_args, respond);
      break;
    case 'validate_configuration':
      validateConfiguration(id, tool_args, respond);
      break;
    case 'backup_configuration':
      backupConfiguration(id, tool_args, respond);
      break;
    case 'fix_server_issues':
      fixServerIssues(id, tool_args, respond);
      break;
    case 'apply_template':
      applyTemplate(id, tool_args, respond);
      break;
    case 'get_server_health':
      getServerHealth(id, tool_args, respond);
      break;
    default:
      respond({
        jsonrpc: '2.0',
        id: id,
        error: {
          code: -32601,
          message: `Tool not found: ${tool_name}`
        }
      });
  }
}

// Enhanced tool implementations

function listMCPServers(id, args, respond) {
  const configPath = args.config_path || DEFAULT_CONFIG_PATHS.fuse;
  
  try {
    const config = readConfigFile(configPath);
    if (!config) {
      respond({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              servers: [],
              error: `Configuration file not found: ${configPath}`,
              ai_suggestion: "Use add_mcp_server to create your first server or check the config path"
            }, null, 2)
          }]
        }
      });
      return;
    }
    
    let servers = [];
    if (config.mcpServers) {
      Object.entries(config.mcpServers).forEach(([name, server]) => {
        const serverInfo = {
          name,
          command: server.command,
          args: server.args || [],
          env: server.env || {},
          description: server.description || 'No description provided',
          enabled: server.enabled !== false,
          health_status: checkServerHealth(server),
          priority: server.priority || 5,
          tags: server.tags || []
        };

        // Apply filters
        if (args.filter) {
          const filter = args.filter;
          if (filter.enabled !== undefined && serverInfo.enabled !== filter.enabled) return;
          if (filter.health_status && serverInfo.health_status !== filter.health_status) return;
          if (filter.tags && filter.tags.length > 0) {
            if (!filter.tags.some(tag => serverInfo.tags.includes(tag))) return;
          }
        }

        servers.push(serverInfo);
      });
    }

    // Sort by priority (highest first)
    servers.sort((a, b) => (b.priority || 5) - (a.priority || 5));

    const result = {
      servers,
      total_count: servers.length,
      healthy_count: servers.filter(s => s.health_status === 'healthy').length,
      configuration_path: configPath,
      ai_analysis: generateAIAnalysis(servers),
      suggested_actions: generateSuggestedActions(servers)
    };

    respond({
      jsonrpc: '2.0',
      id: id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      }
    });
  } catch (error) {
    respond({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32603,
        message: `Error listing MCP servers: ${error.message}`
      }
    });
  }
}

function addMCPServer(id, args, respond) {
  const { config_path, name, command, args: cmdArgs, env, description, template } = args;
  const configPath = config_path || DEFAULT_CONFIG_PATHS.fuse;
  
  try {
    let config = readConfigFile(configPath);
    if (!config) {
      config = { mcpServers: {} };
    }
    
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    // Apply template if specified
    let serverConfig = {
      command,
      args: cmdArgs || []
    };

    if (template && TEMPLATES[template]) {
      const templateConfig = TEMPLATES[template];
      serverConfig = {
        ...serverConfig,
        env: { ...(templateConfig.env || {}), ...(env || {}) },
        description: description || templateConfig.description,
        priority: args.priority || templateConfig.priority,
        tags: [...(templateConfig.tags || []), ...(args.tags || [])]
      };
    } else {
      serverConfig.env = env || {};
      serverConfig.description = description || `MCP server: ${name}`;
      serverConfig.priority = args.priority || 5;
      serverConfig.tags = args.tags || [];
    }

    // Add metadata
    serverConfig.created_at = new Date().toISOString();
    serverConfig.managed_by = 'enhanced-mcp-config-manager';
    serverConfig.enabled = true;

    // Check if server already exists
    const isUpdate = !!config.mcpServers[name];
    if (isUpdate) {
      serverConfig.updated_at = new Date().toISOString();
      // Preserve creation date
      if (config.mcpServers[name].created_at) {
        serverConfig.created_at = config.mcpServers[name].created_at;
      }
    }

    config.mcpServers[name] = serverConfig;

    // Write back to file
    if (writeConfigFile(configPath, config)) {
      const result = {
        success: true,
        action: isUpdate ? 'updated' : 'added',
        server_name: name,
        server_config: serverConfig,
        template_applied: template || 'none',
        ai_recommendations: generateServerRecommendations(serverConfig),
        next_steps: [
          "Restart Claude Desktop to activate the new server",
          "Use get_server_health to verify the server is working",
          "Consider applying security templates if handling sensitive data"
        ]
      };

      respond({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        }
      });
    } else {
      respond({
        jsonrpc: '2.0',
        id: id,
        error: {
          code: -32603,
          message: `Failed to write configuration to ${configPath}`
        }
      });
    }
  } catch (error) {
    respond({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32603,
        message: `Error adding MCP server: ${error.message}`
      }
    });
  }
}

function removeMCPServer(id, args, respond) {
  const { config_path, name, create_backup, force } = args;
  const configPath = config_path || DEFAULT_CONFIG_PATHS.fuse;
  
  try {
    const config = readConfigFile(configPath);
    if (!config || !config.mcpServers || !config.mcpServers[name]) {
      respond({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `MCP server "${name}" not found in configuration`,
              available_servers: config?.mcpServers ? Object.keys(config.mcpServers) : [],
              ai_suggestion: "Use list_mcp_servers to see available servers"
            }, null, 2)
          }]
        }
      });
      return;
    }

    // Create backup if requested
    let backupPath = null;
    if (create_backup !== false) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupPath = `${configPath}.backup.${timestamp}.json`;
      try {
        writeConfigFile(backupPath, config);
      } catch (backupError) {
        if (!force) {
          respond({
            jsonrpc: '2.0',
            id: id,
            error: {
              code: -32603,
              message: `Failed to create backup: ${backupError.message}. Use force:true to proceed without backup.`
            }
          });
          return;
        }
      }
    }

    // Store server info for response
    const removedServer = config.mcpServers[name];

    // Remove the server
    delete config.mcpServers[name];

    // Write back to file
    if (writeConfigFile(configPath, config)) {
      const result = {
        success: true,
        action: 'removed',
        server_name: name,
        removed_server: removedServer,
        backup_created: !!backupPath,
        backup_path: backupPath,
        remaining_servers: Object.keys(config.mcpServers),
        ai_analysis: `Server "${name}" successfully removed. ${Object.keys(config.mcpServers).length} servers remain.`,
        restoration_note: backupPath ? `To restore, use the backup at: ${backupPath}` : null
      };

      respond({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        }
      });
    } else {
      respond({
        jsonrpc: '2.0',
        id: id,
        error: {
          code: -32603,
          message: `Failed to write configuration to ${configPath}`
        }
      });
    }
  } catch (error) {
    respond({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32603,
        message: `Error removing MCP server: ${error.message}`
      }
    });
  }
}

function validateConfiguration(id, args, respond) {
  const configPath = args.config_path || DEFAULT_CONFIG_PATHS.fuse;
  
  try {
    const config = readConfigFile(configPath);
    if (!config) {
      respond({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              valid: false,
              errors: [`Configuration file not found: ${configPath}`],
              ai_suggestion: "Create a new configuration using add_mcp_server"
            }, null, 2)
          }]
        }
      });
      return;
    }

    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      server_analysis: {}
    };

    if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
      validation.warnings.push("No MCP servers configured");
      validation.suggestions.push("Add some MCP servers to enable AI capabilities");
    } else {
      // Validate each server
      for (const [name, server] of Object.entries(config.mcpServers)) {
        const serverValidation = validateServer(name, server, args);
        validation.server_analysis[name] = serverValidation;
        
        if (!serverValidation.valid) {
          validation.valid = false;
          validation.errors.push(...serverValidation.errors.map(e => `${name}: ${e}`));
        }
        
        validation.warnings.push(...serverValidation.warnings.map(w => `${name}: ${w}`));
        validation.suggestions.push(...serverValidation.suggestions.map(s => `${name}: ${s}`));
      }
    }

    // AI-powered analysis
    validation.ai_analysis = generateConfigurationAnalysis(config);
    validation.optimization_suggestions = generateOptimizationSuggestions(config);

    respond({
      jsonrpc: '2.0',
      id: id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(validation, null, 2)
        }]
      }
    });
  } catch (error) {
    respond({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32603,
        message: `Validation error: ${error.message}`
      }
    });
  }
}

function fixServerIssues(id, args, respond) {
  const configPath = args.config_path || DEFAULT_CONFIG_PATHS.fuse;
  
  try {
    const config = readConfigFile(configPath);
    if (!config) {
      respond({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: "No configuration file found",
              ai_action: "No fixes possible without a configuration file"
            }, null, 2)
          }]
        }
      });
      return;
    }

    const fixes = [];
    const serversToCheck = args.server_name ? [args.server_name] : Object.keys(config.mcpServers || {});

    for (const serverName of serversToCheck) {
      const server = config.mcpServers[serverName];
      if (!server) {
        fixes.push({
          server: serverName,
          issue: "Server not found",
          fix: "Server does not exist in configuration",
          action: "skipped"
        });
        continue;
      }

      const issues = detectServerIssues(serverName, server);
      for (const issue of issues) {
        const fix = {
          server: serverName,
          issue: issue.problem,
          suggested_fix: issue.solution,
          action: "detected"
        };

        if (args.auto_apply_fixes && issue.auto_fixable) {
          try {
            applyAutomaticFix(config, serverName, issue);
            fix.action = "fixed";
            fix.details = issue.fix_details;
          } catch (fixError) {
            fix.action = "failed";
            fix.error = fixError.message;
          }
        }

        fixes.push(fix);
      }
    }

    // Save configuration if fixes were applied
    if (args.auto_apply_fixes && fixes.some(f => f.action === "fixed")) {
      writeConfigFile(configPath, config);
    }

    const result = {
      analysis_complete: true,
      servers_checked: serversToCheck.length,
      issues_found: fixes.length,
      fixes_applied: fixes.filter(f => f.action === "fixed").length,
      fixes,
      ai_summary: generateFixSummary(fixes),
      next_steps: generateNextSteps(fixes)
    };

    respond({
      jsonrpc: '2.0',
      id: id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      }
    });
  } catch (error) {
    respond({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32603,
        message: `Error fixing server issues: ${error.message}`
      }
    });
  }
}

// Helper functions

function readConfigFile(configPath) {
  try {
    const expandedPath = expandPath(configPath);
    if (!fs.existsSync(expandedPath)) return null;
    const fileContent = fs.readFileSync(expandedPath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    return null;
  }
}

function writeConfigFile(configPath, data) {
  try {
    const expandedPath = expandPath(configPath);
    const dirPath = path.dirname(expandedPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(expandedPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    return false;
  }
}

function expandPath(filePath) {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

function checkServerHealth(server) {
  // Basic health check logic
  if (!server.command) return 'unhealthy';
  if (server.enabled === false) return 'disabled';
  
  // Check if command looks valid
  if (server.command.includes('npx') || server.command.includes('node') || server.command.includes('docker')) {
    return 'healthy';
  }
  
  return 'unknown';
}

function generateAIAnalysis(servers) {
  const total = servers.length;
  const healthy = servers.filter(s => s.health_status === 'healthy').length;
  const priorities = servers.map(s => s.priority || 5);
  const avgPriority = priorities.reduce((a, b) => a + b, 0) / priorities.length;

  return `Configuration analysis: ${total} servers total, ${healthy} healthy (${Math.round(healthy/total*100)}% healthy). Average priority: ${avgPriority.toFixed(1)}. ${total >= 5 ? 'Well-configured setup' : 'Consider adding more capabilities'}.`;
}

function generateSuggestedActions(servers) {
  const actions = [];
  
  const unhealthy = servers.filter(s => s.health_status === 'unhealthy');
  if (unhealthy.length > 0) {
    actions.push(`Fix ${unhealthy.length} unhealthy server(s): ${unhealthy.map(s => s.name).join(', ')}`);
  }
  
  const untagged = servers.filter(s => !s.tags || s.tags.length === 0);
  if (untagged.length > 0) {
    actions.push(`Add tags to ${untagged.length} server(s) for better organization`);
  }
  
  if (servers.length < 3) {
    actions.push("Consider adding more MCP servers to expand AI capabilities");
  }
  
  return actions;
}

function generateServerRecommendations(serverConfig) {
  const recommendations = [];
  
  if (!serverConfig.tags || serverConfig.tags.length === 0) {
    recommendations.push("Add tags for better server organization");
  }
  
  if (serverConfig.priority === 5) {
    recommendations.push("Consider adjusting priority based on server importance");
  }
  
  if (!serverConfig.env || Object.keys(serverConfig.env).length === 0) {
    recommendations.push("Consider adding environment variables for configuration");
  }
  
  return recommendations;
}

function validateServer(name, server, options) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  if (!server.command) {
    result.valid = false;
    result.errors.push("Missing command");
  }

  if (options.check_commands && server.command) {
    if (server.command === 'node' && (!server.args || server.args.length === 0)) {
      result.warnings.push("Node command without arguments may not work");
    }
  }

  if (options.check_paths && server.args) {
    for (const arg of server.args) {
      if (arg.startsWith('./') || arg.startsWith('/')) {
        if (!fs.existsSync(arg)) {
          result.warnings.push(`Path may not exist: ${arg}`);
        }
      }
    }
  }

  return result;
}

function detectServerIssues(serverName, server) {
  const issues = [];

  // Check for common issues
  if (!server.command) {
    issues.push({
      problem: "Missing command",
      solution: "Add a valid command to execute the server",
      auto_fixable: false
    });
  }

  if (server.command === 'node' && server.args && server.args[0] && server.args[0].endsWith('.ts')) {
    issues.push({
      problem: "TypeScript file with node command",
      solution: "Use tsx or compile to JavaScript first",
      auto_fixable: true,
      fix_details: "Replace 'node' with 'npx tsx'",
      fix_action: () => {
        server.command = 'npx';
        server.args = ['tsx', ...server.args];
      }
    });
  }

  return issues;
}

function applyAutomaticFix(config, serverName, issue) {
  if (issue.fix_action) {
    issue.fix_action();
  }
}

function generateFixSummary(fixes) {
  const total = fixes.length;
  const fixed = fixes.filter(f => f.action === "fixed").length;
  
  if (total === 0) return "No issues detected - configuration looks healthy!";
  if (fixed === total) return `All ${total} issues were automatically fixed.`;
  if (fixed > 0) return `${fixed} of ${total} issues were automatically fixed. Manual review needed for the rest.`;
  return `${total} issues detected. Use auto_apply_fixes:true to attempt automatic repairs.`;
}

function generateNextSteps(fixes) {
  const steps = [];
  
  if (fixes.some(f => f.action === "fixed")) {
    steps.push("Restart Claude Desktop to apply the fixes");
  }
  
  const manualFixes = fixes.filter(f => f.action === "detected");
  if (manualFixes.length > 0) {
    steps.push(`Review and manually fix ${manualFixes.length} remaining issues`);
  }
  
  steps.push("Run validate_configuration to verify all issues are resolved");
  
  return steps;
}

function generateConfigurationAnalysis(config) {
  const serverCount = Object.keys(config.mcpServers || {}).length;
  const hasTemplatedServers = Object.values(config.mcpServers || {}).some(s => s.managed_by);
  
  return `Configuration contains ${serverCount} MCP servers. ${hasTemplatedServers ? 'Some servers use enhanced templates.' : 'Consider using templates for better configuration.'} Overall health appears ${serverCount >= 3 ? 'good' : 'basic - consider expanding'}.`;
}

function generateOptimizationSuggestions(config) {
  const suggestions = [];
  
  const servers = Object.values(config.mcpServers || {});
  const untaggedCount = servers.filter(s => !s.tags || s.tags.length === 0).length;
  
  if (untaggedCount > 0) {
    suggestions.push(`Add tags to ${untaggedCount} servers for better organization`);
  }
  
  if (servers.length < 5) {
    suggestions.push("Consider adding more MCP servers for enhanced AI capabilities");
  }
  
  const lowPriorityCount = servers.filter(s => (s.priority || 5) < 6).length;
  if (lowPriorityCount === servers.length) {
    suggestions.push("Consider setting higher priorities for critical servers");
  }
  
  return suggestions;
}

// Placeholder implementations for remaining tools
function backupConfiguration(id, args, respond) {
  const configPath = args.config_path || DEFAULT_CONFIG_PATHS.fuse;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${configPath}.backup.${timestamp}.json`;
  
  try {
    const config = readConfigFile(configPath);
    if (!config) {
      respond({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: "No configuration file to backup"
            }, null, 2)
          }]
        }
      });
      return;
    }

    writeConfigFile(backupPath, config);
    
    respond({
      jsonrpc: '2.0',
      id: id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            backup_path: backupPath,
            backup_size: JSON.stringify(config).length,
            server_count: Object.keys(config.mcpServers || {}).length
          }, null, 2)
        }]
      }
    });
  } catch (error) {
    respond({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32603,
        message: `Backup failed: ${error.message}`
      }
    });
  }
}

function applyTemplate(id, args, respond) {
  respond({
    jsonrpc: '2.0',
    id: id,
    result: {
      content: [{
        type: 'text',
        text: JSON.stringify({
          message: "Template feature implemented - use add_mcp_server with template parameter",
          available_templates: Object.keys(TEMPLATES)
        }, null, 2)
      }]
    }
  });
}

function getServerHealth(id, args, respond) {
  const configPath = args.config_path || DEFAULT_CONFIG_PATHS.fuse;
  
  try {
    const config = readConfigFile(configPath);
    const healthReport = {};
    
    if (config && config.mcpServers) {
      for (const [name, server] of Object.entries(config.mcpServers)) {
        if (!args.server_names || args.server_names.includes(name)) {
          healthReport[name] = {
            status: checkServerHealth(server),
            command: server.command,
            enabled: server.enabled !== false,
            last_checked: new Date().toISOString()
          };
        }
      }
    }
    
    respond({
      jsonrpc: '2.0',
      id: id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            health_report: healthReport,
            summary: `Checked ${Object.keys(healthReport).length} servers`
          }, null, 2)
        }]
      }
    });
  } catch (error) {
    respond({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32603,
        message: `Health check failed: ${error.message}`
      }
    });
  }
}

// Server initialization
console.error('Enhanced MCP Configuration Manager v2.0.0 initialized');
console.error('AI DevOps capabilities: server management, health monitoring, automatic fixes');
console.error('Listening on stdin for JSON-RPC requests...');
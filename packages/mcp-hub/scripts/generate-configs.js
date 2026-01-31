#!/usr/bin/env node
/**
 * Unified MCP Configuration Generator
 *
 * Generates client-specific MCP configurations from the master registry.
 * Supports: Claude Desktop, Claude Code, Gemini CLI, GitHub Copilot, Cursor, etc.
 *
 * Usage:
 *   node generate-configs.js [profile] [clients...]
 *   node generate-configs.js minimal claude-desktop gemini-cli
 *   node generate-configs.js full --all
 *   node generate-configs.js --list-profiles
 *   node generate-configs.js --list-clients
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Load master registry
const REGISTRY_PATH = path.join(__dirname, '../config/master-registry.json');
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

// Compute dynamic variables
const HOME = os.homedir();
// Script is in packages/mcp-hub/scripts/
// Root is packages/mcp-hub/../../.. -> The-New-Fuse/
const TNF_PATH = path.resolve(__dirname, '../../..');
// Packages directory where servers are located
const MCP_SERVERS_PATH = path.join(TNF_PATH, 'packages');
const NODE_BIN = path.dirname(process.execPath);
// Attempt to find node_modules global lib
const NODE_MODULES = path.resolve(NODE_BIN, '../lib/node_modules');

const DYNAMIC_VARS = {
  HOME: HOME,
  TNF_PATH: TNF_PATH,
  MCP_SERVERS_PATH: MCP_SERVERS_PATH,
  NODE_BIN: NODE_BIN,
  NODE_MODULES: NODE_MODULES,
};

// Expand variables in a string
function expandVariables(str, vars = registry.variables) {
  if (typeof str !== 'string') return str;

  // Merge dynamic vars with registry vars (dynamic wins)
  const allVars = { ...vars, ...DYNAMIC_VARS };

  let result = str;
  for (const [key, value] of Object.entries(allVars)) {
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
  }
  // Also expand environment variables
  result = result.replace(/\$\{(\w+)\}/g, (match, name) => {
    return process.env[name] || match;
  });
  return result;
}

// Expand variables in an object recursively
function expandObject(obj, vars = registry.variables) {
  if (typeof obj === 'string') return expandVariables(obj, vars);
  if (Array.isArray(obj)) return obj.map((item) => expandObject(item, vars));
  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = expandObject(value, vars);
    }
    return result;
  }
  return obj;
}

// Get servers for a profile
function getProfileServers(profileName) {
  const profile = registry.profiles[profileName];
  if (!profile) {
    console.error(`Unknown profile: ${profileName}`);
    process.exit(1);
  }

  if (profile.servers.includes('*')) {
    return Object.keys(registry.servers);
  }

  return profile.servers;
}

// Generate Claude Desktop format config
function generateClaudeDesktopFormat(serverNames, options = {}) {
  const config = { mcpServers: {} };

  for (const name of serverNames) {
    const server = registry.servers[name];
    if (!server) continue;

    // Skip if requires env vars that aren't set
    if (server.requiresEnv) {
      const missing = server.requiresEnv.filter((v) => !process.env[v] && !registry.variables[v]);
      if (missing.length > 0 && !options.includeIncomplete) {
        console.warn(`Skipping ${name}: missing env vars: ${missing.join(', ')}`);
        continue;
      }
    }

    const serverConfig = {
      command: expandVariables(server.command),
      args: server.args.map((arg) => expandVariables(arg)),
    };

    if (server.env && Object.keys(server.env).length > 0) {
      serverConfig.env = expandObject(server.env);
    }

    // Add metadata if supported
    if (options.includeMetadata) {
      serverConfig.description = server.description;
      serverConfig.tags = server.tags;
    }

    config.mcpServers[name] = serverConfig;
  }

  return config;
}

// Generate Gemini CLI format config
function generateGeminiFormat(serverNames, existingConfig = {}) {
  const config = { ...existingConfig };
  config.mcpServers = config.mcpServers || {};

  for (const name of serverNames) {
    const server = registry.servers[name];
    if (!server) continue;

    const serverConfig = {
      command: expandVariables(server.command),
      args: server.args.map((arg) => expandVariables(arg)),
    };

    if (server.env && Object.keys(server.env).length > 0) {
      serverConfig.env = expandObject(server.env);
    }

    config.mcpServers[name] = serverConfig;
  }

  return config;
}

// Generate KiloCode/Cline format config
function generateKiloCodeFormat(serverNames) {
  const servers = {};

  for (const name of serverNames) {
    const server = registry.servers[name];
    if (!server) continue;

    servers[name] = {
      command: expandVariables(server.command),
      args: server.args.map((arg) => expandVariables(arg)),
      env: server.env ? expandObject(server.env) : {},
      disabled: false,
    };
  }

  return { mcpServers: servers };
}

// Write config to file
function writeConfig(clientName, config) {
  const client = registry.clients[clientName];
  if (!client) {
    console.error(`Unknown client: ${clientName}`);
    return false;
  }

  const configPath = expandVariables(client.configPath);
  const dir = path.dirname(configPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Backup existing config
  if (fs.existsSync(configPath)) {
    const backupPath = `${configPath}.backup.${Date.now()}`;
    fs.copyFileSync(configPath, backupPath);
    console.log(`  Backed up existing config to ${path.basename(backupPath)}`);
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`  Written to ${configPath}`);
  return true;
}

// Main function
function main() {
  const args = process.argv.slice(2);

  // Handle special commands
  if (args.includes('--list-profiles')) {
    console.log('Available profiles:');
    for (const [name, profile] of Object.entries(registry.profiles)) {
      console.log(
        `  ${name}: ${profile.description} (${profile.servers.length === 1 && profile.servers[0] === '*' ? 'all' : profile.servers.length} servers)`
      );
    }
    process.exit(0);
  }

  if (args.includes('--list-clients')) {
    console.log('Available clients:');
    for (const [name, client] of Object.entries(registry.clients)) {
      console.log(`  ${name}: ${expandVariables(client.configPath)}`);
    }
    process.exit(0);
  }

  if (args.includes('--list-servers')) {
    console.log('Available servers:');
    for (const [name, server] of Object.entries(registry.servers)) {
      const defer = server.deferLoading ? ' [deferred]' : '';
      const always = server.alwaysLoad ? ' [always]' : '';
      console.log(`  ${name}: ${server.description}${defer}${always}`);
    }
    process.exit(0);
  }

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Unified MCP Configuration Generator

Usage:
  node generate-configs.js <profile> [clients...]
  node generate-configs.js <profile> --all
  node generate-configs.js --list-profiles
  node generate-configs.js --list-clients
  node generate-configs.js --list-servers

Examples:
  node generate-configs.js minimal claude-desktop
  node generate-configs.js core claude-desktop gemini-cli
  node generate-configs.js full --all
  node generate-configs.js development claude-code
`);
    process.exit(0);
  }

  // Parse arguments
  const profileName = args[0];
  const allClients = args.includes('--all');
  const clientNames = allClients
    ? Object.keys(registry.clients)
    : args.slice(1).filter((a) => !a.startsWith('--'));

  if (clientNames.length === 0) {
    console.error('No clients specified. Use --all or specify client names.');
    process.exit(1);
  }

  // Get servers for profile
  const serverNames = getProfileServers(profileName);
  console.log(`\nGenerating configs for profile: ${profileName}`);
  console.log(`Servers: ${serverNames.join(', ')}\n`);

  // Generate and write configs for each client
  for (const clientName of clientNames) {
    const client = registry.clients[clientName];
    if (!client) {
      console.warn(`Unknown client: ${clientName}, skipping`);
      continue;
    }

    console.log(`Generating config for ${clientName}...`);

    let config;
    switch (client.format) {
      case 'claude-desktop':
        config = generateClaudeDesktopFormat(serverNames);
        break;
      case 'claude-code':
        config = generateClaudeDesktopFormat(serverNames, { includeMetadata: true });
        break;
      case 'gemini':
        // Read existing config to preserve other settings
        const configPath = expandVariables(client.configPath);
        let existingConfig = {};
        if (fs.existsSync(configPath)) {
          try {
            existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          } catch (e) {
            console.warn(`  Could not parse existing config, creating new one`);
          }
        }
        config = generateGeminiFormat(serverNames, existingConfig);
        break;
      case 'kilocode':
        config = generateKiloCodeFormat(serverNames);
        break;
      default:
        config = generateClaudeDesktopFormat(serverNames);
    }

    writeConfig(clientName, config);
  }

  console.log('\nDone! Restart your AI applications to apply changes.');
}

main();

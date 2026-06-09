#!/usr/bin/env node

/**
 * MCP Health Check Script
 * 
 * This script tests all configured MCP servers to verify their health status.
 * It provides diagnostic information and suggestions for fixing common issues.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Configuration
const CONFIG_CANDIDATES = [
  path.resolve(__dirname, '../tools/config-files/mcp_config.json'),
  path.resolve(__dirname, '../data/mcp_config.json'),
  path.resolve(__dirname, '../src/vscode-extension/mcp_config.json'),
];

let CONFIG_PATH = CONFIG_CANDIDATES[0];
for (const candidate of CONFIG_CANDIDATES) {
  if (fs.existsSync(candidate)) {
    CONFIG_PATH = candidate;
    break;
  }
}

const TIMEOUT_MS = 3000;
const MAX_CONCURRENT_CHECKS = 5;
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

/**
 * ANSI color codes for terminal output
 */
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

/**
 * Main function that tests MCP servers
 */
async function testMCPServers() {
  console.log(`${Colors.bright}${Colors.cyan}===========================================${Colors.reset}`);
  console.log(`${Colors.bright}${Colors.cyan}       MCP Health Check Utility      ${Colors.reset}`);
  console.log(`${Colors.bright}${Colors.cyan}===========================================${Colors.reset}\n`);
  
  try {
    // Read configuration
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    // Extract server configurations
    const serverConfigs = config.servers || {};
    const serverExecutions = config.mcpServers || {};
    
    console.log(`${Colors.bright}Found ${Object.keys(serverConfigs).length} server configurations and ${Object.keys(serverExecutions).length} executable definitions.${Colors.reset}\n`);
    
    // Test each server with a health check
    console.log(`${Colors.cyan}Running health checks...${Colors.reset}\n`);
    
    const serverResults = await testServers(serverConfigs);
    
    // Display results summary
    console.log(`\n${Colors.bright}${Colors.cyan}===================================${Colors.reset}`);
    console.log(`${Colors.bright}${Colors.cyan}       Health Check Results      ${Colors.reset}`);
    console.log(`${Colors.bright}${Colors.cyan}===================================${Colors.reset}\n`);
    
    let healthyCount = 0;
    let unhealthyCount = 0;
    let warningCount = 0;
    
    for (const [name, result] of Object.entries(serverResults)) {
      if (result.status === 'healthy') {
        console.log(`${Colors.green}✅ ${name}: HEALTHY${Colors.reset}`);
        healthyCount++;
      } else if (result.status === 'warning') {
        console.log(`${Colors.yellow}⚠️  ${name}: WARNING - ${result.message}${Colors.reset}`);
        warningCount++;
      } else {
        console.log(`${Colors.red}❌ ${name}: UNHEALTHY - ${result.message}${Colors.reset}`);
        unhealthyCount++;
      }
    }
    
    console.log(`\n${Colors.bright}Summary:${Colors.reset}`);
    console.log(`${Colors.green}Healthy Servers: ${healthyCount}${Colors.reset}`);
    console.log(`${Colors.yellow}Warnings: ${warningCount}${Colors.reset}`);
    console.log(`${Colors.red}Unhealthy Servers: ${unhealthyCount}${Colors.reset}`);
    
    // Check for port conflicts
    const portConflicts = findPortConflicts(serverConfigs);
    if (portConflicts.length > 0) {
      console.log(`\n${Colors.bright}${Colors.red}Port Conflicts Detected:${Colors.reset}`);
      for (const conflict of portConflicts) {
        console.log(`${Colors.red}⚠️  Port ${conflict.port} is used by multiple servers: ${conflict.servers.join(', ')}${Colors.reset}`);
      }
    }
    
    // Check for command availability in system
    console.log(`\n${Colors.bright}${Colors.cyan}Command Availability:${Colors.reset}`);
    await checkCommandAvailability(serverExecutions);
    
    // Show recommendations for fixing issues
    if (unhealthyCount > 0 || warningCount > 0) {
      console.log(`\n${Colors.bright}${Colors.yellow}Recommendations:${Colors.reset}`);
      generateRecommendations(serverResults, portConflicts, serverConfigs, serverExecutions);
    }
    
    return {
      healthyCount,
      warningCount,
      unhealthyCount,
      results: serverResults
    };
  } catch (error) {
    console.error(`${Colors.red}Error testing MCP servers:${Colors.reset}`, error);
    return {
      healthyCount: 0,
      warningCount: 0,
      unhealthyCount: 0,
      error: error.message
    };
  }
}

/**
 * Test each server for health
 */
async function testServers(serverConfigs) {
  const results = {};
  const testPromises = [];
  
  // Queue to manage concurrent checks
  const queue = [...Object.entries(serverConfigs)];
  const inProgress = new Set();
  
  // Process queue with concurrency limit
  while (queue.length > 0 || inProgress.size > 0) {
    // Fill up to max concurrent
    while (queue.length > 0 && inProgress.size < MAX_CONCURRENT_CHECKS) {
      const [name, config] = queue.shift();
      inProgress.add(name);
      
      const testPromise = testServerHealth(name, config)
        .then(result => {
          results[name] = result;
          inProgress.delete(name);
          console.log(`${getStatusIcon(result.status)} Tested ${name}: ${getStatusText(result.status)}`);
          return result;
        })
        .catch(error => {
          results[name] = { status: 'unhealthy', message: error.message };
          inProgress.delete(name);
          console.log(`${getStatusIcon('unhealthy')} Tested ${name}: ${getStatusText('unhealthy')} (${error.message})`);
          return { status: 'unhealthy', message: error.message };
        });
      
      testPromises.push(testPromise);
    }
    
    // Wait a bit if we're at max capacity
    if (inProgress.size >= MAX_CONCURRENT_CHECKS || (queue.length === 0 && inProgress.size > 0)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  await Promise.all(testPromises);
  return results;
}

/**
 * Test an individual server's health
 */
async function testServerHealth(name, config) {
  if (!config.enabled) {
    return { status: 'warning', message: 'Server is disabled in configuration' };
  }

  // Skip servers without host/port (on-demand npx servers or cloud services)
  if (!config.host || !config.port) {
    // Check server type - database/cache are cloud-first
    if (config.type === 'database' || config.type === 'cache') {
      return { status: 'healthy', message: 'Cloud-first service (config-based)' };
    }
    // Check if this is an npx-based server (command-based, not network)
    if (config.command && config.command.includes('npx')) {
      return { status: 'healthy', message: 'On-demand npx server (not running)' };
    }
    return { status: 'warning', message: 'Missing host or port in configuration' };
  }
  
  try {
    // Try to connect to the server
    await checkServerConnection(config);
    return { status: 'healthy', message: 'Server is responding' };
  } catch (error) {
    if (LOCAL_HOSTS.has(String(config.host).toLowerCase()) && process.env.TNF_MCP_HEALTH_STRICT !== '1') {
      return {
        status: 'warning',
        message: `Local service is not reachable during boot: ${error.message}`,
      };
    }
    return { status: 'unhealthy', message: `Cannot connect to server: ${error.message}` };
  }
}

/**
 * Check server connection
 */
async function checkServerConnection(config) {
  const host = config.host;
  const port = config.port;
  const protocol = config.protocol || 'http';
  const paths = Array.from(
    new Set([config.healthPath, '/health', '/api/health', '/'].filter(Boolean))
  );
  const errors = [];

  for (const pathname of paths) {
    try {
      await checkHttpUrl(`${protocol}://${host}:${port}${pathname}`);
      return true;
    } catch (error) {
      errors.push(`${pathname}: ${error.message}`);
    }
  }

  throw new Error(errors.join('; '));
}

function checkHttpUrl(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: TIMEOUT_MS }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve(true);
      } else {
        reject(new Error(`HTTP status: ${res.statusCode}`));
      }

      res.resume();
    });

    req.on('error', reject);

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

/**
 * Find port conflicts in server configurations
 */
function findPortConflicts(serverConfigs) {
  const portMap = {};
  const conflicts = [];
  
  // Map ports to server names
  for (const [name, config] of Object.entries(serverConfigs)) {
    if (config.enabled && config.port) {
      const port = config.port;
      if (!portMap[port]) {
        portMap[port] = [];
      }
      portMap[port].push(name);
    }
  }
  
  // Find ports with multiple servers
  for (const [port, servers] of Object.entries(portMap)) {
    if (servers.length > 1) {
      conflicts.push({ port, servers });
    }
  }
  
  return conflicts;
}

/**
 * Check for command availability in system
 */
async function checkCommandAvailability(serverExecutions) {
  const uniqueCommands = new Set();
  
  // Extract unique commands
  for (const [name, execution] of Object.entries(serverExecutions)) {
    if (execution.command) {
      uniqueCommands.add(execution.command);
    }
  }
  
  // Check each command
  for (const command of uniqueCommands) {
    try {
      await execPromise(`which ${command}`);
      console.log(`${Colors.green}✅ ${command}: Available${Colors.reset}`);
    } catch (error) {
      console.log(`${Colors.red}❌ ${command}: Not found in PATH${Colors.reset}`);
    }
  }
}

/**
 * Generate recommendations for fixing issues
 */
function generateRecommendations(results, portConflicts, serverConfigs, serverExecutions) {
  const hasUnhealthy = Object.values(results).some(result => result.status === 'unhealthy');
  if (!hasUnhealthy && portConflicts.length === 0) {
    console.log(`${Colors.yellow}1. Warning-only state detected. This is non-fatal for cloud-first boot.${Colors.reset}`);
    console.log(`   - Local API services may be intentionally offline when cloud API routing is healthy.`);
    console.log(`   - Set TNF_MCP_HEALTH_STRICT=1 to make local service misses fail this check.`);
    return;
  }

  // Recommend fixing port conflicts
  if (portConflicts.length > 0) {
    console.log(`${Colors.yellow}1. Fix port conflicts by updating the configuration file:${Colors.reset}`);
    for (const conflict of portConflicts) {
      console.log(`   - Change port for one of these servers: ${conflict.servers.join(', ')}`);
    }
  }
  
  // Recommend starting disabled servers
  const disabledServers = [];
  for (const [name, config] of Object.entries(serverConfigs)) {
    if (!config.enabled) {
      disabledServers.push(name);
    }
  }
  
  if (disabledServers.length > 0) {
    console.log(`${Colors.yellow}2. Enable disabled servers in the configuration:${Colors.reset}`);
    disabledServers.forEach(name => {
      console.log(`   - Set "enabled": true for ${name}`);
    });
  }
  
  // Recommend installing missing commands
  console.log(`${Colors.yellow}3. Make sure all required commands are installed:${Colors.reset}`);
  console.log(`   - Run 'npm install' to install NPM dependencies`);
  console.log(`   - Make sure Docker is installed and running for Docker-based tools`);
  
  // Recommend checking logs
  console.log(`${Colors.yellow}4. Check logs for detailed error information:${Colors.reset}`);
  console.log(`   - Look in ./mcp/logs/mcp-server.log for server errors`);
  
  // Recommend restarting servers
  console.log(`${Colors.yellow}5. Restart MCP servers:${Colors.reset}`);
  console.log(`   - Run 'node ./scripts/initialize-mcp-commands.js' from your TNF root`);
}

/**
 * Get icon for status
 */
function getStatusIcon(status) {
  switch (status) {
    case 'healthy':
      return `${Colors.green}✅${Colors.reset}`;
    case 'warning':
      return `${Colors.yellow}⚠️${Colors.reset}`;
    case 'unhealthy':
      return `${Colors.red}❌${Colors.reset}`;
    default:
      return `${Colors.blue}ℹ️${Colors.reset}`;
  }
}

/**
 * Get text for status
 */
function getStatusText(status) {
  switch (status) {
    case 'healthy':
      return `${Colors.green}HEALTHY${Colors.reset}`;
    case 'warning':
      return `${Colors.yellow}WARNING${Colors.reset}`;
    case 'unhealthy':
      return `${Colors.red}UNHEALTHY${Colors.reset}`;
    default:
      return `${Colors.blue}UNKNOWN${Colors.reset}`;
  }
}

// Execute if run directly
if (require.main === module) {
  testMCPServers()
    .then(results => {
      const exitCode = results.unhealthyCount > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error(`${Colors.red}Fatal error:${Colors.reset}`, error);
      process.exit(1);
    });
}

module.exports = { testMCPServers };

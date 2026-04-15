#!/usr/bin/env node

/**
 * MCP Configuration Manager
 * 
 * A CLI tool to manage MCP server configurations in JSON files
 * Designed to be used both interactively and via command line arguments
 * 
 * Usage:
 *   - Interactive mode: ./mcp-config-manager.js
 *   - Add server: ./mcp-config-manager.js add --file=~/path/to/config.json --name=serverName --command=cmd --args="arg1,arg2"
 *   - List servers: ./mcp-config-manager.js list --file=~/path/to/config.json
 *   - Remove server: ./mcp-config-manager.js remove --file=~/path/to/config.json --name=serverName
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// Default paths for common MCP configuration files
const DEFAULT_CONFIG_PATHS = {
  claude: path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  fuse: path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'The New Fuse', 'mcp_config.json')
};

// CLI Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Create readline interface for interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Expand tilde in file paths (e.g. ~/file.json -> /Users/username/file.json)
 */
function expandPath(filePath) {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Read and parse a JSON configuration file
 */
function readConfigFile(configPath) {
  try {
    const expandedPath = expandPath(configPath);
    
    // Check if file exists
    if (!fs.existsSync(expandedPath)) {
      console.log(`${colors.yellow}Config file doesn't exist: ${expandedPath}${colors.reset}`);
      return null;
    }
    
    // Read and parse file
    const fileContent = fs.readFileSync(expandedPath, 'utf8');
    try {
      return JSON.parse(fileContent);
    } catch (parseError) {
      console.error(`${colors.red}Error parsing JSON: ${parseError.message}${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.error(`${colors.red}Error reading file: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * Write config data to a JSON file
 */
function writeConfigFile(configPath, data) {
  try {
    const expandedPath = expandPath(configPath);
    
    // Ensure directory exists
    const dirPath = path.dirname(expandedPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write the file with pretty formatting (2 spaces indent)
    fs.writeFileSync(expandedPath, JSON.stringify(data, null, 2));
    console.log(`${colors.green}Configuration saved to: ${expandedPath}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error writing file: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Initialize a new config file with empty mcpServers object
 */
function initializeConfigFile(configPath) {
  const initialConfig = {
    mcpServers: {}
  };
  return writeConfigFile(configPath, initialConfig) ? initialConfig : null;
}

/**
 * Add or update an MCP server in the configuration
 */
function addServer(config, name, command, args) {
  // Ensure mcpServers exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  // Parse args if it's a string
  let parsedArgs = args;
  if (typeof args === 'string') {
    parsedArgs = args.split(',').map(arg => arg.trim());
  }
  
  // Add or update the server
  config.mcpServers[name] = {
    command,
    args: parsedArgs
  };
  
  return config;
}

/**
 * Remove an MCP server from the configuration
 */
function removeServer(config, name) {
  if (config.mcpServers && config.mcpServers[name]) {
    delete config.mcpServers[name];
    return true;
  }
  return false;
}

/**
 * List all servers in a configuration
 */
function listServers(config) {
  if (!config || !config.mcpServers || Object.keys(config.mcpServers).length === 0) {
    console.log(`${colors.yellow}No MCP servers found in configuration${colors.reset}`);
    return;
  }

  console.log(`${colors.cyan}${colors.bold}MCP Servers:${colors.reset}`);
  
  Object.entries(config.mcpServers).forEach(([name, server]) => {
    console.log(`\n${colors.green}${colors.bold}${name}${colors.reset}`);
    console.log(`  ${colors.cyan}Command:${colors.reset} ${server.command}`);
    console.log(`  ${colors.cyan}Args:${colors.reset} ${JSON.stringify(server.args)}`);
  });
}

/**
 * Interactive prompt to get a value from the user
 */
function prompt(question, defaultValue = '') {
  return new Promise(resolve => {
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

/**
 * Interactive prompt to select from a list of options
 */
function selectOption(message, options) {
  return new Promise(resolve => {
    console.log(`\n${message}`);
    options.forEach((option, index) => {
      console.log(`${colors.cyan}${index + 1}${colors.reset}. ${option}`);
    });
    
    rl.question(`\nEnter selection (1-${options.length}): `, (answer) => {
      const selection = parseInt(answer);
      if (isNaN(selection) || selection < 1 || selection > options.length) {
        console.log(`${colors.red}Invalid selection. Please enter a number between 1 and ${options.length}.${colors.reset}`);
        selectOption(message, options).then(resolve);
      } else {
        resolve(options[selection - 1]);
      }
    });
  });
}

/**
 * Interactive mode to manage MCP configurations
 */
async function interactiveMode() {
  console.log(`\n${colors.cyan}${colors.bold}===== MCP Configuration Manager =====${colors.reset}\n`);
  
  while (true) {
    const action = await selectOption('Select an action:', [
      'Add/Update MCP Server',
      'List MCP Servers',
      'Remove MCP Server',
      'Exit'
    ]);
    
    if (action === 'Exit') {
      break;
    }
    
    // Select configuration file
    const configType = await selectOption('Select configuration file:', [
      'Claude Desktop Config',
      'The New Fuse Config',
      'Custom Path'
    ]);
    
    let configPath;
    if (configType === 'Claude Desktop Config') {
      configPath = DEFAULT_CONFIG_PATHS.claude;
    } else if (configType === 'The New Fuse Config') {
      configPath = DEFAULT_CONFIG_PATHS.fuse;
    } else {
      configPath = await prompt('Enter path to config file');
      if (!configPath) {
        console.log(`${colors.red}No path provided. Returning to main menu.${colors.reset}`);
        continue;
      }
    }
    
    // Read or initialize the config file
    let config = readConfigFile(configPath);
    if (config === null) {
      const createNew = await prompt('Configuration file not found or invalid. Create a new one? (y/n)', 'y');
      if (createNew.toLowerCase() !== 'y') {
        console.log('Operation cancelled. Returning to main menu.');
        continue;
      }
      config = initializeConfigFile(configPath);
      if (config === null) {
        console.log(`${colors.red}Failed to create configuration file. Returning to main menu.${colors.reset}`);
        continue;
      }
    }
    
    // Process the selected action
    if (action === 'List MCP Servers') {
      listServers(config);
    } 
    else if (action === 'Add/Update MCP Server') {
      const name = await prompt('Enter server name');
      const command = await prompt('Enter command (e.g., node, npx, python)');
      const argsString = await prompt('Enter command arguments (comma-separated)');
      
      const args = argsString.split(',').map(arg => arg.trim()).filter(arg => arg);
      
      config = addServer(config, name, command, args);
      writeConfigFile(configPath, config);
      
      console.log(`${colors.green}Server "${name}" added/updated successfully.${colors.reset}`);
    } 
    else if (action === 'Remove MCP Server') {
      if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
        console.log(`${colors.yellow}No servers to remove in this configuration.${colors.reset}`);
        continue;
      }
      
      const servers = Object.keys(config.mcpServers);
      const serverToRemove = await selectOption('Select server to remove:', servers);
      
      if (removeServer(config, serverToRemove)) {
        writeConfigFile(configPath, config);
        console.log(`${colors.green}Server "${serverToRemove}" removed successfully.${colors.reset}`);
      } else {
        console.log(`${colors.red}Failed to remove server "${serverToRemove}".${colors.reset}`);
      }
    }
    
    console.log('\n');
  }
  
  rl.close();
  console.log(`\n${colors.green}MCP Configuration Manager closed. Goodbye!${colors.reset}`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      options[key] = value;
    }
  }
  
  return { command, options };
}

/**
 * Main function to run the appropriate mode based on command line arguments
 */
async function main() {
  const { command, options } = parseArgs();
  
  if (!command) {
    // No command provided, run interactive mode
    await interactiveMode();
    return;
  }
  
  // Non-interactive CLI mode
  const configPath = options.file || DEFAULT_CONFIG_PATHS.claude;
  let config = readConfigFile(configPath);
  
  switch (command) {
    case 'add':
      if (!options.name || !options.command) {
        console.error(`${colors.red}Error: Missing required options. Usage: add --file=path --name=name --command=cmd --args="arg1,arg2"${colors.reset}`);
        process.exit(1);
      }
      
      // Initialize if not exists
      if (config === null) {
        config = initializeConfigFile(configPath);
        if (config === null) {
          process.exit(1);
        }
      }
      
      const args = options.args ? options.args.split(',') : [];
      config = addServer(config, options.name, options.command, args);
      writeConfigFile(configPath, config);
      console.log(`${colors.green}Server "${options.name}" added/updated successfully.${colors.reset}`);
      break;
      
    case 'list':
      if (config === null) {
        process.exit(1);
      }
      listServers(config);
      break;
      
    case 'remove':
      if (!options.name) {
        console.error(`${colors.red}Error: Missing required option 'name'. Usage: remove --file=path --name=serverName${colors.reset}`);
        process.exit(1);
      }
      
      if (config === null) {
        process.exit(1);
      }
      
      if (removeServer(config, options.name)) {
        writeConfigFile(configPath, config);
        console.log(`${colors.green}Server "${options.name}" removed successfully.${colors.reset}`);
      } else {
        console.error(`${colors.red}Server "${options.name}" not found.${colors.reset}`);
        process.exit(1);
      }
      break;
      
    default:
      console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
      console.log(`Available commands: add, list, remove`);
      process.exit(1);
  }
  
  // Close readline interface if it was used
  if (rl.close) {
    rl.close();
  }
}

main();

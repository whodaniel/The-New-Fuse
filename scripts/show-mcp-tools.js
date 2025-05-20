#!/usr/bin/env node

/**
 * MCP Tools Viewer Script
 * 
 * This script displays the list of available MCP tools configured in the system.
 * It reads the MCP configuration file and presents the tools in a readable format.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const configPath = path.resolve(__dirname, '../src/vscode-extension/mcp_config.json');

/**
 * Display MCP tools from configuration
 */
function showMCPTools() {
  try {
    // Read the configuration file
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    console.log('\n=============================================');
    console.log('🛠️  MCP TOOLS VIEWER');
    console.log('=============================================\n');
    
    // Display server section
    console.log('📋 MCP SERVERS CONFIGURATION:');
    console.log('=============================================');
    
    const servers = config.servers || {};
    if (Object.keys(servers).length === 0) {
      console.log('No servers configured in the "servers" section.\n');
    } else {
      Object.entries(servers).forEach(([name, server]) => {
        console.log(`Server: ${name}`);
        console.log(`  Host: ${server.host}`);
        console.log(`  Port: ${server.port}`);
        console.log(`  Type: ${server.type || 'Not specified'}`);
        if (server.capabilities) {
          console.log(`  Capabilities: ${server.capabilities.join(', ')}`);
        }
        console.log(`  Enabled: ${server.enabled ? 'Yes' : 'No'}`);
        console.log('---------------------------------------------');
      });
    }
    
    // Display mcpServers section (the actual tool configurations)
    console.log('\n📋 MCP TOOL CONFIGURATIONS:');
    console.log('=============================================');
    
    const mcpServers = config.mcpServers || {};
    if (Object.keys(mcpServers).length === 0) {
      console.log('No MCP tools configured in the "mcpServers" section.\n');
    } else {
      Object.entries(mcpServers).forEach(([name, tool]) => {
        console.log(`Tool: ${name}`);
        console.log(`  Command: ${tool.command}`);
        console.log(`  Args: ${JSON.stringify(tool.args)}`);
        if (tool.env) {
          console.log('  Environment Variables:');
          Object.entries(tool.env).forEach(([key, value]) => {
            // Redact sensitive information
            const displayValue = key.toLowerCase().includes('key') || 
                                key.toLowerCase().includes('secret') || 
                                key.toLowerCase().includes('password') 
                                ? '********' : value;
            console.log(`    ${key}: ${displayValue}`);
          });
        }
        if (tool.description) {
          console.log(`  Description: ${tool.description}`);
        }
        console.log('---------------------------------------------');
      });
    }
    
    // Check for server/mcpServer inconsistencies
    console.log('\n🔍 CONFIGURATION ANALYSIS:');
    console.log('=============================================');
    
    // Find servers without matching mcpServers entries
    const serversWithoutMcpConfig = Object.keys(servers).filter(
      name => !mcpServers[name] && !mcpServers[`${name}-mcp`] && !mcpServers[`${name}-server`]
    );
    
    if (serversWithoutMcpConfig.length > 0) {
      console.log('⚠️  Servers without matching mcpServers entries:');
      serversWithoutMcpConfig.forEach(name => console.log(`  - ${name}`));
    } else {
      console.log('✅ All servers have corresponding mcpServers entries');
    }
    
    // Find mcpServers without matching servers entries
    const mcpServersWithoutConfig = Object.keys(mcpServers).filter(
      name => !servers[name] && !servers[name.replace('-mcp', '')] && !servers[name.replace('-server', '')]
    );
    
    if (mcpServersWithoutConfig.length > 0) {
      console.log('⚠️  MCP server entries without matching servers configuration:');
      mcpServersWithoutConfig.forEach(name => console.log(`  - ${name}`));
    } else {
      console.log('✅ All mcpServers have corresponding servers entries');
    }
    
    // Display port conflicts
    const usedPorts = {};
    let hasPortConflicts = false;
    
    Object.entries(servers).forEach(([name, server]) => {
      if (server.port) {
        if (usedPorts[server.port]) {
          if (!hasPortConflicts) {
            console.log('\n⚠️  Port conflicts detected:');
            hasPortConflicts = true;
          }
          console.log(`  - Port ${server.port}: Used by "${name}" and "${usedPorts[server.port]}"`);
        } else {
          usedPorts[server.port] = name;
        }
      }
    });
    
    if (!hasPortConflicts) {
      console.log('✅ No port conflicts detected');
    }
    
    // Display tool availability (simple check)
    console.log('\n⚡ TOOL AVAILABILITY CHECK:');
    console.log('=============================================');
    
    Object.entries(mcpServers).forEach(([name, tool]) => {
      let availability = '❓ Unknown';
      
      // Check if commands are in PATH
      try {
        if (tool.command === 'node' || tool.command === 'npm' || tool.command === 'npx') {
          execSync(`which ${tool.command}`, { stdio: 'ignore' });
          availability = '✅ Command available';
        } else if (tool.command === 'docker') {
          execSync('which docker', { stdio: 'ignore' });
          availability = '✅ Docker available (needs to be running)';
        } else {
          availability = '⚠️ Custom command - availability unknown';
        }
      } catch (error) {
        availability = '❌ Command not available in PATH';
      }
      
      console.log(`${name}: ${availability}`);
    });
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('=============================================');
    console.log(`Total MCP servers configured: ${Object.keys(servers).length}`);
    console.log(`Total MCP tools configured: ${Object.keys(mcpServers).length}`);
    console.log(`Configuration file: ${configPath}`);
    console.log('\nFor more information, see the MCP documentation in the docs folder.');
    
  } catch (error) {
    console.error('Error reading MCP configuration:', error);
    console.error(`\nMake sure the configuration file exists at: ${configPath}`);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  showMCPTools();
}

module.exports = { showMCPTools };

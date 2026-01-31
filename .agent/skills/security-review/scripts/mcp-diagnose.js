#!/usr/bin/env node
/**
 * MCP Server Diagnostic Tool
 * Checks MCP configuration and diagnoses issues
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const MCP_CONFIG_PATH = path.join(process.cwd(), '.kilocode', 'mcp.json');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

async function diagnoseMCP() {
  console.log(`${colors.blue}🔧 MCP Server Diagnostic Tool${colors.reset}\n`);

  // Check if config exists
  if (!fs.existsSync(MCP_CONFIG_PATH)) {
    console.error(`${colors.red}❌ MCP config not found at: ${MCP_CONFIG_PATH}${colors.reset}`);
    return;
  }

  console.log(`${colors.green}✓ MCP config found${colors.reset}\n`);

  const config = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf-8'));
  const servers = config.mcpServers || {};

  console.log(`Found ${Object.keys(servers).length} MCP servers:\n`);

  const results = {
    enabled: [],
    disabled: [],
    issues: [],
  };

  for (const [name, server] of Object.entries(servers)) {
    const isDisabled = server.disabled === true;
    const status = isDisabled
      ? `${colors.yellow}⏸️  DISABLED${colors.reset}`
      : `${colors.green}▶️  ENABLED${colors.reset}`;

    console.log(`${name}: ${status}`);

    if (isDisabled) {
      results.disabled.push({ name, server });
    } else {
      results.enabled.push({ name, server });
    }

    // Check for common issues
    const issues = checkServerIssues(name, server);
    if (issues.length > 0) {
      results.issues.push(...issues);
      issues.forEach((issue) => {
        console.log(`  ${colors.red}⚠️  ${issue.message}${colors.reset}`);
        if (issue.fix) {
          console.log(`  ${colors.blue}   💡 Fix: ${issue.fix}${colors.reset}`);
        }
      });
    }

    // Check if command exists
    if (!isDisabled && server.command) {
      const commandExists = await checkCommandExists(server.command, server.args);
      if (!commandExists) {
        console.log(`  ${colors.red}⚠️  Command not found or not executable${colors.reset}`);
        results.issues.push({
          server: name,
          severity: 'error',
          message: `Command not found: ${server.command}`,
          fix: 'Check path or install required package',
        });
      } else {
        console.log(`  ${colors.green}✓ Command executable${colors.reset}`);
      }
    }

    console.log('');
  }

  // Summary
  console.log(`${colors.blue}📊 Summary${colors.reset}`);
  console.log('==========');
  console.log(`Enabled: ${results.enabled.length}`);
  console.log(`Disabled: ${results.disabled.length}`);
  console.log(`Issues found: ${results.issues.length}\n`);

  // Recommendations
  if (results.disabled.length > 0) {
    console.log(`${colors.blue}🔧 Recommendations${colors.reset}`);
    console.log('==================\n');

    for (const { name, server } of results.disabled) {
      const recommendation = getRecommendation(name, server);
      if (recommendation) {
        console.log(`${name}:`);
        console.log(`  ${recommendation}\n`);
      }
    }
  }

  return results;
}

function checkServerIssues(name, server) {
  const issues = [];

  // Check for hardcoded credentials
  if (server.env) {
    for (const [key, value] of Object.entries(server.env)) {
      if (typeof value === 'string') {
        const isSecret = /token|secret|key|password|credential/i.test(key);
        const isEnvVar = value.startsWith('${') && value.endsWith('}');

        if (isSecret && !isEnvVar && value.length > 5) {
          issues.push({
            server: name,
            severity: 'warning',
            message: `Hardcoded credential in env: ${key}`,
            fix: `Change to "\${${key}}" to use environment variable`,
          });
        }
      }
    }
  }

  // Check for missing required env vars
  const requiredEnvVars = getRequiredEnvVars(name);
  for (const envVar of requiredEnvVars) {
    const hasVar = server.env && (server.env[envVar] || server.env[envVar] === '');
    if (!hasVar && !process.env[envVar]) {
      issues.push({
        server: name,
        severity: 'warning',
        message: `May require environment variable: ${envVar}`,
        fix: `Set ${envVar} in environment or add to server.env`,
      });
    }
  }

  return issues;
}

function getRequiredEnvVars(serverName) {
  const requirements = {
    'github-mcp-server': ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    redis: ['REDIS_URL'],
    gdrive: ['GOOGLE_APPLICATION_CREDENTIALS', 'MCP_GDRIVE_CREDENTIALS'],
    jules: ['JULES_API_KEY'],
    'tnf-relay': ['RELAY_URL'],
  };

  return requirements[serverName] || [];
}

async function checkCommandExists(command, args) {
  return new Promise((resolve) => {
    // Check if it's an absolute path
    if (command.startsWith('/')) {
      fs.access(command, fs.constants.X_OK, (err) => {
        resolve(!err);
      });
      return;
    }

    // For npx/node commands, check if the target script exists
    if (command === 'npx' || command === 'node') {
      const scriptPath = args?.find((arg) => arg.includes('/'));
      if (scriptPath && scriptPath.startsWith('/')) {
        fs.access(scriptPath, fs.constants.F_OK, (err) => {
          resolve(!err);
        });
        return;
      }
    }

    // Assume npx commands work if npx is available
    resolve(true);
  });
}

function getRecommendation(name, server) {
  const recommendations = {
    'github-mcp-server':
      'Set GITHUB_PERSONAL_ACCESS_TOKEN environment variable, then set disabled: false',
    redis: 'Verify REDIS_URL is correct, then set disabled: false if Redis is available',
    gdrive: 'Ensure Google credentials files exist at specified paths, then set disabled: false',
    'google-docs-mcp': 'Configure Google OAuth credentials, then set disabled: false',
    'tnf-skills': 'Should be enabled for TNF operations - verify SKILLS_BASE_PATH exists',
    jules: 'Should be enabled for Jules delegation - verify Jules CLI is installed',
  };

  return recommendations[name] || null;
}

async function generateFixedConfig() {
  const config = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf-8'));

  // Fix common issues
  const fixed = JSON.parse(JSON.stringify(config)); // Deep clone

  for (const [name, server] of Object.entries(fixed.mcpServers)) {
    // Remove empty alwaysAllow arrays
    if (server.alwaysAllow && server.alwaysAllow.length === 0) {
      delete server.alwaysAllow;
    }

    // Ensure consistent disabled flag
    if (server.disabled === undefined) {
      server.disabled = false;
    }

    // Fix relative paths
    if (server.command && server.command.startsWith('./')) {
      // Could expand to absolute path if needed
    }
  }

  const outputPath = MCP_CONFIG_PATH.replace('.json', '.fixed.json');
  fs.writeFileSync(outputPath, JSON.stringify(fixed, null, 2));

  console.log(`${colors.green}✓ Fixed configuration written to: ${outputPath}${colors.reset}`);
  return outputPath;
}

// CLI
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'fix') {
    generateFixedConfig().catch(console.error);
  } else {
    diagnoseMCP().catch(console.error);
  }
}

module.exports = { diagnoseMCP, generateFixedConfig };

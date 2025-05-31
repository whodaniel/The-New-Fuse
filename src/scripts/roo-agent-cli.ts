#!/usr/bin/env node
/**
 * Roo Agent Automation CLI
 * 
 * Command-line interface for creating and managing Roo Code agents
 * Can be used independently or as part of The New Fuse platform
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { RooAgentAutomationService } from '../services/RooAgentAutomationService';
import { AGENT_TEMPLATES, TEAM_CONFIGURATIONS } from '../services/roo-agent-templates';
import { MCPService } from '../services/MCPService';

const program = new Command();
const spinner = ora();

// Initialize service
let agentService: RooAgentAutomationService;

async function initializeService() {
  if (!agentService) {
    try {
      const mcpService = new MCPService();
      agentService = new RooAgentAutomationService(mcpService);
      await agentService.initialize(process.cwd());
    } catch (error) {
      console.error(chalk.red('Failed to initialize agent service:'), error.message);
      process.exit(1);
    }
  }
  return agentService;
}

// Create a single agent
async function createAgent() {
  const service = await initializeService();
  
  console.log(chalk.blue('🤖 Roo Agent Creator\n'));

  const templates = service.getAvailableTemplates();
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'templateKey',
      message: 'Select an agent template:',
      choices: templates.map(t => ({
        name: `${t.name} - ${t.description}`,
        value: t.key,
        short: t.name
      }))
    },
    {
      type: 'input',
      name: 'customName',
      message: 'Custom agent name (optional):',
      default: ''
    },
    {
      type: 'confirm',
      name: 'isGlobal',
      message: 'Create as global agent?',
      default: true
    },
    {
      type: 'confirm',
      name: 'mcpEnabled',
      message: 'Enable MCP servers?',
      default: true
    },
    {
      type: 'confirm',
      name: 'autoStart',
      message: 'Auto-start communication with Roo Code?',
      default: true
    }
  ]);

  spinner.start('Creating agent...');

  try {
    const customizations = answers.customName ? { name: answers.customName } : undefined;
    
    const agent = await service.createAgent({
      templateKey: answers.templateKey,
      customizations,
      isGlobal: answers.isGlobal,
      mcpEnabled: answers.mcpEnabled,
      autoStart: answers.autoStart
    });

    spinner.succeed(chalk.green(`Agent '${agent.name}' created successfully!`));
    
    console.log(chalk.gray('\nAgent Details:'));
    console.log(chalk.gray(`- Name: ${agent.name}`));
    console.log(chalk.gray(`- Slug: ${agent.slug}`));
    console.log(chalk.gray(`- Categories: ${agent.categories?.join(', ') || 'None'}`));
    console.log(chalk.gray(`- Tags: ${agent.tags?.join(', ') || 'None'}`));
    
  } catch (error) {
    spinner.fail(chalk.red(`Failed to create agent: ${error.message}`));
    process.exit(1);
  }
}

// Create a team
async function createTeam() {
  const service = await initializeService();
  
  console.log(chalk.blue('👥 Team Creator\n'));

  const teams = service.getAvailableTeams();
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'teamType',
      message: 'Select a team configuration:',
      choices: teams.map(t => ({
        name: `${t.name} - ${t.description}`,
        value: t.key,
        short: t.name
      }))
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: (answers) => {
        const team = teams.find(t => t.key === answers.teamType);
        return `Create team with ${team?.members.length} agents: ${team?.members.join(', ')}?`;
      },
      default: true
    }
  ]);

  if (!answers.confirm) {
    console.log(chalk.yellow('Team creation cancelled.'));
    return;
  }

  spinner.start('Creating team...');

  try {
    const agents = await service.createDevelopmentTeam(answers.teamType);
    
    spinner.succeed(chalk.green(`Team '${answers.teamType}' created with ${agents.length} agents!`));
    
    console.log(chalk.gray('\nCreated Agents:'));
    agents.forEach(agent => {
      console.log(chalk.gray(`- ${agent.name} (${agent.slug})`));
    });
    
  } catch (error) {
    spinner.fail(chalk.red(`Failed to create team: ${error.message}`));
    process.exit(1);
  }
}

// List available templates
async function listTemplates() {
  const service = await initializeService();
  
  console.log(chalk.blue('📋 Available Agent Templates\n'));
  
  const templates = service.getAvailableTemplates();
  
  templates.forEach(template => {
    console.log(chalk.green(`${template.name}`));
    console.log(chalk.gray(`  Key: ${template.key}`));
    console.log(chalk.gray(`  Description: ${template.description}`));
    console.log(chalk.gray(`  Categories: ${template.categories.join(', ')}`));
    console.log(chalk.gray(`  Tags: ${template.tags.join(', ')}`));
    console.log();
  });
}

// List available teams
async function listTeams() {
  const service = await initializeService();
  
  console.log(chalk.blue('👥 Available Team Configurations\n'));
  
  const teams = service.getAvailableTeams();
  
  teams.forEach(team => {
    console.log(chalk.green(`${team.name}`));
    console.log(chalk.gray(`  Key: ${team.key}`));
    console.log(chalk.gray(`  Description: ${team.description}`));
    console.log(chalk.gray(`  Members: ${team.members.join(', ')}`));
    console.log();
  });
}

// List active agents
async function listActiveAgents() {
  const service = await initializeService();
  
  console.log(chalk.blue('🤖 Active Agents\n'));
  
  const activeAgents = service.getActiveAgents();
  
  if (activeAgents.size === 0) {
    console.log(chalk.yellow('No active agents found.'));
    return;
  }
  
  activeAgents.forEach(agent => {
    console.log(chalk.green(`${agent.name}`));
    console.log(chalk.gray(`  Slug: ${agent.slug}`));
    console.log(chalk.gray(`  Categories: ${agent.categories?.join(', ') || 'None'}`));
    console.log(chalk.gray(`  Model: ${agent.preferredModel || 'Default'}`));
    console.log();
  });
}

// Delete an agent
async function deleteAgent() {
  const service = await initializeService();
  
  console.log(chalk.blue('🗑️  Delete Agent\n'));
  
  const activeAgents = service.getActiveAgents();
  
  if (activeAgents.size === 0) {
    console.log(chalk.yellow('No active agents to delete.'));
    return;
  }
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'agentSlug',
      message: 'Select agent to delete:',
      choices: Array.from(activeAgents.values()).map(agent => ({
        name: `${agent.name} (${agent.slug})`,
        value: agent.slug,
        short: agent.name
      }))
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to delete this agent?',
      default: false
    },
    {
      type: 'confirm',
      name: 'deleteGlobal',
      message: 'Delete global configuration?',
      default: true,
      when: (answers) => answers.confirm
    }
  ]);

  if (!answers.confirm) {
    console.log(chalk.yellow('Deletion cancelled.'));
    return;
  }

  spinner.start('Deleting agent...');

  try {
    await service.deleteAgent(answers.agentSlug, { isGlobal: answers.deleteGlobal });
    spinner.succeed(chalk.green(`Agent '${answers.agentSlug}' deleted successfully!`));
  } catch (error) {
    spinner.fail(chalk.red(`Failed to delete agent: ${error.message}`));
    process.exit(1);
  }
}

// Get statistics
async function getStatistics() {
  const service = await initializeService();
  
  console.log(chalk.blue('📊 Agent Statistics\n'));
  
  try {
    const stats = await service.getAgentStatistics();
    
    console.log(chalk.green('Overall Statistics:'));
    console.log(chalk.gray(`  Total Agents: ${stats.totalAgents}`));
    console.log(chalk.gray(`  Active Agents: ${stats.activeAgents}`));
    
    console.log(chalk.green('\nTemplate Usage:'));
    Object.entries(stats.templateUsage).forEach(([template, count]) => {
      console.log(chalk.gray(`  ${template}: ${count}`));
    });
    
    console.log(chalk.green('\nCategory Distribution:'));
    Object.entries(stats.teamDistribution).forEach(([category, count]) => {
      console.log(chalk.gray(`  ${category}: ${count}`));
    });
    
  } catch (error) {
    console.error(chalk.red(`Failed to get statistics: ${error.message}`));
    process.exit(1);
  }
}

// Interactive mode
async function interactiveMode() {
  console.log(chalk.blue('🎯 Roo Agent Automation - Interactive Mode\n'));
  
  while (true) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Create a single agent', value: 'create-agent' },
          { name: 'Create a team', value: 'create-team' },
          { name: 'List templates', value: 'list-templates' },
          { name: 'List teams', value: 'list-teams' },
          { name: 'List active agents', value: 'list-agents' },
          { name: 'Delete an agent', value: 'delete-agent' },
          { name: 'View statistics', value: 'statistics' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);

    console.log();

    switch (answers.action) {
      case 'create-agent':
        await createAgent();
        break;
      case 'create-team':
        await createTeam();
        break;
      case 'list-templates':
        await listTemplates();
        break;
      case 'list-teams':
        await listTeams();
        break;
      case 'list-agents':
        await listActiveAgents();
        break;
      case 'delete-agent':
        await deleteAgent();
        break;
      case 'statistics':
        await getStatistics();
        break;
      case 'exit':
        console.log(chalk.green('Goodbye! 👋'));
        process.exit(0);
    }

    console.log();
  }
}

// CLI Program setup
program
  .name('roo-agent-cli')
  .description('Roo Code Agent Automation CLI')
  .version('1.0.0');

program
  .command('create-agent')
  .description('Create a new Roo Code agent')
  .action(createAgent);

program
  .command('create-team')
  .description('Create a development team')
  .action(createTeam);

program
  .command('list-templates')
  .description('List available agent templates')
  .action(listTemplates);

program
  .command('list-teams')
  .description('List available team configurations')
  .action(listTeams);

program
  .command('list-agents')
  .description('List active agents')
  .action(listActiveAgents);

program
  .command('delete-agent')
  .description('Delete an agent')
  .action(deleteAgent);

program
  .command('statistics')
  .description('Show agent statistics')
  .action(getStatistics);

program
  .command('interactive')
  .alias('i')
  .description('Launch interactive mode')
  .action(interactiveMode);

// Quick create commands
program
  .command('quick-create <template>')
  .description('Quickly create an agent from a template')
  .option('-n, --name <name>', 'Custom agent name')
  .option('--no-global', 'Create as project-specific agent')
  .option('--no-mcp', 'Disable MCP servers')
  .option('--no-auto-start', 'Disable auto-start')
  .action(async (template, options) => {
    const service = await initializeService();
    
    spinner.start(`Creating agent from template '${template}'...`);
    
    try {
      const customizations = options.name ? { name: options.name } : undefined;
      
      const agent = await service.createAgent({
        templateKey: template,
        customizations,
        isGlobal: options.global,
        mcpEnabled: options.mcp,
        autoStart: options.autoStart
      });
      
      spinner.succeed(chalk.green(`Agent '${agent.name}' created successfully!`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to create agent: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('quick-team <team>')
  .description('Quickly create a team')
  .action(async (team) => {
    const service = await initializeService();
    
    spinner.start(`Creating team '${team}'...`);
    
    try {
      const agents = await service.createDevelopmentTeam(team);
      spinner.succeed(chalk.green(`Team '${team}' created with ${agents.length} agents!`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to create team: ${error.message}`));
      process.exit(1);
    }
  });

// Default to interactive mode if no command specified
if (process.argv.length === 2) {
  interactiveMode();
} else {
  program.parse();
}

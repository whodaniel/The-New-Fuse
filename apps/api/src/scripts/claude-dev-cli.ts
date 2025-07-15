#!/usr/bin/env node

import yargs from 'yargs';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// CLI Configuration
interface CLIConfig {
  apiBaseUrl: string;
  apiKey?: string;
  timeout: number;
}

class ClaudeDevCLI {
  private config: CLIConfig;
  private spinner = ora();

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): CLIConfig {
    const configPath = path.join(process.env.HOME || '', '.claude-dev-cli.json');
    
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return {
          apiBaseUrl: config.apiBaseUrl || 'http://localhost:3000/api/claude-dev',
          apiKey: config.apiKey || process.env.CLAUDE_DEV_API_KEY,
          timeout: config.timeout || 30000
        };
      }
    } catch (error) {
      console.log(chalk.yellow('Warning: Could not load config file, using defaults'));
    }

    return {
      apiBaseUrl: process.env.CLAUDE_DEV_API_URL || 'http://localhost:3000/api/claude-dev',
      apiKey: process.env.CLAUDE_DEV_API_KEY,
      timeout: 30000
    };
  }

  private saveConfig(): void {
    const configPath = path.join(process.env.HOME || '', '.claude-dev-cli.json');
    
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      console.log(chalk.green(`✓ Config saved to ${configPath}`));
    } catch (error) {
      console.log(chalk.red(`✗ Failed to save config: ${(error as Error).message}`));
    }
  }

  private async makeRequest(endpoint: string, method = 'GET', data?: any): Promise<any> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    try {
      const response = await axios({
        method,
        url,
        data,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('Network Error: Could not connect to the API');
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }

  private displayAutomationResult(automation: any): void {
    console.log(chalk.bold('\n📊 Automation Result:\n'));
    console.log(`ID: ${chalk.cyan(automation.id)}`);
    console.log(`Template: ${automation.metadata.templateName}`);
    console.log(`Status: ${chalk.green(automation.status)}`);
    console.log(`Tokens Used: ${chalk.yellow(automation.tokensUsed)}`);
    console.log(`Cost: $${automation.cost.toFixed(6)}`);
    
    if (automation.startTime && automation.endTime) {
      const duration = new Date(automation.endTime).getTime() - new Date(automation.startTime).getTime();
      console.log(`Duration: ${chalk.blue(Math.round(duration / 1000))} seconds`);
    }
    
    if (automation.result) {
      console.log(chalk.bold('\n📄 Result:'));
      if (typeof automation.result === 'string') {
        console.log(automation.result);
      } else {
        console.log(JSON.stringify(automation.result, null, 2));
      }
    }
  }

  async listTemplates(category?: string): Promise<void> {
    this.spinner.start('Loading templates...');
    
    try {
      const endpoint = category ? `/templates?category=${category}` : '/templates';
      const templates = await this.makeRequest(endpoint);
      
      this.spinner.stop();
      
      if (templates.length === 0) {
        console.log(chalk.yellow('No templates found.'));
        return;
      }
      
      console.log(chalk.bold(`\n📋 ${category ? `${category.charAt(0).toUpperCase() + category.slice(1)} ` : ''}Templates:\n`));
      
      templates.forEach((template: any) => {
        console.log(`${chalk.cyan(template.id)} - ${template.name}`);
        console.log(`  ${chalk.gray(template.description)}`);
        console.log(`  Category: ${chalk.yellow(template.category)}`);
        console.log('');
      });
    } catch (error) {
      this.spinner.stop();
      console.log(chalk.red(`✗ Error: ${(error as Error).message}`));
    }
  }

  async getTemplate(templateId: string): Promise<void> {
    this.spinner.start('Loading template...');
    
    try {
      const template = await this.makeRequest(`/templates/${templateId}`);
      
      this.spinner.stop();
      
      console.log(chalk.bold(`\n📄 Template: ${template.name}\n`));
      console.log(`ID: ${chalk.cyan(template.id)}`);
      console.log(`Category: ${chalk.yellow(template.category)}`);
      console.log(`Description: ${template.description}`);
      
      if (template.parameters && template.parameters.length > 0) {
        console.log(chalk.bold('\nParameters:'));
        template.parameters.forEach((param: any) => {
          console.log(`  ${chalk.cyan(param.name)} ${param.required ? chalk.red('(required)') : chalk.gray('(optional)')}`);
          console.log(`    Type: ${param.type}`);
          console.log(`    Description: ${param.description}`);
          if (param.default) {
            console.log(`    Default: ${param.default}`);
          }
          console.log('');
        });
      }
      
      if (template.example) {
        console.log(chalk.bold('Example:'));
        console.log(template.example);
      }
    } catch (error) {
      this.spinner.stop();
      console.log(chalk.red(`✗ Error: ${(error as Error).message}`));
    }
  }
}

// Export for use as a module
export default ClaudeDevCLI;

// CLI setup if run directly
if (require.main === module) {
  const cli = new ClaudeDevCLI();

  yargs(process.argv.slice(2))
    .scriptName('claude-dev')
    .usage('$0 <cmd> [args]')
    .command(
      'templates [category]',
      'List available automation templates',
      (yargs) => {
        yargs.positional('category', {
          type: 'string',
          describe: 'Filter by category (development, analysis, automation, communication)',
          choices: ['development', 'analysis', 'automation', 'communication']
        });
      },
      (argv) => cli.listTemplates(argv.category)
    )
    .command(
      'template <templateId>',
      'Get detailed information about a template',
      (yargs) => {
        yargs.positional('templateId', {
          type: 'string',
          describe: 'Template ID to retrieve',
          demandOption: true
        });
      },
      (argv) => cli.getTemplate(argv.templateId)
    )
    .example('$0 templates', 'List all templates')
    .example('$0 templates development', 'List development templates')
    .example('$0 template code-review', 'Get code-review template details')
    .help()
    .alias('help', 'h')
    .alias('version', 'v')
    .demandCommand(1, 'You need at least one command before moving on')
    .parse();
}

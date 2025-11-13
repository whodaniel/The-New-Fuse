import { CategoryCommand, SubcommandCommand } from './base.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
/**
 * Workflow category command implementation
 */
export class WorkflowCommand extends CategoryCommand {
    constructor(program) {
        super('workflow', 'Workflow orchestration', program);
        this.initializeSubcommands();
    }
    initializeSubcommands() {
        // List subcommand
        this.registerSubcommand('list', new WorkflowListSubcommand('workflow', 'list', 'List workflows', this.program).createSubcommand());
        // Create subcommand
        this.registerSubcommand('create', new WorkflowCreateSubcommand('workflow', 'create', 'Create a workflow', this.program).createSubcommand());
        // Run subcommand
        this.registerSubcommand('run', new WorkflowRunSubcommand('workflow', 'run', 'Run a workflow', this.program).createSubcommand());
        // Stop subcommand
        this.registerSubcommand('stop', new WorkflowStopSubcommand('workflow', 'stop', 'Stop a workflow', this.program).createSubcommand());
        // Status subcommand
        this.registerSubcommand('status', new WorkflowStatusSubcommand('workflow', 'status', 'Check workflow status', this.program).createSubcommand());
        // Logs subcommand
        this.registerSubcommand('logs', new WorkflowLogsSubcommand('workflow', 'logs', 'View workflow logs', this.program).createSubcommand());
        // Update subcommand
        this.registerSubcommand('update', new WorkflowUpdateSubcommand('workflow', 'update', 'Update a workflow', this.program).createSubcommand());
        // Delete subcommand
        this.registerSubcommand('delete', new WorkflowDeleteSubcommand('workflow', 'delete', 'Delete a workflow', this.program).createSubcommand());
        // Template subcommand
        this.registerSubcommand('template', new WorkflowTemplateSubcommand('workflow', 'template', 'Manage workflow templates', this.program).createSubcommand());
    }
}
/**
 * Workflow list subcommand
 */
class WorkflowListSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-s, --status <status>', 'Filter by status (running|stopped|completed|failed)')
            .option('-o, --owner <owner>', 'Filter by owner')
            .option('--json', 'Output in JSON format')
            .option('--detailed', 'Show detailed information');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            const workflows = await this.getWorkflows(options);
            if (options.json) {
                this.formatOutput(workflows, options);
                return;
            }
            console.log(chalk.blue.bold('🔄 Workflows\n'));
            if (workflows.length === 0) {
                console.log(chalk.yellow('No workflows found'));
                return;
            }
            workflows.forEach(workflow => {
                const statusIcon = this.getStatusIcon(workflow.status);
                const statusText = this.getStatusText(workflow.status);
                console.log(`${statusIcon} ${chalk.white.bold(workflow.name)} (${workflow.id}) - ${statusText});`, console.log(chalk.gray(Description, $, { workflow, : .description } `));
          
          if (options.detailed) {
            console.log(chalk.gray(  Owner: ${workflow.owner || 'system'}`)));
                console.log(chalk.gray(Created, $, { workflow, : .createdAt }));
                `
            console.log(chalk.gray(  Updated: ${workflow.updatedAt}`;
            });
        });
        if (workflow.lastRun) {
            console.log(chalk.gray(Last, Run, $, { workflow, : .lastRun } `));
            }
            
            if (workflow.steps) {
              console.log(chalk.gray(  Steps: ${workflow.steps.length}));
            }
          }
          
          console.log();
        });

        return { workflows, count: workflows.length, timestamp: new Date().toISOString() };
      },
      'Workflow list retrieved successfully',
      'Failed to list workflows'
    );
  }

  private async getWorkflows(options: any): Promise<any[]> {
    const workflowsDir = path.join(process.cwd(), 'workflows');
    
    if (!fs.existsSync(workflowsDir)) {
      return [];
    }

    const workflows = [];
    const files = fs.readdirSync(workflowsDir)
      .filter(file => file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml'));

    for (const file of files) {
      const filePath = path.join(workflowsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      try {
        let workflow;
        if (file.endsWith('.json')) {
          workflow = JSON.parse(content);
        } else {
          // YAML parsing would be implemented here
          workflow = { id: file.replace(/\.(yaml|yml)$/, ''), name: file };
        }
        
        workflow.id = workflow.id || file.replace(/\.(json|yaml|yml)$/, '');
        workflow.status = await this.getWorkflowStatus(workflow.id);
        workflow.file = file;
        
        // Apply filters
        if (options.status && workflow.status !== options.status) {
          continue;
        }
        
        if (options.owner && workflow.owner !== options.owner) {
          continue;
        }
        
        workflows.push(workflow);`));
        }
        try { }
        catch (error) {
            `
        console.warn(chalk.yellow(`;
            Could;
            not;
            parse;
            workflow;
            file: $;
            {
                file;
            }
            ;
        }
    }
}
return workflows;
async;
getWorkflowStatus(workflowId, string);
Promise < string > {
    const: runningWorkflows = await this.getRunningWorkflows(),
    return: runningWorkflows.includes(workflowId) ? 'running' : 'stopped'
};
async;
getRunningWorkflows();
Promise < string[] > {
    const: processesFile = path.join(os.homedir(), '.tnf', 'processes.json'),
    if(, fs) { }, : .existsSync(processesFile)
};
{
    return [];
}
const processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
const runningWorkflows = [];
for (const [processName, info] of Object.entries(processes)) {
    if (processName.startsWith('workflow:') && info.pid) {
        try {
            process.kill(info.pid, 0);
            runningWorkflows.push(processName.replace('workflow:', ''));
        }
        catch (error) {
            // Process not running, remove it
            delete processes[processName];
        }
    }
}
return runningWorkflows;
getStatusIcon(status, string);
string;
{
    const icons = {
        running: chalk.green('●'),
        stopped: chalk.red('○'),
        completed: chalk.green('✓'),
        failed: chalk.red('✗'),
        paused: chalk.yellow('⏸')
    };
    return icons[status] || icons.stopped;
}
getStatusText(status, string);
string;
{
    const texts = {
        running: chalk.green('running'),
        stopped: chalk.red('stopped'),
        completed: chalk.green('completed'),
        failed: chalk.red('failed'),
        paused: chalk.yellow('paused')
    };
    return texts[status] || texts.stopped;
}
/**
 * Workflow create subcommand
 */
class WorkflowCreateSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<name>', 'Name of the workflow to create')
            .option('-t, --template <template>', 'Template to use', 'basic')
            .option('-c, --config <config>', 'Configuration file path')
            .option('--description <description>', 'Workflow description')
            .option('--format <format>', 'File format (json|yaml)', 'json');
    }
    async handleCommand(name, options) {
        await this.executeWithHandling(async () => {
            const workflowConfig = await this.createWorkflowConfig(name, options);
            await this.saveWorkflowConfig(name, workflowConfig, options.format);
            `
        console.log(chalk.green(✅ Workflow "${name}`;
            " created successfully`));;
            console.log(chalk.gray(Configuration, saved, to, workflows / $, { name }.$, { options, : .format }));
            return {
                name,
                config: workflowConfig,
                format: options.format,
                timestamp: new Date().toISOString()
            };
        }, 'Workflow created successfully', 'Failed to create workflow');
    }
    async createWorkflowConfig(name, options) {
        const baseConfig = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
        } `
      description: options.description || Workflow: ${name}`, version, owner, created;
        ().toISOString(),
            updated;
        new Date().toISOString(),
            status;
        'inactive',
            steps;
        [],
            triggers;
        [],
            variables;
        { }
        timeout: 3600;
    }
    ;
    // Load template configuration
    if(options, template) { }
}
 && options.template !== 'basic';
{
    const templateConfig = await this.loadTemplate(options.template);
    Object.assign(baseConfig, templateConfig);
}
// Load custom configuration
if (options.config) {
    const customConfig = JSON.parse(fs.readFileSync(options.config, 'utf8'));
    Object.assign(baseConfig, customConfig);
}
return baseConfig;
async;
loadTemplate(template, string);
Promise < any > {
    const: templates = {
        'ci-cd': {
            description: 'CI/CD pipeline workflow',
            steps: [
                { name: 'build', type: 'shell', command: 'pnpm run build' },
                { name: 'test', type: 'shell', command: 'npm test' },
                { name: 'deploy', type: 'shell', command: 'pnpm run deploy' }
            ],
            triggers: [{ type: 'webhook', event: 'push' }]
        },
        'data-processing': {
            description: 'Data processing workflow',
            steps: [
                { name: 'extract', type: 'script', script: 'extract.js' },
                { name: 'transform', type: 'script', script: 'transform.js' },
                { name: 'load', type: 'script', script: 'load.js' }
            ],
            triggers: [{ type: 'schedule', cron: '0 2 * * *' }]
        },
        'agent-orchestration': {
            description: 'Multi-agent orchestration workflow',
            steps: [
                { name: 'analyze', type: 'agent', agent: 'claude', task: 'Analyze requirements' },
                { name: 'implement', type: 'agent', agent: 'copilot', task: 'Implement solution' },
                { name: 'review', type: 'agent', agent: 'gemini', task: 'Review implementation' }
            ],
            triggers: [{ type: 'manual' }]
        }
    },
    return: templates[template] || {}
};
async;
saveWorkflowConfig(name, string, config, any, format, string);
Promise < void  > {
    const: workflowsDir = path.join(process.cwd(), 'workflows'),
    if(, fs) { }, : .existsSync(workflowsDir)
};
{
    fs.mkdirSync(workflowsDir, { recursive: true });
}
const filename = $, { name }, $, { format };
`;
    const configPath = path.join(workflowsDir, filename);
    
    if (format === 'json') {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } else if (format === 'yaml') {
      // YAML implementation would go here
      const yaml = this.convertToYaml(config);
      fs.writeFileSync(configPath, yaml);
    }
  }

  private convertToYaml(obj: any): string {
    // Simple YAML conversion - in real implementation, use a proper YAML library
    return JSON.stringify(obj, null, 2)
      .replace(/"/g, '')
      .replace(/,/g, '')
      .replace(/\{/g, '')
      .replace(/\}/g, '');
  }
}

/**
 * Workflow run subcommand
 */
class WorkflowRunSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('<workflow>', 'Workflow to run')
      .option('-p, --params <params>', 'Parameters for the workflow (JSON string)')
      .option('-a, --async', 'Run workflow asynchronously')
      .option('--dry-run', 'Show what would be executed without running');
  }

  protected async handleCommand(workflow: string, options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        const workflowConfig = await this.loadWorkflowConfig(workflow);
        
        if (!workflowConfig) {
          throw new Error(Workflow not found: ${workflow});
        }` `
        console.log(chalk.blue(🚀 Running workflow: ${workflowConfig.name}`;
;
// Parse parameters
let params = {};
if (options.params) {
    try {
        params = JSON.parse(options.params);
    }
    catch (error) {
        throw new Error('Invalid JSON parameters');
    }
}
if (options.dryRun) {
    console.log(chalk.yellow('DRY RUN - The following steps would be executed:'));
    workflowConfig.steps.forEach((step, index) => {
        console.log($, { index } + 1);
    }, $, { step, : .name }($, { step, : .type }));
}
;
return { workflow, params, dryRun: true };
const result = await this.executeWorkflow(workflow, workflowConfig, params, options);
return {
    workflow,
    params,
    result,
    timestamp: new Date().toISOString()
};
'Workflow executed successfully',
    'Failed to run workflow';
;
async;
loadWorkflowConfig(workflowId, string);
Promise < any > {
    const: workflowsDir = path.join(process.cwd(), 'workflows'),
    const: extensions = ['.json', '.yaml', '.yml'],
    for(, ext, of, extensions) {
        `
      const configPath = path.join(workflowsDir, ${workflowId}`;
        $;
        {
            ext;
        }
        ;
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf8');
            if (ext === '.json') {
                return JSON.parse(content);
            }
            else {
                // YAML parsing would be implemented here
                return { id: workflowId, name: workflowId, steps: [] };
            }
        }
    },
    return: null
};
async;
executeWorkflow(workflowId, string, config, any, params, any, options, any);
Promise < any > {
    if(options) { }, : .async
};
{
    // Run in background
    const child = spawn('node', [
        path.join(__dirname, 'workflow-runner.js'),
        workflowId,
        JSON.stringify(params)
    ], {
        stdio: 'pipe',
        detached: true,
        cwd: process.cwd()
    });
    child.unref();
    `
      // Save process info`;
    await this.saveProcessInfo(workflow, $, { workflowId } `, {
        pid: child.pid,
        startedAt: new Date().toISOString(),
        params
      });

      console.log(chalk.green(✅ Workflow started in background (PID: ${child.pid})));
      return { async: true, pid: child.pid };
    } else {
      // Run synchronously
      console.log(chalk.blue('Executing workflow steps...'));
      
      const results = [];`);
    for (const step of config.steps) {
        `
        console.log(chalk.gray(Executing step: ${step.name}));
        
        const stepResult = await this.executeStep(step, params);
        results.push(stepResult);
        
        if (!stepResult.success) {`;
        console.log(chalk.red(Step, $, { step, : .name }, failed, stopping, workflow `));
          break;
        }
      }

      console.log(chalk.green('✅ Workflow completed successfully'));
      return { results };
    }
  }

  private async executeStep(step: any, params: any): Promise<any> {
    switch (step.type) {
      case 'shell':
        return await this.executeShellStep(step, params);
      case 'script':
        return await this.executeScriptStep(step, params);
      case 'agent':
        return await this.executeAgentStep(step, params);
      default:
        return { success: false, error: Unknown step type: ${step.type} };
    }
  }

  private async executeShellStep(step: any, params: any): Promise<any> {
    try {
      const command = this.interpolateVariables(step.command, params);
      execSync(command, { stdio: 'inherit', cwd: process.cwd() });
      return { success: true, step: step.name };
    } catch (error) {
      return { success: false, step: step.name, error: error.message };
    }
  }

  private async executeScriptStep(step: any, params: any): Promise<any> {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', step.script);`));
        if (!fs.existsSync(scriptPath)) {
            `
        throw new Error(Script not found: ${step.script});
      }
`;
            execSync(node, "${scriptPath}`", { stdio: 'inherit', cwd: process.cwd() });
            return { success: true, step: step.name };
        }
        try { }
        catch (error) {
            return { success: false, step: step.name, error: error.message };
        }
    }
    async;
    executeAgentStep(step, any, params, any);
    Promise < any > {
        try: {
            const: task = this.interpolateVariables(step.task, params),
            // This would integrate with the agent system
            console, : .log(chalk.blue(Running, agent, $, { step, : .agent })), with: task, $
        }
    };
    {
        task;
    }
    ;
    return { success: true, step: step.name, agent: step.agent, task };
}
try { }
catch (error) {
    return { success: false, step: step.name, error: error.message };
}
interpolateVariables(text, string, params, any);
string;
{
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return params[key] || match;
    });
}
async;
saveProcessInfo(processName, string, info, any);
Promise < void  > {
    const: tnfDir = path.join(os.homedir(), '.tnf'),
    const: processesFile = path.join(tnfDir, 'processes.json'),
    if(, fs) { }, : .existsSync(tnfDir)
};
{
    fs.mkdirSync(tnfDir, { recursive: true });
}
let processes = {};
if (fs.existsSync(processesFile)) {
    processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
}
processes[processName] = info;
fs.writeFileSync(processesFile, JSON.stringify(processes, null, 2));
/**
 * Workflow stop subcommand
 */
class WorkflowStopSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<workflow>', 'Workflow to stop')
            .option('-f, --force', 'Force stop the workflow');
    }
    async handleCommand(workflow, options) {
        await this.executeWithHandling(`
      async () => {`);
        const processName = workflow, $, { workflow };
        const processesFile = path.join(os.homedir(), '.tnf', 'processes.json');
        if (!fs.existsSync(processesFile)) {
            throw new Error('No running workflows found');
        }
        const processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
        const processInfo = processes[processName];
        `
        `;
        if (!processInfo || !processInfo.pid) {
            `
          throw new Error(Workflow not running: ${workflow});
        }

        try {
          if (options.force) {
            process.kill(processInfo.pid, 'SIGKILL');
          } else {
            process.kill(processInfo.pid, 'SIGTERM');
            
            // Wait for graceful shutdown
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check if still running, force kill if necessary
            try {
              process.kill(processInfo.pid, 0);
              process.kill(processInfo.pid, 'SIGKILL');
            } catch (error) {
              // Process already stopped
            }
          }
          
          delete processes[processName];
          fs.writeFileSync(processesFile, JSON.stringify(processes, null, 2));
          `;
            console.log(chalk.green(Workflow, "${workflow}`", stopped, successfully));
            return {
                workflow,
                pid: processInfo.pid,
                timestamp: new Date().toISOString()
            };
        }
        try { }
        catch (error) {
            throw new Error(Failed, to, stop, workflow, $, { error, : .message } `);
        }
      },
      'Workflow stopped successfully',
      'Failed to stop workflow'
    );
  }
}

/**
 * Workflow status subcommand
 */
class WorkflowStatusSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('<workflow>', 'Workflow to check status for')
      .option('-d, --detailed', 'Show detailed status information');
  }

  protected async handleCommand(workflow: string, options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        const workflowConfig = await this.loadWorkflowConfig(workflow);
        const status = await this.getWorkflowStatus(workflow);
        
        console.log(chalk.blue.bold(🔄 Workflow Status: ${workflow}\n));
        
        if (workflowConfig) {`, console.log(chalk.white(Name, $, { workflowConfig, : .name } `));
          console.log(chalk.gray(Description: ${workflowConfig.description}`)));
            console.log(chalk.gray(Version, $, { workflowConfig, : .version }));
            `
          console.log(chalk.gray(`;
            Owner: $;
            {
                workflowConfig.owner || 'system';
            }
            ;
            `
        }`;
            console.log(chalk.white(Status, $, { this: .getStatusText(status) } `));
        
        if (options.detailed) {
          console.log(chalk.blue('\nDetailed Information:'));
          
          if (workflowConfig) {
            console.log(chalk.gray(Created: ${workflowConfig.created}`));
            console.log(chalk.gray(Updated, $, { workflowConfig, : .updated }));
            if (workflowConfig.steps) {
                console.log(chalk.gray(Steps, $, { workflowConfig, : .steps.length }));
            }
            `
            if (workflowConfig.triggers && workflowConfig.triggers.length > 0) {`;
            console.log(chalk.gray(Triggers, $, { workflowConfig, : .triggers.map((t) => t.type).join(', ') } `));
            }
          }
          
          const processInfo = await this.getProcessInfo(workflow);
          if (processInfo) {
            console.log(chalk.gray(PID: ${processInfo.pid}));`, console.log(chalk.gray(`Started: ${processInfo.startedAt}));
            if (processInfo.uptime) {
              console.log(chalk.gray(Uptime: ${processInfo.uptime}));
            }
          }
        }

        return {
          workflow,
          status,
          config: workflowConfig,
          timestamp: new Date().toISOString()
        };
      },
      'Workflow status retrieved successfully',
      'Failed to get workflow status'
    );
  }

  private async loadWorkflowConfig(workflowId: string): Promise<any> {
    const workflowsDir = path.join(process.cwd(), 'workflows');
    const extensions = ['.json', '.yaml', '.yml'];` `
    for (const ext of extensions) {
      const configPath = path.join(workflowsDir, `, $, { workflowId }, $, { ext }))));
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                if (ext === '.json') {
                    return JSON.parse(content);
                }
                else {
                    return { id: workflowId, name: workflowId };
                }
            }
        }
        return null;
    }
    async getWorkflowStatus(workflowId) {
        const processInfo = await this.getProcessInfo(workflowId);
        return processInfo ? 'running' : 'stopped';
    }
    async getProcessInfo(workflowId) {
        const processesFile = path.join(os.homedir(), '.tnf', 'processes.json');
        if (!fs.existsSync(processesFile)) {
            return null;
        }
        `
`;
        const processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
        const processInfo = processes[workflow], $, { workflowId };
        `];
    
    if (processInfo && processInfo.pid) {
      try {
        process.kill(processInfo.pid, 0); // Check if process exists
        
        return {
          ...processInfo,
          uptime: this.calculateUptime(processInfo.startedAt)
        };
      } catch (error) {
        // Process not running, remove it
        delete processes[workflow:${workflowId}];
        fs.writeFileSync(processesFile, JSON.stringify(processes, null, 2));
      }
    }

    return null;
  }

  private calculateUptime(startedAt: string): string {
    const startTime = new Date(startedAt).getTime();
    const now = Date.now();
    const uptime = Math.floor((now - startTime) / 1000);
    
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;` `
    if (hours > 0) {
      return `;
        $;
        {
            hours;
        }
        h;
        $;
        {
            minutes;
        }
        m;
        $;
        {
            seconds;
        }
        s;
        `
    } else if (minutes > 0) {
      return ${minutes}`;
        m;
        $;
        {
            seconds;
        }
        s;
        `
    } else {`;
        return $;
        {
            seconds;
        }
        s;
    }
}
getStatusText(status, string);
string;
{
    const texts = {
        running: chalk.green('Running'),
        stopped: chalk.red('Stopped'),
        completed: chalk.green('Completed'),
        failed: chalk.red('Failed'),
        paused: chalk.yellow('Paused')
    };
    return texts[status] || texts.stopped;
}
/**
 * Workflow logs subcommand
 */
class WorkflowLogsSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<workflow>', 'Workflow to show logs for')
            .option('-t, --tail <lines>', 'Number of lines to show from end', '50')
            .option('-f, --follow', 'Follow log output');
    }
    async handleCommand(workflow, options) {
        try {
            `
      const logFile = path.join(process.cwd(), 'logs', workflow-${workflow}.log`;
            ;
            if (!fs.existsSync(logFile)) {
                console.log(chalk.yellow(No, log, file, found));
                for (workflow; ; )
                    : $;
                {
                    workflow;
                }
                ;
                `
        console.log(chalk.gray(Expected location: ${logFile}`;
                ;
                return;
            }
            console.log(chalk.blue(Showing, logs));
            for (workflow; ; )
                : $;
            {
                workflow;
            }
            ;
            `
      `;
            let logCommand = tail - n, $, { options, tail };
            "${logFile}`";
            if (options.follow) {
                logCommand = tail - f;
                "${logFile}";
            }
            execSync(logCommand, { stdio: 'inherit', cwd: process.cwd() });
        }
        catch (error) {
            console.error(chalk.red('Failed to show workflow logs:'), error.message);
        }
    }
}
/**
 * Workflow update subcommand
 */
class WorkflowUpdateSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<workflow>', 'Workflow to update')
            .option('-c, --config <config>', 'New configuration file path')
            .option('--version <version>', 'Update version');
    }
    async handleCommand(workflow, options) {
        await this.executeWithHandling(async () => {
            const workflowConfig = await this.loadWorkflowConfig(workflow);
            `
        if (!workflowConfig) {`;
            throw new Error(Workflow, not, found, $, { workflow });
        });
        // Update configuration
        if (options.config) {
            const newConfig = JSON.parse(fs.readFileSync(options.config, 'utf8'));
            Object.assign(workflowConfig, newConfig);
        }
        if (options.version) {
            workflowConfig.version = options.version;
        }
        workflowConfig.updated = new Date().toISOString();
        await this.saveWorkflowConfig(workflow, workflowConfig);
        `
        console.log(chalk.green(✅ Workflow "${workflow}`;
        " updated successfully));;
        return {
            workflow,
            config: workflowConfig,
            timestamp: new Date().toISOString()
        };
    }
    'Workflow updated successfully';
    'Failed to update workflow';
    ;
}
async;
loadWorkflowConfig(workflowId, string);
Promise < any > {
    const: workflowsDir = path.join(process.cwd(), 'workflows'),
    const: extensions = ['.json', '.yaml', '.yml'],
    for(, ext, of, extensions) {
        const configPath = path.join(workflowsDir, $, { workflowId }, $, { ext });
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf8');
            if (ext === '.json') {
                return JSON.parse(content);
            }
        }
    },
    return: null
} `
  private async saveWorkflowConfig(workflowId: string, config: any): Promise<void> {`;
const workflowsDir = path.join(process.cwd(), 'workflows');
const configPath = path.join(workflowsDir, $, { workflowId } `.json);
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}

/**
 * Workflow delete subcommand
 */
class WorkflowDeleteSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('<workflow>', 'Workflow to delete')
      .option('-f, --force', 'Force deletion without confirmation');
  }

  protected async handleCommand(workflow: string, options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        const workflowsDir = path.join(process.cwd(), 'workflows');
        const extensions = ['.json', '.yaml', '.yml'];
        let configPath = null;

        for (const ext of extensions) {
          const path = path.join(workflowsDir, ${workflow}${ext});
          if (fs.existsSync(path)) {
            configPath = path;
            break;
          }
        }` `
        if (!configPath) {
          throw new Error(`, Workflow, not, found, $, { workflow });
// Confirm deletion unless forced
if (!options.force) {
    const answers = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: Are, you, sure, you, want, to, delete: workflow, "${workflow}": ,
            default: false
        }
    ]);
    if (!answers.confirm) {
        console.log(chalk.yellow('Deletion cancelled'));
        return;
    }
}
`
        fs.unlinkSync(configPath);`;
console.log(chalk.green(`✅ Workflow "${workflow}" deleted successfully));

        return {
          workflow,
          timestamp: new Date().toISOString()
        };
      },
      'Workflow deleted successfully',
      'Failed to delete workflow'
    );
  }
}

/**
 * Workflow template subcommand
 */
class WorkflowTemplateSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('[action]', 'Action to perform (list|create)')
      .argument('[name]', 'Template name (for create action)')
      .option('--from <workflow>', 'Create template from existing workflow')
      .option('--description <description>', 'Template description');
  }

  protected async handleCommand(action: string | undefined, name: string | undefined, options: any): Promise<void> {
    if (!action) {
      action = 'list';
    }

    if (action === 'list') {
      await this.listTemplates();
    } else if (action === 'create') {
      await this.createTemplate(name || '', options);`, {} `
      throw new Error(Unknown action: ${action}. Use 'list' or 'create');
    }
  }

  private async listTemplates(): Promise<void> {
    await this.executeWithHandling(
      async () => {
        const templates = await this.getTemplates();
        
        console.log(chalk.blue.bold('📋 Workflow Templates\n'));

        if (templates.length === 0) {
          console.log(chalk.yellow('No templates found'));
          return;
        }

        templates.forEach(template => {`, console.log(chalk.white.bold($, { template, : .name }($, { template, : .id } `)));
          console.log(chalk.gray(  Description: ${template.description}));`, console.log(chalk.gray(Steps, $, { template, : .steps?.length || 0 })))))));
console.log();
;
return { templates, count: templates.length, timestamp: new Date().toISOString() };
'Template list retrieved successfully',
    'Failed to list templates';
;
async;
createTemplate(name, string, options, any);
Promise < void  > {
    if(, name) {
        throw new Error('Template name is required for create action');
    },
    await, this: .executeWithHandling(async () => {
        let templateConfig;
        if (options.from) {
            // Create template from existing workflow
            const workflowConfig = await this.loadWorkflowConfig(options.from);
            if (!workflowConfig) {
                `
            throw new Error(Workflow not found: ${options.from}`;
            }
        }
    })
};
templateConfig = {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    description: options.description || Template, based, on, $
};
{
    options.from;
}
steps: workflowConfig.steps || [],
    triggers;
workflowConfig.triggers || [],
    variables;
workflowConfig.variables || {},
    created;
new Date().toISOString();
;
{
    // Create empty template
    templateConfig = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
    } `
            name,`;
    description: options.description || Template;
    $;
    {
        name;
    }
    steps: [],
        triggers;
    [],
        variables;
    { }
    created: new Date().toISOString();
}
;
await this.saveTemplate(name, templateConfig);
`
        console.log(chalk.green(✅ Template "${name}`;
" created successfully));;
return {
    name,
    config: templateConfig,
    timestamp: new Date().toISOString()
};
'Template created successfully',
    'Failed to create template';
;
async;
getTemplates();
Promise < any[] > {
    const: templatesDir = path.join(process.cwd(), '.tnf', 'templates'),
    if(, fs) { }, : .existsSync(templatesDir)
};
{
    return [];
}
const templates = [];
const files = fs.readdirSync(templatesDir)
    .filter(file => file.endsWith('.json'));
for (const file of files) {
    const templatePath = path.join(templatesDir, file);
    try {
        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        templates.push(template);
    }
    catch (error) {
        console.warn(chalk.yellow(Could, not, parse, template, file, $, { file }));
    }
}
return templates;
async;
loadWorkflowConfig(workflowId, string);
Promise < any > {
    const: workflowsDir = path.join(process.cwd(), 'workflows'),
    const: extensions = ['.json', '.yaml', '.yml']
} `
    for (const ext of extensions) {`;
const configPath = path.join(workflowsDir, $, { workflowId }, $, { ext });
if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    if (ext === '.json') {
        return JSON.parse(content);
    }
}
return null;
async;
saveTemplate(name, string, config, any);
Promise < void  > {
    const: templatesDir = path.join(process.cwd(), '.tnf', 'templates'),
    if(, fs) { }, : .existsSync(templatesDir)
};
{
    fs.mkdirSync(templatesDir, { recursive: true });
    `
    }` `
    const templatePath = path.join(templatesDir, ${name}.json`;
    ;
    fs.writeFileSync(templatePath, JSON.stringify(config, null, 2));
}
/**
 * Register the workflow category command
 */
export function registerWorkflowCommands(program) {
    const workflowCommand = new WorkflowCommand(program);
    return workflowCommand.createCategoryCommand();
}
//# sourceMappingURL=workflow.js.map
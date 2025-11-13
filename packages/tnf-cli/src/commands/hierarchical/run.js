import { CategoryCommand, SubcommandCommand } from './base.js';
import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
/**
 * Run category command implementation
 */
export class RunCommand extends CategoryCommand {
    constructor(program) {
        super('run', 'Runtime operations', program);
        this.initializeSubcommands();
    }
    initializeSubcommands() {
        // Start subcommand
        this.registerSubcommand('start', new StartSubcommand('run', 'start', 'Start services', this.program).createSubcommand());
        // Stop subcommand
        this.registerSubcommand('stop', new StopSubcommand('run', 'stop', 'Stop services', this.program).createSubcommand());
        // Restart subcommand
        this.registerSubcommand('restart', new RestartSubcommand('run', 'restart', 'Restart services', this.program).createSubcommand());
        // Status subcommand
        this.registerSubcommand('status', new StatusSubcommand('run', 'status', 'Check service status', this.program).createSubcommand());
        // Logs subcommand
        this.registerSubcommand('logs', new LogsSubcommand('run', 'logs', 'View service logs', this.program).createSubcommand());
        // Health subcommand
        this.registerSubcommand('health', new HealthSubcommand('run', 'health', 'Health check operations', this.program).createSubcommand());
    }
}
/**
 * Start subcommand
 */
class StartSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('[service]', 'Service to start (optional, starts all if not specified)')
            .option('-e, --env <environment>', 'Environment to start in', 'development')
            .option('-p, --port <port>', 'Port to run the service on')
            .option('-d, --detach', 'Run in detached/background mode')
            .option('--no-logs', 'Don\'t show logs when starting')
            .option('--scale <count>', 'Number of instances to start', '1');
    }
    async handleCommand(service, options) {
        await this.executeWithHandling(async () => {
            const services = service ? [service] : await this.getAvailableServices();
            const results = [];
            for (const svc of services) {
                console.log(chalk.blue(`Starting service: ${svc}));
          
          const result = await this.startService(svc, options);
          results.push(result);
          
          if (!options.detach) {`, console.log(chalk.green(`✓ Service ${svc}`, started, successfully))));
            }
        });
        if (options.detach) {
            console.log(chalk.green(Started, $, { services, : .length }, service(s) in background));
        }
        return {
            services: results,
            environment: options.env,
            timestamp: new Date().toISOString()
        };
    }
    'Services started successfully';
    'Failed to start services';
    ;
}
async;
startService(service, string, options, any);
Promise < any > {
    const: serviceConfig = await this.getServiceConfig(service),
    if(, serviceConfig) {
        `
      throw new Error(Service configuration not found: ${service}`;
        ;
    },
    const: port = options.port || serviceConfig.port || 3000,
    const: env = { ...process.env, NODE_ENV: options.env },
    if(serviceConfig) { }, : .env
};
{
    Object.assign(env, serviceConfig.env);
}
const startCommand = serviceConfig.start || bun, run, start, { service };
if (options.detach) {
    // Start in background
    const child = spawn(startCommand, [], {
        stdio: options.logs ? 'pipe' : 'ignore',
        detached: true,
        env,
        cwd: process.cwd()
    });
    child.unref();
    // Save process info
    await this.saveProcessInfo(service, {
        pid: child.pid,
        port,
        env: options.env,
        startedAt: new Date().toISOString()
    });
    return { service, pid: child.pid, port, status: 'running' };
}
else {
    `
      // Start in foreground`;
    if (options.logs !== false) {
        console.log(chalk.blue(Starting, $, { service } ` on port ${port}...));
      }
      
      execSync(startCommand, {
        stdio: 'inherit',
        env,
        cwd: process.cwd()
      });
      
      return { service, port, status: 'started' };
    }
  }

  private async getAvailableServices(): Promise<string[]> {
    // Check for common service configurations
    const services = [];
    
    if (fs.existsSync('docker-compose.yml')) {
      services.push(...this.getDockerComposeServices());
    }
    
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};
      
      // Look for start:* scripts
      Object.keys(scripts).forEach(script => {
        if (script.startsWith('start:')) {
          services.push(script.replace('start:', ''));
        }
      });
    }
    
    // Default services
    if (services.length === 0) {
      services.push('app', 'api', 'web', 'server');
    }
    
    return services;
  }

  private getDockerComposeServices(): string[] {
    try {
      const dockerCompose = fs.readFileSync('docker-compose.yml', 'utf8');
      const services = dockerCompose.match(/services:\s*\n((?:\s+.+\n?)*)/);
      if (services) {
        return services[1]
          .split('\n')
          .filter(line => line.trim() && !line.trim().startsWith('#'))
          .map(line => line.trim().split(':')[0]);
      }
    } catch (error) {
      console.warn(chalk.yellow('Could not parse docker-compose.yml'));
    }
    return [];
  }

  private async getServiceConfig(service: string): Promise<any> {`));
        // Try to load service configuration from various sources`
        const configFiles = [
            config / $, { service } `.json,
      services/${service}.json`,
            '.tnf/services.json'
        ];
        for (const configFile of configFiles) {
            if (fs.existsSync(configFile)) {
                try {
                    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                    return config[service] || config;
                }
                catch (error) {
                    console.warn(chalk.yellow(Could, not, read, config, file, $, { configFile }));
                }
            }
        }
        return null;
    }
    async;
    saveProcessInfo(service, string, info, any);
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
    processes[service] = info;
    fs.writeFileSync(processesFile, JSON.stringify(processes, null, 2));
}
/**
 * Stop subcommand
 */
class StopSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('[service]', 'Service to stop (optional, stops all if not specified)')
            .option('-a, --all', 'Stop all running services')
            .option('-f, --force', 'Force stop services')
            .option('--timeout <seconds>', 'Timeout for graceful shutdown', '30');
    }
    async handleCommand(service, options) {
        await this.executeWithHandling(async () => {
            const services = options.all ? await this.getRunningServices() :
                service ? [service] :
                    await this.getRunningServices();
            if (services.length === 0) {
                console.log(chalk.yellow('No running services found'));
                return { services: [], timestamp: new Date().toISOString() };
            }
            const results = [];
            for (const svc of services) {
                console.log(chalk.blue(Stopping, service, $, { svc }));
                const result = await this.stopService(svc, options);
                results.push(result);
                `
          `;
                console.log(chalk.green(Service, $, { svc } ` stopped));
        }

        return {
          services: results,
          timestamp: new Date().toISOString()
        };
      },
      'Services stopped successfully',
      'Failed to stop services'
    );
  }

  async getRunningServices(): Promise<string[]> {
    const processesFile = path.join(os.homedir(), '.tnf', 'processes.json');
    
    if (!fs.existsSync(processesFile)) {
      return [];
    }

    const processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
    const runningServices = [];

    for (const [serviceName, info] of Object.entries(processes)) {
      if (info.pid) {
        try {
          // Check if process is still running
          process.kill(info.pid, 0); // Signal 0 just checks if process exists
          runningServices.push(serviceName);
        } catch (error) {
          // Process is not running, remove it from the file
          delete processes[serviceName];
        }
      }
    }

    // Update the processes file to remove dead processes
    if (runningServices.length < Object.keys(processes).length) {
      fs.writeFileSync(processesFile, JSON.stringify(processes, null, 2));
    }

    return runningServices;
  }

  private async stopService(service: string, options: any): Promise<any> {
    const processesFile = path.join(os.homedir(), '.tnf', 'processes.json');
    
    if (fs.existsSync(processesFile)) {
      const processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
      const serviceInfo = processes[service];
      
      if (serviceInfo && serviceInfo.pid) {
        try {
          if (options.force) {
            process.kill(serviceInfo.pid, 'SIGKILL');
          } else {
            process.kill(serviceInfo.pid, 'SIGTERM');
            
            // Wait for graceful shutdown
            const timeout = parseInt(options.timeout) * 1000;
            await new Promise(resolve => setTimeout(resolve, timeout));
            
            // Check if still running, force kill if necessary
            try {
              process.kill(serviceInfo.pid, 0);
              process.kill(serviceInfo.pid, 'SIGKILL');
            } catch (error) {
              // Process already stopped
            }
          }
          
          delete processes[service];
          fs.writeFileSync(processesFile, JSON.stringify(processes, null, 2));
          
          return { service, pid: serviceInfo.pid, status: 'stopped' };
        } catch (error) {
          console.warn(chalk.yellow(Could not stop process ${serviceInfo.pid}: ${error.message}));
        }
      }
    }

    // Try alternative stop methods
    try {`));
                const stopCommand = bun, run, stop, { service };
                ` || docker-compose stop ${service};
      execSync(stopCommand, { stdio: 'pipe', cwd: process.cwd() });
      return { service, status: 'stopped' };
    } catch (error) {
      return { service, status: 'error', error: error.message };
    }
  }
}

/**
 * Restart subcommand
 */
class RestartSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('[service]', 'Service to restart (optional, restarts all if not specified)')
      .option('-f, --force', 'Force restart services')
      .option('--no-logs', 'Don\'t show logs during restart');
  }

  protected async handleCommand(service: string | undefined, options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        // First stop the service(s)
        const stopCommand = new StopSubcommand('run', 'stop', 'Stop services', this.program);
        await stopCommand.handleCommand(service, { ...options, timeout: '10' });

        // Small delay to ensure clean shutdown
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Then start the service(s)
        const startCommand = new StartSubcommand('run', 'start', 'Start services', this.program);
        const result = await startCommand.handleCommand(service, { 
          ...options, 
          detach: true 
        });

        return {
          service,
          restarted: true,
          timestamp: new Date().toISOString(),
          ...result
        };
      },
      'Services restarted successfully',
      'Failed to restart services'
    );
  }
}

/**
 * Status subcommand
 */
class StatusSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .option('-d, --detailed', 'Show detailed status information')
      .option('--json', 'Output in JSON format')
      .option('--watch', 'Watch for status changes');
  }

  protected async handleCommand(options: any): Promise<void> {
    const displayStatus = async () => {
      const runningServices = await this.getRunningServices();
      const serviceConfigs = await this.getAllServiceConfigs();
      
      const status = {
        running: runningServices.length,
        total: Object.keys(serviceConfigs).length,
        services: []
      };

      console.log(chalk.blue.bold('🚀 TNF Services Status\n'));

      for (const [serviceName, config] of Object.entries(serviceConfigs)) {
        const isRunning = runningServices.includes(serviceName);
        const statusInfo = await this.getServiceStatus(serviceName, config);
        
        status.services.push({
          name: serviceName,
          status: isRunning ? 'running' : 'stopped',
          ...statusInfo
        });

        const statusIcon = isRunning ? chalk.green('●') : chalk.red('○');
        const statusText = isRunning ? chalk.green('Running') : chalk.red('Stopped');` `
        console.log(${statusIcon} ${chalk.white.bold(serviceName)}`;
                $;
                {
                    statusText;
                }
            }
        });
        `
        if (options.detailed && config.port) {`;
        console.log(chalk.gray(Port, $, { config, : .port } `));
        }
        
        if (options.detailed && statusInfo.url) {
          console.log(chalk.gray(  URL: ${statusInfo.url}));
        }
        `));
        if (options.detailed && statusInfo.pid) {
            `
          console.log(chalk.gray(  PID: ${statusInfo.pid}`;
            ;
        }
        if (options.detailed && statusInfo.uptime) {
            console.log(chalk.gray(Uptime, $, { statusInfo, : .uptime }));
        }
        console.log();
    }
}
`
`;
console.log(chalk.blue(Summary, $, { status, : .running } `/${status.total} services running));

      if (options.json) {
        this.formatOutput(status, options);
      }
    };

    if (options.watch) {
      console.log(chalk.blue('Watching for status changes (Press Ctrl+C to stop)...'));
      const interval = setInterval(displayStatus, 5000);
      
      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log(chalk.yellow('\nStopped watching status changes'));
        process.exit(0);
      });
    } else {
      await displayStatus();
    }
  }

  private async getRunningServices(): Promise<string[]> {
    const stopCommand = new StopSubcommand('run', 'stop', 'Stop services', this.program);
    return await stopCommand.getRunningServices();
  }

  private async getAllServiceConfigs(): Promise<Record<string, any>> {
    const configs = {};
    
    // Get from package.json scripts
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};
      
      Object.keys(scripts).forEach(script => {
        if (script.startsWith('start:')) {
          const serviceName = script.replace('start:', '');
          configs[serviceName] = { 
            name: serviceName,
            start: scripts[script]
          };
        }
      });
    }

    // Get from docker-compose
    if (fs.existsSync('docker-compose.yml')) {
      try {
        const content = fs.readFileSync('docker-compose.yml', 'utf8');
        const services = content.match(/services:\s*\n((?:\s+.+\n?)*)/);
        if (services) {
          const serviceNames = services[1]
            .split('\n')
            .filter(line => line.trim() && !line.trim().startsWith('#'))
            .map(line => line.trim().split(':')[0]);
          
          serviceNames.forEach(name => {
            if (!configs[name]) {
              configs[name] = { name, type: 'docker' };
            }
          });
        }
      } catch (error) {
        console.warn(chalk.yellow('Could not parse docker-compose.yml'));
      }
    }

    return configs;
  }

  private async getServiceStatus(service: string, config: any): Promise<any> {
    const processesFile = path.join(os.homedir(), '.tnf', 'processes.json');
    
    if (fs.existsSync(processesFile)) {
      const processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
      const serviceInfo = processes[service];
      
      if (serviceInfo) {
        const uptime = serviceInfo.startedAt ? 
          Math.floor((Date.now() - new Date(serviceInfo.startedAt).getTime()) / 1000) : 
          null;
        
        return {
          pid: serviceInfo.pid,
          port: serviceInfo.port,
          env: serviceInfo.env,
          startedAt: serviceInfo.startedAt,`, uptime, uptime ? this.formatUptime(uptime) : null, `
          url: serviceInfo.port ? http://localhost:${serviceInfo.port}`, null));
return {};
formatUptime(seconds, number);
string;
{
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
        return $;
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
            secs;
        }
        s;
        `
    } else if (minutes > 0) {
      return ${minutes}m ${secs}s;`;
    }
    else {
        `
      return ${secs}s;
    }
  }
}

/**
 * Logs subcommand
 */
class LogsSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('[service]', 'Service to show logs for (optional, shows all if not specified)')
      .option('-t, --tail <lines>', 'Number of lines to show from end', '50')
      .option('-f, --follow', 'Follow log output')
      .option('--since <time>', 'Show logs since timestamp (e.g., 1h, 30m, 2023-01-01T12:00:00)');
  }

  protected async handleCommand(service: string | undefined, options: any): Promise<void> {
    try {
      if (service) {
        await this.showServiceLogs(service, options);
      } else {
        const runningServices = await this.getRunningServices();
        if (runningServices.length === 0) {
          console.log(chalk.yellow('No running services to show logs for'));
          return;
        }

        if (runningServices.length === 1) {
          await this.showServiceLogs(runningServices[0], options);
        } else {
          console.log(chalk.blue('Multiple services running. Choose one:'));
          runningServices.forEach((svc, index) => {`;
        console.log($, { index } + 1);
    }
    `. ${svc});
          });
          console.log(chalk.gray('Use: tnf run logs <service-name>'));
        }
      }
    } catch (error) {
      console.error(chalk.red('Failed to show logs:'), error.message);
    }
  }

  private async getRunningServices(): Promise<string[]> {
    const stopCommand = new StopSubcommand('run', 'stop', 'Stop services', this.program);
    return await stopCommand.getRunningServices();
  }` `
  private async showServiceLogs(service: string, options: any): Promise<void> {
    const logFile = path.join(process.cwd(), 'logs', ${service}.log);`;
    const accessLog = path.join(process.cwd(), 'logs', `${service}-access.log);` `
    console.log(chalk.blue(Showing logs for ${service}:));
    
    let logCommand = '';
    `);
    if (fs.existsSync(logFile)) {
        `
      logCommand = tail -n ${options.tail} "${logFile}";`;
        if (options.follow) {
            logCommand = tail - f;
            "${logFile}`";
        }
    }
    else if (fs.existsSync(accessLog)) {
        logCommand = tail - n;
        $;
        {
            options.tail;
        }
        "${accessLog}";
        `
      if (options.follow) {`;
        logCommand = tail - f;
        "${accessLog}" `;
      }
    } else {
      // Try docker logs
      try {
        logCommand = docker logs ${service};
        if (options.tail) {
          logCommand +=  --tail ${options.tail};
        }
        if (options.follow) {
          logCommand += ' -f';
        }`;
        if (options.since) {
            `
          logCommand +=  --since "${options.since}`;
            ";;
        }
    }
    try { }
    catch (error) {
        console.log(chalk.yellow(No, log, files, found));
        for ($; { service };)
            ;
        ;
        return;
    }
}
if (logCommand) {
    execSync(logCommand, { stdio: 'inherit', cwd: process.cwd() });
}
/**
 * Health subcommand
 */
class HealthSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('[service]', 'Service to check health for (optional, checks all if not specified)')
            .option('-c, --check', 'Perform detailed health check')
            .option('-v, --verbose', 'Show detailed health information')
            .option('--timeout <seconds>', 'Health check timeout', '5');
    }
    async handleCommand(service, options) {
        await this.executeWithHandling(async () => {
            const services = service ? [service] : await this.getRunningServices();
            const results = [];
            console.log(chalk.blue.bold('🏥 Health Check Results\n'));
            for (const svc of services) {
                const health = await this.checkServiceHealth(svc, options);
                results.push(health);
                const statusIcon = health.healthy ? chalk.green('✓') : chalk.red('✗');
                const statusText = health.healthy ? chalk.green('Healthy') : chalk.red('Unhealthy');
                `
          `;
                console.log(`${statusIcon} ${chalk.white.bold(svc)}: ${statusText});
          
          if (options.verbose && health.details) {`, Object.entries(health.details).forEach(([key, value]) => {
                    `
              console.log(chalk.gray(  ${key}`;
                    $;
                    {
                        value;
                    }
                }));
            }
        });
    }
    console;
}
const healthyCount = results.filter(r => r.healthy).length;
console.log(chalk.blue(Summary, $, { healthyCount } / $, { results, : .length }, services, healthy));
return {
    services: results,
    healthy: healthyCount,
    total: results.length,
    timestamp: new Date().toISOString()
};
'Health check completed',
    'Health check failed';
;
async;
getRunningServices();
Promise < string[] > {
    const: stopCommand = new StopSubcommand('run', 'stop', 'Stop services', this.program),
    return: await stopCommand.getRunningServices()
};
async;
checkServiceHealth(service, string, options, any);
Promise < any > {
    const: timeout = parseInt(options.timeout) * 1000,
    const: startTime = Date.now(),
    try: {
        // Get service configuration
        const: processesFile = path.join(os.homedir(), '.tnf', 'processes.json'),
        let, serviceInfo = null,
        if(fs) { }, : .existsSync(processesFile)
    }
};
{
    const processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
    serviceInfo = processes[service];
}
const health = {
    service,
    healthy: false,
    responseTime: null,
    details: {}
};
// Check if process is running
if (serviceInfo && serviceInfo.pid) {
    try {
        process.kill(serviceInfo.pid, 0);
        health.details.process = 'running';
        health.details.pid = serviceInfo.pid;
    }
    catch (error) {
        health.details.process = 'not running';
        return health;
    }
}
// Perform HTTP health check if port is available
if (serviceInfo && serviceInfo.port) {
    try {
        `
          const response = await this.makeHttpRequest(`;
        http: //localhost:${serviceInfo.port}`/health,
         timeout;
        ;
        health.healthy = response.status === 200;
        health.details.http = 'responding';
        health.details.statusCode = response.status;
        health.responseTime = Date.now() - startTime;
    }
    catch (error) {
        health.details.http = 'not responding';
        health.details.httpError = error.message;
    }
}
// Docker health check
try {
    const dockerHealth = execSync(docker, ps--, filter, "name=${service}"--, format, "{{.Status}}" `, 
          { encoding: 'utf8', timeout: timeout / 1000 });
        
        if (dockerHealth.includes('healthy')) {
          health.details.docker = 'healthy';
          if (!health.healthy) health.healthy = true;
        } else if (dockerHealth.includes('unhealthy')) {
          health.details.docker = 'unhealthy';
          health.healthy = false;
        } else {
          health.details.docker = 'running';
        }
      } catch (error) {
        // Docker not available or container not found
      }

      // Default to healthy if no specific checks failed
      if (Object.keys(health.details).length === 0 || 
          (health.details.process === 'running' && !health.details.http)) {
        health.healthy = true;
      }

      health.responseTime = health.responseTime || (Date.now() - startTime);
      return health;

    } catch (error) {
      return {
        service,
        healthy: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        details: { error: error.message }
      };
    }
  }

  private async makeHttpRequest(url: string, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const httpModule = url.startsWith('https:') ? require('https') : require('http');
      
      const request = httpModule.get(url, (response: any) => {
        resolve({ status: response.statusCode });
      });

      request.setTimeout(timeout, () => {
        request.destroy();
        reject(new Error('Health check timeout'));
      });

      request.on('error', (error: Error) => {
        reject(error);
      });
    });
  }
}

/**
 * Register the run category command
 */
export function registerRunCommands(program: Command): Command {
  const runCommand = new RunCommand(program);
  return runCommand.createCategoryCommand();
});
}
finally { }
//# sourceMappingURL=run.js.map
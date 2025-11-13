import { CategoryCommand, SubcommandCommand } from './base.js';
import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
/**
 * Monitor category command implementation
 */
export class MonitorCommand extends CategoryCommand {
    constructor(program) {
        super('monitor', 'Monitoring & observability', program);
        this.initializeSubcommands();
    }
    initializeSubcommands() {
        // Status subcommand
        this.registerSubcommand('status', new MonitorStatusSubcommand('monitor', 'status', 'Monitoring status', this.program).createSubcommand());
        // Metrics subcommand
        this.registerSubcommand('metrics', new MonitorMetricsSubcommand('monitor', 'metrics', 'View metrics', this.program).createSubcommand());
        // Alerts subcommand
        this.registerSubcommand('alerts', new MonitorAlertsSubcommand('monitor', 'alerts', 'Alert management', this.program).createSubcommand());
        // Logs subcommand
        this.registerSubcommand('logs', new MonitorLogsSubcommand('monitor', 'logs', 'Centralized logging', this.program).createSubcommand());
        // Traces subcommand
        this.registerSubcommand('traces', new MonitorTracesSubcommand('monitor', 'traces', 'Distributed tracing', this.program).createSubcommand());
        // Dashboard subcommand
        this.registerSubcommand('dashboard', new MonitorDashboardSubcommand('monitor', 'dashboard', 'Launch dashboard', this.program).createSubcommand());
        // Config subcommand
        this.registerSubcommand('config', new MonitorConfigSubcommand('monitor', 'config', 'Monitoring configuration', this.program).createSubcommand());
        // Health subcommand
        this.registerSubcommand('health', new MonitorHealthSubcommand('monitor', 'health', 'Health checks', this.program).createSubcommand());
    }
}
/**
 * Monitor status subcommand
 */
class MonitorStatusSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-s, --service <service>', 'Show status for specific service')
            .option('-d, --detailed', 'Show detailed status information')
            .option('--json', 'Output in JSON format');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            const monitorStatus = await this.getMonitoringStatus(options);
            if (options.json) {
                this.formatOutput(monitorStatus, options);
                return;
            }
            console.log(chalk.blue.bold('📊 Monitoring Status\n'));
            // Display overall system health
            const healthyServices = monitorStatus.services?.filter((s) => s.health === 'healthy').length || 0;
            const totalServices = monitorStatus.services?.length || 0;
            console.log(chalk.white(`System Health: ${healthyServices}/${totalServices} services healthy));
        console.log();

        // Display service monitoring status
        if (monitorStatus.services) {
          monitorStatus.services.forEach((service: any) => {
            const healthIcon = service.health === 'healthy' ? chalk.green('●') : 
                             service.health === 'warning' ? chalk.yellow('⚠') : 
                             chalk.red('○');
            const healthText = service.health === 'healthy' ? chalk.green('Healthy') :
                             service.health === 'warning' ? chalk.yellow('Warning') :
                             chalk.red('Critical');
            `, console.log($, { healthIcon } ` ${chalk.white.bold(service.name)}`, $, { healthText })));
            if (options.detailed) {
                `
              if (service.uptime) console.log(chalk.gray(  Uptime: ${service.uptime}`;
            }
        });
        ;
        if (service.lastCheck)
            console.log(chalk.gray(Last, Check, $, { service, : .lastCheck } `));
              if (service.metrics) {
                console.log(chalk.gray(  CPU: ${service.metrics.cpu}%));`, console.log(chalk.gray(Memory, $, { service, : .metrics.memory } `%));
                console.log(chalk.gray(  Response Time: ${service.metrics.responseTime}ms`))));
    }
}
console.log();
;
return {
    status: monitorStatus,
    timestamp: new Date().toISOString()
};
'Monitoring status retrieved successfully',
    'Failed to get monitoring status';
;
async;
getMonitoringStatus(options, any);
Promise < any > {
    const: services = [],
    // Get Docker container status
    try: {
        const: containers = execSync('docker ps --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"', { encoding: 'utf8' }),
        containers, : .split('\n').filter(line => line.trim()).forEach(line => {
            const [name, status, ports] = line.split('\t');
            const isHealthy = status.includes('healthy');
            const uptime = this.extractUptime(status);
            services.push({
                name,
                health: isHealthy ? 'healthy' : 'warning',
                uptime,
                lastCheck: new Date().toISOString(),
                metrics: {
                    cpu: Math.random() * 100, // Mock data - would integrate with real metrics
                    memory: Math.random() * 100,
                    responseTime: Math.floor(Math.random() * 1000)
                }
            });
        })
    }, catch(error) {
        console.warn(chalk.yellow('Could not get Docker container status'));
    }
    // Get system metrics
    ,
    // Get system metrics
    const: systemMetrics = await this.getSystemMetrics(),
    // Filter by service if specified
    if(options) { }, : .service
};
{
    return {
        services: services.filter(s => s.name.includes(options.service)),
        system: systemMetrics
    };
}
return { services, system: systemMetrics };
extractUptime(status, string);
string;
{
    const match = status.match(/Up (.+?)(?:\s|$)/);
    return match ? match[1] : 'Unknown';
}
async;
getSystemMetrics();
Promise < any > {
    try: {
        const: loadAvg = os.loadavg(),
        const: totalMem = os.totalmem(),
        const: freeMem = os.freemem(),
        const: usedMem = totalMem - freeMem,
        return: {
            loadAverage: loadAvg,
            memory: {
                total: totalMem,
                used: usedMem,
                free: freeMem,
                usage: Math.round((usedMem / totalMem) * 100)
            },
            uptime: os.uptime(),
            platform: os.platform(),
            arch: os.arch()
        }
    }, catch(error) {
        return {};
    }
};
/**
 * Monitor metrics subcommand
 */
class MonitorMetricsSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-s, --service <service>', 'Show metrics for specific service')
            .option('-t, --timeframe <timeframe>', 'Timeframe for metrics (1h, 24h, 7d)', '1h')
            .option('--interval <seconds>', 'Update interval in seconds', '5')
            .option('--watch', 'Watch metrics in real-time');
    }
    async handleCommand(options) {
        const displayMetrics = async () => {
            const metrics = await this.getMetrics(options);
            console.log(chalk.blue.bold(System, Metrics($, { options, : .timeframe }), n));
            // Display system metrics
            if (metrics.system) {
                console.log(chalk.white.bold('System:'));
                `
        console.log(chalk.gray(  CPU Usage: ${metrics.system.cpu}` % ;
                ;
                console.log(chalk.gray(Memory, Usage, $, { metrics, : .system.memory } `%));
        console.log(chalk.gray(  Disk Usage: ${metrics.system.disk}%));`, console.log(chalk.gray(Network, I / O, $, { metrics, : .system.network } `));
        console.log();
      }
      
      // Display service metrics
      if (metrics.services && metrics.services.length > 0) {
        console.log(chalk.white.bold('Services:'));
        metrics.services.forEach((service: any) => {
          console.log(chalk.gray(  ${service.name}`))));
                console.log(chalk.gray(CPU, $, { service, : .cpu } % ));
                `
          console.log(chalk.gray(    Memory: ${service.memory}%));`;
                console.log(chalk.gray(`    Requests: ${service.requests}/min));`, console.log(chalk.gray(Response, Time, $, { service, : .responseTime } `ms`))));
                console.log(chalk.gray(Error, Rate, $, { service, : .errorRate } % ));
            }
            ;
        };
    }
    ;
    if(options, watch) {
        console.log(chalk.blue('Watching metrics (Press Ctrl+C to stop)...'));
        const interval = setInterval(displayMetrics, (options.interval || 5) * 1000);
        process.on('SIGINT', () => {
            clearInterval(interval);
            console.log(chalk.yellow('\nStopped watching metrics'));
            process.exit(0);
        });
    }
}
{
    await displayMetrics();
}
async;
getMetrics(options, any);
Promise < any > {
    const: metrics, any = {
        system: await this.getSystemMetrics(),
        services: []
    },
    // Get service metrics
    try: {
        const: containers = execSync('docker stats --no-stream --format "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"', { encoding: 'utf8' }),
        containers, : .split('\n').filter(line => line.trim()).forEach(line => {
            const [name, cpu, memory, network, blockIO] = line.split('\t');
            if (!options.service || name.includes(options.service)) {
                metrics.services.push({
                    name,
                    cpu: parseFloat(cpu.replace('%', '')),
                    memory: this.parseMemoryUsage(memory),
                    network,
                    blockIO,
                    requests: Math.floor(Math.random() * 1000), // Mock data
                    responseTime: Math.floor(Math.random() * 500),
                    errorRate: Math.random() * 5
                });
            }
        })
    }, catch(error) {
        console.warn(chalk.yellow('Could not get service metrics'));
    },
    return: metrics
};
async;
getSystemMetrics();
Promise < any > {
    try: {
        const: cpuUsage = await this.getCpuUsage(),
        const: memUsage = this.getMemoryUsage(),
        const: diskUsage = await this.getDiskUsage(),
        const: networkIO = await this.getNetworkIO(),
        return: {
            cpu: cpuUsage,
            memory: memUsage,
            disk: diskUsage,
            network: networkIO
        }
    }, catch(error) {
        return {
            cpu: 0,
            memory: 0,
            disk: 0,
            network: '0 B/s'
        };
    }
};
async;
getCpuUsage();
Promise < number > {
    try: {
        const: stats = fs.readFileSync('/proc/stat', 'utf8'),
        const: lines = stats.split('\n'),
        const: cpuLine = lines.find(line => line.startsWith('cpu ')),
        if(cpuLine) {
            const values = cpuLine.split(/\s+/).slice(1).map(Number);
            const idle = values[3];
            const total = values.reduce((a, b) => a + b, 0);
            return Math.round(((total - idle) / total) * 100);
        }
    }, catch(error) {
        // Fallback for non-Linux systems
    },
    return: Math.random() * 100
};
getMemoryUsage();
number;
{
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return Math.round(((totalMem - freeMem) / totalMem) * 100);
}
async;
getDiskUsage();
Promise < number > {
    try: {
        const: stats = fs.statSync('.'),
        // This is a simplified implementation
        return: Math.random() * 100
    }, catch(error) {
        return 0;
    }
};
async;
getNetworkIO();
Promise < string > {
    try: {
        const: stats = fs.readFileSync('/proc/net/dev', 'utf8'),
        // This is a simplified implementation`
        return: `${Math.floor(Math.random() * 1000)} B/s`
    }, catch(error) {
        return '0 B/s';
    }
};
parseMemoryUsage(memoryStr, string);
number;
{
    const match = memoryStr.match(/(\d+\.?\d*)(\w+)\/(\d+\.?\d*)(\w+)/);
    if (match) {
        const used = parseFloat(match[1]);
        const total = parseFloat(match[3]);
        return Math.round((used / total) * 100);
    }
    return 0;
}
/**
 * Monitor alerts subcommand
 */
class MonitorAlertsSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('--active', 'Show only active alerts')
            .option('--resolved', 'Show only resolved alerts')
            .option('-s, --service <service>', 'Show alerts for specific service')
            .option('--severity <severity>', 'Filter by severity (critical|warning|info)');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            const alerts = await this.getAlerts(options);
            console.log(chalk.blue.bold('🚨 Alerts\n'));
            if (alerts.length === 0) {
                console.log(chalk.green('No alerts found'));
                return;
            }
            alerts.forEach((alert) => {
                const severityIcon = alert.severity === 'critical' ? chalk.red('🔴') :
                    alert.severity === 'warning' ? chalk.yellow('🟡') :
                        chalk.blue('🔵');
                const statusIcon = alert.status === 'active' ? chalk.red('●') : chalk.green('○');
                console.log($, { severityIcon }, $, { statusIcon }, $, { chalk, : .white.bold(alert.title) });
                `
          console.log(chalk.gray(`;
                Service: $;
                {
                    alert.service;
                }
            });
        });
        `
          console.log(chalk.gray(  Severity: ${alert.severity}));`;
        console.log(chalk.gray(Message, $, { alert, : .message } `));
          console.log(chalk.gray(  Created: ${alert.createdAt}));
          if (alert.resolvedAt) {
            console.log(chalk.gray(  Resolved: ${alert.resolvedAt}));
          }
          console.log();
        });

        return {
          alerts,
          count: alerts.length,
          timestamp: new Date().toISOString()
        };
      },
      'Alerts retrieved successfully',
      'Failed to get alerts'
    );
  }

  private async getAlerts(options: any): Promise<any[]> {
    const alertsFile = path.join(process.cwd(), '.tnf', 'alerts.json');
    let alerts = [];
    
    if (fs.existsSync(alertsFile)) {
      alerts = JSON.parse(fs.readFileSync(alertsFile, 'utf8'));
    }

    // Apply filters
    if (options.active) {
      alerts = alerts.filter((alert: any) => alert.status === 'active');
    }
    
    if (options.resolved) {
      alerts = alerts.filter((alert: any) => alert.status === 'resolved');
    }
    
    if (options.service) {
      alerts = alerts.filter((alert: any) => alert.service.includes(options.service));
    }
    
    if (options.severity) {
      alerts = alerts.filter((alert: any) => alert.severity === options.severity);
    }

    return alerts;
  }
}

/**
 * Monitor logs subcommand
 */
class MonitorLogsSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .option('-s, --service <service>', 'Show logs for specific service')
      .option('-l, --level <level>', 'Filter by log level (error|warn|info|debug)')
      .option('-t, --tail <lines>', 'Number of lines to show from end', '100')
      .option('-f, --follow', 'Follow log output')
      .option('--grep <pattern>', 'Filter logs by pattern');
  }

  protected async handleCommand(options: any): Promise<void> {
    try {`));
        const logs = await this.getLogs(options);
        `
      
      console.log(chalk.blue(📋 System Logs${options.service ? ` for ${options.service} : ''}\n));
      
      logs.forEach((log: any) => {
        const levelIcon = log.level === 'error' ? chalk.red('❌') :
                         log.level === 'warn' ? chalk.yellow('⚠️') :
                         log.level === 'info' ? chalk.blue('ℹ️') :
                         chalk.gray('🔹');
        `
            :
        ;
        const timestamp = new Date(log.timestamp).toLocaleString();
        `
        console.log(${levelIcon} ${chalk.gray(timestamp)} ${chalk.white(log.service)}: ${log.message}`;
        ;
    }
    ;
    if(options, follow) {
        console.log(chalk.blue('\nFollowing logs (Press Ctrl+C to stop)...'));
        // In a real implementation, this would tail log files
    }
}
try { }
catch (error) {
    console.error(chalk.red('Failed to get logs:'), error.message);
}
async;
getLogs(options, any);
Promise < any[] > {
    const: logs = [],
    // Get Docker container logs
    try: {
        const: containers = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' }),
        const: containerList = containers.split('\n').filter(name => name.trim()),
        for(, container, of, containerList) {
            if (options.service && !container.includes(options.service)) {
                continue;
            }
            try {
                const containerLogs = execSync(docker, logs--, tail, $, { options, : .tail }--, timestamps, $, { container }, { encoding: 'utf8' });
                containerLogs.split('\n').filter(line => line.trim()).forEach(line => {
                    const log = this.parseLogLine(line, container);
                    if (this.matchesFilters(log, options)) {
                        logs.push(log);
                    }
                });
                `
        } catch (error) {`;
                console.warn(chalk.yellow(Could, not, get, logs));
                for ($; { container };)
                    ;
                ;
            }
            finally {
            }
        }
    }, catch(error) {
        console.warn(chalk.yellow('Could not list containers'));
    }
    // Sort by timestamp
    ,
    // Sort by timestamp
    logs, : .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    return: logs
};
parseLogLine(line, string, service, string);
any;
{
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)/);
    const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
    const message = timestampMatch ? line.substring(timestampMatch[0].length).trim() : line;
    // Determine log level
    let level = 'info';
    if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
        level = 'error';
    }
    else if (message.toLowerCase().includes('warn') || message.toLowerCase().includes('warning')) {
        level = 'warn';
    }
    else if (message.toLowerCase().includes('debug')) {
        level = 'debug';
    }
    return {
        timestamp,
        service,
        level,
        message
    };
}
matchesFilters(log, any, options, any);
boolean;
{
    if (options.level && log.level !== options.level) {
        return false;
    }
    if (options.grep && !log.message.includes(options.grep)) {
        return false;
    }
    return true;
}
/**
 * Monitor traces subcommand
 */
class MonitorTracesSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-s, --service <service>', 'Show traces for specific service')
            .option('--trace-id <traceId>', 'Show specific trace')
            .option('--duration <seconds>', 'Filter by minimum duration');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            const traces = await this.getTraces(options);
            console.log(chalk.blue.bold('🔍 Distributed Traces\n'));
            if (traces.length === 0) {
                console.log(chalk.yellow('No traces found'));
                return;
            }
            traces.forEach((trace) => {
                const durationIcon = trace.duration > 1000 ? chalk.red('⚠️') :
                    trace.duration > 500 ? chalk.yellow('⏱️') :
                        chalk.green('✅');
                `
          console.log(${durationIcon}`;
                $;
                {
                    chalk.white.bold(trace.traceId);
                }
            });
            `
          console.log(chalk.gray(  Service: ${trace.service}));`;
            console.log(chalk.gray(Operation, $, { trace, : .operation } `));
          console.log(chalk.gray(  Duration: ${trace.duration}ms));`, console.log(chalk.gray(Status, $, { trace, : .status }))));
            `
          console.log(chalk.gray(  Timestamp: ${trace.timestamp}`;
        });
        ;
        if (trace.spans && trace.spans.length > 0) {
            console.log(chalk.gray('  Spans:'));
            trace.spans.forEach((span) => {
                console.log(chalk.gray(-$, { span, : .operation }, $, { span, : .duration }, ms));
            });
        }
        console.log();
    }
    ;
}
return {
    traces,
    count: traces.length,
    timestamp: new Date().toISOString()
};
'Traces retrieved successfully',
    'Failed to get traces';
;
async;
getTraces(options, any);
Promise < any[] > {
    // This would integrate with a real tracing system like Jaeger or Zipkin
    // For now, return mock data
    const: traces = [
        {
            traceId: 'abc123',
            service: 'api-service',
            operation: 'GET /api/users',
            duration: 250,
            status: 'success',
            timestamp: new Date().toISOString(),
            spans: [
                { operation: 'database query', duration: 100 },
                { operation: 'cache lookup', duration: 50 },
                { operation: 'response serialization', duration: 100 }
            ]
        },
        {
            traceId: 'def456',
            service: 'user-service',
            operation: 'POST /api/auth',
            duration: 1200,
            status: 'error',
            timestamp: new Date(Date.now() - 60000).toISOString(),
            spans: [
                { operation: 'authentication', duration: 800 },
                { operation: 'token generation', duration: 400 }
            ]
        }
    ],
    // Apply filters
    if(options) { }, : .service
};
{
    return traces.filter(trace => trace.service.includes(options.service));
}
if (options.traceId) {
    return traces.filter(trace => trace.traceId === options.traceId);
}
if (options.duration) {
    return traces.filter(trace => trace.duration >= parseInt(options.duration));
}
return traces;
/**
 * Monitor dashboard subcommand
 */
class MonitorDashboardSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-s, --service <service>', 'Show dashboard for specific service')
            .option('-p, --port <port>', 'Port to run dashboard on', '3001')
            .option('--open', 'Open dashboard in browser');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            `
        console.log(chalk.blue('📊 Starting monitoring dashboard...'));`;
            const dashboardUrl = http, //localhost:${options.port}`;
            console, log;
            (chalk.blue(Dashboard, available, at, $, { dashboardUrl }));
            if (options.open) {
                const open = await import('open');
                await open.default(dashboardUrl);
            }
            // Start a simple dashboard server
            await this.startDashboard(options.port, options.service);
            return {
                url: dashboardUrl,
                service: options.service,
                timestamp: new Date().toISOString()
            };
        }, 'Dashboard started successfully', 'Failed to start dashboard');
    }
    async startDashboard(port, service) {
        `
    // This would start a real dashboard server`;
        // For now, just show what would be started
        console.log(chalk.blue(Dashboard, server, would, start, on, port, $, { port } `));
    console.log(chalk.gray('Features:'));
    console.log(chalk.gray('  - Real-time metrics'));
    console.log(chalk.gray('  - Service health monitoring'));
    console.log(chalk.gray('  - Alert management'));
    console.log(chalk.gray('  - Log viewing'));
    console.log(chalk.gray('  - Distributed tracing'));
    
    if (service) {
      console.log(chalk.gray(  - Focused on service: ${service}));
    }
  }
}

/**
 * Monitor config subcommand
 */
class MonitorConfigSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .option('--get <key>', 'Get configuration value')
      .option('--set <key>', 'Set configuration value')
      .option('--value <value>', 'Value to set (use with --set)')
      .option('-s, --service <service>', 'Service to configure')
      .option('--list', 'List all configuration values');
  }

  protected async handleCommand(options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        if (options.get) {`));
        const value = await this.getConfig(options.get, options.service);
        `
          console.log(chalk.blue(${options.get}:), value);
        } else if (options.set) {
          if (!options.value) {
            throw new Error('--value is required when using --set');
          }
          await this.setConfig(options.get, options.value, options.service);`;
        console.log(chalk.green(`✅ Set ${options.get} = ${options.value}));
        } else if (options.list) {`));
        const config = await this.listConfig(options.service);
        `
          console.log(chalk.blue.bold(Monitoring Configuration${options.service ?  : ;
        for ($; { options, : .service }; )
            : '';
    }
    ;
    console;
    log(JSON, stringify) { }
}
(config, null, 2);
;
{
    // Interactive configuration
    await this.interactiveConfig(options.service);
}
return {
    operation: options.get ? 'get' : options.set ? 'set' : options.list ? 'list' : 'interactive',
    service: options.service,
    timestamp: new Date().toISOString()
};
'Monitoring configuration completed',
    'Failed to configure monitoring';
;
async;
getConfig(key, string, service ?  : string);
Promise < any > {
    const: configPath = path.join(process.cwd(), '.tnf', 'monitor-config.json'),
    if(fs) { }, : .existsSync(configPath)
};
{
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (service) {
        return config[service]?.[key];
    }
    return config[key];
}
return null;
async;
setConfig(key, string, value, any, service ?  : string);
Promise < void  > {
    const: configPath = path.join(process.cwd(), '.tnf', 'monitor-config.json'),
    const: configDir = path.dirname(configPath),
    if(, fs) { }, : .existsSync(configDir)
};
{
    fs.mkdirSync(configDir, { recursive: true });
}
let config = {};
if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}
if (service) {
    if (!config[service])
        config[service] = {};
    config[service][key] = value;
}
else {
    config[key] = value;
}
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
async;
listConfig(service ?  : string);
Promise < any > {
    const: configPath = path.join(process.cwd(), '.tnf', 'monitor-config.json'),
    if(fs) { }, : .existsSync(configPath)
};
{
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return service ? config[service] || {} : config;
}
return {};
async;
interactiveConfig(service ?  : string);
Promise < void  > {
    const: inquirer = await import('inquirer')
} `
    console.log(chalk.blue(🔧 Configuring monitoring${service ?  : ;
for ($; { service } ` : ''}\n));

    const answers = await inquirer.default.prompt([
      {
        type: 'confirm',
        name: 'enableMetrics',
        message: 'Enable metrics collection:',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableLogging',
        message: 'Enable log collection:',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableTracing',
        message: 'Enable distributed tracing:',
        default: false
      },
      {
        type: 'list',
        name: 'alertLevel',
        message: 'Default alert level:',
        choices: ['info', 'warning', 'critical'],
        default: 'warning'
      }
    ]);

    // Save configuration
    for (const [key, value] of Object.entries(answers)) {
      await this.setConfig(key, value, service);
    }

    console.log(chalk.green('✅ Configuration saved'));
  }
}

/**
 * Monitor health subcommand
 */
class MonitorHealthSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .option('-c, --comprehensive', 'Run comprehensive health checks')
      .option('--export <format>', 'Export health report (json|yaml)')
      .option('-s, --service <service>', 'Check health for specific service');
  }

  protected async handleCommand(options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        console.log(chalk.blue('🏥 Running health checks...'));
        
        const healthReport = await this.performHealthChecks(options);
        
        const overallHealth = healthReport.checks.filter((check: any) => check.status === 'healthy').length;
        const totalChecks = healthReport.checks.length;
        
        console.log(chalk.blue(\nHealth Summary: ${overallHealth}/${totalChecks} checks passed`;)
    ;
;
if (overallHealth === totalChecks) {
    console.log(chalk.green('✅ All health checks passed'));
}
else {
    console.log(chalk.red('❌ Some health checks failed'));
    healthReport.checks.forEach((check) => {
        if (check.status === 'unhealthy') {
            console.log(chalk.red(-$, { check, : .name }, $, { check, : .message }));
        }
    });
}
// Export if requested
if (options.export) {
    await this.exportHealthReport(healthReport, options.export);
}
return {
    report: healthReport,
    overallHealth: overallHealth === totalChecks ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString()
};
'Health checks completed',
    'Failed to run health checks';
;
async;
performHealthChecks(options, any);
Promise < any > {
    const: checks = [],
    // Docker health check
    try: {
        checks, : .push({
            name: 'Docker daemon',
            status: 'healthy',
            message: 'Docker daemon is running'
        })
    }, catch(error) {
        checks.push({
            name: 'Docker daemon',
            status: 'unhealthy',
            message: 'Docker daemon is not accessible'
        });
    }
    // Container health checks
    ,
    // Container health checks
    try: {
        const: containers = execSync('docker ps --format "{{.Names}}\t{{.Status}}"', { encoding: 'utf8' }),
        const: healthyContainers = containers.split('\n')
            .filter(line => line.trim())
            .filter(line => line.includes('healthy')),
        checks, : .push({
            name: 'Container health',
        } `
        status: healthyContainers.length > 0 ? 'healthy' : 'warning',`, message, $, { healthyContainers, : .length } ` healthy containers
      });
    } catch (error) {
      checks.push({
        name: 'Container health',
        status: 'unhealthy',
        message: 'Could not check container health'
      });
    }

    // System resource checks
    const memUsage = this.getMemoryUsage();
    checks.push({
      name: 'Memory usage',
      status: memUsage < 90 ? 'healthy' : memUsage < 95 ? 'warning' : 'unhealthy',
      message: Memory usage is ${memUsage}%
    });

    // Disk space check
    const diskUsage = await this.getDiskUsage();
    checks.push({
      name: 'Disk space',`, status, diskUsage < 80 ? 'healthy' : diskUsage < 90 ? 'warning' : 'unhealthy', `
      message: `, Disk, usage, is, $, { diskUsage } %
        )
    },
    // Service-specific checks
    if(options) { }, : .service
};
{
    const serviceHealth = await this.checkServiceHealth(options.service);
    checks.push(serviceHealth);
}
// Comprehensive checks
if (options.comprehensive) {
    const comprehensiveChecks = await this.runComprehensiveChecks();
    checks.push(...comprehensiveChecks);
}
return {
    timestamp: new Date().toISOString(),
    checks
};
getMemoryUsage();
number;
{
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return Math.round(((totalMem - freeMem) / totalMem) * 100);
}
async;
getDiskUsage();
Promise < number > {
    try: {
        const: stats = fs.statSync('.'),
        return: Math.random() * 100
    }, catch(error) {
        return 0;
    }
};
async;
checkServiceHealth(service, string);
Promise < any > {
    try: {
        const: containerInfo = execSync(docker, inspect, $, { service }, { encoding: 'utf8' }),
        const: info = JSON.parse(containerInfo),
        const: health = info[0]?.State?.Health?.Status || 'unknown'
    } `
      return {`,
    name: Service, health: $
};
{
    service;
}
`,
        status: health === 'healthy' ? 'healthy' : health === 'unhealthy' ? 'unhealthy' : 'warning',
        message: Service ${service} is ${health}
      };
    } catch (error) {
      return {`;
name: Service;
health: $;
{
    service;
}
`
        status: 'unhealthy',`;
message: Could;
not;
check;
health;
of;
$;
{
    service;
}
;
async;
runComprehensiveChecks();
Promise < any[] > {
    const: checks = [],
    // Network connectivity check
    try: {
        checks, : .push({
            name: 'Network connectivity',
            status: 'healthy',
            message: 'Network is reachable'
        })
    }, catch(error) {
        checks.push({
            name: 'Network connectivity',
            status: 'unhealthy',
            message: 'Network is not reachable'
        });
    }
    // Process count check
    ,
    // Process count check
    try: {
        const: processCount = os.cpus().length,
        checks, : .push({
            name: 'System processes',
        } `
        status: 'healthy',`, message, $, { processCount }, CPU, cores, detected `
      });
    } catch (error) {
      checks.push({
        name: 'System processes',
        status: 'warning',
        message: 'Could not determine system information'
      });
    }

    return checks;
  }

  private async exportHealthReport(report: any, format: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = health-report-${timestamp}.${format};
    
    if (format === 'json') {
      fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    } else if (format === 'yaml') {
      // Simple YAML conversion
      const yaml = JSON.stringify(report, null, 2)
        .replace(/"/g, '')
        .replace(/,/g, '')
        .replace(/\{/g, '')
        .replace(/\}/g, '');
      fs.writeFileSync(filename, yaml);
    }` `
    console.log(chalk.green(✅ Health report exported to: ${filename}` `));
  }
}

/**
 * Register the monitor category command
 */
export function registerMonitorCommands(program: Command): Command {
  const monitorCommand = new MonitorCommand(program);
  return monitorCommand.createCategoryCommand();
})
    }
};
//# sourceMappingURL=monitor.js.map
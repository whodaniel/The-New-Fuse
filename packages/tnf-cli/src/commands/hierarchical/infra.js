import { CategoryCommand, SubcommandCommand } from './base.js';
import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
/**
 * Infra category command implementation
 */
export class InfraCommand extends CategoryCommand {
    constructor(program) {
        super('infra', 'Infrastructure management', program);
        this.initializeSubcommands();
    }
    initializeSubcommands() {
        // Status subcommand
        this.registerSubcommand('status', new InfraStatusSubcommand('infra', 'status', 'Infrastructure status', this.program).createSubcommand());
        // Provision subcommand
        this.registerSubcommand('provision', new InfraProvisionSubcommand('infra', 'provision', 'Provision resources', this.program).createSubcommand());
        // Teardown subcommand
        this.registerSubcommand('teardown', new InfraTeardownSubcommand('infra', 'teardown', 'Teardown resources', this.program).createSubcommand());
        // Scale subcommand
        this.registerSubcommand('scale', new InfraScaleSubcommand('infra', 'scale', 'Scale services', this.program).createSubcommand());
        // Backup subcommand
        this.registerSubcommand('backup', new InfraBackupSubcommand('infra', 'backup', 'Create backups', this.program).createSubcommand());
        // Restore subcommand
        this.registerSubcommand('restore', new InfraRestoreSubcommand('infra', 'restore', 'Restore from backup', this.program).createSubcommand());
        // Monitor subcommand
        this.registerSubcommand('monitor', new InfraMonitorSubcommand('infra', 'monitor', 'Infrastructure monitoring', this.program).createSubcommand());
        // Config subcommand
        this.registerSubcommand('config', new InfraConfigSubcommand('infra', 'config', 'Infrastructure configuration', this.program).createSubcommand());
    }
}
/**
 * Infrastructure status subcommand
 */
class InfraStatusSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-d, --detailed', 'Show detailed status information')
            .option('--json', 'Output in JSON format')
            .option('--service <service>', 'Show status for specific service');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            const infraStatus = await this.getInfrastructureStatus(options);
            if (options.json) {
                this.formatOutput(infraStatus, options);
                return;
            }
            console.log(chalk.blue.bold('🏗️  Infrastructure Status\n'));
            // Display overall status
            const overallHealth = infraStatus.services?.filter((s) => s.status === 'healthy').length || 0;
            const totalServices = infraStatus.services?.length || 0;
            console.log(chalk.white(`Overall Health: ${overallHealth}/${totalServices} services healthy));
        console.log();

        // Display service status
        if (infraStatus.services) {
          infraStatus.services.forEach((service: any) => {
            const statusIcon = service.status === 'healthy' ? chalk.green('●') : chalk.red('○');
            const statusText = service.status === 'healthy' ? chalk.green('Healthy') : chalk.red('Unhealthy');
            `, console.log($, { statusIcon } ` ${chalk.white.bold(service.name)}`, $, { statusText })));
            if (options.detailed) {
                `
              if (service.version) console.log(chalk.gray(  Version: ${service.version}`;
            }
        });
        ;
        if (service.uptime)
            console.log(chalk.gray(Uptime, $, { service, : .uptime } `));
              if (service.resources) {
                console.log(chalk.gray(  CPU: ${service.resources.cpu}%));`, console.log(chalk.gray(Memory, $, { service, : .resources.memory } `%));
              }
            }
            console.log();
          });
        }

        return {
          status: infraStatus,
          timestamp: new Date().toISOString()
        };
      },
      'Infrastructure status retrieved successfully',
      'Failed to get infrastructure status'
    );
  }

  private async getInfrastructureStatus(options: any): Promise<any> {
    const services = [];
    
    // Check Docker services
    try {
      const dockerServices = execSync('docker ps --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"', 
        { encoding: 'utf8' });
      
      dockerServices.split('\n').forEach(line => {
        if (line.trim()) {
          const [name, status, ports] = line.split('\t');
          services.push({
            name,
            status: status.includes('healthy') ? 'healthy' : 'running',
            type: 'docker',
            ports: ports || 'N/A'
          });
        }
      });
    } catch (error) {
      // Docker not available
    }

    // Check Kubernetes services
    try {
      const k8sServices = execSync('kubectl get services --no-headers', 
        { encoding: 'utf8' });
      
      k8sServices.split('\n').forEach(line => {
        if (line.trim()) {
          const parts = line.split(/\s+/);
          const name = parts[0];
          const type = parts[1];
          const clusterIp = parts[2];
          
          services.push({
            name,
            status: 'healthy',
            type: 'kubernetes',
            clusterIp,
            serviceType: type
          });
        }
      });
    } catch (error) {
      // Kubernetes not available
    }

    // Check local processes
    const processesFile = path.join(os.homedir(), '.tnf', 'processes.json');
    if (fs.existsSync(processesFile)) {
      const processes = JSON.parse(fs.readFileSync(processesFile, 'utf8'));
      
      Object.entries(processes).forEach(([name, info]: [string, any]) => {
        if (info.pid) {
          try {
            process.kill(info.pid, 0); // Check if process exists
            services.push({
              name,
              status: 'healthy',
              type: 'process',
              pid: info.pid,
              startedAt: info.startedAt
            });
          } catch (error) {
            // Process not running
          }
        }
      });
    }

    // Filter by service if specified
    if (options.service) {
      return {
        services: services.filter(s => s.name.includes(options.service))
      };
    }

    return { services };
  }
}

/**
 * Infrastructure provision subcommand
 */
class InfraProvisionSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .option('-t, --template <template>', 'Infrastructure template to use')
      .option('-e, --env <environment>', 'Target environment', 'development')
      .option('--config <config>', 'Configuration file path')
      .option('--dry-run', 'Show what would be provisioned without actually provisioning');
  }

  protected async handleCommand(options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        console.log(chalk.blue('🏗️  Provisioning infrastructure...'));
        
        if (options.dryRun) {
          console.log(chalk.yellow('DRY RUN - The following resources would be provisioned:'));
          console.log('- Network: tnf-network');
          console.log('- Database: PostgreSQL');
          console.log('- Cache: Redis');
          console.log('- Storage: MinIO');
          return { dryRun: true };
        }

        const result = await this.provisionInfrastructure(options);
        
        console.log(chalk.green('✅ Infrastructure provisioned successfully'));
        
        return {
          provisioned: result,
          environment: options.env,
          timestamp: new Date().toISOString()
        };
      },
      'Infrastructure provisioned successfully',
      'Failed to provision infrastructure'
    );
  }

  private async provisionInfrastructure(options: any): Promise<any> {
    const resources = [];
    
    // Provision Docker network
    try {
      execSync('docker network create tnf-network', { stdio: 'pipe' });
      resources.push({ type: 'network', name: 'tnf-network', status: 'created' });
    } catch (error) {
      resources.push({ type: 'network', name: 'tnf-network', status: 'exists' });
    }

    // Provision database
    try {
      const dbCommand = docker run -d --name tnf-postgres --network tnf-network -e POSTGRES_PASSWORD=tnf123 -p 5432:5432 postgres:15;
      execSync(dbCommand, { stdio: 'pipe' });
      resources.push({ type: 'database', name: 'tnf-postgres', status: 'created' });
    } catch (error) {
      resources.push({ type: 'database', name: 'tnf-postgres', status: 'exists' });
    }

    // Provision cache
    try {
      const cacheCommand = docker run -d --name tnf-redis --network tnf-network -p 6379:6379 redis:7-alpine;
      execSync(cacheCommand, { stdio: 'pipe' });
      resources.push({ type: 'cache', name: 'tnf-redis', status: 'created' });
    } catch (error) {
      resources.push({ type: 'cache', name: 'tnf-redis', status: 'exists' });
    }

    return resources;
  }
}

/**
 * Infrastructure teardown subcommand
 */
class InfraTeardownSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .option('-e, --env <environment>', 'Target environment', 'development')
      .option('-f, --force', 'Force teardown without confirmation')
      .option('--service <service>', 'Teardown specific service only');
  }

  protected async handleCommand(options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        if (!options.force) {
          const inquirer = await import('inquirer');
          const answers = await inquirer.default.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Are you sure you want to teardown infrastructure? This will delete all resources.',
              default: false
            }
          ]);

          if (!answers.confirm) {
            console.log(chalk.yellow('Teardown cancelled'));
            return;
          }
        }

        console.log(chalk.blue('🏗️  Tearing down infrastructure...'));
        
        const result = await this.teardownInfrastructure(options);
        
        console.log(chalk.green('✅ Infrastructure torn down successfully'));
        
        return {
          tornDown: result,
          environment: options.env,
          timestamp: new Date().toISOString()
        };
      },
      'Infrastructure torn down successfully',
      'Failed to teardown infrastructure'
    );
  }

  private async teardownInfrastructure(options: any): Promise<any> {
    const resources = [];
    
    // Stop and remove containers
    const containers = ['tnf-postgres', 'tnf-redis'];
    
    for (const container of containers) {
      try {
        execSync(`, docker, stop, $, { container }, { stdio: 'pipe' }))));
        `
        execSync(docker rm ${container}`, { stdio: 'pipe' };
        ;
        resources.push({ type: 'container', name: container, status: 'removed' });
    }
    catch(error) {
        resources.push({ type: 'container', name: container, status: 'not_found' });
    }
}
// Remove network
try {
    execSync('docker network rm tnf-network', { stdio: 'pipe' });
    resources.push({ type: 'network', name: 'tnf-network', status: 'removed' });
}
catch (error) {
    resources.push({ type: 'network', name: 'tnf-network', status: 'not_found' });
}
return resources;
/**
 * Infrastructure scale subcommand
 */
class InfraScaleSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<service>', 'Service to scale')
            .argument('<replicas>', 'Number of replicas')
            .option('-r, --replicas <count>', 'Number of replicas (alternative to argument)')
            .option('--auto', 'Enable auto-scaling')
            .option('--policy <policy>', 'Scaling policy to apply');
    }
    async handleCommand(service, replicas, options) {
        await this.executeWithHandling(async () => {
            const replicaCount = parseInt(replicas || options.replicas || '1');
            if (isNaN(replicaCount) || replicaCount < 1) {
                throw new Error('Replicas must be a positive number');
            }
            console.log(chalk.blue(Scaling, service, $, { service }, to, $, { replicaCount } ` replicas...));
        
        const result = await this.scaleService(service, replicaCount, options);
        
        console.log(chalk.green(✅ Service ${service} scaled successfully));
        
        return {
          service,
          replicas: replicaCount,
          result,
          timestamp: new Date().toISOString()
        };
      },
      'Service scaled successfully',
      'Failed to scale service'
    );
  }

  private async scaleService(service: string, replicas: number, options: any): Promise<any> {
    try {
      // Docker scaling
      if (options.auto) {
        console.log(chalk.blue('Enabling auto-scaling...'));
        // In a real implementation, this would configure auto-scaling policies
        return { method: 'docker', autoScaling: true, replicas };
      } else {`));
            const scaleCommand = docker, service, scale, $, { service };
            `=${replicas};
        execSync(scaleCommand, { stdio: 'pipe' });
        return { method: 'docker', replicas, autoScaling: false };
      }
    } catch (error) {`;
            // Fallback to Kubernetes scaling`
            try {
                const scaleCommand = kubectl, scale, deployment, $, { service };
                --replicas;
                $;
                {
                    replicas;
                }
                `;
        execSync(scaleCommand, { stdio: 'pipe' });
        return { method: 'kubernetes', replicas };
      } catch (k8sError) {
        throw new Error(Failed to scale service: ${error.message});
      }
    }
  }
}

/**
 * Infrastructure backup subcommand
 */
class InfraBackupSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .option('-s, --service <service>', 'Service to backup (optional, backups all if not specified)')
      .option('-d, --destination <destination>', 'Backup destination path', './backups')
      .option('--compress', 'Compress backup files')
      .option('--retention <days>', 'Retention period in days', '7');
  }

  protected async handleCommand(options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        console.log(chalk.blue('💾 Creating infrastructure backup...'));
        
        const result = await this.createBackup(options);
        
        console.log(chalk.green('✅ Backup created successfully'));
        
        return {
          backup: result,
          destination: options.destination,
          timestamp: new Date().toISOString()
        };
      },
      'Backup created successfully',
      'Failed to create backup'
    );
  }
`;
            }
            finally {
            }
        }, private, async, createBackup(options, any), Promise < any > {} `
    const backupDir = path.resolve(options.destination);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `, infra - backup - $, { timestamp });
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        fs.mkdirSync(backupPath, { recursive: true });
        const backupInfo = {
            timestamp: new Date().toISOString(),
            services: [],
            files: []
        };
        // Backup Docker volumes
        try {
            const volumes = execSync('docker volume ls --format "{{.Name}}"', { encoding: 'utf8' });
            `
      volumes.split('\n').filter(v => v.trim()).forEach(volume => {`;
            try {
                const backupCommand = docker, run;
                --rm - v;
                $;
                {
                    volume;
                }
                /data -v ${backupPath}`:/backup;
                alpine;
                tar;
                czf / backup / $;
                {
                    volume;
                }
                tar.gz - C / data.;
                `
          execSync(backupCommand, { stdio: 'pipe' });
          backupInfo.services.push({ type: 'volume', name: volume, file: ${volume}.tar.gz });`;
            }
            catch (error) {
                `
          console.warn(chalk.yellow(Failed to backup volume ${volume}: ${error.message}));
        }
      });
    } catch (error) {
      console.warn(chalk.yellow('Could not list Docker volumes'));
    }

    // Backup configuration files
    const configFiles = ['docker-compose.yml', 'package.json', '.tnf/config.json'];
    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const destFile = path.join(backupPath, file);
        fs.copyFileSync(file, destFile);
        backupInfo.files.push(file);
      }
    });

    // Save backup metadata
    fs.writeFileSync(path.join(backupPath, 'backup-info.json'), JSON.stringify(backupInfo, null, 2));
    
    return {
      path: backupPath,
      info: backupInfo,
      size: this.calculateDirectorySize(backupPath)
    };
  }

  private calculateDirectorySize(dirPath: string): number {
    let totalSize = 0;
    
    function calculateSize(filePath: string): void {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        fs.readdirSync(filePath).forEach(file => {
          calculateSize(path.join(filePath, file));
        });
      } else {
        totalSize += stats.size;
      }
    }
    
    calculateSize(dirPath);
    return totalSize;
  }
}

/**
 * Infrastructure restore subcommand
 */
class InfraRestoreSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('<backup>', 'Backup to restore from')
      .option('-s, --service <service>', 'Service to restore (optional, restores all if not specified)')
      .option('--force', 'Force restore without confirmation');
  }

  protected async handleCommand(backup: string, options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        if (!options.force) {
          const inquirer = await import('inquirer');
          const answers = await inquirer.default.prompt([
            {`;
                type: 'confirm', `
              name: 'confirm',`;
                message: Are;
                you;
                sure;
                you;
                want;
                to;
                restore;
                from;
                backup;
                "${backup}" ? This : ;
                will;
                overwrite;
                current;
                data.,
                ;
            }
        }
        finally {
        }
    }
    default;
}
;
if (!answers.confirm) {
    console.log(chalk.yellow('Restore cancelled'));
    return;
}
`
        console.log(chalk.blue(🔄 Restoring from backup: ${backup}`;
;
const result = await this.restoreFromBackup(backup, options);
console.log(chalk.green('✅ Backup restored successfully'));
return {
    backup,
    restored: result,
    timestamp: new Date().toISOString()
};
'Backup restored successfully',
    'Failed to restore backup';
;
async;
restoreFromBackup(backup, string, options, any);
Promise < any > {
    const: backupPath = path.resolve(backup),
    if(, fs) { }, : .existsSync(backupPath)
};
{
    throw new Error(Backup, not, found, $, { backupPath } `);
    }

    const backupInfoPath = path.join(backupPath, 'backup-info.json');
    if (!fs.existsSync(backupInfoPath)) {
      throw new Error('Invalid backup: missing backup-info.json');
    }

    const backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf8'));
    const restored = [];

    // Restore Docker volumes
    backupInfo.services.forEach((service: any) => {
      if (service.type === 'volume') {
        try {
          const restoreCommand = docker run --rm -v ${service.name}:/data -v ${backupPath}:/backup alpine tar xzf /backup/${service.file} -C /data;
          execSync(restoreCommand, { stdio: 'pipe' });
          restored.push(service);
        } catch (error) {`, console.warn(chalk.yellow(Failed, to, restore, volume, $, { service, : .name } `: ${error.message}));
        }
      }
    });

    // Restore configuration files
    backupInfo.files.forEach((file: string) => {
      const sourceFile = path.join(backupPath, file);
      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, file);
        restored.push({ type: 'config', file });
      }
    });

    return restored;
  }
}

/**
 * Infrastructure monitor subcommand
 */
class InfraMonitorSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .option('-s, --service <service>', 'Service to monitor')
      .option('--metrics', 'Show detailed metrics')
      .option('--watch', 'Watch for changes');
  }

  protected async handleCommand(options: any): Promise<void> {
    const displayMetrics = async () => {
      const metrics = await this.getInfrastructureMetrics(options);
      
      console.log(chalk.blue.bold('📊 Infrastructure Metrics\n'));
      `, metrics.forEach((metric) => {
        `
        console.log(chalk.white.bold(${metric.name}:));`;
        console.log(chalk.gray(`  Status: ${metric.status}));`, console.log(chalk.gray(CPU, $, { metric, : .cpu } % ))));
        `
        console.log(chalk.gray(  Memory: ${metric.memory}` % ;
    }))));
    if (metric.disk)
        console.log(chalk.gray(Disk, $, { metric, : .disk } % ));
    `
        if (metric.network) console.log(chalk.gray(  Network: ${metric.network}));
        console.log();
      });
    };

    if (options.watch) {
      console.log(chalk.blue('Watching infrastructure metrics (Press Ctrl+C to stop)...'));
      const interval = setInterval(displayMetrics, 5000);
      
      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log(chalk.yellow('\nStopped watching metrics'));
        process.exit(0);
      });
    } else {
      await displayMetrics();
    }
  }

  private async getInfrastructureMetrics(options: any): Promise<any[]> {
    const metrics = [];
    
    // Get Docker container metrics
    try {
      const stats = execSync('docker stats --no-stream --format "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"', 
        { encoding: 'utf8' });
      
      stats.split('\n').filter(line => line.trim()).forEach(line => {
        const [name, cpu, memory] = line.split('\t');
        metrics.push({
          name,
          status: 'running',
          cpu: parseFloat(cpu.replace('%', '')),
          memory: this.parseMemoryUsage(memory)
        });
      });
    } catch (error) {
      console.warn(chalk.yellow('Could not get Docker metrics'));
    }

    return metrics;
  }

  private parseMemoryUsage(memoryStr: string): number {
    const match = memoryStr.match(/(\d+\.?\d*)(\w+)\/(\d+\.?\d*)(\w+)/);
    if (match) {
      const used = parseFloat(match[1]);
      const total = parseFloat(match[3]);
      return Math.round((used / total) * 100);
    }
    return 0;
  }
}

/**
 * Infrastructure config subcommand
 */
class InfraConfigSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .option('--get <key>', 'Get configuration value')
      .option('--set <key>', 'Set configuration value')
      .option('--value <value>', 'Value to set (use with --set)')
      .option('--service <service>', 'Service to configure')
      .option('--list', 'List all configuration values');
  }

  protected async handleCommand(options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        if (options.get) {
          const value = await this.getConfig(options.get, options.service);`;
    console.log(chalk.blue($, { options, : .get } `:), value);
        } else if (options.set) {
          if (!options.value) {
            throw new Error('--value is required when using --set');
          }
          await this.setConfig(options.set, options.value, options.service);
          console.log(chalk.green(✅ Set ${options.set} = ${options.value}));
        } else if (options.list) {
          const config = await this.listConfig(options.service);
          console.log(chalk.blue.bold('Infrastructure Configuration:'));
          console.log(JSON.stringify(config, null, 2));
        } else {
          // Interactive configuration
          await this.interactiveConfig(options.service);
        }

        return {
          operation: options.get ? 'get' : options.set ? 'set' : options.list ? 'list' : 'interactive',
          service: options.service,
          timestamp: new Date().toISOString()
        };
      },
      'Infrastructure configuration completed',
      'Failed to configure infrastructure'
    );
  }

  private async getConfig(key: string, service?: string): Promise<any> {
    const configPath = path.join(process.cwd(), '.tnf', 'infra-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (service) {
        return config[service]?.[key];
      }
      return config[key];
    }
    return null;
  }

  private async setConfig(key: string, value: any, service?: string): Promise<void> {
    const configPath = path.join(process.cwd(), '.tnf', 'infra-config.json');
    const configDir = path.dirname(configPath);
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    if (service) {
      if (!config[service]) config[service] = {};
      config[service][key] = value;
    } else {
      config[key] = value;
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  private async listConfig(service?: string): Promise<any> {
    const configPath = path.join(process.cwd(), '.tnf', 'infra-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return service ? config[service] || {} : config;
    }
    return {};
  }

  private async interactiveConfig(service?: string): Promise<void> {`));
    const inquirer = await import('inquirer');
    `
    
    console.log(chalk.blue(🔧 Configuring infrastructure${service ?  : ;
    for ($; { service } ` : ''}\n`;)
        ;
    ;
    const answers = await inquirer.default.prompt([
        {
            type: 'list',
            name: 'environment',
            message: 'Environment:',
            choices: ['development', 'staging', 'production']
        },
        {
            type: 'confirm',
            name: 'autoBackup',
            message: 'Enable automatic backups:',
            default: true
        },
        {
            type: 'number',
            name: 'backupRetention',
            message: 'Backup retention (days):',
            default: 7,
            when: (answers) => answers.autoBackup
        }
    ]);
    // Save configuration
    for (const [key, value] of Object.entries(answers)) {
        await this.setConfig(key, value, service);
    }
    console.log(chalk.green('✅ Configuration saved'));
}
/**
 * Register the infra category command
 */
export function registerInfraCommands(program) {
    const infraCommand = new InfraCommand(program);
    return infraCommand.createCategoryCommand();
}
//# sourceMappingURL=infra.js.map
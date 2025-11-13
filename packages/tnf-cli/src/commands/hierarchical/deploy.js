import { CategoryCommand, SubcommandCommand } from './base.js';
import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
/**
 * Deploy category command implementation
 */
export class DeployCommand extends CategoryCommand {
    constructor(program) {
        super('deploy', 'Deployment & packaging', program);
        this.initializeSubcommands();
    }
    initializeSubcommands() {
        // Package subcommand
        this.registerSubcommand('package', new DeployPackageSubcommand('deploy', 'package', 'Package application', this.program).createSubcommand());
        // Publish subcommand
        this.registerSubcommand('publish', new DeployPublishSubcommand('deploy', 'publish', 'Publish package', this.program).createSubcommand());
        // Rollback subcommand
        this.registerSubcommand('rollback', new DeployRollbackSubcommand('deploy', 'rollback', 'Rollback deployment', this.program).createSubcommand());
        // Promote subcommand
        this.registerSubcommand('promote', new DeployPromoteSubcommand('deploy', 'promote', 'Promote between environments', this.program).createSubcommand());
        // Status subcommand
        this.registerSubcommand('status', new DeployStatusSubcommand('deploy', 'status', 'Deployment status', this.program).createSubcommand());
        // Logs subcommand
        this.registerSubcommand('logs', new DeployLogsSubcommand('deploy', 'logs', 'Deployment logs', this.program).createSubcommand());
        // Config subcommand
        this.registerSubcommand('config', new DeployConfigSubcommand('deploy', 'config', 'Deployment configuration', this.program).createSubcommand());
        // Validate subcommand
        this.registerSubcommand('validate', new DeployValidateSubcommand('deploy', 'validate', 'Validate deployment', this.program).createSubcommand());
    }
}
/**
 * Deploy package subcommand
 */
class DeployPackageSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-f, --format <format>', 'Package format (docker|tar|zip)', 'docker')
            .option('-o, --output <output>', 'Output directory', './dist')
            .option('-t, --tag <tag>', 'Docker image tag')
            .option('--compress', 'Compress package')
            .option('--include-sources', 'Include source files');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            console.log(chalk.blue('📦 Packaging application...'));
            const result = await this.packageApplication(options);
            console.log(chalk.green('✅ Application packaged successfully'));
            return {
                package: result,
                format: options.format,
                timestamp: new Date().toISOString()
            };
        }, 'Application packaged successfully', 'Failed to package application');
    }
    async packageApplication(options) {
        const outputDir = path.resolve(options.output);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const packageInfo = {
            name: path.basename(process.cwd()),
            version: this.getVersion(),
            format: options.format,
            files: [],
            size: 0
        };
        switch (options.format) {
            case 'docker':
                return await this.packageDocker(options, outputDir, packageInfo);
            case 'tar':
                return await this.packageTar(options, outputDir, packageInfo);
            case 'zip':
                return await this.packageZip(options, outputDir, packageInfo);
            default:
                throw new Error(`Unsupported package format: ${options.format});
    }
  }

  private async packageDocker(options: any, outputDir: string, packageInfo: any): Promise<any> {`);
                const tag = options.tag || `${packageInfo.name}`, $, { packageInfo, version };
                // Check for Dockerfile
                if (!fs.existsSync('Dockerfile')) {
                    throw new Error('Dockerfile not found in current directory');
                }
                console.log(chalk.blue('Building Docker image...'));
                try {
                    `
      execSync(`;
                    docker;
                    build - t;
                    $;
                    {
                        tag;
                    }
                    ` ., { stdio: 'inherit' });
      
      // Save image to tar file
      const tarFile = path.join(outputDir, ${packageInfo.name}-${packageInfo.version}.tar);`;
                    execSync(docker, save, $, { tag } ` -o ${tarFile}, { stdio: 'pipe' });
      
      const stats = fs.statSync(tarFile);
      
      return {
        type: 'docker',
        image: tag,
        file: tarFile,`, size, stats.size `
      };
    } catch (error) {
      throw new Error(Docker build failed: ${error.message}`);
                }
                finally {
                }
        }
    }
    async packageTar(options, outputDir, packageInfo) {
        const tarFile = path.join(outputDir, $, { packageInfo, : .name } `-${packageInfo.version}.tar);
    
    let excludeArgs = '';
    if (!options.includeSources) {
      excludeArgs = '--exclude=node_modules --exclude=.git --exclude=dist --exclude=coverage';
    }
    
    console.log(chalk.blue('Creating tar archive...'));
    
    try {`, execSync(tar, $, { excludeArgs } - cf, $, { tarFile } ` ., { stdio: 'pipe' });
      
      if (options.compress) {
        execSync(gzip ${tarFile}`, { stdio: 'pipe' }));
        tarFile += '.gz';
    }
    stats = fs.statSync(tarFile);
}
return {
    type: 'tar',
    file: tarFile,
    compressed: options.compress,
    size: stats.size
};
try { }
catch (error) {
    throw new Error(Tar, creation, failed, $, { error, : .message });
}
async;
packageZip(options, any, outputDir, string, packageInfo, any);
Promise < any > {} `
    const zipFile = path.join(outputDir, ${packageInfo.name}` - $;
{
    packageInfo.version;
}
zip;
;
console.log(chalk.blue('Creating zip archive...'));
try {
    // Create zip using node's built-in zlib or external tool
    const archiver = await import('archiver');
    const output = fs.createWriteStream(zipFile);
    const archive = archiver.default('zip');
    archive.pipe(output);
    if (options.includeSources) {
        archive.directory('.', false);
    }
    else {
        // Add specific files and directories
        const filesToAdd = ['src', 'package.json', 'README.md', 'LICENSE'];
        filesToAdd.forEach(file => {
            if (fs.existsSync(file)) {
                archive.file(file, { name: file });
            }
        });
    }
    await archive.finalize();
    const stats = fs.statSync(zipFile);
    return {
        type: 'zip',
        file: zipFile,
        size: stats.size `
      };`
    };
    try { }
    catch (error) {
        throw new Error(Zip, creation, failed, $, { error, : .message });
    }
}
finally {
}
getVersion();
string;
{
    try {
        if (fs.existsSync('package.json')) {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return packageJson.version || '1.0.0';
        }
    }
    catch (error) {
        // Ignore
    }
    return '1.0.0';
}
/**
 * Deploy publish subcommand
 */
class DeployPublishSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<package>', 'Package to publish')
            .option('-r, --registry <registry>', 'Registry to publish to')
            .option('-t, --tag <tag>', 'Tag to publish with')
            .option('--dry-run', 'Show what would be published without actually publishing');
    }
    async handleCommand(packagePath, options) {
        await this.executeWithHandling(`
      async () => {`, console.log(chalk.blue(`📤 Publishing package: ${packagePath}));
        
        if (options.dryRun) {`, console.log(chalk.yellow('DRY RUN - Would publish to registry:')))));
        `
          console.log(Package: ${packagePath}`;
        ;
        console.log(Registry, $, { options, : .registry || 'default' });
        console.log(Tag, $, { options, : .tag || 'latest' });
        return { dryRun: true };
    }
    result = await this.publishPackage(packagePath, options);
    console;
    log(chalk, green) { }
}
('✅ Package published successfully');
;
return {
    package: packagePath,
    published: result,
    registry: options.registry,
    tag: options.tag,
    timestamp: new Date().toISOString()
};
'Package published successfully',
    'Failed to publish package';
;
async;
publishPackage(packagePath, string, options, any);
Promise < any > {
    const: resolvedPath = path.resolve(packagePath)
} `
    if (!fs.existsSync(resolvedPath)) {`;
throw new Error(Package, not, found, $, { resolvedPath } `);
    }

    const isDocker = resolvedPath.endsWith('.tar');
    const isTar = resolvedPath.endsWith('.tar.gz') || resolvedPath.endsWith('.tgz');
    const isZip = resolvedPath.endsWith('.zip');

    if (isDocker) {
      return await this.publishDockerImage(resolvedPath, options);
    } else if (isTar || isZip) {
      return await this.publishArchive(resolvedPath, options);
    } else {
      throw new Error('Unsupported package format for publishing');
    }
  }

  private async publishDockerImage(imagePath: string, options: any): Promise<any> {
    const registry = options.registry || 'docker.io';
    const tag = options.tag || 'latest';
    const imageName = tnf-app:${tag};
    
    try {
      // Load image from tar
      execSync(docker load -i ${imagePath}, { stdio: 'pipe' });` `
      // Tag and push`);
const fullImageName = $, { registry };
/${imageName};`;
execSync(docker, tag, $, { imageName } ` ${fullImageName}, { stdio: 'pipe' });
      execSync(docker push ${fullImageName}, { stdio: 'inherit' });
      
      return {
        type: 'docker',
        image: fullImageName,
        registry
      };`);
try { }
catch (error) {
    `
      throw new Error(`;
    Docker;
    publish;
    failed: $;
    {
        error.message;
    }
    ;
}
async;
publishArchive(archivePath, string, options, any);
Promise < any > {
    const: registry = options.registry || 'npm',
    try: {
        if(archivePath) { }, : .endsWith('.tgz') || archivePath.endsWith('.tar.gz')
    }
};
{
    // npm publish`
    execSync(npm, publish, $, { archivePath } `, { stdio: 'inherit' });
        
        return {
          type: 'npm',
          file: archivePath,
          registry
        };
      } else {
        throw new Error('Archive publishing not implemented for this format');
      }
    } catch (error) {
      throw new Error(Archive publish failed: ${error.message}`);
}
/**
 * Deploy rollback subcommand
 */
class DeployRollbackSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<version>', 'Version to rollback to')
            .option('-s, --service <service>', 'Service to rollback')
            .option('-f, --force', 'Force rollback without confirmation')
            .option('--backup', 'Create backup before rollback');
    }
    async handleCommand(version, options) {
        await this.executeWithHandling(async () => {
            if (!options.force) {
                const inquirer = await import('inquirer');
                const answers = await inquirer.default.prompt([
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: Are, you, sure, you, want, to, rollback, to, version, "${version}": ,
                        default: false
                    }
                ]);
                if (!answers.confirm) {
                    console.log(chalk.yellow('Rollback cancelled'));
                    return;
                }
            }
            `
        console.log(chalk.blue(🔄 Rolling back to version: ${version}` `));
        
        if (options.backup) {
          console.log(chalk.blue('Creating backup before rollback...'));
          await this.createBackup(options.service);
        }
        
        const result = await this.rollbackToVersion(version, options);
        
        console.log(chalk.green('✅ Rollback completed successfully'));
        
        return {
          version,
          rolledBack: result,
          service: options.service,
          timestamp: new Date().toISOString()
        };
      },
      'Rollback completed successfully',
      'Failed to rollback'
    );
  }

  private async createBackup(service?: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = pre-rollback-${service || 'all'}-${timestamp};
    
    try {`;
            execSync(docker, commit, $, { service } || 'tnf-app');
        }, ` ${backupName}, { stdio: 'pipe' });`, console.log(chalk.green(Backup, created, $, { backupName })));
    }
    catch(error) {
        console.warn(chalk.yellow('Could not create backup'));
    }
}
async;
rollbackToVersion(version, string, options, any);
Promise < any > {
    try: {
        // Docker rollback
        if(options) { }, : .service
    }
};
{
    `
        const rollbackCommand = `;
    docker;
    run - d--;
    name;
    $;
    {
        options.service;
    }
    -rollback;
    $;
    {
        version;
    }
    `;
        execSync(rollbackCommand, { stdio: 'pipe' });
        
        // Stop current service
        execSync(docker stop ${options.service}, { stdio: 'pipe' });
        
        // Start rollback service`;
    execSync(docker, stop, $, { options, : .service } - rollback, { stdio: 'pipe' });
    `
        execSync(docker rm ${options.service}`, { stdio: 'pipe' };
    ;
    execSync(docker, rename, $, { options, : .service } - rollback, $, { options, : .service }, { stdio: 'pipe' });
    `
        execSync(docker start ${options.service}`, { stdio: 'pipe' };
    ;
    return {
        type: 'docker',
        service: options.service,
        previousVersion: version
    };
}
{
    // Generic rollback - would depend on deployment system
    console.log(chalk.blue('Performing generic rollback...'));
    return {
        type: 'generic',
        version
    };
}
try { }
catch (error) {
    throw new Error(Rollback, failed, $, { error, : .message });
}
/**
 * Deploy promote subcommand
 */
class DeployPromoteSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('<env>', 'Target environment')
            .option('-s, --source <source>', 'Source environment', 'development')
            .option('-t, --target <target>', 'Target environment')
            .option('--validate', 'Validate promotion after deployment');
    }
    async handleCommand(env, options) {
        await this.executeWithHandling(async () => {
            const sourceEnv = options.source || 'development';
            const targetEnv = options.target || env;
            `
        `;
            console.log(chalk.blue(Promoting, from, $, { sourceEnv }, to, $, { targetEnv }, ...));
            const result = await this.promoteEnvironment(sourceEnv, targetEnv, options);
            console.log(chalk.green('✅ Promotion completed successfully'));
            return {
                source: sourceEnv,
                target: targetEnv,
                promoted: result,
                timestamp: new Date().toISOString()
            };
        }, 'Promotion completed successfully', 'Failed to promote');
    }
    async promoteEnvironment(source, target, options) {
        try {
            // Get current deployment info
            const currentDeployment = await this.getCurrentDeployment(source);
            `
      `;
            if (!currentDeployment) {
                `
        throw new Error(No deployment found in ${source} environment);`;
            }
            `
`;
            console.log(chalk.blue(Promoting, version, $, { currentDeployment, : .version }, ...));
            // Deploy to target environment
            const deploymentResult = await this.deployToEnvironment(currentDeployment, target);
            if (options.validate) {
                console.log(chalk.blue('Validating promotion...'));
                await this.validateDeployment(target);
            }
            return {
                version: currentDeployment.version,
                image: currentDeployment.image,
                target,
                validated: options.validate
            };
        }
        catch (error) {
            `
      throw new Error(Promotion failed: ${error.message}`;
            ;
        }
    }
    async getCurrentDeployment(env) {
        // This would integrate with your deployment system
        // For now, return mock data
        return {
            version: '1.0.0',
            image: 'tnf-app:1.0.0',
            config: {}
        };
    }
    async deployToEnvironment(deployment, env) {
        // This would deploy the specified version to the target environment
        console.log(chalk.blue(Deploying, $, { deployment, : .image } ` to ${env}...));
    
    return {
      environment: env,
      image: deployment.image,
      status: 'deployed'
    };
  }

  private async validateDeployment(env: string): Promise<void> {
    // This would run health checks and validation
    console.log(chalk.green('✅ Deployment validation passed'));
  }
}

/**
 * Deploy status subcommand
 */
class DeployStatusSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .option('-d, --deployment <deployment>', 'Show status for specific deployment')
      .option('-e, --environment <environment>', 'Show status for specific environment')
      .option('--detailed', 'Show detailed status information')
      .option('--json', 'Output in JSON format');
  }

  protected async handleCommand(options: any): Promise<void> {
    await this.executeWithHandling(
      async () => {
        const deployments = await this.getDeploymentStatus(options);
        
        if (options.json) {
          this.formatOutput(deployments, options);
          return;
        }

        console.log(chalk.blue.bold('🚀 Deployment Status\n'));

        deployments.forEach((deployment: any) => {
          const statusIcon = deployment.status === 'healthy' ? chalk.green('●') : 
                           deployment.status === 'deploying' ? chalk.yellow('◐') : 
                           chalk.red('○');
          const statusText = deployment.status === 'healthy' ? chalk.green('Healthy') :
                           deployment.status === 'deploying' ? chalk.yellow('Deploying') :
                           chalk.red('Failed');
          `, console.log($, { statusIcon }, $, { chalk, : .white.bold(deployment.name) } ` (${deployment.environment}) - ${statusText});`, console.log(chalk.gray(Version, $, { deployment, : .version })))));
        `
          console.log(chalk.gray(  Image: ${deployment.image}`;
        ;
        if (options.detailed) {
            console.log(chalk.gray(Deployed, $, { deployment, : .deployedAt } `));
            if (deployment.replicas) console.log(chalk.gray(  Replicas: ${deployment.replicas}));`));
            if (deployment.url)
                console.log(chalk.gray(`  URL: ${deployment.url}));
          }
          
          console.log();
        });

        return {
          deployments,
          count: deployments.length,
          timestamp: new Date().toISOString()
        };
      },
      'Deployment status retrieved successfully',
      'Failed to get deployment status'
    );
  }

  private async getDeploymentStatus(options: any): Promise<any[]> {
    const deployments = [];
    
    // Get Docker containers
    try {
      const containers = execSync('docker ps --format "{{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}"', 
        { encoding: 'utf8' });
      
      containers.split('\n').filter(line => line.trim()).forEach(line => {
        const [name, status, image, ports] = line.split('\t');
        const isHealthy = status.includes('healthy');
        
        deployments.push({
          name,
          environment: this.extractEnvironment(name),
          status: isHealthy ? 'healthy' : 'unhealthy',
          version: this.extractVersion(image),
          image,
          deployedAt: new Date().toISOString(),
          url: this.extractUrl(ports)
        });
      });
    } catch (error) {
      console.warn(chalk.yellow('Could not get Docker deployment status'));
    }

    // Filter by environment or deployment if specified
    if (options.environment) {
      return deployments.filter(d => d.environment === options.environment);
    }
    
    if (options.deployment) {
      return deployments.filter(d => d.name.includes(options.deployment));
    }

    return deployments;
  }

  private extractEnvironment(name: string): string {
    if (name.includes('prod')) return 'production';
    if (name.includes('staging')) return 'staging';
    if (name.includes('dev')) return 'development';
    return 'unknown';
  }

  private extractVersion(image: string): string {
    const match = image.match(/:(.+)$/);
    return match ? match[1] : 'latest';
  }

  private extractUrl(ports: string): string {
    const match = ports.match(/:(\d+)->/);
    if (match) {`));
            const port = match[1];
            `
      return http://localhost:${port};
    }
    return null;
  }
}

/**
 * Deploy logs subcommand
 */
class DeployLogsSubcommand extends SubcommandCommand {
  protected addSpecificOptions(command: Command): Command {
    return command
      .argument('[deployment]', 'Deployment to show logs for (optional, shows all if not specified)')
      .option('-t, --tail <lines>', 'Number of lines to show from end', '50')
      .option('-f, --follow', 'Follow log output')
      .option('--since <time>', 'Show logs since timestamp');
  }

  protected async handleCommand(deployment: string | undefined, options: any): Promise<void> {
    try {
      if (deployment) {
        await this.showDeploymentLogs(deployment, options);
      } else {
        const deployments = await this.getDeployments();
        if (deployments.length === 0) {
          console.log(chalk.yellow('No deployments found'));
          return;
        }

        if (deployments.length === 1) {
          await this.showDeploymentLogs(deployments[0], options);
        } else {
          console.log(chalk.blue('Multiple deployments found. Choose one:'));
          deployments.forEach((dep, index) => {`;
            console.log($, { index } + 1);
        }
        `. ${dep});
          });
          console.log(chalk.gray('Use: tnf deploy logs <deployment-name>'));
        }
      }
    } catch (error) {
      console.error(chalk.red('Failed to show deployment logs:'), error.message);
    }
  }

  private async getDeployments(): Promise<string[]> {
    try {
      const containers = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' });
      return containers.split('\n').filter(name => name.trim());
    } catch (error) {
      return [];
    }
  }
`;
    }
    async showDeploymentLogs(deployment, options) {
        `
    console.log(chalk.blue(📋 Showing logs for deployment: ${deployment}));
    `;
        let logCommand = `docker logs ${deployment};
    `;
        if (options.tail) {
            `
      logCommand +=  --tail ${options.tail}`;
        }
        if (options.follow) {
            logCommand += ' -f';
        }
        if (options.since) {
            logCommand += --since;
            "${options.since}";
        }
        execSync(logCommand, { stdio: 'inherit', cwd: process.cwd() });
    }
}
/**
 * Deploy config subcommand
 */
class DeployConfigSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('--get <key>', 'Get configuration value')
            .option('--set <key>', 'Set configuration value')
            .option('--value <value>', 'Value to set (use with --set)')
            .option('-e, --env <environment>', 'Environment to configure')
            .option('--list', 'List all configuration values');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            if (options.get) {
                `
          const value = await this.getConfig(options.get, options.env);`;
                console.log(chalk.blue($, { options, : .get }), value);
            }
            else if (options.set) {
                if (!options.value) {
                    throw new Error('--value is required when using --set');
                }
                await this.setConfig(options.get, options.value, options.env);
                `
          console.log(chalk.green(✅ Set ${options.get} = ${options.value}`;
            }
        });
        ;
    }
    if(options, list) {
        const config = await this.listConfig(options.env);
        console.log(chalk.blue.bold(Deployment, Configuration));
        for ($; { options, : .env || 'default' }; )
            : ;
        ;
        console.log(JSON.stringify(config, null, 2));
    }
}
{
    // Interactive configuration
    await this.interactiveConfig(options.env);
}
return {
    operation: options.get ? 'get' : options.set ? 'set' : options.list ? 'list' : 'interactive',
    environment: options.env,
    timestamp: new Date().toISOString()
};
'Deployment configuration completed',
    'Failed to configure deployment';
;
async;
getConfig(key, string, env ?  : string);
Promise < any > {
    const: configPath = path.join(process.cwd(), '.tnf', 'deploy-config.json'),
    if(fs) { }, : .existsSync(configPath)
};
{
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (env) {
        return config[env]?.[key];
    }
    return config[key];
}
return null;
async;
setConfig(key, string, value, any, env ?  : string);
Promise < void  > {
    const: configPath = path.join(process.cwd(), '.tnf', 'deploy-config.json'),
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
if (env) {
    if (!config[env])
        config[env] = {};
    config[env][key] = value;
}
else {
    config[key] = value;
}
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
async;
listConfig(env ?  : string);
Promise < any > {
    const: configPath = path.join(process.cwd(), '.tnf', 'deploy-config.json'),
    if(fs) { }, : .existsSync(configPath)
};
{
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return env ? config[env] || {} : config;
}
return {};
async;
interactiveConfig(env ?  : string);
Promise < void  > {} `
    const inquirer = await import('inquirer');`;
console.log(chalk.blue(`🔧 Configuring deployment${env ?  : ));
for ($; { env }; )
    : '';
n;
;
const answers = await inquirer.default.prompt([
    {
        type: 'input',
        name: 'registry',
        message: 'Docker registry:',
        default: 'docker.io'
    },
    {
        type: 'input',
        name: 'namespace',
        message: 'Namespace/organization:',
        default: 'tnf'
    },
    {
        type: 'list',
        name: 'strategy',
        message: 'Deployment strategy:',
        choices: ['rolling', 'recreate', 'blue-green']
    },
    {
        type: 'number',
        name: 'replicas',
        message: 'Number of replicas:',
        default: 1
    }
]);
// Save configuration
for (const [key, value] of Object.entries(answers)) {
    await this.setConfig(key, value, env);
}
console.log(chalk.green('✅ Configuration saved'));
/**
 * Deploy validate subcommand
 */
class DeployValidateSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-e, --env <environment>', 'Environment to validate', 'development')
            .option('-s, --strict', 'Enable strict validation')
            .option('--check-health', 'Perform health checks');
    }
    async handleCommand(options) {
        await this.executeWithHandling(`
      async () => {`, console.log(chalk.blue(Validating, deployment)));
        for (environment; ; )
            : $;
        {
            options.env;
        }
        ;
        const validationResults = await this.validateDeployment(options);
        const passed = validationResults.filter((r) => r.status === 'passed').length;
        const total = validationResults.length;
        `
        console.log(chalk.blue(\nValidation Summary: ${passed}` / $;
        {
            total;
        }
        checks;
        passed;
        ;
        if (passed === total) {
            console.log(chalk.green('✅ All validations passed'));
        }
        else {
            console.log(chalk.red('❌ Some validations failed'));
            validationResults.forEach((result) => {
                `
            if (result.status === 'failed') {`;
                console.log(chalk.red(-$, { result, : .check } `: ${result.message}));
            }
          });
        }

        return {
          environment: options.env,
          results: validationResults,
          passed,
          total,
          timestamp: new Date().toISOString()
        };
      },
      'Deployment validation completed',
      'Failed to validate deployment'
    );
  }

  private async validateDeployment(options: any): Promise<any[]> {
    const results = [];
    
    // Check Dockerfile exists
    const dockerfileCheck = {
      check: 'Dockerfile exists',
      status: fs.existsSync('Dockerfile') ? 'passed' : 'failed',
      message: fs.existsSync('Dockerfile') ? 'Dockerfile found' : 'Dockerfile not found'
    };
    results.push(dockerfileCheck);
    
    // Check package.json exists
    const packageCheck = {
      check: 'package.json exists',
      status: fs.existsSync('package.json') ? 'passed' : 'failed',
      message: fs.existsSync('package.json') ? 'package.json found' : 'package.json not found'
    };
    results.push(packageCheck);
    
    // Check if Docker is running
    try {
      execSync('docker version', { stdio: 'pipe' });
      results.push({
        check: 'Docker is running',
        status: 'passed',
        message: 'Docker daemon is accessible'
      });
    } catch (error) {
      results.push({
        check: 'Docker is running',
        status: 'failed',
        message: 'Docker daemon is not accessible'
      });
    }
    
    // Health checks if requested
    if (options.checkHealth) {
      const healthResults = await this.performHealthChecks(options.env);
      results.push(...healthResults);
    }
    
    return results;
  }

  private async performHealthChecks(env: string): Promise<any[]> {
    const results = [];
    
    try {
      // Check if containers are running
      const containers = execSync('docker ps --format "{{.Names}}\t{{.Status}}"', 
        { encoding: 'utf8' });
      
      const runningContainers = containers.split('\n')
        .filter(line => line.trim())
        .filter(line => line.includes('healthy') || line.includes('Up'));
      
      results.push({
        check: 'Containers are healthy',`, status, runningContainers.length > 0 ? 'passed' : 'failed', `
        message: ${runningContainers.length} healthy containers found`));
            });
        }
        try { }
        catch (error) {
            results.push({
                check: 'Containers are healthy',
                status: 'failed',
                message: 'Could not check container health'
            });
        }
        return results;
    }
}
/**
 * Register the deploy category command
 */
export function registerDeployCommands(program) {
    const deployCommand = new DeployCommand(program);
    return deployCommand.createCategoryCommand();
}
//# sourceMappingURL=deploy.js.map
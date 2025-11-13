import { CategoryCommand, SubcommandCommand } from './base.js';
import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
/**
 * Dev category command implementation
 */
export class DevCommand extends CategoryCommand {
    constructor(program) {
        super('dev', 'Development operations', program);
        this.initializeSubcommands();
    }
    initializeSubcommands() {
        // Build subcommand
        this.registerSubcommand('build', new BuildSubcommand('dev', 'build', 'Build the project', this.program).createSubcommand());
        // Test subcommand
        this.registerSubcommand('test', new TestSubcommand('dev', 'test', 'Run tests', this.program).createSubcommand());
        // Lint subcommand
        this.registerSubcommand('lint', new LintSubcommand('dev', 'lint', 'Lint code', this.program).createSubcommand());
        // Type-check subcommand
        this.registerSubcommand('type-check', new TypeCheckSubcommand('dev', 'type-check', 'Run type checking', this.program).createSubcommand());
        // Serve subcommand
        this.registerSubcommand('serve', new ServeSubcommand('dev', 'serve', 'Start development server', this.program).createSubcommand());
        // Clean subcommand
        this.registerSubcommand('clean', new CleanSubcommand('dev', 'clean', 'Clean build artifacts', this.program).createSubcommand());
        // Init subcommand
        this.registerSubcommand('init', new InitSubcommand('dev', 'init', 'Initialize project', this.program).createSubcommand());
        // VS Code Server subcommand
        this.registerSubcommand('vscode-server', new VSCodeServerSubcommand('dev', 'vscode-server', 'Start VS Code Server tunnel', this.program).createSubcommand());
    }
}
/**
 * Build subcommand
 */
class BuildSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-w, --watch', 'Watch for changes and rebuild')
            .option('--type-check', 'Run type checking during build')
            .option('--clean', 'Clean build artifacts before building')
            .option('-p, --production', 'Build for production')
            .option('--verbose', 'Enable verbose build output');
    }
    async handleCommand(options) {
        const validation = this.validateOptions(options);
        if (!validation.isValid) {
            console.error(chalk.red('Validation errors:'));
            validation.errors.forEach(error => console.error(chalk.red(`  - ${error})));
      process.exit(1);
    }

    await this.executeWithHandling(
      async () => {
        let buildCommand = 'pnpm run build';
        
        if (options.production) {
          buildCommand = 'pnpm run build:prod';
        }
        
        if (options.watch) {
          buildCommand += ' --watch';
        }
        
        if (options.typeCheck) {
          buildCommand += ' --type-check';
        }
        
        if (options.clean) {
          await this.cleanBuildArtifacts();
        }
`, console.log(chalk.blue(`Running: ${buildCommand}`)))));
            execSync(buildCommand, {
                stdio: options.verbose ? 'inherit' : 'pipe',
                cwd: process.cwd()
            });
            return {
                command: buildCommand,
                options,
                timestamp: new Date().toISOString()
            };
        }
        'Build completed successfully',
            'Build failed';
        ;
    }
    async cleanBuildArtifacts() {
        const dirsToClean = ['dist', 'build', '.next', '.nuxt'];
        const filesToClean = ['*.log', '*.cache'];
        for (const dir of dirsToClean) {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
                console.log(chalk.gray(Cleaned, directory, $, { dir }));
            }
        }
    }
}
/**
 * Test subcommand
 */
class TestSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-c, --coverage', 'Generate coverage report')
            .option('-w, --watch', 'Watch for changes and re-run tests')
            .option('-p, --pattern <pattern>', 'Run tests matching pattern')
            .option('--verbose', 'Enable verbose test output')
            .option('--bail', 'Stop on first test failure');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            let testCommand = 'npm test';
            if (options.coverage) {
                testCommand = 'pnpm run test:coverage';
            }
            if (options.watch) {
                testCommand += ' --watch';
            }
            if (options.pattern) {
                `
          testCommand +=  -- --testNamePattern="${options.pattern}`;
                ";;
            }
            if (options.bail) {
                testCommand += ' -- --bail';
            }
            console.log(chalk.blue(Running, $, { testCommand }));
            execSync(testCommand, {
                stdio: options.verbose ? 'inherit' : 'pipe',
                cwd: process.cwd()
            });
            return {
                command: testCommand,
                options,
                timestamp: new Date().toISOString()
            };
        }, 'Tests completed successfully', 'Tests failed');
    }
}
/**
 * Lint subcommand
 */
class LintSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-f, --fix', 'Automatically fix linting issues')
            .option('--format <format>', 'Output format (stylish | compact | json)', 'stylish')
            .option('--ext <extensions>', 'File extensions to lint', '.ts,.js,.tsx,.jsx')
            .option('--quiet', 'Only show errors, not warnings');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            let lintCommand = 'pnpm run lint';
            if (options.fix) {
                lintCommand += ' --fix';
            }
            `
        `;
            if (options.format && options.format !== 'stylish') {
                lintCommand += --format;
                $;
                {
                    options.format;
                }
                `;
        }
        
        if (options.ext) {
          lintCommand +=  --ext ${options.ext};
        }
        
        if (options.quiet) {
          lintCommand += ' --quiet';`;
            }
            `

        console.log(chalk.blue(Running: ${lintCommand}`;
        });
        ;
        execSync(lintCommand, {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        return {
            command: lintCommand,
            options,
            timestamp: new Date().toISOString()
        };
    }
    'Linting completed successfully';
    'Linting failed';
    ;
}
/**
 * Type-check subcommand
 */
class TypeCheckSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-s, --strict', 'Enable strict type checking')
            .option('-w, --watch', 'Watch for changes and re-run type checking')
            .option('--noEmit', 'Do not emit output files');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            let typeCheckCommand = 'pnpm dlx tsc --noEmit';
            if (options.strict) {
                typeCheckCommand += ' --strict';
            }
            if (options.watch) {
                typeCheckCommand += ' --watch';
            }
            console.log(chalk.blue(Running, $, { typeCheckCommand }));
            execSync(typeCheckCommand, {
                stdio: 'inherit',
                cwd: process.cwd()
            });
            return {
                command: typeCheckCommand,
                options,
                timestamp: new Date().toISOString()
            };
        }, 'Type checking completed successfully', 'Type checking failed');
    }
}
/**
 * Serve subcommand
 */
class ServeSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-p, --port <port>', 'Port to run the server on', '3000')
            .option('-h, --host <host>', 'Host to bind to', 'localhost')
            .option('--open', 'Open browser automatically')
            .option('--https', 'Serve over HTTPS')
            .option('--ssl-cert <path>', 'Path to SSL certificate file')
            .option('--ssl-key <path>', 'Path to SSL key file');
    }
    validateOptions(options) {
        const errors = super.validateOptions(options).errors;
        if (options.port && (parseInt(options.port) < 1 || parseInt(options.port) > 65535)) {
            errors.push('Port must be between 1 and 65535');
        }
        if (options.https && (!options.sslCert || !options.sslKey)) {
            errors.push('HTTPS requires both --ssl-cert and --ssl-key');
        }
        return { isValid: errors.length === 0, errors };
    }
    async handleCommand(options) {
        const validation = this.validateOptions(options);
        `
    if (!validation.isValid) {`;
        console.error(chalk.red('Validation errors:'));
        validation.errors.forEach(error => console.error(chalk.red(-$, { error } `)));
      process.exit(1);
    }

    await this.executeWithHandling(
      async () => {
        let serveCommand = 'pnpm run dev';
        
        // Add port and host
        serveCommand +=  -- --port ${options.port} --host ${options.host}`)));
        if (options.open) {
            serveCommand += ' --open';
        }
        if (options.https) {
            serveCommand += ' --https';
            if (options.sslCert)
                serveCommand += --ssl - cert;
            $;
            {
                options.sslCert;
            }
            ;
            `
          if (options.sslKey) serveCommand +=  --ssl-key ${options.sslKey}`;
        }
        console.log(chalk.blue(Starting, development, server, on, $, { options, : .https ? 'https' : 'http' } `://${options.host}:${options.port}));`, console.log(chalk.blue(Running, $, { serveCommand } `));
        
        // For dev server, we want to see the output
        execSync(serveCommand, {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        return {
          command: serveCommand,
          url: ${options.https ? 'https' : 'http'}://${options.host}`, $, { options, : .port }, options, timestamp, new Date().toISOString()))));
    }
    ;
}
undefined, // Don't show success message for long-running server
    'Failed to start development server';
;
/**
 * Clean subcommand
 */
class CleanSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-a, --all', 'Clean all (build, deps, cache)')
            .option('--build', 'Clean build artifacts only')
            .option('--deps', 'Clean dependencies only')
            .option('--cache', 'Clean cache only')
            .option('--dry-run', 'Show what would be cleaned without actually cleaning');
    }
    async handleCommand(options) {
        await this.executeWithHandling(async () => {
            const operations = [];
            if (options.all || options.build) {
                operations.push('build');
                await this.cleanBuildArtifacts();
            }
            if (options.all || options.deps) {
                operations.push('dependencies');
                await this.cleanDependencies(options.dryRun);
            }
            if (options.all || options.cache) {
                operations.push('cache');
                await this.cleanCache();
            }
            return {
                operations,
                dryRun: options.dryRun,
                timestamp: new Date().toISOString()
            };
        }, Cleaning, completed, successfully($, { options, : .dryRun ? 'dry run' : 'actual' }), 'Cleaning failed');
    }
    async cleanBuildArtifacts() {
        const dirsToClean = ['dist', 'build', '.next', '.nuxt', 'coverage', '.nyc_output'];
        const filesToClean = ['*.log', '*.cache', '.tsbuildinfo'];
        for (const dir of dirsToClean) {
            if (fs.existsSync(dir)) {
                `
        fs.rmSync(dir, { recursive: true, force: true });`;
                console.log(chalk.gray(`Removed directory: ${dir}));
      }
    }
  }

  private async cleanDependencies(dryRun: boolean): Promise<void> {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    const packageLockPath = path.join(process.cwd(), 'package-lock.json');
    
    if (fs.existsSync(nodeModulesPath)) {`));
                if (dryRun) {
                    `
        console.log(chalk.gray(Would remove directory: node_modules`;
                    ;
                }
                else {
                    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
                    console.log(chalk.gray(Removed, directory, node_modules));
                }
            }
            if (fs.existsSync(packageLockPath)) {
                if (dryRun) {
                    console.log(chalk.gray(Would, remove, file, package - lock.json));
                }
                else {
                    fs.unlinkSync(packageLockPath);
                    console.log(chalk.gray(Removed, file, package - lock.json));
                }
            }
        }
    }
    async cleanCache() {
        const cacheDirs = ['.cache', '.parcel-cache', '.vite', '.turbo'];
        for (const cacheDir of cacheDirs) {
            if (fs.existsSync(cacheDir)) {
                fs.rmSync(cacheDir, { recursive: true, force: true });
                console.log(chalk.gray(Removed, cache, directory, $, { cacheDir }));
            }
        }
    }
}
/**
 * Init subcommand
 */
class InitSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .argument('[template]', 'Project template to use', 'basic')
            .option('-f, --force', 'Force initialization even if directory is not empty')
            .option('--git', 'Initialize git repository')
            .option('--install', 'Install dependencies after initialization');
    }
    async handleCommand(template, options) {
        await this.executeWithHandling(async () => {
            const projectPath = process.cwd();
            // Check if directory is empty
            const files = fs.readdirSync(projectPath);
            if (files.length > 0 && !options.force) {
                throw new Error('Directory is not empty. Use --force to initialize anyway.');
            }
            `
`;
            console.log(chalk.blue(`Initializing project with template: ${template}));
        
        // Create basic project structure
        await this.createProjectStructure(template);
        
        // Create package.json if it doesn't exist
        if (!fs.existsSync('package.json')) {
          await this.createPackageJson(template);
        }
        
        // Initialize git if requested
        if (options.git && !fs.existsSync('.git')) {
          execSync('git init', { stdio: 'inherit' });
          console.log(chalk.green('Git repository initialized'));
        }
        
        // Install dependencies if requested
        if (options.install) {
          console.log(chalk.blue('Installing dependencies...'));
          execSync('pnpm install', { stdio: 'inherit' });
        }

        return {
          template,
          projectPath,
          gitInitialized: options.git,
          dependenciesInstalled: options.install,
          timestamp: new Date().toISOString()
        };
      },
      'Project initialized successfully',
      'Project initialization failed'
    );
  }

  private async createProjectStructure(template: string): Promise<void> {
    const dirs = ['src', 'tests', 'docs', 'scripts'];
    
    if (template === 'basic') {
      dirs.push('lib', 'config');
    } else if (template === 'fullstack') {
      dirs.push('client', 'server', 'shared');
    } else if (template === 'library') {
      dirs.push('src', 'examples', 'benchmarks');
    }

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });`, console.log(chalk.gray(Created, directory, $, { dir } `));
      }
    }
  }

  private async createPackageJson(template: string): Promise<void> {
    const basePackage = {
      name: path.basename(process.cwd()),
      version: '1.0.0',
      description: ${template} project`, main, 'src/index.js', scripts, {
                start: 'node src/index.js',
                dev: 'node --watch src/index.js',
                test: 'jest',
                lint: 'eslint src --ext .js,.ts',
                build: 'tsc',
                clean: 'rm -rf dist'
            }, keywords, [], author, '', license, 'MIT'))));
        });
        if (template === 'typescript') {
            basePackage.main = 'dist/index.js';
            basePackage.types = 'dist/index.d.ts';
            basePackage.scripts.build = 'tsc';
            basePackage.scripts.dev = 'tsc --watch';
            basePackage.devDependencies = {
                typescript: '^5.0.0',
                '@types/node': '^20.0.0'
            };
        }
        fs.writeFileSync('package.json', JSON.stringify(basePackage, null, 2));
        console.log(chalk.green('Created package.json'));
    }
}
/**
 * VS Code Server subcommand
 */
class VSCodeServerSubcommand extends SubcommandCommand {
    addSpecificOptions(command) {
        return command
            .option('-n, --name <name>', 'Custom tunnel name')
            .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
            .option('--auth-provider <provider>', 'Authentication provider (github, microsoft)', 'github')
            .option('-p, --port <port>', 'Local port for tunnel')
            .option('-b, --background', 'Run in background mode')
            .option('--stop', 'Stop VS Code Server tunnel')
            .option('--stop-all', 'Stop all VS Code Server tunnels')
            .option('--list', 'List active tunnels')
            .option('--status', 'Show tunnel status');
    }
    async handleCommand(options) {
        const { VSCodeServerManager } = await import('../../lib/VSCodeServerManager.js');
        const manager = new VSCodeServerManager();
        try {
            if (options.list) {
                await this.handleList(manager);
            }
            else if (options.status) {
                await this.handleStatus(manager);
            }
            else if (options.stop || options.stopAll) {
                await this.handleStop(manager, options);
            }
            else {
                await this.handleStart(manager, options);
            }
        }
        catch (error) {
            console.error(chalk.red('VS Code Server error:'), error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    }
    async handleStart(manager, options) {
        console.log(chalk.blue('🚀 Starting VS Code Server...'));
        const serverOptions = {
            name: options.name,
            workspace: options.workspace,
            authProvider: options.authProvider,
            port: options.port,
            background: options.background,
            verbose: options.verbose
        };
        const result = await manager.startServer(serverOptions);
        console.log(chalk.green('✅ VS Code Server started successfully!'));
        if (result.url) {
            console.log(chalk.blue('\n🌐 Access your VS Code environment at:'));
            console.log(chalk.cyan($, { result, : .url }));
            console.log(chalk.gray('\n💡 Bookmark this URL for easy access'));
        }
    }
    async handleStop(manager, options) {
        if (options.stopAll) {
            console.log(chalk.yellow('🛑 Stopping all VS Code Server tunnels...'));
            `
      const result = await manager.stopAllServers();`;
            console.log(chalk.green(`✅ Stopped ${result.stoppedCount} tunnel(s)));
    } else {
      console.log(chalk.yellow(🛑 Stopping VS Code Server tunnel...));
      const result = await manager.stopServer(options.name);`, console.log(chalk.green(`✅ Stopped tunnel '${result.name}`, '));))));
        }
    }
    async handleList(manager) {
        const result = await manager.listActiveTunnels();
        console.log(chalk.blue('\n📋 Active VS Code Server Tunnels:'));
        if (result.tunnels && result.tunnels.length > 0) {
            result.tunnels.forEach((tunnel, index) => {
                console.log(chalk.cyan($, { index } + 1));
            }, $, { tunnel, : .name });
            ;
            `
        console.log(chalk.gray(      URL: ${tunnel.url}`;
            ;
            console.log(chalk.gray(Workspace, $, { tunnel, : .workspace } `));
        console.log(chalk.gray(      Started: ${tunnel.startTime}));
      });
    } else {
      console.log(chalk.yellow('   No active tunnels found'));
      console.log(chalk.gray('   Run "tnf dev vscode-server" to start a tunnel'));
    }
  }

  private async handleStatus(manager: any): Promise<void> {
    const result = await manager.getStatus();

    console.log(chalk.blue('\n📊 VS Code Server Status:'));

    if (result.activeTunnels && result.activeTunnels.length > 0) {`, console.log(chalk.green(Active, tunnels, $, { result, : .activeTunnels.length } `));
      result.activeTunnels.forEach((tunnel: any) => {
        console.log(chalk.cyan(   • ${tunnel.name}`, $, { tunnel, : .url } `));
      });
    } else {
      console.log(chalk.yellow('   No active tunnels'));
    }
  }
}

/**
 * Register the dev category command
 */
export function registerDevCommands(program: Command): Command {
  const devCommand = new DevCommand(program);
  return devCommand.createCategoryCommand();
}))));
        }
    }
}
//# sourceMappingURL=dev.js.map
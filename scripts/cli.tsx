import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';

const program = new Command();

program
  .name('fuse')
  .description('The New Fuse CLI tools')
  .version('1.0.0');

program
  .command('dev')
  .description('Start development environment')
  .option('-a, --api-only', 'Run only the API server')
  .option('-f, --frontend-only', 'Run only the frontend')
  .action((options) => {
    if (options.apiOnly) {
      execSync('yarn workspace @the-new-fuse/api dev', { stdio: 'inherit' });
    } else if (options.frontendOnly) {
      execSync('yarn workspace @the-new-fuse/frontend-app dev', { stdio: 'inherit' });
    } else {
      execSync('yarn dev', { stdio: 'inherit' });
    }
  });

program
  .command('build')
  .description('Build all packages')
  .option('-p, --production', 'Build for production')
  .action((options) => {
    const buildCmd = options.production ? 'build:prod' : 'build';
    execSync(`yarn ${buildCmd}`, { stdio: 'inherit' });
  });

program
  .command('test')
  .description('Run tests')
  .option('-w, --watch', 'Run in watch mode')
  .option('-c, --coverage', 'Generate coverage report')
  .action((options) => {
    const args = [
      options.watch ? '--watch' : '',
      options.coverage ? '--coverage' : ''
    ].filter(Boolean);
    execSync(`yarn test ${args.join(' ')}`, { stdio: 'inherit' });
  });

program
  .command('lint')
  .description('Lint all packages')
  .option('-f, --fix', 'Automatically fix issues')
  .action((options) => {
    execSync(`yarn lint${options.fix ? ':fix' : ''}`, { stdio: 'inherit' });
  });

program
  .command('db')
  .description('Database operations')
  .option('-m, --migrate', 'Run migrations')
  .option('-s, --seed', 'Seed database')
  .option('-r, --reset', 'Reset database')
  .action((options) => {
    if (options.migrate) {
      execSync('yarn workspace @the-new-fuse/api db:migrate', { stdio: 'inherit' });
    } else if (options.seed) {
      execSync('yarn workspace @the-new-fuse/api db:seed', { stdio: 'inherit' });
    } else if (options.reset) {
      execSync('yarn workspace @the-new-fuse/api db:reset', { stdio: 'inherit' });
    }
  });

program
  .command('clean')
  .description('Clean build artifacts')
  .action(() => {
    execSync('yarn clean', { stdio: 'inherit' });
  });

program
  .command('docs')
  .description('Generate documentation')
  .action(() => {
    execSync('yarn docs', { stdio: 'inherit' });
  });

program
  .command('analyze')
  .description('Analyze codebase')
  .option('-d, --detailed', 'Generate detailed report')
  .option('-f, --fix', 'Auto-fix detected issues')
  .option('-p, --path <path>', 'Specific path to analyze')
  .action(async (options) => {
    try {
      const analysis = await analyzeCodebase(options.path);
      if (options.detailed) {
        await generateDetailedReport(analysis);
      } else {
        await generateReport(analysis);
      }
      
      if (options.fix) {
        await autoFix(analysis);
      }
    } catch (error) {
      console.error(chalk.red('Analysis failed:'), error);
      process.exit(1);
    }
  });

program.on('command:*', () => {
  console.error(chalk.red('Invalid command'));
  );
  program.commands.forEach(cmd => {
    )}: ${cmd.description()}`);
  });
  process.exit(1);
});

program.parse();

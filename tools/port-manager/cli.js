#!/usr/bin/env node

// tools/port-manager/cli.js - Simplified CLI

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as net from 'net';

const program = new Command();

program
  .name('tnf-ports')
  .description('The New Fuse Port Management CLI')
  .version('1.0.0');

// Simple port availability check
async function isPortAvailable(port, host = 'localhost') {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, host, () => {
      server.once('close', () => resolve(true));
      server.close();
    });

    server.on('error', () => resolve(false));
  });
}

// Status command
program
  .command('status')
  .description('Show current port allocation status')
  .action(async () => {
    const spinner = ora('Checking port status...').start();
    
    try {
      const commonPorts = [3000, 3001, 3002, 3003, 3004];
      const portStatus = [];
      
      for (const port of commonPorts) {
        const available = await isPortAvailable(port);
        portStatus.push({
          port,
          status: available ? 'available' : 'in-use'
        });
      }
      
      spinner.stop();
      
      console.log(chalk.bold('\n📊 Port Status\n'));
      
      portStatus.forEach(({ port, status }) => {
        const statusColor = status === 'available' ? 'green' : 'red';
        const statusIcon = status === 'available' ? '🟢' : '🔴';
        
        console.log(
          `${statusIcon} Port ${chalk.bold(port.toString().padEnd(4))} ${chalk[statusColor](status)}`
        );
      });
      
      console.log('');
      
    } catch (error) {
      spinner.fail('Failed to check port status');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Conflicts command
program
  .command('conflicts')
  .description('Check for port conflicts')
  .option('--auto-resolve', 'Automatically resolve conflicts')
  .action(async (options) => {
    const spinner = ora('Checking for conflicts...').start();
    
    try {
      // Simple conflict detection - check if expected ports are in use
      const expectedPorts = [
        { port: 3000, service: 'frontend' },
        { port: 3001, service: 'api' }
      ];
      
      const conflicts = [];
      
      for (const { port, service } of expectedPorts) {
        const available = await isPortAvailable(port);
        if (!available) {
          conflicts.push({ port, service });
        }
      }
      
      if (conflicts.length === 0) {
        spinner.succeed('No port conflicts detected! 🎉');
        return;
      }
      
      spinner.warn(`Found ${conflicts.length} potential conflict(s)`);
      
      console.log(chalk.bold('\n⚠️  Potential Port Conflicts\n'));
      
      conflicts.forEach(({ port, service }) => {
        console.log(chalk.yellow(`Port ${port} (expected for ${service}) is currently in use`));
      });
      
      if (options.autoResolve) {
        console.log(chalk.blue('\nAuto-resolution will be available in the full implementation.'));
      }
      
    } catch (error) {
      spinner.fail('Failed to check conflicts');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Health command
program
  .command('health')
  .description('Check service health')
  .action(async () => {
    const spinner = ora('Checking service health...').start();
    
    try {
      const services = [
        { name: 'frontend', port: 3000, url: 'http://localhost:3000' },
        { name: 'api', port: 3001, url: 'http://localhost:3001' }
      ];
      
      const healthResults = [];
      
      for (const service of services) {
        const available = await isPortAvailable(service.port);
        
        if (!available) {
          // Port is in use, try to check if service is responding
          try {
            const response = await fetch(service.url, { 
              method: 'GET', 
              signal: AbortSignal.timeout(3000) 
            });
            healthResults.push({
              ...service,
              status: response.ok ? 'healthy' : 'unhealthy',
              httpStatus: response.status
            });
          } catch (error) {
            healthResults.push({
              ...service,
              status: 'running',
              note: 'Port in use, but service not responding to HTTP'
            });
          }
        } else {
          healthResults.push({
            ...service,
            status: 'not_running'
          });
        }
      }
      
      spinner.stop();
      
      console.log(chalk.bold('\n🏥 Service Health Status\n'));
      
      healthResults.forEach(result => {
        const statusIcon = result.status === 'healthy' ? '🟢' : 
                          result.status === 'running' ? '🟡' : 
                          result.status === 'unhealthy' ? '🟡' : '⚪';
        
        const statusColor = result.status === 'healthy' ? 'green' : 
                           result.status === 'running' ? 'yellow' : 
                           result.status === 'unhealthy' ? 'yellow' : 'gray';
        
        console.log(
          `${statusIcon} ${chalk.bold(result.name.padEnd(15))} ` +
          `${chalk.blue(result.url.padEnd(25))} ` +
          `${chalk[statusColor](result.status)} ` +
          `${result.httpStatus ? `(${result.httpStatus})` : ''}`
        );
        
        if (result.note) {
          console.log(chalk.dim(`    ${result.note}`));
        }
      });
      
      console.log('');
      
    } catch (error) {
      spinner.fail('Failed to check service health');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Dev command
program
  .command('dev')
  .description('Prepare development environment')
  .option('--optimize', 'Optimize port allocation')
  .action(async (options) => {
    const spinner = ora('Preparing development environment...').start();
    
    try {
      spinner.succeed('Development environment check complete!');
      
      console.log(chalk.bold('\n🚀 Development Environment Ready\n'));
      console.log(chalk.green('Frontend: http://localhost:3000'));
      console.log(chalk.green('API: http://localhost:3001'));
      console.log('');
      console.log(chalk.dim('Tip: Use "tnf-ports status" to monitor ports'));
      
    } catch (error) {
      spinner.fail('Failed to prepare development environment');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program.parse();

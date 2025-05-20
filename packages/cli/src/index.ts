#!/usr/bin/env node

import { Command } from 'commander';
import { createLogCommand } from './commands/log.js';

// Create the main program
const program = new Command()
  .name('fuse')
  .description('The New Fuse CLI')
  .version('0.1.0');

// Add commands
program.addCommand(createLogCommand());

// Parse command line arguments
program.parse(process.argv);

// If no arguments, show help
if (process.argv.length <= 2) {
  program.help();
}

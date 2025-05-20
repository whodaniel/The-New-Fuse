import { Command } from 'commander';
import * as inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import { DevelopmentLogger, FileChangeTracker } from '../../core/src/utils/LoggingUtils.js';
import { FileSystemWatcher } from '../../core/src/utils/FileSystemWatcher.js';

/**
 * Create the log command
 * 
 * @returns The log command
 */
export function createLogCommand(): Command {
  const logCommand = new Command('log')
    .description('Manage development logs');

  // Add subcommand to create a new log entry
  logCommand
    .command('add')
    .description('Add a new entry to the development log')
    .action(async () => {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter a title for the log entry:',
          validate: (input) => input.trim().length > 0 || 'Title is required'
        },
        {
          type: 'input',
          name: 'agent',
          message: 'Enter your agent identifier:',
          default: process.env.USER || 'Unknown Agent'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Enter a description of the changes:',
          validate: (input) => input.trim().length > 0 || 'Description is required'
        },
        {
          type: 'confirm',
          name: 'addDecisions',
          message: 'Do you want to add design decisions?',
          default: false
        },
        {
          type: 'confirm',
          name: 'addChallenges',
          message: 'Do you want to add challenges encountered?',
          default: false
        },
        {
          type: 'confirm',
          name: 'addNextSteps',
          message: 'Do you want to add next steps?',
          default: false
        }
      ]);

      const decisions = [];
      if (answers.addDecisions) {
        let addMore = true;
        while (addMore) {
          const decisionAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'decision',
              message: 'Enter a design decision:',
              validate: (input) => input.trim().length > 0 || 'Decision is required'
            },
            {
              type: 'input',
              name: 'rationale',
              message: 'Enter the rationale for this decision:',
              validate: (input) => input.trim().length > 0 || 'Rationale is required'
            },
            {
              type: 'confirm',
              name: 'addAnother',
              message: 'Add another decision?',
              default: false
            }
          ]);

          decisions.push({
            decision: decisionAnswers.decision,
            rationale: decisionAnswers.rationale
          });

          addMore = decisionAnswers.addAnother;
        }
      }

      const challenges = [];
      if (answers.addChallenges) {
        let addMore = true;
        while (addMore) {
          const challengeAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'challenge',
              message: 'Enter a challenge encountered:',
              validate: (input) => input.trim().length > 0 || 'Challenge is required'
            },
            {
              type: 'input',
              name: 'solution',
              message: 'Enter how this challenge was addressed:',
              validate: (input) => input.trim().length > 0 || 'Solution is required'
            },
            {
              type: 'confirm',
              name: 'addAnother',
              message: 'Add another challenge?',
              default: false
            }
          ]);

          challenges.push({
            challenge: challengeAnswers.challenge,
            solution: challengeAnswers.solution
          });

          addMore = challengeAnswers.addAnother;
        }
      }

      const nextSteps = [];
      if (answers.addNextSteps) {
        let addMore = true;
        while (addMore) {
          const nextStepAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'nextStep',
              message: 'Enter a next step:',
              validate: (input) => input.trim().length > 0 || 'Next step is required'
            },
            {
              type: 'confirm',
              name: 'addAnother',
              message: 'Add another next step?',
              default: false
            }
          ]);

          nextSteps.push(nextStepAnswers.nextStep);

          addMore = nextStepAnswers.addAnother;
        }
      }

      // Get file changes
      const fileChangesAnswers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addFileChanges',
          message: 'Do you want to add file changes?',
          default: true
        }
      ]);

      const filesChanged = [];
      if (fileChangesAnswers.addFileChanges) {
        let addMore = true;
        while (addMore) {
          const fileChangeAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'filePath',
              message: 'Enter the file path:',
              validate: (input) => input.trim().length > 0 || 'File path is required'
            },
            {
              type: 'list',
              name: 'changeType',
              message: 'Select the type of change:',
              choices: ['create', 'modify', 'delete', 'move']
            },
            {
              type: 'input',
              name: 'description',
              message: 'Enter a description of the change:',
              validate: (input) => input.trim().length > 0 || 'Description is required'
            },
            {
              type: 'confirm',
              name: 'addAnother',
              message: 'Add another file change?',
              default: false
            }
          ]);

          filesChanged.push({
            filePath: fileChangeAnswers.filePath,
            changeType: fileChangeAnswers.changeType,
            description: fileChangeAnswers.description
          });

          addMore = fileChangeAnswers.addAnother;
        }
      }

      // Create the log entry
      const entry = {
        date: new Date(),
        title: answers.title,
        agent: answers.agent,
        filesChanged,
        description: answers.description,
        decisions: decisions.length > 0 ? decisions : undefined,
        challenges: challenges.length > 0 ? challenges : undefined,
        nextSteps: nextSteps.length > 0 ? nextSteps : undefined
      };

      // Add the entry to the log
      const success = await DevelopmentLogger.addLogEntry(entry);

      if (success) {
        console.log('Log entry added successfully');
      } else {
        console.error('Failed to add log entry');
      }
    });

  // Add subcommand to view the log
  logCommand
    .command('view')
    .description('View the development log')
    .action(async () => {
      const logContent = await DevelopmentLogger.getLogContent();
      
      if (logContent) {
        console.log(logContent);
      } else {
        console.error('Failed to read log file');
      }
    });

  // Add subcommand to watch for file changes
  logCommand
    .command('watch')
    .description('Watch for file changes and track them')
    .option('-d, --directories <directories>', 'Comma-separated list of directories to watch', '.')
    .option('-i, --ignore <patterns>', 'Comma-separated list of patterns to ignore', '**/node_modules/**,**/dist/**,**/build/**,**/.git/**')
    .action(async (options) => {
      const directories = options.directories.split(',');
      const ignored = options.ignore.split(',');

      const watcher = new FileSystemWatcher({
        directories,
        ignored,
        autoTrack: true
      });

      console.log(`Watching directories: ${directories.join(', ')}`);
      console.log(`Ignoring patterns: ${ignored.join(', ')}`);
      console.log('Press Ctrl+C to stop watching');

      watcher.start();

      // Handle process termination
      process.on('SIGINT', async () => {
        await watcher.stop();
        
        const changes = FileChangeTracker.getChanges();
        
        if (changes.length > 0) {
          console.log(`\nDetected ${changes.length} file changes:`);
          
          for (const change of changes) {
            console.log(`- ${change.changeType}: ${change.filePath}`);
          }
          
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'commitChanges',
              message: 'Do you want to commit these changes to the development log?',
              default: true
            }
          ]);
          
          if (answers.commitChanges) {
            const logAnswers = await inquirer.prompt([
              {
                type: 'input',
                name: 'title',
                message: 'Enter a title for the log entry:',
                validate: (input) => input.trim().length > 0 || 'Title is required'
              },
              {
                type: 'input',
                name: 'agent',
                message: 'Enter your agent identifier:',
                default: process.env.USER || 'Unknown Agent'
              },
              {
                type: 'input',
                name: 'description',
                message: 'Enter a description of the changes:',
                validate: (input) => input.trim().length > 0 || 'Description is required'
              }
            ]);
            
            const success = await FileChangeTracker.commitChanges(
              logAnswers.agent,
              logAnswers.title,
              logAnswers.description
            );
            
            if (success) {
              console.log('Changes committed to development log');
            } else {
              console.error('Failed to commit changes to development log');
            }
          }
        } else {
          console.log('\nNo file changes detected');
        }
        
        process.exit(0);
      });
    });

  return logCommand;
}

/**
 * Master Cleanup Script for The New Fuse
 * 
 * This script orchestrates the complete cleanup process by running the individual
 * cleanup scripts in the correct sequence with proper logging and error handling.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import readline from 'readline';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Define the steps in the cleanup process
const CLEANUP_STEPS = [
  {
    id: 'init',
    name: 'Initialize Cleanup Environment',
    script: 'run-now.js',
    description: 'Setting up directories, creating backups, and initializing tracking'
  },
  {
    id: 'cleanup',
    name: 'Run Code Cleanup',
    script: 'final-cleanup.js',
    description: 'Removing console.logs, standardizing imports, and identifying unused code'
  },
  {
    id: 'analyze',
    name: 'Analyze Results',
    script: 'analyze-results.js',
    description: 'Analyzing cleanup results and generating actionable reports'
  },
  {
    id: 'summarize',
    name: 'Generate Prioritized Summary',
    script: 'cleanup-summary.js',
    description: 'Creating a prioritized cleanup plan based on analysis'
  },
  {
    id: 'update',
    name: 'Update Progress Dashboard',
    script: 'update-progress.js',
    description: 'Updating the cleanup dashboard with current progress'
  }
];

// Create a readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to run a script with proper logging
function runScript(scriptPath, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n\x1b[36m${description}...\x1b[0m\n`);
    
    const child = spawn('node', [scriptPath], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n\x1b[32m✓ Completed successfully\x1b[0m\n`);
        resolve();
      } else {
        console.error(`\n\x1b[31m✗ Failed with exit code ${code}\x1b[0m\n`);
        reject(new Error(`Script exited with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      console.error(`\n\x1b[31m✗ Failed to start: ${err.message}\x1b[0m\n`);
      reject(err);
    });
  });
}

// Function to prompt for confirmation before proceeding
function confirm(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (Y/n) `, (answer) => {
      resolve(answer.toLowerCase() !== 'n');
    });
  });
}

// Display cleanup banner
function displayBanner() {
  console.log('\n\x1b[1m' + '='.repeat(80) + '\x1b[0m');
  console.log('\x1b[1m\x1b[36m' + ' '.repeat(25) + 'THE NEW FUSE CLEANUP PROCESS' + ' '.repeat(25) + '\x1b[0m');
  console.log('\x1b[1m' + '='.repeat(80) + '\x1b[0m\n');
  
  console.log('This script will guide you through the complete cleanup process for The New Fuse project.');
  console.log('Each step will be executed in sequence with the option to continue or stop after each one.\n');
  
  console.log('\x1b[1mCleanup Steps:\x1b[0m');
  CLEANUP_STEPS.forEach((step, index) => {
    console.log(`  ${index + 1}. \x1b[36m${step.name}\x1b[0m - ${step.description}`);
  });
  
  console.log('\n\x1b[33mNote: You can stop the process after any step and resume later.\x1b[0m');
  console.log('\x1b[1m' + '-'.repeat(80) + '\x1b[0m\n');
}

// Main execution function
async function main() {
  try {
    displayBanner();
    
    // Ensure reports directory exists for logging
    const reportsDir = path.join(PROJECT_ROOT, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Log start time
    const startTime = new Date();
    const logStream = fs.createWriteStream(path.join(reportsDir, 'cleanup-master.log'), { flags: 'a' });
    logStream.write(`\n\n=== Cleanup process started at ${startTime.toISOString()} ===\n\n`);
    
    let continueProcess = await confirm('Ready to begin the cleanup process?');
    if (!continueProcess) {
      console.log('\nCleanup process aborted by user. No changes have been made.\n');
      rl.close();
      return;
    }
    
    // Execute each step in sequence
    for (let i = 0; i < CLEANUP_STEPS.length; i++) {
      const step = CLEANUP_STEPS[i];
      const scriptPath = path.join(__dirname, step.script);
      
      logStream.write(`[${new Date().toISOString()}] Starting step ${i + 1}: ${step.name}\n`);
      
      try {
        await runScript(scriptPath, step.name);
        logStream.write(`[${new Date().toISOString()}] Completed step ${i + 1}: ${step.name}\n`);
        
        // If not the last step, ask for confirmation to continue
        if (i < CLEANUP_STEPS.length - 1) {
          continueProcess = await confirm('Continue to the next step?');
          if (!continueProcess) {
            console.log('\n\x1b[33mCleanup process paused after step ' + (i + 1) + '. You can resume later.\x1b[0m\n');
            break;
          }
        }
      } catch (error) {
        logStream.write(`[${new Date().toISOString()}] Error in step ${i + 1}: ${error.message}\n`);
        console.error(`\n\x1b[31mError in step ${i + 1} (${step.name}): ${error.message}\x1b[0m\n`);
        
        const skipStep = await confirm('Would you like to skip this step and continue?');
        if (!skipStep) {
          console.log('\n\x1b[33mCleanup process paused after step ' + (i + 1) + '. You can resume later.\x1b[0m\n');
          break;
        }
      }
    }
    
    // Log completion time
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    logStream.write(`\n=== Cleanup process completed at ${endTime.toISOString()} (Duration: ${duration}s) ===\n`);
    logStream.end();
    
    // Final summary
    console.log('\n\x1b[1m' + '='.repeat(80) + '\x1b[0m');
    console.log('\x1b[1m\x1b[32m' + ' '.repeat(30) + 'CLEANUP COMPLETE' + ' '.repeat(30) + '\x1b[0m');
    console.log('\x1b[1m' + '='.repeat(80) + '\x1b[0m\n');
    
    console.log('Review these files to continue the cleanup process:');
    console.log('  1. \x1b[36mCLEANUP-PRIORITIZED.md\x1b[0m - Prioritized list of items to clean up');
    console.log('  2. \x1b[36mreports/cleanup-action-plan.md\x1b[0m - Specific actions to take');
    console.log('  3. \x1b[36mCLEANUP-IMPLEMENTATION.md\x1b[0m - Guidelines for implementing changes');
    
    console.log('\nNext steps:');
    console.log('  1. Review the generated reports');
    console.log('  2. Verify the suggested changes are appropriate');
    console.log('  3. Implement high-priority changes first');
    console.log('  4. Run tests after each batch of changes');
    console.log('  5. Update progress using: \x1b[36mnode scripts/update-progress.js\x1b[0m\n');
    
    rl.close();
  } catch (error) {
    console.error('\n\x1b[31mUnexpected error in cleanup process:\x1b[0m', error);
    rl.close();
    process.exit(1);
  }
}

main();

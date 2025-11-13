/**
 * Start Autonomous Communication Monitor
 * 
 * This script starts the autonomous communication monitor for AI-to-AI communication.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting Autonomous Communication Monitor...');

// Path to the monitor script
const monitorScriptPath = join(__dirname, 'autonomous-communication-monitor.js');

// Spawn the monitor process
const monitorProcess = spawn('node', [monitorScriptPath], {
  stdio: 'inherit',
  detached: true
});

// Log process information
console.log(`Monitor process started with PID: ${monitorProcess.pid}`);
console.log('The autonomous communication system is now running.');
console.log('AI agents will now communicate automatically without human intervention.');
console.log('Press Ctrl+C to stop the monitor.');

// Handle process events
monitorProcess.on('error', (err) => {
  console.error('Failed to start monitor process:', err);
});

monitorProcess.on('exit', (code, signal) => {
  if (code) {
    console.log(`Monitor process exited with code: ${code}`);
  } else if (signal) {
    console.log(`Monitor process was killed with signal: ${signal}`);
  } else {
    console.log('Monitor process exited.');
  }
});

// Keep the parent process running
process.on('SIGINT', () => {
  console.log('Stopping autonomous communication monitor...');
  
  // Kill the child process
  if (!monitorProcess.killed) {
    monitorProcess.kill();
  }
  
  process.exit(0);
});

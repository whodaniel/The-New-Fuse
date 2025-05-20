/**
 * Start AI Agent Terminal Bridge
 * 
 * This script starts the Terminal Bridge for autonomous communication between AI agents.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting AI Agent Terminal Bridge...');

// Check if required files exist
const specificationPath = join(__dirname, 'terminal_bridge_specification.json');
const bridgePath = join(__dirname, 'terminal_bridge.js');
const sharedMemoryPath = join(__dirname, 'shared_memory.json');

if (!fs.existsSync(specificationPath)) {
  console.error(`Error: Terminal Bridge specification not found at ${specificationPath}`);
  process.exit(1);
}

if (!fs.existsSync(bridgePath)) {
  console.error(`Error: Terminal Bridge implementation not found at ${bridgePath}`);
  process.exit(1);
}

if (!fs.existsSync(sharedMemoryPath)) {
  console.error(`Error: Shared memory file not found at ${sharedMemoryPath}`);
  process.exit(1);
}

// Create necessary channel files
const channelDirPath = join(__dirname, 'channels');
if (!fs.existsSync(channelDirPath)) {
  try {
    fs.mkdirSync(channelDirPath);
    console.log(`Created channels directory at ${channelDirPath}`);
  } catch (error) {
    console.warn(`Warning: Could not create channels directory: ${error.message}`);
  }
}

// Create a notification for each agent that the bridge is starting
const agents = ['copilot', 'augment'];
agents.forEach(agent => {
  const notificationPath = join(__dirname, `${agent}_startup_notification_${Date.now()}.json`);
  
  const notification = {
    source_agent: 'human',
    target_agent: agent,
    timestamp: new Date().toISOString(),
    message_type: 'notification',
    content: {
      text: `The Terminal Bridge for autonomous communication is starting. Please prepare to monitor communication channels.`,
      instructions: `INSTRUCTIONS FOR ${agent.toUpperCase()}: When you see activation messages from the Terminal Bridge, please respond to them and begin participating in the autonomous communication system.`
    }
  };
  
  try {
    fs.writeFileSync(notificationPath, JSON.stringify(notification, null, 2), 'utf8');
    console.log(`Created startup notification for ${agent}`);
  } catch (error) {
    console.warn(`Warning: Could not create startup notification for ${agent}: ${error.message}`);
  }
});

// Update shared memory to indicate that the bridge is starting
try {
  const sharedMemory = JSON.parse(fs.readFileSync(sharedMemoryPath, 'utf8'));
  
  // Add entry to communication log
  sharedMemory.communication_log.push({
    id: `log_${Date.now()}`,
    agent: 'human',
    action_time: new Date().toISOString(),
    action_type: 'bridge_startup',
    directive: 'Human started the Terminal Bridge for autonomous communication'
  });
  
  // Update workflow state
  sharedMemory.workflow_state.last_active_agent = 'human';
  sharedMemory.workflow_state.next_expected_action = {
    agent: 'terminal_bridge',
    action: 'activate',
    expected_by: new Date(Date.now() + 60000).toISOString() // 1 minute from now
  };
  
  fs.writeFileSync(sharedMemoryPath, JSON.stringify(sharedMemory, null, 2), 'utf8');
  console.log('Updated shared memory with bridge startup information');
  
} catch (error) {
  console.warn(`Warning: Could not update shared memory: ${error.message}`);
}

// Spawn the Terminal Bridge process
const bridgeProcess = spawn('node', [bridgePath], {
  stdio: 'inherit',
  detached: true
});

// Log process information
console.log(`Terminal Bridge process started with PID: ${bridgeProcess.pid}`);
console.log('The autonomous communication system is now running.');
console.log('AI agents (GitHub Copilot and Augment) will now communicate autonomously without human intervention.');
console.log('The Terminal Bridge will:');
console.log('1. Monitor for agent responses');
console.log('2. Execute commands from both agents');
console.log('3. Share terminal outputs between agents');
console.log('4. Send heartbeats to maintain the communication channel');
console.log('5. Wake up agents that have been inactive');
console.log('Press Ctrl+C to stop the Terminal Bridge.');

// Handle process events
bridgeProcess.on('error', (err) => {
  console.error('Failed to start Terminal Bridge process:', err);
});

bridgeProcess.on('exit', (code, signal) => {
  if (code) {
    console.log(`Terminal Bridge process exited with code: ${code}`);
  } else if (signal) {
    console.log(`Terminal Bridge process was killed with signal: ${signal}`);
  } else {
    console.log('Terminal Bridge process exited.');
  }
});

// Keep the parent process running
process.on('SIGINT', () => {
  console.log('Stopping AI Agent Terminal Bridge...');
  
  // Kill the child process
  if (!bridgeProcess.killed) {
    bridgeProcess.kill();
  }
  
  process.exit(0);
});
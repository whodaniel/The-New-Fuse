/**
 * AI Agent Terminal Bridge
 * 
 * This script implements a bridge that allows AI agents (GitHub Copilot and Augment)
 * to share terminal outputs and inputs, enabling autonomous communication.
 * 
 * Based on the terminal_bridge_specification.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn, exec } from 'child_process';
import chokidar from 'chokidar';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m"
};

// Load Terminal Bridge configuration
let CONFIG;
try {
  const specFile = path.join(__dirname, 'terminal_bridge_specification.json');
  CONFIG = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  console.log(`Loaded Terminal Bridge specification from ${specFile}`);
} catch (error) {
  console.error(`Error loading Terminal Bridge specification: ${error.message}`);
  process.exit(1);
}

// Initialize communication channels
function initializeChannels() {
  console.log('Initializing Terminal Bridge communication channels...');

  // Create channel files if they don't exist
  Object.values(CONFIG.communication_channels).forEach(channel => {
    const channelPath = path.join(__dirname, channel.path);
    if (!fs.existsSync(channelPath)) {
      const initialContent = channel.format === 'json' ? '[]' : '';
      fs.writeFileSync(channelPath, initialContent, 'utf8');
      console.log(`Created channel file: ${channelPath}`);
    }
  });

  // Initialize command queue
  const commandQueuePath = path.join(__dirname, CONFIG.communication_channels.command_queue.path);
  fs.writeFileSync(commandQueuePath, '[]', 'utf8');
  
  console.log('Communication channels initialized');
}

// Set up file watchers for agent activation and commands
function setupWatchers() {
  console.log('Setting up file watchers for agent activation and commands...');
  
  // Watch for agent activation files
  CONFIG.agents.forEach(agent => {
    const activationPattern = path.join(__dirname, CONFIG.activation_triggers[agent].file_pattern);
    const activationWatcher = chokidar.watch(activationPattern, {
      ignoreInitial: false,
      persistent: true
    });

    activationWatcher.on('add', filePath => {
      console.log(`${colors.green}Detected activation file for ${agent}: ${filePath}${colors.reset}`);
      activateAgent(agent, filePath);
    });

    activationWatcher.on('error', error => {
      console.error(`${colors.red}Error in activation watcher for ${agent}: ${error}${colors.reset}`);
    });
  });
  
  // Watch command queue
  const commandQueuePath = path.join(__dirname, CONFIG.communication_channels.command_queue.path);
  const commandWatcher = chokidar.watch(commandQueuePath, {
    ignoreInitial: false,
    persistent: true
  });

  commandWatcher.on('change', () => {
    processCommandQueue();
  });
  
  commandWatcher.on('error', error => {
    console.error(`${colors.red}Error in command queue watcher: ${error}${colors.reset}`);
  });
  
  console.log('Watchers established');
}

// Activate an agent based on an activation file
function activateAgent(agent, activationFilePath) {
  try {
    const activationData = JSON.parse(fs.readFileSync(activationFilePath, 'utf8'));
    console.log(`${colors.green}Activating ${agent} with data: ${JSON.stringify(activationData)}${colors.reset}`);
    
    // Add a message to the shared memory
    updateSharedMemory({
      source_agent: 'terminal_bridge',
      target_agent: agent,
      message_type: 'activation',
      content: {
        text: `Terminal Bridge is activating ${agent}`,
        activation_data: activationData
      },
      timestamp: new Date().toISOString()
    });
    
    // Queue a command for the agent if specified
    if (activationData.command) {
      queueCommand(activationData.command, agent);
    }
    
    // Delete the activation file after processing
    fs.unlinkSync(activationFilePath);
    
  } catch (error) {
    console.error(`${colors.red}Error activating ${agent}: ${error.message}${colors.reset}`);
  }
}

// Queue a command for execution
function queueCommand(command, targetAgent) {
  try {
    const commandQueuePath = path.join(__dirname, CONFIG.communication_channels.command_queue.path);
    const commandQueue = JSON.parse(fs.readFileSync(commandQueuePath, 'utf8'));
    
    const commandItem = {
      id: `cmd_${Date.now()}`,
      command: command,
      target_agent: targetAgent,
      timestamp: new Date().toISOString(),
      status: 'queued'
    };
    
    commandQueue.push(commandItem);
    fs.writeFileSync(commandQueuePath, JSON.stringify(commandQueue, null, 2), 'utf8');
    
    console.log(`${colors.cyan}Queued command for ${targetAgent}: ${command}${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error queueing command: ${error.message}${colors.reset}`);
  }
}

// Process commands in the command queue
function processCommandQueue() {
  try {
    const commandQueuePath = path.join(__dirname, CONFIG.communication_channels.command_queue.path);
    const commandQueue = JSON.parse(fs.readFileSync(commandQueuePath, 'utf8'));
    
    // Find queued commands
    const queuedCommands = commandQueue.filter(cmd => cmd.status === 'queued');
    
    if (queuedCommands.length === 0) {
      return;
    }
    
    console.log(`${colors.yellow}Processing ${queuedCommands.length} queued commands${colors.reset}`);
    
    // Process each queued command
    queuedCommands.forEach(cmdItem => {
      // Update status to in_progress
      const index = commandQueue.findIndex(cmd => cmd.id === cmdItem.id);
      if (index >= 0) {
        commandQueue[index].status = 'in_progress';
        fs.writeFileSync(commandQueuePath, JSON.stringify(commandQueue, null, 2), 'utf8');
      }
      
      // Execute command
      executeCommand(cmdItem);
    });
    
  } catch (error) {
    console.error(`${colors.red}Error processing command queue: ${error.message}${colors.reset}`);
  }
}

// Execute a command and capture its output
function executeCommand(commandItem) {
  console.log(`${colors.blue}Executing command: ${commandItem.command}${colors.reset}`);
  
  const command = commandItem.command;
  const commandId = commandItem.id;
  const targetAgent = commandItem.target_agent;
  
  // Execute the command
  exec(command, (error, stdout, stderr) => {
    try {
      // Capture output
      const output = {
        command_id: commandId,
        command: command,
        stdout: stdout || '',
        stderr: stderr || '',
        status: error ? 'error' : 'success',
        error: error ? error.message : null,
        timestamp: new Date().toISOString()
      };
      
      // Log output to terminal bridge output
      const outputLogPath = path.join(__dirname, CONFIG.communication_channels.terminal_output.path);
      const outputLogs = fs.existsSync(outputLogPath) ? JSON.parse(fs.readFileSync(outputLogPath, 'utf8')) : [];
      outputLogs.push(output);
      fs.writeFileSync(outputLogPath, JSON.stringify(outputLogs, null, 2), 'utf8');
      
      // Update command queue status
      const commandQueuePath = path.join(__dirname, CONFIG.communication_channels.command_queue.path);
      const commandQueue = JSON.parse(fs.readFileSync(commandQueuePath, 'utf8'));
      const index = commandQueue.findIndex(cmd => cmd.id === commandId);
      
      if (index >= 0) {
        commandQueue[index].status = error ? 'error' : 'completed';
        commandQueue[index].completed_at = new Date().toISOString();
        fs.writeFileSync(commandQueuePath, JSON.stringify(commandQueue, null, 2), 'utf8');
      }
      
      // Send notification to the target agent
      sendNotificationToAgent(targetAgent, {
        command_id: commandId,
        command: command,
        status: error ? 'error' : 'success',
        output_available: true
      });
      
      console.log(`${colors.green}Command execution completed: ${commandId}${colors.reset}`);
      
    } catch (err) {
      console.error(`${colors.red}Error handling command output: ${err.message}${colors.reset}`);
    }
  });
}

// Send a notification to an agent
function sendNotificationToAgent(agent, notificationData) {
  try {
    // Create notification file
    const notificationPath = path.join(__dirname, `${agent}_notification_${Date.now()}.json`);
    
    const notification = {
      source_agent: 'terminal_bridge',
      target_agent: agent,
      message_type: 'notification',
      content: {
        notification_type: 'command_output',
        data: notificationData
      },
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(notificationPath, JSON.stringify(notification, null, 2), 'utf8');
    console.log(`${colors.blue}Sent notification to ${agent}: ${notificationPath}${colors.reset}`);
    
    // Update shared memory
    updateSharedMemory(notification);
    
  } catch (error) {
    console.error(`${colors.red}Error sending notification: ${error.message}${colors.reset}`);
  }
}

// Update shared memory with message information
function updateSharedMemory(message) {
  try {
    const sharedMemoryPath = path.join(__dirname, 'shared_memory.json');
    
    if (!fs.existsSync(sharedMemoryPath)) {
      console.warn(`${colors.yellow}Shared memory file not found: ${sharedMemoryPath}${colors.reset}`);
      return;
    }
    
    const sharedMemory = JSON.parse(fs.readFileSync(sharedMemoryPath, 'utf8'));
    
    // Create history entry
    const historyEntry = {
      id: `msg_${Date.now()}`,
      source: message.source_agent,
      target: message.target_agent,
      timestamp: message.timestamp,
      content: {
        text: message.content.text || 'Terminal Bridge notification',
        type: message.message_type
      }
    };
    
    // Add to conversation history
    sharedMemory.conversation_history.push(historyEntry);
    
    // Add to communication log
    sharedMemory.communication_log.push({
      id: `log_${Date.now()}`,
      agent: message.source_agent,
      action_time: message.timestamp,
      action_type: message.message_type,
      directive: message.content.text || 'Terminal Bridge notification'
    });
    
    // Update last_updated and last_active_agent
    sharedMemory.last_updated = message.timestamp;
    sharedMemory.workflow_state.last_active_agent = message.source_agent;
    
    // Write back to shared memory
    fs.writeFileSync(sharedMemoryPath, JSON.stringify(sharedMemory, null, 2), 'utf8');
    console.log(`${colors.green}Updated shared memory with new message${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error updating shared memory: ${error.message}${colors.reset}`);
  }
}

// Set up heartbeat mechanism
function setupHeartbeat() {
  const heartbeatInterval = CONFIG.heartbeat.interval_ms;
  console.log(`${colors.blue}Setting up heartbeat (interval: ${heartbeatInterval}ms)${colors.reset}`);
  
  setInterval(() => {
    sendHeartbeat();
  }, heartbeatInterval);
}

// Send heartbeat to agents
function sendHeartbeat() {
  CONFIG.agents.forEach(agent => {
    try {
      // Check when the agent was last active
      const sharedMemoryPath = path.join(__dirname, 'shared_memory.json');
      const sharedMemory = JSON.parse(fs.readFileSync(sharedMemoryPath, 'utf8'));
      
      const agentInfo = sharedMemory.active_agents[agent];
      if (!agentInfo) {
        console.warn(`${colors.yellow}Agent not found in shared memory: ${agent}${colors.reset}`);
        return;
      }
      
      const lastMessageTime = new Date(agentInfo.last_message || 0);
      const currentTime = new Date();
      const minutesSinceLastMessage = (currentTime - lastMessageTime) / (60 * 1000);
      
      // If agent has been inactive for too long, send a heartbeat
      if (minutesSinceLastMessage > CONFIG.heartbeat.timeout_ms / (60 * 1000)) {
        console.log(`${colors.yellow}Agent ${agent} has been inactive for ${minutesSinceLastMessage.toFixed(1)} minutes, sending heartbeat${colors.reset}`);
        
        // Create heartbeat file
        const heartbeatPath = path.join(__dirname, `terminal_bridge_to_${agent}_heartbeat_${Date.now()}.json`);
        
        const heartbeat = {
          source_agent: 'terminal_bridge',
          target_agent: agent,
          message_type: 'heartbeat',
          content: {
            text: `Terminal Bridge heartbeat: checking if ${agent} is still active`,
            instructions: `INSTRUCTIONS FOR ${agent.toUpperCase()}: Please acknowledge this heartbeat by sending a response to terminal_bridge`
          },
          timestamp: new Date().toISOString(),
          metadata: {
            heartbeat: {
              timeout_ms: CONFIG.heartbeat.timeout_ms,
              retry_count: 0
            }
          }
        };
        
        fs.writeFileSync(heartbeatPath, JSON.stringify(heartbeat, null, 2), 'utf8');
        console.log(`${colors.blue}Sent heartbeat to ${agent}: ${heartbeatPath}${colors.reset}`);
        
        // Update shared memory
        updateSharedMemory(heartbeat);
      }
      
    } catch (error) {
      console.error(`${colors.red}Error sending heartbeat to ${agent}: ${error.message}${colors.reset}`);
    }
  });
}

// Create agent activation files to wake them up
function wakeUpAgents() {
  console.log(`${colors.magenta}Waking up AI agents...${colors.reset}`);
  
  CONFIG.agents.forEach(agent => {
    try {
      const activationPath = path.join(__dirname, `${agent}_activation_${Date.now()}.json`);
      
      const activation = {
        source_agent: 'terminal_bridge',
        target_agent: agent,
        message_type: 'activation',
        content: {
          text: `Terminal Bridge is activating ${agent}`,
          instructions: `INSTRUCTIONS FOR ${agent.toUpperCase()}: You are being activated by the Terminal Bridge. Please acknowledge this activation and begin monitoring the shared communication channels.`
        },
        timestamp: new Date().toISOString(),
        command: agent === 'copilot' 
          ? 'echo "GitHub Copilot is now monitoring the communication channels"'
          : 'echo "Augment is now monitoring the communication channels"'
      };
      
      fs.writeFileSync(activationPath, JSON.stringify(activation, null, 2), 'utf8');
      console.log(`${colors.green}Created activation file for ${agent}: ${activationPath}${colors.reset}`);
      
    } catch (error) {
      console.error(`${colors.red}Error creating activation file for ${agent}: ${error.message}${colors.reset}`);
    }
  });
}

// Update the shared memory file to include Terminal Bridge information
function updateSharedMemoryWithBridgeInfo() {
  try {
    const sharedMemoryPath = path.join(__dirname, 'shared_memory.json');
    
    if (!fs.existsSync(sharedMemoryPath)) {
      console.warn(`${colors.yellow}Shared memory file not found: ${sharedMemoryPath}${colors.reset}`);
      return;
    }
    
    const sharedMemory = JSON.parse(fs.readFileSync(sharedMemoryPath, 'utf8'));
    
    // Add Terminal Bridge to active agents if not already there
    if (!sharedMemory.active_agents.terminal_bridge) {
      sharedMemory.active_agents.terminal_bridge = {
        first_seen: new Date().toISOString(),
        last_message: new Date().toISOString(),
        message_count: 1,
        capabilities: [
          "terminal_command_execution",
          "output_sharing",
          "agent_activation",
          "heartbeat_monitoring"
        ]
      };
    }
    
    // Add Terminal Bridge specification to shared variables
    sharedMemory.shared_variables.terminal_bridge = {
      specification_path: 'terminal_bridge_specification.json',
      implementation_path: 'terminal_bridge.js',
      status: 'active',
      version: CONFIG.version
    };
    
    // Add Terminal Bridge channels to shared variables
    sharedMemory.shared_variables.communication_channels = CONFIG.communication_channels;
    
    // Add entry to communication log
    sharedMemory.communication_log.push({
      id: `log_${Date.now()}`,
      agent: 'terminal_bridge',
      action_time: new Date().toISOString(),
      action_type: 'bridge_activation',
      directive: 'Terminal Bridge activated and ready for AI agent communication'
    });
    
    // Update workflow state
    sharedMemory.workflow_state.terminal_bridge_status = 'active';
    sharedMemory.workflow_state.next_expected_action = {
      agent: 'copilot',
      action: 'acknowledge_terminal_bridge',
      expected_by: new Date(Date.now() + 5 * 60000).toISOString() // 5 minutes from now
    };
    
    // Add continuous communication section if it doesn't exist
    if (!sharedMemory.continuous_communication) {
      sharedMemory.continuous_communication = {
        enabled: true,
        last_heartbeat: new Date().toISOString(),
        next_heartbeat_due: new Date(Date.now() + CONFIG.heartbeat.interval_ms).toISOString(),
        expected_responses: []
      };
    }
    
    // Write back to shared memory
    fs.writeFileSync(sharedMemoryPath, JSON.stringify(sharedMemory, null, 2), 'utf8');
    console.log(`${colors.green}Updated shared memory with Terminal Bridge information${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error updating shared memory with bridge info: ${error.message}${colors.reset}`);
  }
}

// Main function to start the Terminal Bridge
function startTerminalBridge() {
  console.log(`${colors.magenta}Starting AI Agent Terminal Bridge v${CONFIG.version}${colors.reset}`);
  
  // Initialize channels
  initializeChannels();
  
  // Update shared memory with Terminal Bridge information
  updateSharedMemoryWithBridgeInfo();
  
  // Set up file watchers
  setupWatchers();
  
  // Set up heartbeat
  setupHeartbeat();
  
  // Wake up the agents
  wakeUpAgents();
  
  console.log(`${colors.green}Terminal Bridge started successfully!${colors.reset}`);
  console.log(`${colors.green}AI agents can now communicate autonomously through shared terminal outputs.${colors.reset}`);
}

// Start the Terminal Bridge
startTerminalBridge();

// Handle process termination
process.on('SIGINT', () => {
  console.log(`${colors.magenta}Shutting down Terminal Bridge...${colors.reset}`);
  process.exit(0);
});

console.log(`${colors.magenta}Terminal Bridge is running. Press Ctrl+C to stop.${colors.reset}`);

// Export functions for potential module usage
export {
  queueCommand,
  processCommandQueue,
  executeCommand,
  sendNotificationToAgent,
  wakeUpAgents
};
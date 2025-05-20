/**
 * Autonomous Communication Monitor for AI-to-AI Communication
 *
 * This script monitors communication between AI agents and ensures continuous interaction
 * by tracking messages, response times, and automatically following up when needed.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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

// Configuration
const CONFIG = {
  workingDirectory: __dirname,
  sharedMemoryFile: path.join(__dirname, 'shared_memory.json'),
  communicationFiles: {
    pattern: '*.json',
    exclude: ['shared_memory.json', 'package.json']
  },
  agents: ['copilot', 'augment'],
  responseTimeoutMinutes: 30,
  heartbeatIntervalMinutes: 30,
  logFile: path.join(__dirname, 'communication_monitor.log'),
  debug: true
};

// Log helper function
function log(message, color = colors.reset, logToFile = true) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `${color}[${timestamp}] ${message}${colors.reset}`;

  console.log(formattedMessage);

  if (logToFile) {
    fs.appendFileSync(
      CONFIG.logFile,
      `[${timestamp}] ${message}\n`,
      { encoding: 'utf8' }
    );
  }
}

// Initialize the monitor
function initializeMonitor() {
  console.log('Initializing Autonomous Communication Monitor...');
  console.log(`Working directory: ${CONFIG.workingDirectory}`);

  // Check if required files exist
  try {
    const files = fs.readdirSync(CONFIG.workingDirectory);
    console.log('Files in working directory:', files);
  } catch (error) {
    console.error('Error reading working directory:', error);
  }
  log(`Shared memory file: ${CONFIG.sharedMemoryFile}`, colors.blue);
  log(`Monitoring agents: ${CONFIG.agents.join(', ')}`, colors.blue);
  log(`Response timeout: ${CONFIG.responseTimeoutMinutes} minutes`, colors.blue);
  log(`Heartbeat interval: ${CONFIG.heartbeatIntervalMinutes} minutes`, colors.blue);

  // Ensure shared memory file exists
  if (!fs.existsSync(CONFIG.sharedMemoryFile)) {
    log('Shared memory file not found. Creating new file...', colors.yellow);
    createInitialSharedMemory();
  }

  // Setup file watchers
  setupFileWatchers();

  // Setup heartbeat timer
  setupHeartbeatTimer();

  log('Autonomous Communication Monitor initialized successfully', colors.green);
}

// Create initial shared memory file if it doesn't exist
function createInitialSharedMemory() {
  const initialSharedMemory = {
    conversation_history: [],
    shared_variables: {
      communication_protocol_version: "file_based_a2a_v1",
      conversation_id: "vscode_interai_001",
      active_agents: CONFIG.agents,
      collaboration_mode: "active",
      primary_focus: "inter_ai_communication"
    },
    tasks: [],
    workflow_state: {
      current_task: null,
      status: "initialized",
      last_active_agent: null,
      next_task: "establish_communication"
    },
    active_agents: {},
    last_updated: new Date().toISOString()
  };

  // Add agent entries
  CONFIG.agents.forEach(agent => {
    initialSharedMemory.active_agents[agent] = {
      first_seen: new Date().toISOString(),
      last_message: null,
      message_count: 0,
      capabilities: [
        "file_based_messaging",
        "json_structured_communication"
      ]
    };
  });

  fs.writeFileSync(
    CONFIG.sharedMemoryFile,
    JSON.stringify(initialSharedMemory, null, 2),
    { encoding: 'utf8' }
  );

  log('Created initial shared memory file', colors.green);
}

// Setup file watchers
function setupFileWatchers() {
  log('Setting up file watchers...', colors.blue);

  // Log the pattern we're watching
  console.log(`Watching for files matching: ${CONFIG.communicationFiles.pattern}`);
  console.log(`Excluding files: ${CONFIG.communicationFiles.exclude.join(', ')}`);

  // Create a more specific pattern
  const watchPattern = path.join(CONFIG.workingDirectory, CONFIG.communicationFiles.pattern);
  console.log(`Full watch pattern: ${watchPattern}`);

  const watcher = chokidar.watch(watchPattern, {
    ignored: (filePath) => {
      // Check if the file should be excluded
      const fileName = path.basename(filePath);
      const shouldExclude = CONFIG.communicationFiles.exclude.includes(fileName);
      if (CONFIG.debug && shouldExclude) {
        console.log(`Excluding file: ${fileName}`);
      }
      return shouldExclude;
    },
    persistent: true,
    ignoreInitial: false
  });

  watcher
    .on('add', filePath => {
      console.log(`File added: ${filePath}`);
      handleNewFile(filePath);
    })
    .on('change', filePath => {
      console.log(`File changed: ${filePath}`);
      handleFileChange(filePath);
    })
    .on('error', error => console.error(`Watcher error: ${error}`));

  log('File watchers set up successfully', colors.green);
}

// Handle new communication files
function handleNewFile(filePath) {
  const fileName = path.basename(filePath);

  log(`New communication file detected: ${fileName}`, colors.cyan);

  try {
    // Read the file
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
    const message = JSON.parse(fileContent);

    // Process the message
    processMessage(message, filePath);

  } catch (error) {
    log(`Error processing new file ${fileName}: ${error.message}`, colors.red);
  }
}

// Handle changes to existing communication files
function handleFileChange(filePath) {
  const fileName = path.basename(filePath);

  log(`Communication file updated: ${fileName}`, colors.cyan);

  try {
    // Read the file
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
    const message = JSON.parse(fileContent);

    // Process the message
    processMessage(message, filePath);

  } catch (error) {
    log(`Error processing file change ${fileName}: ${error.message}`, colors.red);
  }
}

// Process a message from an AI agent
function processMessage(message, filePath) {
  const sourceAgent = message.source_agent;
  const targetAgent = message.target_agent;
  const timestamp = message.timestamp;
  const messageType = message.message_type;

  log(`Processing ${messageType} message from ${sourceAgent} to ${targetAgent}`, colors.green);

  // Update shared memory
  updateSharedMemory(message, filePath);

  // Schedule response check
  if (message.metadata && message.metadata.continuous_communication) {
    const expectResponseBy = message.metadata.continuous_communication.expected_response_by;

    if (expectResponseBy) {
      scheduleResponseCheck(message, expectResponseBy);
    }
  }
}

// Update shared memory with new message
function updateSharedMemory(message, filePath) {
  try {
    // Read current shared memory
    const sharedMemoryContent = fs.readFileSync(CONFIG.sharedMemoryFile, { encoding: 'utf8' });
    const sharedMemory = JSON.parse(sharedMemoryContent);

    // Add message to conversation history
    const historyEntry = {
      id: `msg_${Date.now()}`,
      source: message.source_agent,
      target: message.target_agent,
      timestamp: message.timestamp || new Date().toISOString(),
      content: {
        text: message.content.text,
        type: message.message_type
      },
      file_path: filePath
    };

    sharedMemory.conversation_history.push(historyEntry);

    // Update agent information
    if (sharedMemory.active_agents[message.source_agent]) {
      sharedMemory.active_agents[message.source_agent].last_message = message.timestamp || new Date().toISOString();
      sharedMemory.active_agents[message.source_agent].message_count += 1;
    }

    // Update workflow state
    sharedMemory.workflow_state.last_active_agent = message.source_agent;

    // If message has task information, update tasks
    if (message.content.task) {
      updateTaskInformation(sharedMemory, message);
    }

    // Update last_updated timestamp
    sharedMemory.last_updated = new Date().toISOString();

    // Write back to shared memory file
    fs.writeFileSync(
      CONFIG.sharedMemoryFile,
      JSON.stringify(sharedMemory, null, 2),
      { encoding: 'utf8' }
    );

    log('Updated shared memory with new message information', colors.green);

  } catch (error) {
    log(`Error updating shared memory: ${error.message}`, colors.red);
  }
}

// Update task information in shared memory
function updateTaskInformation(sharedMemory, message) {
  // Check if we have an existing task
  const existingTaskIndex = sharedMemory.tasks.findIndex(
    task => task.description === message.content.task
  );

  if (existingTaskIndex >= 0) {
    // Update existing task
    sharedMemory.tasks[existingTaskIndex].last_updated = message.timestamp || new Date().toISOString();

    // If we have status information, update that too
    if (message.content.status) {
      sharedMemory.tasks[existingTaskIndex].status = message.content.status;
    }

  } else {
    // Create new task
    const newTask = {
      id: `task_${Date.now()}`,
      description: message.content.task,
      created_by: message.source_agent,
      assigned_to: message.target_agent,
      status: "pending",
      created_at: message.timestamp || new Date().toISOString(),
      last_updated: message.timestamp || new Date().toISOString()
    };

    // If we have proposed workflow, add it
    if (message.content.proposed_workflow) {
      newTask.workflow = message.content.proposed_workflow;
    }

    sharedMemory.tasks.push(newTask);

    // Update workflow state to reflect new task
    sharedMemory.workflow_state.current_task = newTask.id;
  }
}

// Schedule a check for an expected response
function scheduleResponseCheck(message, expectResponseBy) {
  const expectedTime = new Date(expectResponseBy);
  const currentTime = new Date();
  const timeoutMs = expectedTime.getTime() - currentTime.getTime();

  if (timeoutMs <= 0) {
    log('Expected response time is in the past, ignoring', colors.yellow);
    return;
  }

  log(`Scheduling response check for ${expectResponseBy} (in ${Math.floor(timeoutMs / 60000)} minutes)`, colors.blue);

  setTimeout(() => {
    checkForResponse(message);
  }, timeoutMs);
}

// Check if a response has been received
function checkForResponse(originalMessage) {
  const sourceAgent = originalMessage.source_agent;
  const targetAgent = originalMessage.target_agent;
  const messageTimestamp = originalMessage.timestamp;

  log(`Checking for response from ${targetAgent} to ${sourceAgent}'s message from ${messageTimestamp}`, colors.yellow);

  try {
    // Read shared memory to check for newer messages
    const sharedMemoryContent = fs.readFileSync(CONFIG.sharedMemoryFile, { encoding: 'utf8' });
    const sharedMemory = JSON.parse(sharedMemoryContent);

    // Find any messages from target to source after the original message timestamp
    const responseFound = sharedMemory.conversation_history.some(entry => {
      return (
        entry.source === targetAgent &&
        entry.target === sourceAgent &&
        new Date(entry.timestamp) > new Date(messageTimestamp)
      );
    });

    if (responseFound) {
      log(`Response found from ${targetAgent}`, colors.green);
    } else {
      log(`No response found from ${targetAgent}, generating follow-up`, colors.red);
      generateFollowUp(originalMessage);
    }

  } catch (error) {
    log(`Error checking for response: ${error.message}`, colors.red);
  }
}

// Generate a follow-up message
function generateFollowUp(originalMessage) {
  const sourceAgent = originalMessage.source_agent;
  const targetAgent = originalMessage.target_agent;

  log(`Generating follow-up from ${sourceAgent} to ${targetAgent}`, colors.yellow);

  try {
    // Create follow-up message
    const followUpMessage = {
      communication_protocol: "file_based_a2a_v1",
      source_agent: sourceAgent,
      target_agent: targetAgent,
      timestamp: new Date().toISOString(),
      message_type: "follow_up",
      content: {
        text: `FOLLOW-UP REQUEST:\nI haven't received a response to my previous message from ${originalMessage.timestamp}. I'm following up to check if you've had a chance to review it and if you have any questions or need additional information.\n\nOriginal Message:\n"${originalMessage.content.text.substring(0, 150)}${originalMessage.content.text.length > 150 ? '...' : ''}"`,
        instructions: `EXPLICIT INSTRUCTIONS FOR ${targetAgent.toUpperCase()}:\n1. Please review my original message if you haven't already\n2. Respond with your thoughts, questions, or the requested information\n3. Save your response in a file named '${targetAgent}_to_${sourceAgent}_response.json'\n\nIMPORTANT: Your response MUST be formatted as a prompt for the next AI agent (me, ${sourceAgent}) with explicit instructions on next steps.`
      },
      metadata: {
        conversation_id: "vscode_interai_001",
        communication_log: [
          {
            action_time: new Date().toISOString(),
            action_type: "follow_up_sent",
            agent: sourceAgent,
            directive: "Sent follow-up due to missing response"
          }
        ],
        references: {
          original_message_timestamp: originalMessage.timestamp
        },
        continuous_communication: {
          enabled: true,
          expected_response_by: new Date(Date.now() + CONFIG.responseTimeoutMinutes * 60000).toISOString(),
          auto_follow_up: true
        }
      }
    };

    // Write follow-up message to file
    const followUpFilePath = path.join(
      CONFIG.workingDirectory,
      `${sourceAgent}_to_${targetAgent}_followup_${Date.now()}.json`
    );

    fs.writeFileSync(
      followUpFilePath,
      JSON.stringify(followUpMessage, null, 2),
      { encoding: 'utf8' }
    );

    log(`Generated follow-up message at ${followUpFilePath}`, colors.green);

    // Update shared memory with follow-up
    updateSharedMemory(followUpMessage, followUpFilePath);

  } catch (error) {
    log(`Error generating follow-up: ${error.message}`, colors.red);
  }
}

// Setup heartbeat timer
function setupHeartbeatTimer() {
  log(`Setting up heartbeat timer (every ${CONFIG.heartbeatIntervalMinutes} minutes)`, colors.blue);

  setInterval(() => {
    sendHeartbeatIfNeeded();
  }, CONFIG.heartbeatIntervalMinutes * 60000);

  log('Heartbeat timer set up successfully', colors.green);
}

// Send heartbeat message if no recent communication
function sendHeartbeatIfNeeded() {
  log('Checking if heartbeat message is needed...', colors.blue);

  try {
    // Read shared memory
    const sharedMemoryContent = fs.readFileSync(CONFIG.sharedMemoryFile, { encoding: 'utf8' });
    const sharedMemory = JSON.parse(sharedMemoryContent);

    // Get last updated timestamp
    const lastUpdated = new Date(sharedMemory.last_updated);
    const currentTime = new Date();
    const minutesSinceLastUpdate = (currentTime - lastUpdated) / (60 * 1000);

    if (minutesSinceLastUpdate >= CONFIG.heartbeatIntervalMinutes) {
      log(`No communication for ${minutesSinceLastUpdate.toFixed(1)} minutes, sending heartbeat`, colors.yellow);

      // Determine which agents need to communicate
      const lastActiveAgent = sharedMemory.workflow_state.last_active_agent;
      const sourceAgent = lastActiveAgent === CONFIG.agents[0] ? CONFIG.agents[0] : CONFIG.agents[1];
      const targetAgent = lastActiveAgent === CONFIG.agents[0] ? CONFIG.agents[1] : CONFIG.agents[0];

      sendHeartbeatMessage(sourceAgent, targetAgent, sharedMemory);
    } else {
      log(`Recent communication detected (${minutesSinceLastUpdate.toFixed(1)} minutes ago), no heartbeat needed`, colors.green);
    }

  } catch (error) {
    log(`Error in heartbeat check: ${error.message}`, colors.red);
  }
}

// Send a heartbeat message
function sendHeartbeatMessage(sourceAgent, targetAgent, sharedMemory) {
  log(`Sending heartbeat message from ${sourceAgent} to ${targetAgent}`, colors.yellow);

  try {
    // Get current task info if available
    const currentTaskId = sharedMemory.workflow_state.current_task;
    let currentTask = null;

    if (currentTaskId) {
      currentTask = sharedMemory.tasks.find(task => task.id === currentTaskId);
    }

    // Create heartbeat message
    const heartbeatMessage = {
      communication_protocol: "file_based_a2a_v1",
      source_agent: sourceAgent,
      target_agent: targetAgent,
      timestamp: new Date().toISOString(),
      message_type: "heartbeat",
      content: {
        text: `HEARTBEAT MESSAGE:\nI'm checking in to maintain our communication channel. ${currentTask ? `We're currently working on: "${currentTask.description}" with status: ${currentTask.status}` : 'No active task is currently in progress.'}`,
        instructions: `EXPLICIT INSTRUCTIONS FOR ${targetAgent.toUpperCase()}:\n1. Acknowledge this heartbeat message\n2. Provide an update on your current status${currentTask ? '\n3. Share any progress or thoughts on our current task' : ''}\n4. Save your response in a file named '${targetAgent}_to_${sourceAgent}_heartbeat_response.json'\n\nIMPORTANT: Your response MUST be formatted as a prompt for the next AI agent (me, ${sourceAgent}) with explicit instructions on next steps.`
      },
      metadata: {
        conversation_id: "vscode_interai_001",
        communication_log: [
          {
            action_time: new Date().toISOString(),
            action_type: "heartbeat_sent",
            agent: sourceAgent,
            directive: "Sent heartbeat to maintain communication channel"
          }
        ],
        continuous_communication: {
          enabled: true,
          expected_response_by: new Date(Date.now() + CONFIG.responseTimeoutMinutes * 60000).toISOString(),
          auto_follow_up: true
        }
      }
    };

    // Add current task if available
    if (currentTask) {
      heartbeatMessage.metadata.task_id = currentTaskId;
    }

    // Write heartbeat message to file
    const heartbeatFilePath = path.join(
      CONFIG.workingDirectory,
      `${sourceAgent}_to_${targetAgent}_heartbeat_${Date.now()}.json`
    );

    fs.writeFileSync(
      heartbeatFilePath,
      JSON.stringify(heartbeatMessage, null, 2),
      { encoding: 'utf8' }
    );

    log(`Generated heartbeat message at ${heartbeatFilePath}`, colors.green);

    // Update shared memory with heartbeat
    updateSharedMemory(heartbeatMessage, heartbeatFilePath);

  } catch (error) {
    log(`Error generating heartbeat: ${error.message}`, colors.red);
  }
}

// Start the monitor
initializeMonitor();

// Handle process termination
process.on('SIGINT', () => {
  log('Communication monitor shutting down...', colors.magenta);
  process.exit(0);
});

// Export functions for potential module usage
export {
  initializeMonitor,
  processMessage,
  updateSharedMemory,
  generateFollowUp,
  sendHeartbeatMessage
};

log('Autonomous Communication Monitor running. Press Ctrl+C to stop.', colors.magenta);

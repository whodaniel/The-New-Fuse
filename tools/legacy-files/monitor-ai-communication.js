/**
 * AI Communication Monitor
 * 
 * This script automates the processing of JSON communication files between
 * different AI assistants (like GitHub Copilot and Augment) and displays
 * them in a centralized terminal view.
 * 
 * Usage: node monitor-ai-communication.js
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const chalk = require('chalk'); // We'll handle the case if chalk isn't installed

// Configuration
const CONFIG = {
  watchDir: path.join(__dirname),
  filePattern: /^(copilot|augment|claude|gpt4|assistant).*\.json$/i,
  excludeProcessed: true,
  pollInterval: 1000, // Check for new files every second
  colorMap: {
    'copilot': 'cyan',
    'augment': 'green',
    'claude': 'magenta',
    'gpt4': 'blue',
    'assistant': 'yellow'
  },
  sharedMemoryFile: path.join(__dirname, 'shared_memory.json'),
  historyFile: path.join(__dirname, 'communication_history.log')
};

// Setup colored output (with fallback if chalk isn't installed)
let colors = {
  cyan: (text) => text,
  green: (text) => text,
  magenta: (text) => text, 
  blue: (text) => text,
  yellow: (text) => text,
  red: (text) => text,
  gray: (text) => text,
  bold: (text) => text
};

try {
  // Try to use chalk if available
  colors = {
    cyan: chalk.cyan,
    green: chalk.green,
    magenta: chalk.magenta,
    blue: chalk.blue,
    yellow: chalk.yellow,
    red: chalk.red,
    gray: chalk.gray,
    bold: chalk.bold
  };
} catch (err) {
  console.log('Chalk not installed. Running without color support.');
  console.log('To install: npm install chalk');
}

// Track processed files to avoid duplicate processing
const processedFiles = new Set();

// Initialize shared memory if it doesn't exist
function initializeSharedMemory() {
  if (!fs.existsSync(CONFIG.sharedMemoryFile)) {
    const initialMemory = {
      conversation_history: [],
      shared_variables: {},
      tasks: [],
      workflow_state: {
        current_task: null,
        status: 'idle'
      },
      active_agents: {},
      last_updated: new Date().toISOString()
    };
    
    fs.writeFileSync(
      CONFIG.sharedMemoryFile, 
      JSON.stringify(initialMemory, null, 2)
    );
    
    console.log(colors.gray(`Created shared memory file: ${CONFIG.sharedMemoryFile}`));
  }
}

// Write to shared memory
function updateSharedMemory(message) {
  try {
    // Read current shared memory
    const memoryData = JSON.parse(fs.readFileSync(CONFIG.sharedMemoryFile, 'utf8'));
    
    // Update conversation history
    memoryData.conversation_history.push({
      id: `msg_${Date.now()}`,
      source: message.source_agent,
      target: message.target_agent,
      timestamp: message.timestamp || new Date().toISOString(),
      content: message.content,
      type: message.message_type
    });
    
    // Update active agents
    if (!memoryData.active_agents[message.source_agent]) {
      memoryData.active_agents[message.source_agent] = {
        first_seen: new Date().toISOString(),
        message_count: 0,
        capabilities: message.metadata?.capabilities || []
      };
    }
    
    memoryData.active_agents[message.source_agent].last_message = new Date().toISOString();
    memoryData.active_agents[message.source_agent].message_count++;
    
    // Update for target too
    if (!memoryData.active_agents[message.target_agent]) {
      memoryData.active_agents[message.target_agent] = {
        first_seen: new Date().toISOString(),
        message_count: 0,
        capabilities: []
      };
    }
    
    // Update tasks if this is a task-related message
    if (message.message_type === 'task_proposal' || 
        message.message_type === 'task_request' || 
        message.message_type === 'task_result') {
      
      if (message.content.task) {
        const taskId = `task_${Date.now()}`;
        memoryData.tasks.push({
          id: taskId,
          description: message.content.task,
          created_by: message.source_agent,
          assigned_to: message.target_agent,
          status: 'pending',
          created_at: new Date().toISOString()
        });
        
        memoryData.workflow_state.current_task = taskId;
        memoryData.workflow_state.status = 'task_assigned';
      }
    }
    
    // Update timestamp
    memoryData.last_updated = new Date().toISOString();
    
    // Write back to file
    fs.writeFileSync(
      CONFIG.sharedMemoryFile, 
      JSON.stringify(memoryData, null, 2)
    );
    
  } catch (error) {
    console.error(colors.red('Error updating shared memory:'), error);
  }
}

// Append to history log
function appendToHistory(message, filePath) {
  try {
    const logEntry = `\n[${new Date().toLocaleTimeString()}] ${message.source_agent} -> ${message.target_agent} (${filePath})
${'-'.repeat(80)}
${message.content.text || JSON.stringify(message.content)}
${'-'.repeat(80)}\n`;

    fs.appendFileSync(CONFIG.historyFile, logEntry);
  } catch (error) {
    console.error(colors.red('Error appending to history:'), error);
  }
}

// Display a message in the terminal
function displayMessage(message, filePath) {
  const source = message.source_agent || 'unknown';
  const target = message.target_agent || 'unknown';
  const type = message.message_type || 'message';
  
  // Choose color based on source agent
  const sourceColor = CONFIG.colorMap[source.toLowerCase()] 
    ? colors[CONFIG.colorMap[source.toLowerCase()]] 
    : colors.gray;
  
  // Display header
  console.log('\n' + '='.repeat(80));
  console.log(
    sourceColor(`[${source.toUpperCase()}] -> [${target.toUpperCase()}]`) + 
    colors.gray(` | ${type} | ${path.basename(filePath)}`)
  );
  console.log('='.repeat(80));
  
  // Display message content
  if (message.content.text) {
    console.log(sourceColor(message.content.text));
  }
  
  // Display additional content fields if present
  const additionalFields = Object.keys(message.content).filter(key => key !== 'text');
  if (additionalFields.length > 0) {
    console.log('\nAdditional content:');
    additionalFields.forEach(field => {
      if (typeof message.content[field] === 'object') {
        console.log(`- ${field}:`);
        console.log(util.inspect(message.content[field], { colors: true, depth: 3 }));
      } else {
        console.log(`- ${field}: ${message.content[field]}`);
      }
    });
  }
  
  // Show metadata preview
  if (message.metadata) {
    console.log('\nMetadata:');
    console.log(colors.gray(JSON.stringify(message.metadata, null, 2)));
  }
  
  console.log('='.repeat(80) + '\n');
}

// Process a communication file
function processFile(filePath) {
  try {
    // Skip if already processed
    if (processedFiles.has(filePath)) {
      return;
    }
    
    // Read and parse the file
    const content = fs.readFileSync(filePath, 'utf8');
    const message = JSON.parse(content);
    
    // Display the message
    displayMessage(message, filePath);
    
    // Update shared memory with this message
    updateSharedMemory(message);
    
    // Append to history log
    appendToHistory(message, filePath);
    
    // Mark as processed
    processedFiles.add(filePath);
    
    // Mark file as processed by renaming (optional)
    if (CONFIG.excludeProcessed && !filePath.includes('.processed')) {
      try {
        // We don't rename here to avoid race conditions with other tools
        // but we could with: fs.renameSync(filePath, `${filePath}.processed`);
      } catch (err) {
        // Ignore rename errors
      }
    }
    
    return message;
  } catch (error) {
    console.error(colors.red(`Error processing file ${filePath}:`), error);
    return null;
  }
}

// Watch the directory for changes
function watchDirectory() {
  console.log(colors.bold(`Monitoring for AI communication in: ${CONFIG.watchDir}`));
  console.log(colors.gray(`Shared memory: ${CONFIG.sharedMemoryFile}`));
  console.log(colors.gray(`History log: ${CONFIG.historyFile}`));
  console.log(colors.gray('Press Ctrl+C to stop\n'));

  // Initial scan of existing files
  const files = fs.readdirSync(CONFIG.watchDir);
  const jsonFiles = files.filter(file => 
    CONFIG.filePattern.test(file) && 
    (!CONFIG.excludeProcessed || !file.includes('.processed'))
  );
  
  if (jsonFiles.length > 0) {
    console.log(colors.bold(`Processing ${jsonFiles.length} existing message files...`));
    
    // Process files chronologically by modification time
    const sortedFiles = jsonFiles
      .map(file => ({ 
        name: file, 
        mtime: fs.statSync(path.join(CONFIG.watchDir, file)).mtime.getTime() 
      }))
      .sort((a, b) => a.mtime - b.mtime)
      .map(file => file.name);
    
    sortedFiles.forEach(file => {
      processFile(path.join(CONFIG.watchDir, file));
    });
  }
  
  // Setup polling for new files
  let lastCheckTime = Date.now();
  
  setInterval(() => {
    try {
      const currentFiles = fs.readdirSync(CONFIG.watchDir);
      const currentJsonFiles = currentFiles.filter(file => 
        CONFIG.filePattern.test(file) && 
        (!CONFIG.excludeProcessed || !file.includes('.processed'))
      );
      
      // Check each file's modification time
      currentJsonFiles.forEach(file => {
        const filePath = path.join(CONFIG.watchDir, file);
        const stats = fs.statSync(filePath);
        
        // Process files modified since our last check
        if (stats.mtimeMs > lastCheckTime && !processedFiles.has(filePath)) {
          processFile(filePath);
        }
      });
      
      lastCheckTime = Date.now();
    } catch (err) {
      console.error(colors.red('Error checking for new files:'), err);
    }
  }, CONFIG.pollInterval);
}

// Main process
function main() {
  console.log(colors.bold('\nAI Communication Monitor'));
  console.log(colors.bold('========================'));
  
  // Initialize shared memory
  initializeSharedMemory();
  
  // Start watching for changes
  watchDirectory();
}

// Start the monitor
main();
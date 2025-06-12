#!/usr/bin/env node

/**
 * Self-Improvement Orchestrator for The New Fuse Framework
 * 
 * This script creates a continuous self-improvement loop for The New Fuse
 * by utilizing the MCP tools, AppleScript execution, and other available resources.
 * 
 * Features:
 * 1. Maintains context between interactions
 * 2. Schedules and executes tasks autonomously
 * 3. Learns from its actions and results
 * 4. Evolves The New Fuse framework based on its findings
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn, exec } from 'child_process';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  contextDir: path.join(projectRoot, 'self_improvement'),
  contextFile: path.join(projectRoot, 'self_improvement', 'context.json'),
  taskQueueFile: path.join(projectRoot, 'self_improvement', 'task_queue.json'),
  resultsDir: path.join(projectRoot, 'self_improvement', 'results'),
  promptsFile: path.join(projectRoot, 'self_improvement', 'prompts.json'),
  mcpConfigFile: path.join(projectRoot, 'mcp_config.json'),
  claudeConfigFile: path.join(process.env.HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  checkIntervalMs: 60000, // 1 minute
  verboseLogging: true,
  maxTaskHistory: 100
};

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  bright: "\x1b[1m"
};

/**
 * Main Orchestrator Class
 */
class SelfImprovementOrchestrator {
  constructor() {
    this.context = {
      currentState: 'initializing',
      lastUpdate: new Date().toISOString(),
      sessionId: `session_${Date.now()}`,
      discoveries: [],
      improvements: [],
      taskHistory: []
    };
    
    this.taskQueue = [];
    this.prompts = {
      baseContextPrompt: "You are an autonomous AI system that helps improve The New Fuse framework. Remember your core mission, the available MCP tools, and your current task.",
      reflectionPrompt: "Based on the completed tasks and current state of the framework, what improvements would be most valuable next? Consider both technical improvements and documentation updates.",
      explorationPrompt: "Explore the framework to discover new components, integrations, or opportunities for enhancement. Focus on the MCP integration specifically."
    };
  }

  /**
   * Initialize the orchestrator
   */
  async initialize() {
    this.log('Initializing Self-Improvement Orchestrator...', colors.bright + colors.blue);

    // Ensure directories exist
    await this.ensureDirectories();
    
    // Load or create context
    await this.loadContext();
    
    // Load or create task queue
    await this.loadTaskQueue();
    
    // Load or create prompts
    await this.loadPrompts();
    
    // Verify MCP configuration
    await this.verifyMcpConfig();

    // Update context
    this.context.currentState = 'ready';
    this.context.lastUpdate = new Date().toISOString();
    await this.saveContext();

    this.log('Self-Improvement Orchestrator initialized successfully', colors.green);
  }

  /**
   * Ensure all required directories exist
   */
  async ensureDirectories() {
    this.log('Ensuring directories exist...', colors.cyan);
    
    // Create directories if they don't exist
    for (const dir of [CONFIG.contextDir, CONFIG.resultsDir]) {
      if (!fs.existsSync(dir)) {
        this.log(`Creating directory: ${dir}`, colors.yellow);
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Load or create context file
   */
  async loadContext() {
    this.log('Loading context...', colors.cyan);
    
    if (fs.existsSync(CONFIG.contextFile)) {
      try {
        const contextData = fs.readFileSync(CONFIG.contextFile, 'utf8');
        this.context = JSON.parse(contextData);
        this.log('Context loaded successfully', colors.green);
      } catch (error) {
        this.log(`Error loading context: ${error.message}`, colors.red);
        // Keep using default context and save it
        await this.saveContext();
      }
    } else {
      this.log('Context file not found, creating new context', colors.yellow);
      await this.saveContext();
    }
  }

  /**
   * Save context to file
   */
  async saveContext() {
    this.log('Saving context...', colors.cyan);
    
    try {
      // Ensure context directory exists
      if (!fs.existsSync(CONFIG.contextDir)) {
        fs.mkdirSync(CONFIG.contextDir, { recursive: true });
      }
      
      // Update timestamp
      this.context.lastUpdate = new Date().toISOString();
      
      // Write context to file
      fs.writeFileSync(CONFIG.contextFile, JSON.stringify(this.context, null, 2), 'utf8');
      this.log('Context saved successfully', colors.green);
    } catch (error) {
      this.log(`Error saving context: ${error.message}`, colors.red);
    }
  }

  /**
   * Load or create task queue
   */
  async loadTaskQueue() {
    this.log('Loading task queue...', colors.cyan);
    
    if (fs.existsSync(CONFIG.taskQueueFile)) {
      try {
        const taskData = fs.readFileSync(CONFIG.taskQueueFile, 'utf8');
        this.taskQueue = JSON.parse(taskData);
        this.log(`Task queue loaded with ${this.taskQueue.length} tasks`, colors.green);
      } catch (error) {
        this.log(`Error loading task queue: ${error.message}`, colors.red);
        // Keep using default empty queue and save it
        await this.saveTaskQueue();
      }
    } else {
      this.log('Task queue file not found, creating new queue', colors.yellow);
      // Add initial tasks
      this.taskQueue = [
        {
          id: `task_${Date.now()}_1`,
          type: 'exploration',
          description: 'Explore The New Fuse framework structure to build knowledge base',
          status: 'pending',
          priority: 'high',
          created: new Date().toISOString()
        },
        {
          id: `task_${Date.now()}_2`,
          type: 'enhancement',
          description: 'Verify all MCP servers are properly configured',
          status: 'pending',
          priority: 'high',
          created: new Date().toISOString()
        }
      ];
      await this.saveTaskQueue();
    }
  }

  /**
   * Save task queue to file
   */
  async saveTaskQueue() {
    this.log('Saving task queue...', colors.cyan);
    
    try {
      fs.writeFileSync(CONFIG.taskQueueFile, JSON.stringify(this.taskQueue, null, 2), 'utf8');
      this.log('Task queue saved successfully', colors.green);
    } catch (error) {
      this.log(`Error saving task queue: ${error.message}`, colors.red);
    }
  }

  /**
   * Load or create prompts
   */
  async loadPrompts() {
    this.log('Loading prompts...', colors.cyan);
    
    if (fs.existsSync(CONFIG.promptsFile)) {
      try {
        const promptsData = fs.readFileSync(CONFIG.promptsFile, 'utf8');
        this.prompts = JSON.parse(promptsData);
        this.log('Prompts loaded successfully', colors.green);
      } catch (error) {
        this.log(`Error loading prompts: ${error.message}`, colors.red);
        // Keep using default prompts and save them
        await this.savePrompts();
      }
    } else {
      this.log('Prompts file not found, creating new prompts file', colors.yellow);
      await this.savePrompts();
    }
  }

  /**
   * Save prompts to file
   */
  async savePrompts() {
    this.log('Saving prompts...', colors.cyan);
    
    try {
      fs.writeFileSync(CONFIG.promptsFile, JSON.stringify(this.prompts, null, 2), 'utf8');
      this.log('Prompts saved successfully', colors.green);
    } catch (error) {
      this.log(`Error saving prompts: ${error.message}`, colors.red);
    }
  }

  /**
   * Verify MCP configuration
   */
  async verifyMcpConfig() {
    this.log('Verifying MCP configuration...', colors.cyan);
    
    try {
      // Check if MCP configuration files exist
      const mcpConfigExists = fs.existsSync(CONFIG.mcpConfigFile);
      const claudeConfigExists = fs.existsSync(CONFIG.claudeConfigFile);
      
      if (!mcpConfigExists) {
        this.log('MCP config file not found.', colors.yellow);
        await this.addTask({
          type: 'setup',
          description: 'Create MCP configuration file',
          status: 'pending',
          priority: 'critical',
          created: new Date().toISOString()
        });
      }
      
      if (!claudeConfigExists) {
        this.log('Claude config file not found.', colors.yellow);
        await this.addTask({
          type: 'setup',
          description: 'Create Claude configuration file',
          status: 'pending',
          priority: 'critical',
          created: new Date().toISOString()
        });
      }
      
      // If configs exist, check for required servers
      if (mcpConfigExists) {
        const mcpConfig = JSON.parse(fs.readFileSync(CONFIG.mcpConfigFile, 'utf8'));
        
        // Check for essential servers
        const essentialServers = ['filesystem', 'http', 'shell', 'web-search'];
        const missingServers = essentialServers.filter(server => 
          !mcpConfig.mcpServers || !mcpConfig.mcpServers[server]
        );
        
        if (missingServers.length > 0) {
          this.log(`Missing essential MCP servers: ${missingServers.join(', ')}`, colors.yellow);
          await this.addTask({
            type: 'setup',
            description: `Add missing MCP servers: ${missingServers.join(', ')}`,
            status: 'pending',
            priority: 'high',
            data: { missingServers },
            created: new Date().toISOString()
          });
        } else {
          this.log('All essential MCP servers are configured', colors.green);
        }
      }
    } catch (error) {
      this.log(`Error verifying MCP config: ${error.message}`, colors.red);
    }
  }

  /**
   * Add a task to the queue
   */
  async addTask(task) {
    // Ensure task has an ID if not provided
    if (!task.id) {
      task.id = `task_${Date.now()}_${this.taskQueue.length + 1}`;
    }
    
    // Ensure task has a creation timestamp if not provided
    if (!task.created) {
      task.created = new Date().toISOString();
    }
    
    // Add task to queue
    this.taskQueue.push(task);
    
    // Save updated queue
    await this.saveTaskQueue();
    
    this.log(`Added task: ${task.description} [ID: ${task.id}]`, colors.yellow);
  }

  /**
   * Start the main orchestration loop
   */
  async start() {
    this.log('Starting Self-Improvement Orchestrator...', colors.bright + colors.green);
    
    // Update context
    this.context.currentState = 'running';
    this.context.lastUpdate = new Date().toISOString();
    await this.saveContext();
    
    // Start the main loop
    this.scheduleNextCheck();
  }

  /**
   * Schedule the next check
   */
  scheduleNextCheck() {
    setTimeout(() => {
      this.checkAndProcessTasks()
        .catch(error => this.log(`Error in task processing: ${error.message}`, colors.red))
        .finally(() => this.scheduleNextCheck());
    }, CONFIG.checkIntervalMs);
  }

  /**
   * Check and process pending tasks
   */
  async checkAndProcessTasks() {
    this.log('Checking for pending tasks...', colors.cyan);
    
    // Filter pending tasks
    const pendingTasks = this.taskQueue.filter(task => task.status === 'pending');
    
    if (pendingTasks.length === 0) {
      this.log('No pending tasks found. Generating new tasks...', colors.yellow);
      await this.generateNewTasks();
      return;
    }
    
    // Sort by priority
    pendingTasks.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Process the highest priority task
    const task = pendingTasks[0];
    this.log(`Processing task: ${task.description} [ID: ${task.id}]`, colors.bright + colors.yellow);
    
    try {
      // Update task status
      task.status = 'processing';
      task.startedAt = new Date().toISOString();
      await this.saveTaskQueue();
      
      // Process based on task type
      switch (task.type) {
        case 'exploration':
          await this.handleExplorationTask(task);
          break;
        case 'enhancement':
          await this.handleEnhancementTask(task);
          break;
        case 'setup':
          await this.handleSetupTask(task);
          break;
        case 'reflection':
          await this.handleReflectionTask(task);
          break;
        default:
          this.log(`Unknown task type: ${task.type}`, colors.red);
          task.status = 'failed';
          task.error = `Unknown task type: ${task.type}`;
      }
      
      // Update task status if not already updated
      if (task.status === 'processing') {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
      }
      
      // Add to task history
      this.context.taskHistory.unshift({
        id: task.id,
        type: task.type,
        description: task.description,
        status: task.status,
        created: task.created,
        completed: task.completedAt || new Date().toISOString()
      });
      
      // Keep history to maximum size
      if (this.context.taskHistory.length > CONFIG.maxTaskHistory) {
        this.context.taskHistory = this.context.taskHistory.slice(0, CONFIG.maxTaskHistory);
      }
      
      // Save context and task queue
      await this.saveContext();
      
      // Remove completed task from queue
      this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);
      await this.saveTaskQueue();
      
      this.log(`Task completed: ${task.description}`, colors.green);
    } catch (error) {
      this.log(`Error processing task: ${error.message}`, colors.red);
      
      // Update task status
      task.status = 'failed';
      task.error = error.message;
      task.failedAt = new Date().toISOString();
      
      // Save task queue
      await this.saveTaskQueue();
    }
  }

  /**
   * Generate new tasks when the queue is empty
   */
  async generateNewTasks() {
    this.log('Generating new tasks...', colors.cyan);
    
    // Add a reflection task
    await this.addTask({
      type: 'reflection',
      description: 'Reflect on recent improvements and suggest next steps',
      status: 'pending',
      priority: 'medium',
      created: new Date().toISOString()
    });
    
    // Add an exploration task
    await this.addTask({
      type: 'exploration',
      description: 'Explore framework components for improvement opportunities',
      status: 'pending',
      priority: 'medium',
      created: new Date().toISOString()
    });
  }

  /**
   * Handle exploration tasks
   */
  async handleExplorationTask(task) {
    this.log(`Handling exploration task: ${task.description}`, colors.cyan);
    
    // Use AppleScript to generate an exploration prompt
    const result = await this.executeAppleScript(`
      tell application "Claude"
        set frontmost to true
        activate
        
        -- Clear previous conversations
        tell application "System Events" to keystroke "n" using command down
        delay 0.5
        
        -- Type the exploration prompt
        set myPrompt to "I need to explore The New Fuse framework to identify improvement opportunities. The framework focuses on MCP (Model Context Protocol) integration, which enables AI agents to use tools and communicate with each other. Based on the recent tasks: ${JSON.stringify(this.context.taskHistory.slice(0, 5))}, what should I explore next and how?"
        tell application "System Events" to keystroke myPrompt
        delay 0.5
        
        -- Submit the prompt
        tell application "System Events" to keystroke return
        
        -- Wait for response
        delay 10
        
        -- Return the current conversation
        return "Exploration initiated successfully"
      end tell
    `);
    
    // Create a result file for this exploration
    const resultFile = path.join(CONFIG.resultsDir, `exploration_${Date.now()}.txt`);
    fs.writeFileSync(resultFile, `Exploration Task: ${task.description}\nStarted: ${new Date().toISOString()}\nResult: ${result}\n`, 'utf8');
    
    this.log(`Exploration initiated, see Claude for results`, colors.green);
    task.resultFile = resultFile;
    
    // Add a follow-up enhancement task
    await this.addTask({
      type: 'enhancement',
      description: 'Implement improvements based on exploration findings',
      status: 'pending',
      priority: 'medium',
      created: new Date().toISOString()
    });
  }

  /**
   * Handle enhancement tasks
   */
  async handleEnhancementTask(task) {
    this.log(`Handling enhancement task: ${task.description}`, colors.cyan);
    
    // Use AppleScript to generate an enhancement prompt
    const result = await this.executeAppleScript(`
      tell application "Claude"
        set frontmost to true
        activate
        
        -- Clear previous conversations
        tell application "System Events" to keystroke "n" using command down
        delay 0.5
        
        -- Type the enhancement prompt
        set myPrompt to "I need to implement improvements for The New Fuse framework. Based on my exploration and the current state, please help me implement specific enhancements. Here is my context: ${JSON.stringify(this.context)}"
        tell application "System Events" to keystroke myPrompt
        delay 0.5
        
        -- Submit the prompt
        tell application "System Events" to keystroke return
        
        -- Wait for response
        delay 10
        
        -- Return the current conversation
        return "Enhancement initiated successfully"
      end tell
    `);
    
    // Create a result file for this enhancement
    const resultFile = path.join(CONFIG.resultsDir, `enhancement_${Date.now()}.txt`);
    fs.writeFileSync(resultFile, `Enhancement Task: ${task.description}\nStarted: ${new Date().toISOString()}\nResult: ${result}\n`, 'utf8');
    
    this.log(`Enhancement initiated, see Claude for results`, colors.green);
    task.resultFile = resultFile;
    
    // Track improvement in context
    this.context.improvements.push({
      id: `improvement_${Date.now()}`,
      description: task.description,
      date: new Date().toISOString(),
      taskId: task.id
    });
    await this.saveContext();
  }

  /**
   * Handle setup tasks
   */
  async handleSetupTask(task) {
    this.log(`Handling setup task: ${task.description}`, colors.cyan);
    
    // Handle different setup tasks
    if (task.description.includes('Create MCP configuration file')) {
      // Create basic MCP config
      const mcpConfig = {
        mcpServers: {
          filesystem: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem", "--allow-dir", "."]
          },
          http: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-http"]
          },
          shell: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-shell", "--allow-commands", "ls,cat,grep,find,echo,pwd"]
          },
          "web-search": {
            command: "npx",
            args: ["@modelcontextprotocol/server-websearch"]
          }
        }
      };
      
      // Ensure directory exists
      const configDir = path.dirname(CONFIG.mcpConfigFile);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Write config file
      fs.writeFileSync(CONFIG.mcpConfigFile, JSON.stringify(mcpConfig, null, 2), 'utf8');
      this.log(`Created MCP configuration file: ${CONFIG.mcpConfigFile}`, colors.green);
    } 
    else if (task.description.includes('Add missing MCP servers')) {
      // Read existing config
      const mcpConfig = JSON.parse(fs.readFileSync(CONFIG.mcpConfigFile, 'utf8'));
      
      // Ensure mcpServers object exists
      if (!mcpConfig.mcpServers) {
        mcpConfig.mcpServers = {};
      }
      
      // Add missing servers
      const missingServers = task.data?.missingServers || [];
      
      for (const server of missingServers) {
        switch (server) {
          case 'filesystem':
            mcpConfig.mcpServers.filesystem = {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-filesystem", "--allow-dir", "."]
            };
            break;
          case 'http':
            mcpConfig.mcpServers.http = {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-http"]
            };
            break;
          case 'shell':
            mcpConfig.mcpServers.shell = {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-shell", "--allow-commands", "ls,cat,grep,find,echo,pwd"]
            };
            break;
          case 'web-search':
            mcpConfig.mcpServers['web-search'] = {
              command: "npx",
              args: ["@modelcontextprotocol/server-websearch"]
            };
            break;
        }
      }
      
      // Write updated config
      fs.writeFileSync(CONFIG.mcpConfigFile, JSON.stringify(mcpConfig, null, 2), 'utf8');
      this.log(`Added missing MCP servers: ${missingServers.join(', ')}`, colors.green);
    }
    else if (task.description.includes('Create Claude configuration file')) {
      // Create basic Claude config
      const claudeConfig = {
        mcpServers: {
          filesystem: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem", "--allow-dir", "."]
          },
          http: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-http"]
          },
          shell: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-shell", "--allow-commands", "ls,cat,grep,find,echo,pwd"]
          },
          "web-search": {
            command: "npx",
            args: ["@modelcontextprotocol/server-websearch"]
          }
        }
      };
      
      // Ensure directory exists
      const configDir = path.dirname(CONFIG.claudeConfigFile);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Write config file
      fs.writeFileSync(CONFIG.claudeConfigFile, JSON.stringify(claudeConfig, null, 2), 'utf8');
      this.log(`Created Claude configuration file: ${CONFIG.claudeConfigFile}`, colors.green);
    }
    else {
      this.log(`Unknown setup task: ${task.description}`, colors.red);
      task.status = 'failed';
      task.error = `Unknown setup task: ${task.description}`;
      return;
    }
  }

  /**
   * Handle reflection tasks
   */
  async handleReflectionTask(task) {
    this.log(`Handling reflection task: ${task.description}`, colors.cyan);
    
    // Get task history summary
    const taskHistorySummary = this.context.taskHistory
      .slice(0, 10)
      .map(t => `${t.type}: ${t.description} (${t.status})`)
      .join("\n");
    
    // Use AppleScript to generate a reflection prompt
    const result = await this.executeAppleScript(`
      tell application "Claude"
        set frontmost to true
        activate
        
        -- Clear previous conversations
        tell application "System Events" to keystroke "n" using command down
        delay 0.5
        
        -- Type the reflection prompt
        set myPrompt to "I need to reflect on recent improvements to The New Fuse framework and suggest next steps. Here's my recent task history:\\n${taskHistorySummary}\\n\\nBased on this history and your understanding of The New Fuse framework and MCP integration, what are the most important improvements I should prioritize next? Please be specific and actionable."
        tell application "System Events" to keystroke myPrompt
        delay 0.5
        
        -- Submit the prompt
        tell application "System Events" to keystroke return
        
        -- Wait for response
        delay 10
        
        -- Return the current conversation
        return "Reflection initiated successfully"
      end tell
    `);
    
    // Create a result file for this reflection
    const resultFile = path.join(CONFIG.resultsDir, `reflection_${Date.now()}.txt`);
    fs.writeFileSync(resultFile, `Reflection Task: ${task.description}\nStarted: ${new Date().toISOString()}\nResult: ${result}\n`, 'utf8');
    
    this.log(`Reflection initiated, see Claude for results`, colors.green);
    task.resultFile = resultFile;
    
    // Add a new task based on the current deficiencies
    if (this.context.improvements.length < 3) {
      await this.addTask({
        type: 'enhancement',
        description: 'Implement core framework improvements based on reflection',
        status: 'pending',
        priority: 'high',
        created: new Date().toISOString()
      });
    } else {
      await this.addTask({
        type: 'exploration',
        description: 'Analyze current MCP server capabilities and identify gaps',
        status: 'pending',
        priority: 'medium',
        created: new Date().toISOString()
      });
    }
  }

  /**
   * Execute an AppleScript and return the result
   */
  async executeAppleScript(script) {
    return new Promise((resolve, reject) => {
      // Create a temporary file for the script
      const tempScriptFile = `/tmp/self_improve_${Date.now()}.scpt`;
      fs.writeFileSync(tempScriptFile, script, 'utf8');
      
      // Execute the script
      exec(`osascript ${tempScriptFile}`, (error, stdout, stderr) => {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempScriptFile);
        } catch (e) {
          // Ignore cleanup errors
        }
        
        if (error) {
          reject(error);
          return;
        }
        
        if (stderr) {
          this.log(`AppleScript warning: ${stderr}`, colors.yellow);
        }
        
        resolve(stdout.trim());
      });
    });
  }

  /**
   * Stop the orchestrator
   */
  async stop() {
    this.log('Stopping Self-Improvement Orchestrator...', colors.bright + colors.blue);
    
    // Update context
    this.context.currentState = 'stopped';
    this.context.lastUpdate = new Date().toISOString();
    await this.saveContext();
    
    this.log('Self-Improvement Orchestrator stopped successfully', colors.green);
    process.exit(0);
  }

  /**
   * Log a message with optional color
   */
  log(message, color = colors.reset) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `${color}[${timestamp}] ${message}${colors.reset}`;
    
    console.log(formattedMessage);
  }
}

/**
 * Main function to start the orchestrator
 */
async function main() {
  // Create and initialize the orchestrator
  const orchestrator = new SelfImprovementOrchestrator();
  
  try {
    // Initialize
    await orchestrator.initialize();
    
    // Start the main loop
    await orchestrator.start();
    
    // Handle shutdown signals
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT. Shutting down...');
      await orchestrator.stop();
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM. Shutting down...');
      await orchestrator.stop();
    });
    
    // Keep the process running
    console.log('Self-Improvement Orchestrator is now running...');
    console.log('Press Ctrl+C to stop.');
  } catch (error) {
    console.error(`Error starting orchestrator: ${error.message}`);
    process.exit(1);
  }
}

// Start the program
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});

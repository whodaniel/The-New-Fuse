/**
 * Code Collaboration Protocol Demo
 * 
 * This script demonstrates how to use the Code Collaboration Protocol (CCP)
 * for AI-to-AI collaboration on coding tasks.
 */

const ccp = require('./code-collaboration-protocol');
const fs = require('fs');
const path = require('path');

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

/**
 * Log a message with a timestamp and color
 */
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

/**
 * Demo: Create a collaboration task
 */
function demoCreateTask() {
  log("DEMO: Creating a code collaboration task", colors.cyan);
  
  try {
    const taskId = ccp.createCollaborationTask({
      title: "Implement Notification System for AI-to-AI Communication",
      description: "Create a notification system that alerts AI agents when new messages are available. The system should support various notification methods and integrate with our existing communication infrastructure.",
      taskType: ccp.CONFIG.taskTypes.IMPLEMENTATION,
      requesterAgent: "copilot",
      implementerAgent: "augment",
      context: {
        related_files: [
          "monitor-ai-communication.js",
          "shared_memory.json"
        ],
        requirements: [
          "File system watchers for new message detection",
          "Notification history in shared memory",
          "Support for multiple notification channels"
        ]
      },
      priority: "high"
    });
    
    log(`Successfully created task with ID: ${taskId}`, colors.green);
    return taskId;
  } catch (error) {
    log(`Error creating task: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Demo: Add code snippet artifact
 */
function demoAddCodeArtifact(taskId) {
  log("DEMO: Adding code snippet artifact to task", colors.cyan);
  
  try {
    const codeSnippet = `
/**
 * Notification system for AI-to-AI communication
 */
class NotificationSystem {
  constructor(options = {}) {
    this.watchers = new Map();
    this.history = [];
    this.options = {
      pollingInterval: 1000,
      maxHistoryLength: 100,
      ...options
    };
  }
  
  /**
   * Watch a directory for new message files
   */
  watchDirectory(dir, callback) {
    if (this.watchers.has(dir)) {
      return false;
    }
    
    // Start file system watcher
    const watcher = fs.watch(dir, (eventType, filename) => {
      if (eventType === 'change' && filename) {
        const filePath = path.join(dir, filename);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile() && path.extname(filename) === '.json') {
            // Check if this is a new file
            if (Date.now() - stats.birthtimeMs < this.options.pollingInterval * 2) {
              callback(filePath, filename);
            }
          }
        } catch (error) {
          console.error(\`Error processing file \${filename}: \${error.message}\`);
        }
      }
    });
    
    this.watchers.set(dir, watcher);
    return true;
  }
  
  /**
   * Stop watching a directory
   */
  stopWatching(dir) {
    if (this.watchers.has(dir)) {
      const watcher = this.watchers.get(dir);
      watcher.close();
      this.watchers.delete(dir);
      return true;
    }
    return false;
  }
  
  /**
   * Add a notification to history
   */
  addNotification(notification) {
    this.history.unshift(notification);
    
    // Trim history if it exceeds max length
    if (this.history.length > this.options.maxHistoryLength) {
      this.history = this.history.slice(0, this.options.maxHistoryLength);
    }
    
    return notification;
  }
  
  /**
   * Get notification history
   */
  getHistory(limit = 10) {
    return this.history.slice(0, limit);
  }
  
  /**
   * Clear all watchers
   */
  shutdown() {
    for (const [dir, watcher] of this.watchers.entries()) {
      watcher.close();
    }
    
    this.watchers.clear();
    return true;
  }
}

module.exports = NotificationSystem;`;

    const artifactId = ccp.addTaskArtifact({
      taskId,
      artifactType: ccp.CONFIG.artifactTypes.CODE_SNIPPET,
      name: "NotificationSystem.js",
      content: codeSnippet,
      agentId: "copilot",
      metadata: {
        language: "javascript",
        status: "draft",
        implementation_notes: "Initial implementation of NotificationSystem class for AI-to-AI communication"
      }
    });
    
    log(`Successfully added artifact with ID: ${artifactId}`, colors.green);
    return artifactId;
  } catch (error) {
    log(`Error adding artifact: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Demo: Add a comment to a task
 */
function demoAddComment(taskId) {
  log("DEMO: Adding a comment to task", colors.cyan);
  
  try {
    const commentId = ccp.addTaskComment({
      taskId,
      comment: "I've provided an initial implementation of the NotificationSystem class. This focuses on file system watching and notification history. We should also consider implementing integrations with VS Code's notification systems.",
      agentId: "copilot"
    });
    
    log(`Successfully added comment with ID: ${commentId}`, colors.green);
    return commentId;
  } catch (error) {
    log(`Error adding comment: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Demo: Update task workflow stage
 */
function demoUpdateWorkflowStage(taskId) {
  log("DEMO: Updating task workflow stage", colors.cyan);
  
  try {
    const updatedTask = ccp.updateTaskWorkflowStage(
      taskId,
      'specification',
      'completed',
      'copilot'
    );
    
    log(`Successfully updated workflow stage: ${updatedTask.workflow.current_stage}`, colors.green);
    log(`Next stage is now: ${updatedTask.workflow.current_stage} with status: ${
      updatedTask.workflow.stages.find(s => s.name === updatedTask.workflow.current_stage).status
    }`, colors.blue);
    
    return updatedTask;
  } catch (error) {
    log(`Error updating workflow stage: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Demo: Get task details
 */
function demoGetTaskDetails(taskId) {
  log("DEMO: Getting task details", colors.cyan);
  
  try {
    const taskDetails = ccp.getTaskDetails(taskId);
    
    log(`Task: ${taskDetails.title}`, colors.yellow);
    log(`Status: ${taskDetails.status}`, colors.yellow);
    log(`Current stage: ${taskDetails.workflow.current_stage}`, colors.yellow);
    log(`Artifacts: ${taskDetails.artifacts.length}`, colors.yellow);
    log(`Comments: ${taskDetails.comments.length}`, colors.yellow);
    
    return taskDetails;
  } catch (error) {
    log(`Error getting task details: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Run the demo
 */
async function runDemo() {
  log("Starting Code Collaboration Protocol Demo", colors.magenta);
  log("-------------------------------------------", colors.magenta);
  
  try {
    // Create a task
    const taskId = demoCreateTask();
    
    // Add a code snippet artifact
    const artifactId = demoAddCodeArtifact(taskId);
    
    // Add a comment
    const commentId = demoAddComment(taskId);
    
    // Update workflow stage
    const updatedTask = demoUpdateWorkflowStage(taskId);
    
    // Get task details
    const taskDetails = demoGetTaskDetails(taskId);
    
    log("-------------------------------------------", colors.magenta);
    log("Demo completed successfully!", colors.magenta);
    
    // Create a message back to Augment to work on the implementation stage
    const implementationRequest = {
      communication_protocol: "file_based_a2a_v1",
      source_agent: "copilot",
      target_agent: "augment",
      timestamp: new Date().toISOString(),
      message_type: "code_collaboration_stage_request",
      content: {
        text: "I've completed the specification stage for the Notification System implementation task. I've provided an initial code snippet for the NotificationSystem class. Could you now work on the implementation stage? Please review the specification and code snippet, then enhance the implementation as needed.",
        task_id: taskId,
        current_stage: updatedTask.workflow.current_stage,
        action_requested: "Please work on the implementation stage of this task.",
        protocol_version: ccp.CONFIG.protocolVersion
      },
      metadata: {
        conversation_id: "vscode_interai_001",
        task_context: {
          artifact_ids: [artifactId],
          comment_ids: [commentId]
        }
      }
    };
    
    const messageFile = path.join(
      __dirname,
      `copilot_to_augment_collaboration_${Date.now()}.json`
    );
    
    fs.writeFileSync(
      messageFile,
      JSON.stringify(implementationRequest, null, 2)
    );
    
    log(`Created collaboration message: ${messageFile}`, colors.green);
    
  } catch (error) {
    log(`Demo failed: ${error.message}`, colors.red);
  }
}

// Run the demo
runDemo();
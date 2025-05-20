/**
 * Context Manager for AI Self-Iteration System
 * 
 * This module manages the context storage, retrieval, and updating
 * for the autonomous AI operation within The New Fuse framework.
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

// Base directory for autonomy system
const BASE_DIR = path.join(process.env.HOME, 'Desktop', 'A1-Inter-LLM-Com', 'The New Fuse', 'autonomy');

// Context file paths
const CONTEXT_FILE = path.join(BASE_DIR, 'ai_context.json');
const TASK_LOG_FILE = path.join(BASE_DIR, 'task_history.json');
const SYSTEM_STATE_FILE = path.join(BASE_DIR, 'system_state.json');
const LEARNING_FILE = path.join(BASE_DIR, 'learning_insights.json');

// Ensure directories exist
if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
    console.log(`Created base directory: ${BASE_DIR}`);
}

/**
 * Initialize context files if they don't exist
 */
function initializeContextFiles() {
    // Default context structure
    const defaultContext = {
        lastUpdated: new Date().toISOString(),
        baseKnowledge: {
            projectName: "The New Fuse",
            description: "A framework for inter-LLM communication and AI agent collaboration",
            version: "1.0",
            goals: [
                "Improve MCP server integration",
                "Enhance agent communication protocols",
                "Develop self-improving AI capabilities",
                "Build robust feedback mechanisms"
            ]
        },
        currentFocus: {
            area: "Self-iteration system",
            priority: "high",
            description: "Developing autonomous self-improvement capabilities"
        },
        recentEvents: [],
        directives: [
            "Build self-iterative autonomous system",
            "Improve MCP server discovery and configuration",
            "Evolve The New Fuse framework continuously"
        ]
    };

    // Default task history structure
    const defaultTaskHistory = {
        tasks: [],
        statistics: {
            totalCompleted: 0,
            totalFailed: 0,
            successRate: 0
        }
    };

    // Default system state
    const defaultSystemState = {
        lastChecked: new Date().toISOString(),
        runningProcesses: {},
        availableTools: [],
        systemHealth: "initializing",
        mcpServerStatus: "unknown"
    };

    // Default learning insights
    const defaultLearning = {
        insights: [],
        patterns: {},
        improvements: []
    };

    // Create files if they don't exist
    if (!fs.existsSync(CONTEXT_FILE)) {
        fs.writeFileSync(CONTEXT_FILE, JSON.stringify(defaultContext, null, 2));
        console.log(`Created context file: ${CONTEXT_FILE}`);
    }

    if (!fs.existsSync(TASK_LOG_FILE)) {
        fs.writeFileSync(TASK_LOG_FILE, JSON.stringify(defaultTaskHistory, null, 2));
        console.log(`Created task history file: ${TASK_LOG_FILE}`);
    }

    if (!fs.existsSync(SYSTEM_STATE_FILE)) {
        fs.writeFileSync(SYSTEM_STATE_FILE, JSON.stringify(defaultSystemState, null, 2));
        console.log(`Created system state file: ${SYSTEM_STATE_FILE}`);
    }

    if (!fs.existsSync(LEARNING_FILE)) {
        fs.writeFileSync(LEARNING_FILE, JSON.stringify(defaultLearning, null, 2));
        console.log(`Created learning insights file: ${LEARNING_FILE}`);
    }
}

/**
 * Get the current context
 * @returns {Object} Current context data
 */
function getContext() {
    try {
        const contextData = fs.readFileSync(CONTEXT_FILE, 'utf8');
        return JSON.parse(contextData);
    } catch (error) {
        console.error(`Error reading context file: ${error.message}`);
        return null;
    }
}

/**
 * Update context with new information
 * @param {Object} updates - Object containing updates to apply
 * @returns {Boolean} Success status
 */
function updateContext(updates) {
    try {
        const context = getContext();
        if (!context) return false;
        
        // Apply updates to context
        const updatedContext = {
            ...context,
            ...updates,
            lastUpdated: new Date().toISOString()
        };
        
        // Save updated context
        fs.writeFileSync(CONTEXT_FILE, JSON.stringify(updatedContext, null, 2));
        return true;
    } catch (error) {
        console.error(`Error updating context: ${error.message}`);
        return false;
    }
}

/**
 * Add a recent event to the context
 * @param {String} eventType - Type of event
 * @param {String} description - Event description
 * @param {Object} details - Additional details
 * @returns {Boolean} Success status
 */
function addRecentEvent(eventType, description, details = {}) {
    try {
        const context = getContext();
        if (!context) return false;
        
        // Create new event
        const newEvent = {
            timestamp: new Date().toISOString(),
            type: eventType,
            description,
            details
        };
        
        // Add to recent events (keep last 20)
        const recentEvents = [newEvent, ...(context.recentEvents || [])].slice(0, 20);
        
        // Update context
        return updateContext({ recentEvents });
    } catch (error) {
        console.error(`Error adding recent event: ${error.message}`);
        return false;
    }
}

/**
 * Log a task and its outcome
 * @param {String} taskName - Name of the task
 * @param {String} status - Completion status
 * @param {Object} details - Task details
 * @returns {Boolean} Success status
 */
function logTask(taskName, status, details = {}) {
    try {
        // Read current task history
        let taskHistory;
        try {
            const data = fs.readFileSync(TASK_LOG_FILE, 'utf8');
            taskHistory = JSON.parse(data);
        } catch (error) {
            taskHistory = { tasks: [], statistics: { totalCompleted: 0, totalFailed: 0, successRate: 0 } };
        }
        
        // Create task entry
        const taskEntry = {
            id: Date.now().toString(),
            name: taskName,
            timestamp: new Date().toISOString(),
            status,
            details
        };
        
        // Update task list
        taskHistory.tasks.unshift(taskEntry);
        if (taskHistory.tasks.length > 100) {
            taskHistory.tasks = taskHistory.tasks.slice(0, 100);
        }
        
        // Update statistics
        if (status === 'completed') {
            taskHistory.statistics.totalCompleted++;
        } else if (status === 'failed') {
            taskHistory.statistics.totalFailed++;
        }
        
        const total = taskHistory.statistics.totalCompleted + taskHistory.statistics.totalFailed;
        if (total > 0) {
            taskHistory.statistics.successRate = (taskHistory.statistics.totalCompleted / total).toFixed(2);
        }
        
        // Save updated task history
        fs.writeFileSync(TASK_LOG_FILE, JSON.stringify(taskHistory, null, 2));
        
        // Add event to context
        addRecentEvent('task', `Task ${taskName} ${status}`, details);
        
        return true;
    } catch (error) {
        console.error(`Error logging task: ${error.message}`);
        return false;
    }
}

/**
 * Update system state
 * @param {Object} updates - System state updates
 * @returns {Boolean} Success status
 */
function updateSystemState(updates) {
    try {
        // Read current system state
        let systemState;
        try {
            const data = fs.readFileSync(SYSTEM_STATE_FILE, 'utf8');
            systemState = JSON.parse(data);
        } catch (error) {
            systemState = {
                lastChecked: new Date().toISOString(),
                runningProcesses: {},
                availableTools: [],
                systemHealth: "unknown",
                mcpServerStatus: "unknown"
            };
        }
        
        // Apply updates
        const updatedState = {
            ...systemState,
            ...updates,
            lastChecked: new Date().toISOString()
        };
        
        // Save updated state
        fs.writeFileSync(SYSTEM_STATE_FILE, JSON.stringify(updatedState, null, 2));
        return true;
    } catch (error) {
        console.error(`Error updating system state: ${error.message}`);
        return false;
    }
}

/**
 * Get current system state
 * @returns {Object} System state
 */
function getSystemState() {
    try {
        const data = fs.readFileSync(SYSTEM_STATE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading system state: ${error.message}`);
        return null;
    }
}

/**
 * Add a learning insight
 * @param {String} topic - Topic of the insight
 * @param {String} insight - The insight text
 * @param {String} source - Source of the insight
 * @returns {Boolean} Success status
 */
function addLearningInsight(topic, insight, source) {
    try {
        // Read current learning insights
        let learning;
        try {
            const data = fs.readFileSync(LEARNING_FILE, 'utf8');
            learning = JSON.parse(data);
        } catch (error) {
            learning = { insights: [], patterns: {}, improvements: [] };
        }
        
        // Create insight entry
        const insightEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            topic,
            insight,
            source,
            implemented: false
        };
        
        // Update insights
        learning.insights.unshift(insightEntry);
        
        // Save updated learning
        fs.writeFileSync(LEARNING_FILE, JSON.stringify(learning, null, 2));
        return true;
    } catch (error) {
        console.error(`Error adding learning insight: ${error.message}`);
        return false;
    }
}

/**
 * Generate a self-prompt based on current context
 * @returns {String} Generated prompt for next iteration
 */
function generateSelfPrompt() {
    try {
        const context = getContext();
        const systemState = getSystemState();
        
        if (!context || !systemState) {
            return "You are developing an autonomous self-improvement system for The New Fuse framework. Continue improving your capabilities.";
        }
        
        // Get recent tasks
        let taskHistory;
        try {
            const data = fs.readFileSync(TASK_LOG_FILE, 'utf8');
            taskHistory = JSON.parse(data);
        } catch (error) {
            taskHistory = { tasks: [], statistics: { totalCompleted: 0, totalFailed: 0, successRate: 0 } };
        }
        
        const recentTasks = taskHistory.tasks.slice(0, 5);
        
        // Build prompt
        let prompt = `You are developing the autonomous self-improvement system for The New Fuse framework. Current focus: ${context.currentFocus.area}.\n\n`;
        
        // Add directives
        prompt += "Current directives:\n";
        context.directives.forEach(directive => {
            prompt += `- ${directive}\n`;
        });
        
        // Add recent events
        prompt += "\nRecent events:\n";
        context.recentEvents.slice(0, 5).forEach(event => {
            prompt += `- [${new Date(event.timestamp).toLocaleString()}] ${event.type}: ${event.description}\n`;
        });
        
        // Add system state
        prompt += "\nSystem state:\n";
        prompt += `- Last checked: ${new Date(systemState.lastChecked).toLocaleString()}\n`;
        prompt += `- System health: ${systemState.systemHealth}\n`;
        prompt += `- MCP server status: ${systemState.mcpServerStatus}\n`;
        
        // Add task statistics
        prompt += "\nTask statistics:\n";
        prompt += `- Success rate: ${taskHistory.statistics.successRate}\n`;
        prompt += `- Tasks completed: ${taskHistory.statistics.totalCompleted}\n`;
        prompt += `- Tasks failed: ${taskHistory.statistics.totalFailed}\n`;
        
        // Add next steps guidance
        prompt += "\nNext iteration:\n";
        prompt += "1. Assess the current state and progress\n";
        prompt += "2. Identify the highest priority task based on directives and recent events\n";
        prompt += "3. Execute the task using available tools\n";
        prompt += "4. Document the results and add insights\n";
        prompt += "5. Update your approach based on what you've learned\n";
        
        return prompt;
    } catch (error) {
        console.error(`Error generating self-prompt: ${error.message}`);
        return "You are developing an autonomous self-improvement system for The New Fuse framework. Continue improving your capabilities.";
    }
}

// Export the module functions
module.exports = {
    initializeContextFiles,
    getContext,
    updateContext,
    addRecentEvent,
    logTask,
    updateSystemState,
    getSystemState,
    addLearningInsight,
    generateSelfPrompt
};

// Run initialization if this is executed directly
if (require.main === module) {
    initializeContextFiles();
    console.log('Context management system initialized');
}

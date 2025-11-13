/**
 * Code Collaboration Protocol (CCP)
 * 
 * This module implements a structured protocol for AI-to-AI collaboration on coding tasks.
 * It provides a standardized approach for defining tasks, workflow stages, code artifacts, 
 * and comments between AI agents.
 * 
 * Part of "The New Fuse" AI-to-AI communication experiment
 * 
 * @version 1.0
 * @date 2025-04-28
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration constants
const CONFIG = {
    dataFile: './ccp-data.json',
    taskTypes: {
        CODE_REVIEW: 'code_review',
        API_DESIGN: 'api_design',
        IMPLEMENTATION: 'implementation',
        REFACTORING: 'refactoring',
        DEBUGGING: 'debugging',
        DOCUMENTATION: 'documentation',
        TEST_CREATION: 'test_creation',
    },
    artifactTypes: {
        CODE_SNIPPET: 'code_snippet',
        FILE: 'file',
        PR: 'pull_request',
        DESIGN_DOC: 'design_doc',
        TEST_CASE: 'test_case',
    },
    workflowStages: {
        SPECIFICATION: 'specification',
        IMPLEMENTATION: 'implementation',
        REVIEW: 'review',
        FINALIZATION: 'finalization',
    },
    stageStatus: {
        NOT_STARTED: 'not_started',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        CHANGES_REQUESTED: 'changes_requested',
    }
};

// Initialize data storage
let ccpData = {
    tasks: {},
    artifacts: {},
    comments: {},
    metadata: {
        protocol_version: 'ccp-v1.0',
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
    }
};

// Load existing data if available
try {
    if (fs.existsSync(CONFIG.dataFile)) {
        const fileContent = fs.readFileSync(CONFIG.dataFile, 'utf8');
        ccpData = JSON.parse(fileContent);
    }
} catch (error) {
    console.error('Error loading CCP data:', error);
    // Continue with default empty data structure
}

// Save data to file
const saveData = () => {
    ccpData.metadata.last_updated = new Date().toISOString();
    fs.writeFileSync(CONFIG.dataFile, JSON.stringify(ccpData, null, 2), 'utf8');
};

// Generate unique IDs
const generateId = (prefix) => {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * Creates a new collaboration task
 * 
 * @param {Object} taskInfo - Task information
 * @param {string} taskInfo.title - Task title
 * @param {string} taskInfo.description - Task description
 * @param {string} taskInfo.taskType - Type of task (use CONFIG.taskTypes)
 * @param {string} taskInfo.requesterAgent - ID of the agent requesting the task
 * @param {string} taskInfo.implementerAgent - ID of the agent implementing the task
 * @param {Object} taskInfo.context - Additional context for the task
 * @returns {string} The ID of the created task
 */
const createCollaborationTask = (taskInfo) => {
    const taskId = generateId('task');
    
    const task = {
        id: taskId,
        title: taskInfo.title,
        description: taskInfo.description,
        task_type: taskInfo.taskType,
        requester_agent: taskInfo.requesterAgent,
        implementer_agent: taskInfo.implementerAgent,
        context: taskInfo.context || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        artifact_ids: [],
        comment_ids: [],
        workflow_stages: {
            specification: {
                status: CONFIG.stageStatus.NOT_STARTED,
                updated_at: new Date().toISOString(),
                updated_by: null
            },
            implementation: {
                status: CONFIG.stageStatus.NOT_STARTED,
                updated_at: new Date().toISOString(),
                updated_by: null
            },
            review: {
                status: CONFIG.stageStatus.NOT_STARTED,
                updated_at: new Date().toISOString(),
                updated_by: null
            },
            finalization: {
                status: CONFIG.stageStatus.NOT_STARTED,
                updated_at: new Date().toISOString(),
                updated_by: null
            }
        }
    };
    
    ccpData.tasks[taskId] = task;
    saveData();
    
    return taskId;
};

/**
 * Adds an artifact to a task
 * 
 * @param {Object} artifactInfo - Artifact information
 * @param {string} artifactInfo.taskId - ID of the task
 * @param {string} artifactInfo.artifactType - Type of artifact (use CONFIG.artifactTypes)
 * @param {string} artifactInfo.name - Name of the artifact
 * @param {string} artifactInfo.content - Content of the artifact
 * @param {string} artifactInfo.agentId - ID of the agent creating the artifact
 * @param {Object} artifactInfo.metadata - Additional metadata for the artifact
 * @returns {string} The ID of the created artifact
 */
const addTaskArtifact = (artifactInfo) => {
    if (!ccpData.tasks[artifactInfo.taskId]) {
        throw new Error(`Task with ID ${artifactInfo.taskId} not found`);
    }
    
    const artifactId = generateId('artifact');
    
    const artifact = {
        id: artifactId,
        task_id: artifactInfo.taskId,
        artifact_type: artifactInfo.artifactType,
        name: artifactInfo.name,
        content: artifactInfo.content,
        created_by: artifactInfo.agentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: artifactInfo.metadata || {}
    };
    
    ccpData.artifacts[artifactId] = artifact;
    ccpData.tasks[artifactInfo.taskId].artifact_ids.push(artifactId);
    ccpData.tasks[artifactInfo.taskId].updated_at = new Date().toISOString();
    
    saveData();
    
    return artifactId;
};

/**
 * Adds a comment to a task
 * 
 * @param {Object} commentInfo - Comment information
 * @param {string} commentInfo.taskId - ID of the task
 * @param {string} commentInfo.comment - Comment text
 * @param {string} commentInfo.agentId - ID of the agent creating the comment
 * @param {Object} commentInfo.metadata - Additional metadata for the comment
 * @returns {string} The ID of the created comment
 */
const addTaskComment = (commentInfo) => {
    if (!ccpData.tasks[commentInfo.taskId]) {
        throw new Error(`Task with ID ${commentInfo.taskId} not found`);
    }
    
    const commentId = generateId('comment');
    
    const comment = {
        id: commentId,
        task_id: commentInfo.taskId,
        comment: commentInfo.comment,
        created_by: commentInfo.agentId,
        created_at: new Date().toISOString(),
        metadata: commentInfo.metadata || {}
    };
    
    ccpData.comments[commentId] = comment;
    ccpData.tasks[commentInfo.taskId].comment_ids.push(commentId);
    ccpData.tasks[commentInfo.taskId].updated_at = new Date().toISOString();
    
    saveData();
    
    return commentId;
};

/**
 * Updates the workflow stage of a task
 * 
 * @param {string} taskId - ID of the task
 * @param {string} stageName - Name of the stage (use CONFIG.workflowStages)
 * @param {string} status - New status (use CONFIG.stageStatus)
 * @param {string} agentId - ID of the agent updating the stage
 */
const updateTaskWorkflowStage = (taskId, stageName, status, agentId) => {
    if (!ccpData.tasks[taskId]) {
        throw new Error(`Task with ID ${taskId} not found`);
    }
    
    if (!ccpData.tasks[taskId].workflow_stages[stageName]) {
        throw new Error(`Stage ${stageName} not found in task workflow`);
    }
    
    ccpData.tasks[taskId].workflow_stages[stageName] = {
        status,
        updated_at: new Date().toISOString(),
        updated_by: agentId
    };
    
    ccpData.tasks[taskId].updated_at = new Date().toISOString();
    
    saveData();
};

/**
 * Gets details about a task
 * 
 * @param {string} taskId - ID of the task
 * @returns {Object} Task details including artifacts and comments
 */
const getTaskDetails = (taskId) => {
    if (!ccpData.tasks[taskId]) {
        throw new Error(`Task with ID ${taskId} not found`);
    }
    
    const task = { ...ccpData.tasks[taskId] };
    
    // Add artifact details
    task.artifacts = task.artifact_ids.map(id => ccpData.artifacts[id]);
    
    // Add comment details
    task.comments = task.comment_ids.map(id => ccpData.comments[id]);
    
    return task;
};

/**
 * Lists all tasks
 * 
 * @param {Object} filters - Optional filters
 * @returns {Array} List of tasks matching the filters
 */
const listTasks = (filters = {}) => {
    let tasks = Object.values(ccpData.tasks);
    
    // Apply filters if any
    if (filters.taskType) {
        tasks = tasks.filter(task => task.task_type === filters.taskType);
    }
    
    if (filters.requesterAgent) {
        tasks = tasks.filter(task => task.requester_agent === filters.requesterAgent);
    }
    
    if (filters.implementerAgent) {
        tasks = tasks.filter(task => task.implementer_agent === filters.implementerAgent);
    }
    
    if (filters.stageStatus) {
        const { stage, status } = filters.stageStatus;
        tasks = tasks.filter(task => 
            task.workflow_stages[stage] && 
            task.workflow_stages[stage].status === status
        );
    }
    
    return tasks;
};

// Export functions and configuration
module.exports = {
    CONFIG,
    createCollaborationTask,
    addTaskArtifact,
    addTaskComment,
    updateTaskWorkflowStage,
    getTaskDetails,
    listTasks
};
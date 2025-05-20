/**
 * Represents a discrete unit of work that an AI agent can perform
 * Enhanced with real-time progress reporting and tool metadata
 */
export interface AITask {
    id: string;
    type: string;
    input: any;
    output?: any;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
    progress?: number; // Progress percentage (0-100)
    progressMessage?: string; // Human-readable progress message
    toolName?: string; // Associated MCP tool name if applicable
    toolInput?: Record<string, any>; // Input parameters for the tool
    toolOutput?: Record<string, any>; // Output from the tool execution
    startTime?: Date; // When the task started execution
    endTime?: Date; // When the task completed or failed
    duration?: number; // Task duration in milliseconds
}

/**
 * Represents a collection of related AI tasks forming a complete workflow
 * Enhanced with progress tracking, execution metrics, and UI interactions
 */
export interface AICollaborationWorkflow {
    id: string;
    name: string;
    description?: string;
    tasks: AITask[];
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
    metadata?: Record<string, any>;
    progress?: number; // Overall workflow progress percentage
    startTime?: Date; // When the workflow started execution
    endTime?: Date; // When the workflow completed or failed
    duration?: number; // Workflow duration in milliseconds
    owner?: string; // The user or system that initiated the workflow
    priority?: 'low' | 'medium' | 'high' | 'critical'; // Priority level
    tags?: string[]; // Categorization tags
    notifyOnCompletion?: boolean; // Whether to notify the user when completed
    uiElements?: { // Associated UI elements for the workflow
        panelId?: string; // ID of the UI panel to display results
        iconPath?: string; // Path to the icon for this workflow
        contextActions?: Array<{
            label: string;
            command: string;
            args?: any[];
        }>; // Context actions available for this workflow
    };
}

export interface WorkflowStep {
    id: string;
    type: string;
    input: any;
    output?: any;
    error?: string;
    metadata?: Record<string, any>;
}
import React, { useState, useEffect, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { 
  Network, 
  Diagram, 
  Activity, 
  AlertCircle, 
  Users, 
  ArrowRight, 
  MessageSquare, 
  Lightbulb
} from "lucide-react";
import { Toast } from '../../../packages/ui-components/src/core/toast.js';
import { 
  AgentCapability, 
  AgentProtocol, 
  AgentTrustLevel 
} from '../../../packages/core/types/src/agent.js';
import { Badge } from '../../../packages/ui-components/src/core/badge.js';

/**
 * Task Type Enum
 */
export enum TaskType {
  INFORMATION_RETRIEVAL = 'information-retrieval',
  ANALYSIS = 'analysis',
  SYNTHESIS = 'synthesis',
  VERIFICATION = 'verification',
  RECOMMENDATION = 'recommendation',
  SUMMARIZATION = 'summarization',
  CONTENT_CREATION = 'content-creation',
  DATA_PROCESSING = 'data-processing',
  DECISION_MAKING = 'decision-making'
}

/**
 * Task Status Enum
 */
export enum TaskStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

/**
 * Agent Collaboration Mode Enum
 */
export enum CollaborationMode {
  SEQUENTIAL = 'sequential',  // Agents work one after another
  PARALLEL = 'parallel',      // Agents work simultaneously
  SUPERVISOR = 'supervisor',  // One agent oversees others
  CONSENSUS = 'consensus',    // Multiple agents must agree on an answer
  COMPETITIVE = 'competitive' // Agents compete to provide the best solution
}

/**
 * Collective Task Interface
 */
export interface CollectiveTask {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: number; // 1-10
  assignedAgents: string[]; // Agent IDs
  requiredCapabilities: AgentCapability[];
  requiredTrustLevel: AgentTrustLevel;
  deadline?: string; // ISO date string
  created: string; // ISO date string
  updated: string; // ISO date string
  progress: number; // 0-100
  result?: any;
  errors?: string[];
  dependencies?: string[]; // IDs of other tasks this depends on
}

/**
 * Agent Collective Node Data Interface
 */
export interface AICollectiveOrchestratorNodeData {
  id: string;
  name: string;
  tasks: CollectiveTask[];
  collaborationMode: CollaborationMode;
  registeredAgents: string[]; // Agent IDs
  activeAgentCount: number;
  status: 'idle' | 'busy' | 'error';
  lastUpdated: string | null;
  consensusThreshold: number; // 0.0-1.0
  maxParallelTasks: number;
  supportedProtocols: AgentProtocol[];
  currentQuery?: string;
  currentResult?: any;
  autoDistributeWork: boolean;
}

/**
 * Default Agent Collective Node Data
 */
export const defaultAICollectiveOrchestratorData: AICollectiveOrchestratorNodeData = {
  id: crypto.randomUUID(),
  name: "Agent Collective",
  tasks: [],
  collaborationMode: CollaborationMode.SEQUENTIAL,
  registeredAgents: [],
  activeAgentCount: 0,
  status: 'idle',
  lastUpdated: null,
  consensusThreshold: 0.8,
  maxParallelTasks: 5,
  supportedProtocols: [AgentProtocol.A2A, AgentProtocol.MCP],
  autoDistributeWork: true
};

/**
 * Message Interface for agents in the collective
 */
interface AgentMessage {
  agentId: string;
  agentName: string;
  message: string;
  timestamp: string;
  type: 'query' | 'result' | 'error' | 'notification' | 'thinking';
}

/**
 * Agent Collective Orchestrator Node Component
 * 
 * Coordinates the work of multiple specialized agents for complex tasks
 */
const AICollectiveOrchestratorNode: React.FC<NodeProps<AICollectiveOrchestratorNodeData>> = ({ 
  data, 
  isConnectable,
  selected
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  
  // Initialize collective on mount
  useEffect(() => {
    initializeCollective();
    
    return () => {
      // Clean up
    };
  }, []);
  
  // Initialize the agent collective
  const initializeCollective = async () => {
    try {
      data.status = 'busy';
      
      // Use VS Code extension API to initialize the collective
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.collective.initialize',
        {
          id: data.id,
          name: data.name,
          collaborationMode: data.collaborationMode,
          supportedProtocols: data.supportedProtocols,
          consensusThreshold: data.consensusThreshold,
          maxParallelTasks: data.maxParallelTasks,
          autoDistributeWork: data.autoDistributeWork
        }
      );
      
      if (result?.registeredAgents) {
        data.registeredAgents = result.registeredAgents;
        data.activeAgentCount = result.activeAgentCount || 0;
        
        if (result.tasks) {
          data.tasks = result.tasks;
        }
      }
      
      data.lastUpdated = new Date().toISOString();
      data.status = 'idle';
      
      // Subscribe to task updates
      await subscribeToUpdates();
      
    } catch (err) {
      console.error("Failed to initialize agent collective:", err);
      setError("Failed to initialize agent collective");
      data.status = 'error';
    }
  };
  
  // Subscribe to task and agent updates
  const subscribeToUpdates = async () => {
    try {
      // Subscribe to task status updates
      await window.vscode?.commands.executeCommand(
        'thefuse.orchestrator.subscribe',
        {
          action: 'collective.task.updated',
          callback: (message: any) => {
            handleTaskUpdated(message.task);
          }
        }
      );
      
      // Subscribe to agent messages
      await window.vscode?.commands.executeCommand(
        'thefuse.orchestrator.subscribe',
        {
          action: 'collective.agent.message',
          callback: (message: any) => {
            handleAgentMessage(message);
          }
        }
      );
      
      // Subscribe to agent registration/removal
      await window.vscode?.commands.executeCommand(
        'thefuse.orchestrator.subscribe',
        {
          action: 'collective.agent.registered',
          callback: (message: any) => {
            handleAgentRegistered(message.agentId);
          }
        }
      );
      
      await window.vscode?.commands.executeCommand(
        'thefuse.orchestrator.subscribe',
        {
          action: 'collective.agent.unregistered',
          callback: (message: any) => {
            handleAgentUnregistered(message.agentId);
          }
        }
      );
      
    } catch (err) {
      console.error("Error subscribing to updates:", err);
      setError("Failed to subscribe to updates");
    }
  };
  
  // Handle task updates
  const handleTaskUpdated = (task: CollectiveTask) => {
    const taskIndex = data.tasks.findIndex(t => t.id === task.id);
    
    if (taskIndex >= 0) {
      // Update existing task
      data.tasks[taskIndex] = task;
    } else {
      // Add new task
      data.tasks.push(task);
    }
    
    data.lastUpdated = new Date().toISOString();
  };
  
  // Handle agent messages
  const handleAgentMessage = (message: AgentMessage) => {
    setMessages(prevMessages => [...prevMessages.slice(-19), message]);
    
    // If this is a result and we have a current query
    if (message.type === 'result' && data.currentQuery) {
      // Store most recent result
      data.currentResult = message.message;
    }
  };
  
  // Handle agent registration
  const handleAgentRegistered = (agentId: string) => {
    if (!data.registeredAgents.includes(agentId)) {
      data.registeredAgents.push(agentId);
      data.activeAgentCount = data.registeredAgents.length;
      data.lastUpdated = new Date().toISOString();
    }
  };
  
  // Handle agent unregistration
  const handleAgentUnregistered = (agentId: string) => {
    data.registeredAgents = data.registeredAgents.filter(id => id !== agentId);
    data.activeAgentCount = data.registeredAgents.length;
    data.lastUpdated = new Date().toISOString();
    
    // Reassign tasks if needed
    data.tasks.forEach(task => {
      if (task.assignedAgents.includes(agentId) && 
         (task.status === TaskStatus.ASSIGNED || task.status === TaskStatus.IN_PROGRESS)) {
        // Remove the agent from the task
        task.assignedAgents = task.assignedAgents.filter(id => id !== agentId);
        
        if (task.assignedAgents.length === 0) {
          // No agents left, mark for reassignment
          task.status = TaskStatus.PENDING;
        }
        
        task.updated = new Date().toISOString();
      }
    });
  };
  
  // Process new input data
  const processInput = async (input: any) => {
    if (isProcessing || data.status === 'busy') return;
    
    setIsProcessing(true);
    setError(null);
    data.status = 'busy';
    data.currentQuery = typeof input === 'string' ? input : JSON.stringify(input);
    
    try {
      // Create a new task from the input
      const newTask: CollectiveTask = {
        id: crypto.randomUUID(),
        name: `Task ${data.tasks.length + 1}`,
        description: typeof input === 'string' ? input : JSON.stringify(input),
        type: TaskType.ANALYSIS, // Default type
        status: TaskStatus.PENDING,
        priority: 5,
        assignedAgents: [],
        requiredCapabilities: [AgentCapability.TASK_EXECUTION],
        requiredTrustLevel: AgentTrustLevel.VERIFIED,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        progress: 0
      };
      
      // Add task to the list
      data.tasks.push(newTask);
      
      // Distribute the task to appropriate agents
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.collective.processTask',
        {
          collectiveId: data.id,
          task: newTask,
          collaborationMode: data.collaborationMode
        }
      );
      
      if (result?.task) {
        // Update the task with latest info
        const taskIndex = data.tasks.findIndex(t => t.id === newTask.id);
        if (taskIndex >= 0) {
          data.tasks[taskIndex] = result.task;
        }
      }
      
      if (result?.result) {
        data.currentResult = result.result;
      }
      
      data.lastUpdated = new Date().toISOString();
      data.status = 'idle';
      
    } catch (err) {
      console.error("Error processing collective input:", err);
      setError("Failed to process input");
      data.status = 'error';
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle new data coming in via the input handle
  useEffect(() => {
    const handleData = (event: any) => {
      if (event.target && event.target.nodeid === data.id && event.data) {
        processInput(event.data);
      }
    };
    
    // Listen for data events
    document.addEventListener('nodedata', handleData);
    
    return () => {
      document.removeEventListener('nodedata', handleData);
    };
  }, [data.id]);
  
  // Change collaboration mode
  const changeCollaborationMode = async (mode: CollaborationMode) => {
    try {
      const result = await window.vscode?.commands.executeCommand(
        'thefuse.collective.setMode',
        {
          collectiveId: data.id,
          mode
        }
      );
      
      if (result?.success) {
        data.collaborationMode = mode;
        data.lastUpdated = new Date().toISOString();
      }
    } catch (err) {
      console.error("Error changing collaboration mode:", err);
      setError("Failed to change collaboration mode");
    }
  };
  
  // Get task status color
  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case TaskStatus.ASSIGNED:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
      case TaskStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case TaskStatus.FAILED:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case TaskStatus.CANCELED:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
    }
  };
  
  // Format task type for display
  const formatTaskType = (type: TaskType) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  return (
    <div className={`p-4 rounded-md bg-white dark:bg-gray-800 border ${
      selected ? 'border-blue-500 shadow-lg' : 'border-gray-300 dark:border-gray-600'
    } transition-all duration-200 w-[360px]`}>
      {/* Input handle at top */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
      
      {/* Node header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-violet-500" />
          <h3 className="font-medium text-sm">{data.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
            {data.collaborationMode}
          </Badge>
        </div>
      </div>
      
      {/* Status indicator */}
      {data.status === 'busy' && (
        <Toast
          variant="info"
          title="Processing collective task"
          description="Agents are collaborating on your request..."
          className="mb-3 py-2"
        />
      )}
      
      {data.status === 'error' && (
        <Toast
          variant="destructive"
          title="Collective error"
          description={error || "An unknown error occurred"}
          className="mb-3 py-2"
        />
      )}
      
      {/* Collective stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-violet-50 dark:bg-violet-950/30 rounded p-2 flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <div>
            <div className="text-xs text-violet-700 dark:text-violet-300 font-medium">Agents</div>
            <div className="text-sm font-semibold">{data.activeAgentCount} active</div>
          </div>
        </div>
        
        <div className="bg-cyan-50 dark:bg-cyan-950/30 rounded p-2 flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <div>
            <div className="text-xs text-cyan-700 dark:text-cyan-300 font-medium">Tasks</div>
            <div className="text-sm font-semibold">
              {data.tasks.filter(t => t.status === TaskStatus.COMPLETED).length}/{data.tasks.length}
            </div>
          </div>
        </div>
      </div>
      
      {/* Collaboration modes */}
      <div className="mb-4">
        <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
          <Diagram className="h-3.5 w-3.5" />
          <span>Collaboration Mode</span>
        </h4>
        
        <div className="flex flex-wrap gap-1">
          {Object.values(CollaborationMode).map(mode => (
            <button
              key={mode}
              onClick={() => changeCollaborationMode(mode)}
              className={`px-2 py-1 rounded text-xs ${
                data.collaborationMode === mode
                  ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 font-medium'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tasks list */}
      <div className="mb-4">
        <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Recent Tasks</span>
        </h4>
        
        <div className="max-h-[120px] overflow-y-auto space-y-1.5">
          {data.tasks.length > 0 ? (
            data.tasks.slice(-3).reverse().map(task => (
              <div 
                key={task.id} 
                className="text-xs border border-gray-100 dark:border-gray-700 rounded p-1.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate max-w-[200px]">{task.name}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                    getTaskStatusColor(task.status)
                  }`}>
                    {task.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{formatTaskType(task.type)}</span>
                  <span className="text-gray-500">{task.assignedAgents.length} agent{task.assignedAgents.length !== 1 ? 's' : ''}</span>
                </div>
                {task.progress > 0 && (
                  <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 dark:bg-violet-400 rounded-full" 
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-gray-400 dark:text-gray-500">
              <Activity className="h-5 w-5 mb-1 opacity-20" />
              <span className="text-xs">No tasks yet</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Agent conversation */}
      <div className="mb-3">
        <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Agent Collaboration</span>
        </h4>
        
        <div className="max-h-[120px] overflow-y-auto border border-gray-100 dark:border-gray-700 rounded p-1.5 text-xs bg-gray-50 dark:bg-gray-850">
          {messages.length > 0 ? (
            messages.slice(-3).map((message, index) => (
              <div 
                key={index} 
                className={`mb-1.5 ${
                  message.type === 'query' 
                    ? 'pl-1.5 border-l-2 border-blue-500' 
                    : message.type === 'result'
                      ? 'pl-1.5 border-l-2 border-green-500'
                      : message.type === 'error'
                        ? 'pl-1.5 border-l-2 border-red-500'
                        : message.type === 'thinking'
                          ? 'pl-1.5 border-l-2 border-amber-500'
                          : 'pl-1.5 border-l-2 border-gray-300'
                }`}
              >
                <div className="flex items-center gap-1 text-gray-500 text-[10px] mb-0.5">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{message.agentName}</span>
                  <span>•</span>
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-gray-800 dark:text-gray-200">
                  {message.message.length > 100 
                    ? message.message.substring(0, 100) + '...' 
                    : message.message}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-gray-400 dark:text-gray-500">
              <MessageSquare className="h-5 w-5 mb-1 opacity-20" />
              <span className="text-xs">No agent communication yet</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Current result indicator */}
      {data.currentResult && (
        <div className="mb-3 p-2 bg-violet-50 dark:bg-violet-950/20 rounded text-xs border border-violet-100 dark:border-violet-800">
          <div className="flex items-center gap-1 mb-1">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-medium">Collective Result</span>
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            {typeof data.currentResult === 'string' 
              ? (data.currentResult.length > 100 
                  ? data.currentResult.substring(0, 100) + '...' 
                  : data.currentResult)
              : JSON.stringify(data.currentResult).substring(0, 100) + '...'}
          </div>
        </div>
      )}
      
      {/* Last updated */}
      {data.lastUpdated && (
        <div className="mt-2 text-xs text-gray-400 text-right">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </div>
      )}
      
      {/* Output handle at bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
};

export default AICollectiveOrchestratorNode;
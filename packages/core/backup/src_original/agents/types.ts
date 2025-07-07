export interface AgentWorkflow { id: string;
  name: string;
  description?: string;
  tasks: WorkflowTask[];
  metadata: WorkflowMetadata;
  configuration: WorkflowConfiguration;
 }

export interface WorkflowTask { id: string;
  type: TaskType;
  name: string;
  description?: string;
  dependencies: string[];
  configuration: TaskConfiguration;
  timeout?: number;
  retryPolicy?: RetryPolicy;
 }

export interface WorkflowState { workflow: AgentWorkflow;
  status: WorkflowStatus;
  startTime: number;
  endTime?: number;
  completedTasks: number;
  errors?: WorkflowError[];
 }

export interface TaskConfiguration {
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  requirements: TaskRequirements;
  constraints?: TaskConstraints;
}

export interface WorkflowMetadata { version: string;
  creator: string;
  createdAt: number;
  tags?: string[];
  priority: 'low' | 'medium' | 'high'
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled'
  | 'data_processing'
  | 'ml_inference'
  | 'api_call'
  | 'notification'
  | 'validation'
  | 'transformation'
  events: ('start' | 'complete' | 'fail' | 'pause'
  format: 'json' | 'plain'
  PLANNER = 'planner'';
  EXECUTOR = 'executor'';
  RESEARCHER = 'researcher'';
  CRITIC = 'critic'';
  WRITER = 'writer'';
  CODER = 'coder'';
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  type?: 'thought' | 'action' | 'observation' | 'communication'
  type: 'question' | 'answer' | 'suggestion' | 'instruction' | 'feedback'
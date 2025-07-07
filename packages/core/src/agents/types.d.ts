export interface Agent {
    id: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    capabilities: string[];
    currentTaskId?: string;
    lastActivity: Date;
    configuration: AgentConfiguration;
    metadata: AgentMetadata;
}
export interface AgentConfiguration {
    maxConcurrentTasks: number;
    timeout: number;
    retryPolicy: RetryPolicy;
    memorySettings: MemorySettings;
    communicationSettings: CommunicationSettings;
}
export interface AgentMetadata {
    version: string;
    creator: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    description?: string;
}
export interface MemorySettings {
    persistMemory: boolean;
    memoryCapacity: number;
    memoryRetentionDays: number;
    sharedMemoryAccess: boolean;
}
export interface CommunicationSettings {
    enableBroadcast: boolean;
    enableDirectMessage: boolean;
    communicationProtocols: CommunicationProtocol[];
    messageTimeout: number;
}
export interface Task {
    id: string;
    type: TaskType;
    name: string;
    description?: string;
    payload: any;
    status: TaskStatus;
    agentId?: string;
    priority: TaskPriority;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    retries: number;
    maxRetries: number;
    dependencies: string[];
    configuration: TaskConfiguration;
    timeout?: number;
    retryPolicy?: RetryPolicy;
}
export interface TaskConfiguration {
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    requirements: TaskRequirements;
    constraints?: TaskConstraints;
}
export interface TaskRequirements {
    memoryAccess: boolean;
    networkAccess: boolean;
    fileSystemAccess: boolean;
    requiredCapabilities: string[];
    minimumAgentVersion?: string;
}
export interface TaskConstraints {
    maxExecutionTime: number;
    maxMemoryUsage: number;
    allowedNetworkDomains?: string[];
    restrictedOperations?: string[];
}
export interface AgentWorkflow {
    id: string;
    name: string;
    description?: string;
    tasks: WorkflowTask[];
    metadata: WorkflowMetadata;
    configuration: WorkflowConfiguration;
}
export interface WorkflowTask {
    id: string;
    type: TaskType;
    name: string;
    description?: string;
    dependencies: string[];
    configuration: TaskConfiguration;
    timeout?: number;
    retryPolicy?: RetryPolicy;
}
export interface WorkflowState {
    workflow: AgentWorkflow;
    status: WorkflowStatus;
    startTime: Date;
    endTime?: Date;
    completedTasks: number;
    totalTasks: number;
    errors?: WorkflowError[];
    currentTask?: string;
}
export interface WorkflowMetadata {
    version: string;
    creator: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
    priority: TaskPriority;
}
export interface WorkflowConfiguration {
    parallelExecution: boolean;
    failureStrategy: FailureStrategy;
    timeoutStrategy: TimeoutStrategy;
    retryPolicy: RetryPolicy;
    notifications: NotificationSettings;
}
export interface WorkflowError {
    taskId: string;
    error: string;
    timestamp: Date;
    recoverable: boolean;
}
export interface AgentMessage {
    id: string;
    sender: string;
    recipient: string;
    content: any;
    metadata?: Record<string, unknown>;
    timestamp: string;
    type: MessageType;
    priority: MessagePriority;
}
export interface CommunicationChannel {
    id: string;
    name: string;
    channelType: ChannelType;
    participants: string[];
    createdAt: Date;
    createdBy: string;
    isActive: boolean;
    metadata?: Record<string, any>;
}
export interface MemoryItem {
    id: string;
    agentId: string;
    taskId?: string;
    type: MemoryType;
    content: any;
    metadata: Record<string, any>;
    timestamp: Date;
    expiresAt?: Date;
    tags: string[];
    priority: TaskPriority;
}
export interface AgentThought {
    id: string;
    agentId: string;
    taskId?: string;
    content: string;
    type: ThoughtType;
    timestamp: Date;
    confidence: number;
    reasoning?: string;
}
export interface AgentInteraction {
    id: string;
    fromAgentId: string;
    toAgentId: string;
    type: InteractionType;
    content: any;
    timestamp: Date;
    responseId?: string;
}
export interface RetryPolicy {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors: string[];
}
export interface NotificationSettings {
    onStart: boolean;
    onComplete: boolean;
    onFailure: boolean;
    onPause: boolean;
    webhookUrl?: string;
    emailNotifications?: string[];
}
export declare enum AgentType {
    PLANNER = "planner",
    EXECUTOR = "executor",
    RESEARCHER = "researcher",
    CRITIC = "critic",
    WRITER = "writer",
    CODER = "coder",
    COORDINATOR = "coordinator",
    SPECIALIST = "specialist"
}
export declare enum AgentStatus {
    IDLE = "idle",
    BUSY = "busy",
    OFFLINE = "offline",
    INITIALIZING = "initializing",
    ERROR = "error"
}
export declare enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    PAUSED = "paused"
}
export declare enum TaskType {
    DATA_PROCESSING = "data_processing",
    ML_INFERENCE = "ml_inference",
    API_CALL = "api_call",
    NOTIFICATION = "notification",
    VALIDATION = "validation",
    TRANSFORMATION = "transformation",
    COMMUNICATION = "communication",
    RESEARCH = "research",
    PLANNING = "planning",
    EXECUTION = "execution"
}
export declare enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum WorkflowStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    PAUSED = "paused",
    CANCELLED = "cancelled"
}
export declare enum MessageType {
    DIRECT = "direct",
    BROADCAST = "broadcast",
    TASK_REQUEST = "task_request",
    TASK_RESPONSE = "task_response",
    STATUS_UPDATE = "status_update",
    ERROR = "error",
    HEARTBEAT = "heartbeat"
}
export declare enum MessagePriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum ChannelType {
    DIRECT = "direct",
    BROADCAST = "broadcast",
    GROUP = "group",
    SYSTEM = "system"
}
export declare enum MemoryType {
    FACT = "fact",
    PROCEDURE = "procedure",
    EVENT = "event",
    CONTEXT = "context",
    EXPERIENCE = "experience"
}
export declare enum ThoughtType {
    THOUGHT = "thought",
    ACTION = "action",
    OBSERVATION = "observation",
    COMMUNICATION = "communication",
    REFLECTION = "reflection"
}
export declare enum InteractionType {
    QUESTION = "question",
    ANSWER = "answer",
    SUGGESTION = "suggestion",
    INSTRUCTION = "instruction",
    FEEDBACK = "feedback",
    COLLABORATION = "collaboration"
}
export declare enum CommunicationProtocol {
    A2A_V1 = "A2A_V1",
    A2A_V2 = "A2A_V2",
    MCP = "MCP",
    WEBSOCKET = "WEBSOCKET",
    REST = "REST"
}
export declare enum FailureStrategy {
    STOP_ON_FIRST_FAILURE = "stop_on_first_failure",
    CONTINUE_ON_FAILURE = "continue_on_failure",
    RETRY_FAILED_TASKS = "retry_failed_tasks"
}
export declare enum TimeoutStrategy {
    FAIL_IMMEDIATELY = "fail_immediately",
    EXTEND_TIMEOUT = "extend_timeout",
    SKIP_TASK = "skip_task"
}
export interface TaskResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: Record<string, any>;
    executionTime?: number;
}
export interface AgentResponse {
    agentId: string;
    taskId: string;
    result: TaskResult;
    timestamp: Date;
}
export interface WorkflowResult {
    workflowId: string;
    success: boolean;
    completedTasks: Task[];
    failedTasks: Task[];
    executionTime: number;
    errors: WorkflowError[];
}
//# sourceMappingURL=types.d.ts.map
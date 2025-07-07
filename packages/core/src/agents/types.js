// Enums
export var AgentType;
(function (AgentType) {
    AgentType["PLANNER"] = "planner";
    AgentType["EXECUTOR"] = "executor";
    AgentType["RESEARCHER"] = "researcher";
    AgentType["CRITIC"] = "critic";
    AgentType["WRITER"] = "writer";
    AgentType["CODER"] = "coder";
    AgentType["COORDINATOR"] = "coordinator";
    AgentType["SPECIALIST"] = "specialist";
})(AgentType || (AgentType = {}));
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["INITIALIZING"] = "initializing";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (AgentStatus = {}));
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
    TaskStatus["PAUSED"] = "paused";
})(TaskStatus || (TaskStatus = {}));
export var TaskType;
(function (TaskType) {
    TaskType["DATA_PROCESSING"] = "data_processing";
    TaskType["ML_INFERENCE"] = "ml_inference";
    TaskType["API_CALL"] = "api_call";
    TaskType["NOTIFICATION"] = "notification";
    TaskType["VALIDATION"] = "validation";
    TaskType["TRANSFORMATION"] = "transformation";
    TaskType["COMMUNICATION"] = "communication";
    TaskType["RESEARCH"] = "research";
    TaskType["PLANNING"] = "planning";
    TaskType["EXECUTION"] = "execution";
})(TaskType || (TaskType = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
    TaskPriority["CRITICAL"] = "critical";
})(TaskPriority || (TaskPriority = {}));
export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "pending";
    WorkflowStatus["RUNNING"] = "running";
    WorkflowStatus["COMPLETED"] = "completed";
    WorkflowStatus["FAILED"] = "failed";
    WorkflowStatus["PAUSED"] = "paused";
    WorkflowStatus["CANCELLED"] = "cancelled";
})(WorkflowStatus || (WorkflowStatus = {}));
export var MessageType;
(function (MessageType) {
    MessageType["DIRECT"] = "direct";
    MessageType["BROADCAST"] = "broadcast";
    MessageType["TASK_REQUEST"] = "task_request";
    MessageType["TASK_RESPONSE"] = "task_response";
    MessageType["STATUS_UPDATE"] = "status_update";
    MessageType["ERROR"] = "error";
    MessageType["HEARTBEAT"] = "heartbeat";
})(MessageType || (MessageType = {}));
export var MessagePriority;
(function (MessagePriority) {
    MessagePriority["LOW"] = "low";
    MessagePriority["MEDIUM"] = "medium";
    MessagePriority["HIGH"] = "high";
    MessagePriority["URGENT"] = "urgent";
})(MessagePriority || (MessagePriority = {}));
export var ChannelType;
(function (ChannelType) {
    ChannelType["DIRECT"] = "direct";
    ChannelType["BROADCAST"] = "broadcast";
    ChannelType["GROUP"] = "group";
    ChannelType["SYSTEM"] = "system";
})(ChannelType || (ChannelType = {}));
export var MemoryType;
(function (MemoryType) {
    MemoryType["FACT"] = "fact";
    MemoryType["PROCEDURE"] = "procedure";
    MemoryType["EVENT"] = "event";
    MemoryType["CONTEXT"] = "context";
    MemoryType["EXPERIENCE"] = "experience";
})(MemoryType || (MemoryType = {}));
export var ThoughtType;
(function (ThoughtType) {
    ThoughtType["THOUGHT"] = "thought";
    ThoughtType["ACTION"] = "action";
    ThoughtType["OBSERVATION"] = "observation";
    ThoughtType["COMMUNICATION"] = "communication";
    ThoughtType["REFLECTION"] = "reflection";
})(ThoughtType || (ThoughtType = {}));
export var InteractionType;
(function (InteractionType) {
    InteractionType["QUESTION"] = "question";
    InteractionType["ANSWER"] = "answer";
    InteractionType["SUGGESTION"] = "suggestion";
    InteractionType["INSTRUCTION"] = "instruction";
    InteractionType["FEEDBACK"] = "feedback";
    InteractionType["COLLABORATION"] = "collaboration";
})(InteractionType || (InteractionType = {}));
export var CommunicationProtocol;
(function (CommunicationProtocol) {
    CommunicationProtocol["A2A_V1"] = "A2A_V1";
    CommunicationProtocol["A2A_V2"] = "A2A_V2";
    CommunicationProtocol["MCP"] = "MCP";
    CommunicationProtocol["WEBSOCKET"] = "WEBSOCKET";
    CommunicationProtocol["REST"] = "REST";
})(CommunicationProtocol || (CommunicationProtocol = {}));
export var FailureStrategy;
(function (FailureStrategy) {
    FailureStrategy["STOP_ON_FIRST_FAILURE"] = "stop_on_first_failure";
    FailureStrategy["CONTINUE_ON_FAILURE"] = "continue_on_failure";
    FailureStrategy["RETRY_FAILED_TASKS"] = "retry_failed_tasks";
})(FailureStrategy || (FailureStrategy = {}));
export var TimeoutStrategy;
(function (TimeoutStrategy) {
    TimeoutStrategy["FAIL_IMMEDIATELY"] = "fail_immediately";
    TimeoutStrategy["EXTEND_TIMEOUT"] = "extend_timeout";
    TimeoutStrategy["SKIP_TASK"] = "skip_task";
})(TimeoutStrategy || (TimeoutStrategy = {}));

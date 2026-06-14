/**
 * @title A2A (Agent2Agent) Protocol
 * @description This file defines the interfaces and types for the Agent2Agent (A2A) specification.
 * The A2A specification facilitates interoperability between AI agents and clients.
 */
// --8<-- [end:AgentSkill]
// --8<-- [start:TransportProtocol]
/**
 * Supported A2A transport protocols.
 */
export var TransportProtocol;
(function (TransportProtocol) {
    TransportProtocol["JSONRPC"] = "JSONRPC";
    TransportProtocol["GRPC"] = "GRPC";
    TransportProtocol["HTTP_JSON"] = "HTTP+JSON";
})(TransportProtocol || (TransportProtocol = {}));
// --8<-- [end:MessageSendParams]
// --8<-- [start:TaskState]
/**
 * Defines the lifecycle states of a Task.
 */
export var TaskState;
(function (TaskState) {
    /** The task has been submitted and is awaiting execution. */
    TaskState["Submitted"] = "submitted";
    /** The agent is actively working on the task. */
    TaskState["Working"] = "working";
    /** The task is paused and waiting for input from the user. */
    TaskState["InputRequired"] = "input-required";
    /** The task has been successfully completed. */
    TaskState["Completed"] = "completed";
    /** The task has been canceled by the user. */
    TaskState["Canceled"] = "canceled";
    /** The task failed due to an error during execution. */
    TaskState["Failed"] = "failed";
    /** The task was rejected by the agent and was not started. */
    TaskState["Rejected"] = "rejected";
    /** The task requires authentication to proceed. */
    TaskState["AuthRequired"] = "auth-required";
    /** The task is in an unknown or indeterminate state. */
    TaskState["Unknown"] = "unknown";
})(TaskState || (TaskState = {}));
// --8<-- [end:A2AError]

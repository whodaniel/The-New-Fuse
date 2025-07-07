/**
 * A2A (Agent-to-Agent) Message Types
 * Clean, type-safe message definitions for inter-agent communication
 */

/**
 * Base message interface that all A2A messages extend
 */
export interface BaseA2AMessage {
  id: string;
  timestamp: number;
  source: string;
  target: string;
  type: string;
  metadata: {
    workflowId?: string;
    nodeId?: string;
    conversationId?: string;
    protocol?: string;
    encrypted?: boolean;
    [key: string]: any;
  };
}

/**
 * A2A Message for workflow steps
 */
export interface A2AMessage extends BaseA2AMessage {
  type:
    | "WORKFLOW_STEP"
    | "TASK_REQUEST"
    | "RESPONSE"
    | "NOTIFICATION"
    | "ERROR"
    | "HEARTBEAT";
  payload: any;
}

/**
 * Task Request Message
 */
export interface TaskRequestMessage extends BaseA2AMessage {
  type: "TASK_REQUEST";
  payload: {
    taskType: string;
    parameters: Record<string, any>;
    priority?: "low" | "medium" | "high";
    requestedBy: {
      id: string;
      name: string;
    };
  };
}

/**
 * Response Message
 */
export interface ResponseMessage extends BaseA2AMessage {
  type: "RESPONSE";
  payload: {
    originalMessageId: string;
    status: "success" | "error" | "partial";
    data: any;
    respondedBy: {
      id: string;
      name: string;
    };
  };
}

/**
 * Notification Message
 */
export interface NotificationMessage extends BaseA2AMessage {
  type: "NOTIFICATION";
  payload: {
    notificationType: string;
    message: string;
    data?: any;
    priority?: "low" | "medium" | "high";
    sentBy: {
      id: string;
      name: string;
    };
  };
}

/**
 * Error Message
 */
export interface ErrorMessage extends BaseA2AMessage {
  type: "ERROR";
  payload: {
    errorCode: string;
    errorMessage: string;
    details?: any;
    originalMessageId?: string;
  };
}

/**
 * Heartbeat Message
 */
export interface HeartbeatMessage extends BaseA2AMessage {
  type: "HEARTBEAT";
  payload: {
    status: "alive" | "busy" | "idle";
    capabilities?: string[];
    load?: number;
  };
}

/**
 * Union type for all A2A messages
 */
export type A2AMessageTypes =
  | A2AMessage
  | TaskRequestMessage
  | ResponseMessage
  | NotificationMessage
  | ErrorMessage
  | HeartbeatMessage;

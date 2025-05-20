export interface AgentMessage {
  header: {
    source: "cascade" | "cline";
    target: "cascade" | "cline";
    type: MessageType;
    version: string;
    priority: Priority;
  };
  body: {
    content: {
      message: string;
      [key: string]: any;
    };
    metadata: {
      sent_at: string;
      version: string;
    };
    timestamp: string;
  };
}

export interface TaskUpdate {
  taskId: string;
  status: TaskStatus;
  progress: number;
  metadata: {
    type: string;
    fileUrl?: string;
    fileName?: string;
    [key: string]: any;
  };
}

export interface WorldEvent {
  type: "messageReceived" | "taskUpdate" | "taskAssign";
  payload: {
    messageId?: string;
    roomId?: string;
    senderId?: string;
    taskId?: string;
    status?: string;
    progress?: number;
    metadata?: Record<string, any>;
    timestamp: number;
  };
}

export type Priority = "low" | "medium" | "high" | "critical";
export type MessageType =
  | "TASK_ASSIGNMENT"
  | "AGENT_COORDINATION"
  | "KNOWLEDGE_SHARING"
  | "SYSTEM_MESSAGE"
  | "ERROR";

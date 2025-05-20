export enum SystemEvents {
  // User events
  USER_CREATED = "user.created",
  USER_UPDATED = "user.updated",
  USER_DELETED = "user.deleted",
  USER_LOGIN = "user.login",
  USER_LOGOUT = "user.logout",

  // Authentication events
  AUTH_SUCCESS = "auth.success",
  AUTH_FAILURE = "auth.failure",
  TOKEN_REFRESH = "(auth as any).token.refresh",
  PASSWORD_RESET_REQUESTED = "auth.password.reset.requested",
  PASSWORD_RESET_COMPLETED = "auth.password.reset.completed",

  // System events
  SYSTEM_ERROR = "system.error",
  SYSTEM_WARNING = "system.warning",
  CONFIG_UPDATED = "(system as any).config.updated",
  MAINTENANCE_STARTED = "(system as any).maintenance.started",
  MAINTENANCE_COMPLETED = "(system as any).maintenance.completed",

  // Resource events
  RESOURCE_CREATED = "resource.created",
  RESOURCE_UPDATED = "resource.updated",
  RESOURCE_DELETED = "resource.deleted",
  RESOURCE_ACCESSED = "resource.accessed",

  // Workflow events
  WORKFLOW_STARTED = "workflow.started",
  WORKFLOW_COMPLETED = "workflow.completed",
  WORKFLOW_FAILED = "workflow.failed",
  TASK_CREATED = "(workflow as any).task.created",
  TASK_COMPLETED = "(workflow as any).task.completed",
  TASK_FAILED = "(workflow as any).task.failed",

  // Integration events
  INTEGRATION_CONNECTED = "integration.connected",
  INTEGRATION_DISCONNECTED = "integration.disconnected",
  INTEGRATION_SYNC_STARTED = "(integration as any).sync.started",
  INTEGRATION_SYNC_COMPLETED = "(integration as any).sync.completed",
  INTEGRATION_SYNC_FAILED = "(integration as any).sync.failed",

  // Notification events
  NOTIFICATION_CREATED = "notification.created",
  NOTIFICATION_SENT = "notification.sent",
  NOTIFICATION_FAILED = "notification.failed",
  NOTIFICATION_READ = "notification.read",
}

export interface EventPayloads {
  [SystemEvents.USER_CREATED]: {
    userId: string;
    email: string;
    roles: string[];
  };

  [SystemEvents.AUTH_SUCCESS]: {
    userId: string;
    timestamp: number;
    ipAddress: string;
  };

  [SystemEvents.SYSTEM_ERROR]: {
    error: string;
    stack?: string;
    context?: Record<string, any>;
  };

  [SystemEvents.WORKFLOW_STARTED]: {
    workflowId: string;
    type: string;
    initiator: string;
    parameters: Record<string, any>;
  };

  // Add more payload types as needed
}

export type EventType = keyof EventPayloads;
export type EventPayload<T extends EventType> = EventPayloads[T];

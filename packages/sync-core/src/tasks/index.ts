export { EnhancedTaskManagementService } from './EnhancedTaskManagementService';
export { TaskNotificationService } from './TaskNotificationService';
export { TaskSynchronizationService } from './TaskSynchronizationService';

export type {
  TaskDependencyUpdate,
  TaskExecutionSyncData,
  TaskNotification,
  TaskSyncData,
} from './TaskSynchronizationService';

export type {
  EnhancedTaskData,
  TaskExecutionContext,
  WorkflowTaskIntegration,
} from './EnhancedTaskManagementService';

export type {
  NotificationChannel,
  TaskNotificationHistory,
  TaskNotificationRule,
} from './TaskNotificationService';

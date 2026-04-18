export { TaskSynchronizationService } from './TaskSynchronizationService';
export { EnhancedTaskManagementService } from './EnhancedTaskManagementService';
export { TaskNotificationService } from './TaskNotificationService';

export type {
  TaskSyncData,
  TaskExecutionSyncData,
  TaskDependencyUpdate,
  TaskNotification
} from './TaskSynchronizationService';

export type {
  EnhancedTaskData,
  TaskExecutionContext,
  WorkflowTaskIntegration
} from './EnhancedTaskManagementService';

export type {
  TaskNotificationRule,
  NotificationChannel,
  TaskNotificationHistory
} from './TaskNotificationService';
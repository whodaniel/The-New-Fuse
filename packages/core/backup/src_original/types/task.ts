import { TaskStatusType, TaskPriorityType, TaskTypeValue, TaskMetadata } from '@fuse/types';
export type TaskExecutionStatus = 'running' | 'completed' | 'failed' | ';
    level: 'info' | 'warning' | 'error'
        processingStrategy: 'fifo' | 'lifo' | 'priority'
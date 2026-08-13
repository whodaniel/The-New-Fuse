import { Task } from './task.js';

export interface ImplementationPhase {
    id: string;
    tasks: Task[];
    status: 'pending' | 'running' | 'completed' | 'failed';
}

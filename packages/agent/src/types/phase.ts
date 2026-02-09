import { Task } from './task';

export interface ImplementationPhase {
    id: string;
    tasks: Task[];
    status: 'pending' | 'running' | 'completed' | 'failed';
}

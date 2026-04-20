import { Task } from './task.js';

export interface ImplementationPhase {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  tasks?: Task[];
  startTime?: Date;
  endTime?: Date;
  dependencies?: string[];
}
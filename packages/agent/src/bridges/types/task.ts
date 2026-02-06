export interface Task {
  id?: string;
  type: string;
  data?: any;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  priority?: number;
  basePriority?: number;
  retryCount?: number;
  dependencies?: Task[];
  createdAt?: Date;
  updatedAt?: Date;
}

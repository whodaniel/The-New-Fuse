import { Injectable } from '@nestjs/common';

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  details?: string;
  timestamp: Date;
}

@Injectable()
export class TaskActivityService {
  private activities: Map<string, TaskActivity[]> = new Map();

  logActivity(taskId: string, userId: string, action: string, details?: string): TaskActivity {
    const activity: TaskActivity = {
      id: `activity-${Date.now()}`,
      taskId,
      userId,
      action,
      details,
      timestamp: new Date(),
    };

    const taskActivities = this.activities.get(taskId) || [];
    taskActivities.push(activity);
    this.activities.set(taskId, taskActivities);

    return activity;
  }

  getTaskActivities(taskId: string): TaskActivity[] {
    return this.activities.get(taskId) || [];
  }

  getAllActivities(): TaskActivity[] {
    const allActivities: TaskActivity[] = [];
    for (const activities of this.activities.values()) {
      allActivities.push(...activities);
    }
    return allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getRecentActivities(limit: number = 10): TaskActivity[] {
    return this.getAllActivities().slice(0, limit);
  }
}

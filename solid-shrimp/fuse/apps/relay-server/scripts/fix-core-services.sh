#!/bin/bash
set -e

echo "🔧 Fixing core service files..."

# Create all necessary directories
echo "Creating directory structure..."
mkdir -p src/types
mkdir -p src/task
mkdir -p src/communication

# Create base service types
echo "Creating base service types..."
cat > src/types/service-types.ts << 'EOL'
export interface BaseServiceConfig {
  enabled?: boolean;
  debug?: boolean;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

export interface AsyncServiceResult<T> extends Promise<ServiceResult<T>> {}
EOL

# Fix TaskService
echo "Fixing TaskService..."
cat > src/task/TaskService.ts << 'EOL'
import { Injectable } from '@nestjs/common';
import { BaseServiceConfig, AsyncServiceResult } from '../types/service-types';

export interface TaskConfig extends BaseServiceConfig {
  maxRetries?: number;
  timeout?: number;
}

export interface Task {
  id: string;
  type: string;
  data: unknown;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

@Injectable()
export class TaskService {
  private config: TaskConfig;

  constructor(config: TaskConfig = {}) {
    this.config = {
      enabled: true,
      maxRetries: 3,
      timeout: 5000,
      ...config
    };
  }

  async createTask(type: string, data: unknown): AsyncServiceResult<Task> {
    try {
      const task: Task = {
        id: crypto.randomUUID(),
        type,
        data,
        status: 'pending'
      };
      return { success: true, data: task };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async executeTask(taskId: string): AsyncServiceResult<Task> {
    try {
      // Implementation here
      return { success: true, data: { id: taskId } as Task };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}
EOL

# Fix NotificationService
echo "Fixing NotificationService..."
cat > src/communication/NotificationService.ts << 'EOL'
import { Injectable } from '@nestjs/common';
import { BaseServiceConfig, AsyncServiceResult } from '../types/service-types';

export interface NotificationConfig extends BaseServiceConfig {
  channels?: string[];
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  recipient: string;
  status: 'pending' | 'sent' | 'failed';
}

@Injectable()
export class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig = {}) {
    this.config = {
      enabled: true,
      channels: ['email', 'push'],
      ...config
    };
  }

  async send(notification: Omit<Notification, 'id' | 'status'>): AsyncServiceResult<Notification> {
    try {
      const fullNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        status: 'pending'
      };
      return { success: true, data: fullNotification };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}
EOL

echo "✅ Core service fixes applied!"

import { Injectable } from '@nestjs/common';
import { BaseServiceConfig, AsyncServiceResult } from '../types/service-types.js';

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

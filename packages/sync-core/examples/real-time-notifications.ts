/**
 * Real-Time Notifications Example
 *
 * Shows how to use sync-core for real-time notifications
 * and event delivery across the system.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator.js';
import { NotificationService } from '../src/services/NotificationService';

interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

@Injectable()
export class RealTimeNotificationService implements OnModuleInit {
  constructor(
    private readonly syncOrchestrator: SyncOrchestrator,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    // Subscribe to system events
    this.subscribeToEvents();
  }

  /**
   * Subscribe to various system events for notifications
   */
  private subscribeToEvents() {
    // Agent status changes
    this.syncOrchestrator.subscribe('agent', async (event) => {
      if (event.data.status === 'ERROR') {
        await this.sendNotification({
          type: 'ERROR',
          title: 'Agent Error',
          message: `Agent ${event.resourceId} encountered an error`,
          priority: 'HIGH',
          tenantId: event.tenantId,
        });
      }
    });

    // Task completion
    this.syncOrchestrator.subscribe('task', async (event) => {
      if (event.data.status === 'COMPLETED') {
        await this.sendNotification({
          type: 'SUCCESS',
          title: 'Task Completed',
          message: `Task ${event.resourceId} completed successfully`,
          priority: 'MEDIUM',
          userId: event.data.assignedTo,
          tenantId: event.tenantId,
        });
      }
    });

    // Conflict detection
    this.syncOrchestrator.subscribe('conflict', async (event) => {
      await this.sendNotification({
        type: 'WARNING',
        title: 'Conflict Detected',
        message: `Data conflict detected for ${event.resourceType}`,
        priority: 'HIGH',
        tenantId: event.tenantId,
        metadata: {
          resourceType: event.resourceType,
          resourceId: event.resourceId,
        },
      });
    });
  }

  /**
   * Send notification to user(s)
   */
  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
    const fullNotification: Notification = {
      id: this.generateId(),
      ...notification,
      createdAt: new Date(),
    };

    // Store notification
    await this.storeNotification(fullNotification);

    // Send via appropriate channels
    await this.deliverNotification(fullNotification);

    // Sync across all instances
    if (notification.userId) {
      await this.syncOrchestrator.syncTenantData(
        notification.tenantId!,
        'notification',
        fullNotification
      );
    }

    return fullNotification;
  }

  /**
   * Deliver notification via multiple channels
   */
  private async deliverNotification(notification: Notification) {
    // Real-time WebSocket delivery
    if (notification.userId) {
      await this.notificationService.sendToUser(
        notification.userId,
        {
          type: 'notification',
          data: notification,
        }
      );
    }

    // Broadcast to tenant
    if (notification.tenantId && !notification.userId) {
      await this.notificationService.sendToTenant(
        notification.tenantId,
        {
          type: 'notification',
          data: notification,
        }
      );
    }

    // Email for HIGH/URGENT priority
    if (['HIGH', 'URGENT'].includes(notification.priority)) {
      await this.sendEmailNotification(notification);
    }

    // SMS for URGENT priority
    if (notification.priority === 'URGENT') {
      await this.sendSMSNotification(notification);
    }

    // Push notification for mobile
    if (notification.userId) {
      await this.sendPushNotification(notification);
    }
  }

  /**
   * Broadcast system-wide notification
   */
  async broadcastSystemNotification(
    title: string,
    message: string,
    priority: Notification['priority'] = 'MEDIUM'
  ) {
    const notification: Omit<Notification, 'id' | 'createdAt'> = {
      type: 'INFO',
      title,
      message,
      priority,
    };

    // Sync globally (all tenants)
    await this.syncOrchestrator.syncGlobalData(
      'system_notification',
      notification
    );

    // Broadcast via WebSocket to all connected clients
    await this.notificationService.broadcast({
      type: 'system_notification',
      data: notification,
    });

    console.log(`System notification broadcasted: ${title}`);
  }

  /**
   * Send notification to specific tenant
   */
  async notifyTenant(
    tenantId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'INFO'
  ) {
    await this.sendNotification({
      type,
      title,
      message,
      priority: 'MEDIUM',
      tenantId,
    });
  }

  /**
   * Send notification to specific user
   */
  async notifyUser(
    userId: string,
    tenantId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'INFO'
  ) {
    await this.sendNotification({
      type,
      title,
      message,
      priority: 'MEDIUM',
      userId,
      tenantId,
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    tenantId: string,
    options: {
      limit?: number;
      unreadOnly?: boolean;
      since?: Date;
    } = {}
  ): Promise<Notification[]> {
    // Retrieve from database
    const notifications = await this.retrieveNotifications({
      userId,
      tenantId,
      ...options,
    });

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string, tenantId: string) {
    await this.updateNotificationStatus(notificationId, 'READ');

    // Sync status update
    await this.syncOrchestrator.syncTenantData(
      tenantId,
      'notification',
      {
        id: notificationId,
        userId,
        status: 'READ',
        readAt: new Date(),
      }
    );
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string, tenantId: string) {
    await this.removeNotification(notificationId);

    // Sync deletion
    await this.syncOrchestrator.syncTenantData(
      tenantId,
      'notification',
      {
        id: notificationId,
        userId,
        deleted: true,
        deletedAt: new Date(),
      }
    );
  }

  /**
   * Real-time notification stream for user
   */
  async streamNotifications(userId: string, tenantId: string): Promise<any> {
    // Return async iterator for real-time notifications
    // Implementation would use WebSocket or Server-Sent Events

    return {
      subscribe: (callback: (notification: Notification) => void) => {
        const handler = (event: any) => {
          if (event.data.userId === userId) {
            callback(event.data);
          }
        };

        this.syncOrchestrator.subscribe('notification', handler);

        return {
          unsubscribe: () => {
            this.syncOrchestrator.unsubscribe('notification', handler);
          },
        };
      },
    };
  }

  // Helper methods (implementations would use actual services)

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeNotification(notification: Notification) {
    // Store in database
    console.log('Storing notification:', notification.id);
  }

  private async retrieveNotifications(filters: any): Promise<Notification[]> {
    // Retrieve from database
    console.log('Retrieving notifications with filters:', filters);
    return [];
  }

  private async updateNotificationStatus(id: string, status: string) {
    // Update in database
    console.log(`Updating notification ${id} status to ${status}`);
  }

  private async removeNotification(id: string) {
    // Delete from database
    console.log(`Removing notification ${id}`);
  }

  private async sendEmailNotification(notification: Notification) {
    // Send email
    console.log(`Sending email notification: ${notification.title}`);
  }

  private async sendSMSNotification(notification: Notification) {
    // Send SMS
    console.log(`Sending SMS notification: ${notification.title}`);
  }

  private async sendPushNotification(notification: Notification) {
    // Send push notification
    console.log(`Sending push notification: ${notification.title}`);
  }
}

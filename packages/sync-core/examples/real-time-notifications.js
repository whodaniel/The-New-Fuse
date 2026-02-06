/**
 * Real-Time Notifications Example
 *
 * Shows how to use sync-core for real-time notifications
 * and event delivery across the system.
 */
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return (c > 3 && r && Object.defineProperty(target, key, r), r);
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v);
  };
var _a;
import { Injectable } from '@nestjs/common';
import { NotificationService } from '../src/services/NotificationService';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator';
let RealTimeNotificationService = class RealTimeNotificationService {
  syncOrchestrator;
  notificationService;
  constructor(syncOrchestrator, notificationService) {
    this.syncOrchestrator = syncOrchestrator;
    this.notificationService = notificationService;
  }
  async onModuleInit() {
    // Subscribe to system events
    this.subscribeToEvents();
  }
  /**
   * Subscribe to various system events for notifications
   */
  subscribeToEvents() {
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
  async sendNotification(notification) {
    const fullNotification = {
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
        notification.tenantId,
        'notification',
        fullNotification
      );
    }
    return fullNotification;
  }
  /**
   * Deliver notification via multiple channels
   */
  async deliverNotification(notification) {
    // Real-time WebSocket delivery
    if (notification.userId) {
      await this.notificationService.sendToUser(notification.userId, {
        type: 'notification',
        data: notification,
      });
    }
    // Broadcast to tenant
    if (notification.tenantId && !notification.userId) {
      await this.notificationService.sendToTenant(notification.tenantId, {
        type: 'notification',
        data: notification,
      });
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
  async broadcastSystemNotification(title, message, priority = 'MEDIUM') {
    const notification = {
      type: 'INFO',
      title,
      message,
      priority,
    };
    // Sync globally (all tenants)
    await this.syncOrchestrator.syncGlobalData('system_notification', notification);
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
  async notifyTenant(tenantId, title, message, type = 'INFO') {
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
  async notifyUser(userId, tenantId, title, message, type = 'INFO') {
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
  async getUserNotifications(userId, tenantId, options = {}) {
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
  async markAsRead(notificationId, userId, tenantId) {
    await this.updateNotificationStatus(notificationId, 'READ');
    // Sync status update
    await this.syncOrchestrator.syncTenantData(tenantId, 'notification', {
      id: notificationId,
      userId,
      status: 'READ',
      readAt: new Date(),
    });
  }
  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId, tenantId) {
    await this.removeNotification(notificationId);
    // Sync deletion
    await this.syncOrchestrator.syncTenantData(tenantId, 'notification', {
      id: notificationId,
      userId,
      deleted: true,
      deletedAt: new Date(),
    });
  }
  /**
   * Real-time notification stream for user
   */
  async streamNotifications(userId, tenantId) {
    // Return async iterator for real-time notifications
    // Implementation would use WebSocket or Server-Sent Events
    return {
      subscribe: (callback) => {
        const handler = (event) => {
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
  generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  async storeNotification(notification) {
    // Store in database
    console.log('Storing notification:', notification.id);
  }
  async retrieveNotifications(filters) {
    // Retrieve from database
    console.log('Retrieving notifications with filters:', filters);
    return [];
  }
  async updateNotificationStatus(id, status) {
    // Update in database
    console.log(`Updating notification ${id} status to ${status}`);
  }
  async removeNotification(id) {
    // Delete from database
    console.log(`Removing notification ${id}`);
  }
  async sendEmailNotification(notification) {
    // Send email
    console.log(`Sending email notification: ${notification.title}`);
  }
  async sendSMSNotification(notification) {
    // Send SMS
    console.log(`Sending SMS notification: ${notification.title}`);
  }
  async sendPushNotification(notification) {
    // Send push notification
    console.log(`Sending push notification: ${notification.title}`);
  }
};
RealTimeNotificationService = __decorate(
  [
    Injectable(),
    __metadata('design:paramtypes', [
      SyncOrchestrator,
      typeof (_a = typeof NotificationService !== 'undefined' && NotificationService) === 'function'
        ? _a
        : Object,
    ]),
  ],
  RealTimeNotificationService
);
export { RealTimeNotificationService };
//# sourceMappingURL=real-time-notifications.js.map

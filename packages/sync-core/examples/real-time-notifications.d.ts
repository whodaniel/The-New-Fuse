/**
 * Real-Time Notifications Example
 *
 * Shows how to use sync-core for real-time notifications
 * and event delivery across the system.
 */
import { OnModuleInit } from '@nestjs/common';
import { NotificationService } from '../src/services/NotificationService';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator';
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
export declare class RealTimeNotificationService implements OnModuleInit {
  private readonly syncOrchestrator;
  private readonly notificationService;
  constructor(syncOrchestrator: SyncOrchestrator, notificationService: NotificationService);
  onModuleInit(): Promise<void>;
  /**
   * Subscribe to various system events for notifications
   */
  private subscribeToEvents;
  /**
   * Send notification to user(s)
   */
  sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  /**
   * Deliver notification via multiple channels
   */
  private deliverNotification;
  /**
   * Broadcast system-wide notification
   */
  broadcastSystemNotification(
    title: string,
    message: string,
    priority?: Notification['priority']
  ): Promise<void>;
  /**
   * Send notification to specific tenant
   */
  notifyTenant(
    tenantId: string,
    title: string,
    message: string,
    type?: Notification['type']
  ): Promise<void>;
  /**
   * Send notification to specific user
   */
  notifyUser(
    userId: string,
    tenantId: string,
    title: string,
    message: string,
    type?: Notification['type']
  ): Promise<void>;
  /**
   * Get user notifications
   */
  getUserNotifications(
    userId: string,
    tenantId: string,
    options?: {
      limit?: number;
      unreadOnly?: boolean;
      since?: Date;
    }
  ): Promise<Notification[]>;
  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string, userId: string, tenantId: string): Promise<void>;
  /**
   * Delete notification
   */
  deleteNotification(notificationId: string, userId: string, tenantId: string): Promise<void>;
  /**
   * Real-time notification stream for user
   */
  streamNotifications(userId: string, tenantId: string): Promise<any>;
  private generateId;
  private storeNotification;
  private retrieveNotifications;
  private updateNotificationStatus;
  private removeNotification;
  private sendEmailNotification;
  private sendSMSNotification;
  private sendPushNotification;
}
export {};
//# sourceMappingURL=real-time-notifications.d.ts.map

import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { TaskNotification } from './TaskSynchronizationService';

export interface TaskNotificationRule {
  id: string;
  userId: string;
  tenantId?: string;
  eventTypes: string[];
  conditions?: {
    taskTypes?: string[];
    priorities?: string[];
    statuses?: string[];
    agentIds?: string[];
    pipelineIds?: string[];
  };
  channels: NotificationChannel[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationChannel {
  type: 'websocket' | 'email' | 'push' | 'webhook';
  config: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface TaskNotificationHistory {
  id: string;
  notificationId: string;
  userId: string;
  tenantId?: string;
  channel: string;
  status: 'sent' | 'delivered' | 'failed' | 'acknowledged';
  sentAt: Date;
  deliveredAt?: Date;
  acknowledgedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface IWebSocketService {
  sendMessage(userId: string, message: any): Promise<boolean>;
  broadcastToAllUsers(message: any): Promise<number>;
  broadcastToTenant(tenantId: string, message: any): Promise<number>;
}

@Injectable()
export class TaskNotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TaskNotificationService.name);

  private readonly config = {
    notificationChannelPrefix: 'task_notifications:',
    historyChannelPrefix: 'notification_history:',
    batchSize: 100,
    retryAttempts: 3,
    retryDelay: 5000,
    maxPendingNotifications: 1000,
  };

  private notificationRules: Map<string, TaskNotificationRule[]> = new Map();
  private pendingNotifications: Map<string, TaskNotification[]> = new Map();
  private notificationHistory: Map<string, TaskNotificationHistory[]> = new Map();
  private processingQueue: TaskNotification[] = [];
  private isProcessing = false;

  constructor(
    private readonly redisService: UnifiedRedisService,
    @Inject('IWebSocketService') private readonly wsService: IWebSocketService,
    private readonly dbService: DatabaseService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadNotificationRules();
    await this.initializeChannelSubscriptions();
    this.startNotificationProcessor();
    this.startHistoryCleanup();
    this.logger.log('TaskNotificationService initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.cleanup();
    this.logger.log('TaskNotificationService destroyed');
  }

  /**
   * Load notification rules from database or configuration
   */
  private async loadNotificationRules(): Promise<void> {
    try {
      // Load users and their notification preferences
      const users = await this.dbService.user.findMany({
        select: {
          id: true,
          preferences: true,
          role: true,
        },
      });

      for (const user of users) {
        const preferences = (user.preferences as any) || {};
        const notificationPrefs = preferences.notifications || {};

        // Create default notification rules based on user preferences
        const defaultRules: TaskNotificationRule[] = [
          {
            id: `${user.id}_task_assigned`,
            userId: user.id,
            eventTypes: ['task_created', 'task_updated'],
            conditions: {
              // Only notify for tasks assigned to this user
            },
            channels: [
              {
                type: 'websocket',
                config: { realTime: true },
                priority: 'medium',
              },
            ],
            isActive: notificationPrefs.taskUpdates !== false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: `${user.id}_task_completed`,
            userId: user.id,
            eventTypes: ['task_completed', 'task_failed'],
            conditions: {},
            channels: [
              {
                type: 'websocket',
                config: { realTime: true },
                priority: 'high',
              },
            ],
            isActive: notificationPrefs.taskCompletions !== false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: `${user.id}_urgent_tasks`,
            userId: user.id,
            eventTypes: ['task_created', 'task_updated', 'task_failed'],
            conditions: {
              priorities: ['URGENT'],
            },
            channels: [
              {
                type: 'websocket',
                config: { realTime: true, persistent: true },
                priority: 'urgent',
              },
            ],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        // Add admin-specific rules
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          defaultRules.push({
            id: `${user.id}_system_tasks`,
            userId: user.id,
            eventTypes: ['task_failed', 'dependency_changed'],
            conditions: {},
            channels: [
              {
                type: 'websocket',
                config: { realTime: true, systemLevel: true },
                priority: 'high',
              },
            ],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        this.notificationRules.set(user.id, defaultRules);
      }

      this.logger.log(`Loaded notification rules for ${users.length} users`);
    } catch (error) {
      this.logger.error('Failed to load notification rules:', error);
    }
  }

  /**
   * Initialize Redis channel subscriptions
   */
  private async initializeChannelSubscriptions(): Promise<void> {
    // Subscribe to notification events
    await this.redisService.psubscribe(
      `${this.config.notificationChannelPrefix}*`,
      async (message) => {
        await this.handleNotificationMessage(message);
      }
    );

    // Subscribe to notification history events
    await this.redisService.psubscribe(`${this.config.historyChannelPrefix}*`, async (message) => {
      await this.handleHistoryMessage(message);
    });

    this.logger.log('Notification channels initialized');
  }

  /**
   * Process a task notification
   */
  async processTaskNotification(notification: TaskNotification): Promise<void> {
    try {
      // Add to processing queue
      this.processingQueue.push(notification);

      // Trigger immediate processing for urgent notifications
      if (notification.priority === 'urgent') {
        await this.processNotificationQueue();
      }

      this.logger.debug(`Queued notification ${notification.id} for processing`);
    } catch (error) {
      this.logger.error(`Failed to process task notification:`, error);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(userId: string, notification: TaskNotification): Promise<void> {
    try {
      const userRules = this.notificationRules.get(userId) || [];
      const applicableRules = this.findApplicableRules(userRules, notification);

      for (const rule of applicableRules) {
        for (const channel of rule.channels) {
          await this.sendViaChannel(notification, channel, userId);
        }
      }

      // Store in history
      await this.recordNotificationHistory(notification, userId, 'sent');

      this.logger.debug(`Sent notification ${notification.id} to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}:`, error);
      await this.recordNotificationHistory(notification, userId, 'failed', error.message);
    }
  }

  /**
   * Broadcast notification to all relevant users
   */
  async broadcastTaskNotification(notification: TaskNotification): Promise<void> {
    try {
      const relevantUsers = await this.findRelevantUsers(notification);

      for (const userId of relevantUsers) {
        await this.sendNotificationToUser(userId, notification);
      }

      // Publish to Redis for other instances
      const channel = `${this.config.notificationChannelPrefix}${notification.tenantId || 'global'}`;
      await this.redisService.publish(channel, notification);

      this.logger.debug(
        `Broadcasted notification ${notification.id} to ${relevantUsers.length} users`
      );
    } catch (error) {
      this.logger.error(`Failed to broadcast notification:`, error);
    }
  }

  /**
   * Create and manage notification rules
   */
  async createNotificationRule(
    rule: Omit<TaskNotificationRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TaskNotificationRule> {
    const newRule: TaskNotificationRule = {
      ...rule,
      id: this.generateRuleId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userRules = this.notificationRules.get(rule.userId) || [];
    userRules.push(newRule);
    this.notificationRules.set(rule.userId, userRules);

    this.logger.debug(`Created notification rule ${newRule.id} for user ${rule.userId}`);
    return newRule;
  }

  async updateNotificationRule(
    ruleId: string,
    updates: Partial<TaskNotificationRule>
  ): Promise<TaskNotificationRule | null> {
    for (const [userId, rules] of this.notificationRules.entries()) {
      const ruleIndex = rules.findIndex((r) => r.id === ruleId);
      if (ruleIndex >= 0) {
        const updatedRule = {
          ...rules[ruleIndex],
          ...updates,
          updatedAt: new Date(),
        };
        rules[ruleIndex] = updatedRule;
        this.notificationRules.set(userId, rules);

        this.logger.debug(`Updated notification rule ${ruleId}`);
        return updatedRule;
      }
    }

    return null;
  }

  async deleteNotificationRule(ruleId: string): Promise<boolean> {
    for (const [userId, rules] of this.notificationRules.entries()) {
      const ruleIndex = rules.findIndex((r) => r.id === ruleId);
      if (ruleIndex >= 0) {
        rules.splice(ruleIndex, 1);
        this.notificationRules.set(userId, rules);

        this.logger.debug(`Deleted notification rule ${ruleId}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
      limit?: number;
    }
  ): Promise<TaskNotificationHistory[]> {
    const userHistory = this.notificationHistory.get(userId) || [];

    let filteredHistory = userHistory;

    if (filters?.startDate) {
      filteredHistory = filteredHistory.filter((h) => h.sentAt >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredHistory = filteredHistory.filter((h) => h.sentAt <= filters.endDate!);
    }

    if (filters?.status) {
      filteredHistory = filteredHistory.filter((h) => h.status === filters.status);
    }

    // Sort by sent date (newest first)
    filteredHistory.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

    // Apply limit
    if (filters?.limit) {
      filteredHistory = filteredHistory.slice(0, filters.limit);
    }

    return filteredHistory;
  }

  /**
   * Acknowledge notification
   */
  async acknowledgeNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const userHistory = this.notificationHistory.get(userId) || [];
      const historyItem = userHistory.find((h) => h.notificationId === notificationId);

      if (historyItem) {
        historyItem.status = 'acknowledged';
        historyItem.acknowledgedAt = new Date();

        // Publish acknowledgment event
        const channel = `${this.config.historyChannelPrefix}acknowledged`;
        await this.redisService.publish(channel, {
          notificationId,
          userId,
          acknowledgedAt: new Date(),
        });

        this.logger.debug(`Acknowledged notification ${notificationId} for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to acknowledge notification:`, error);
    }
  }

  /**
   * Private helper methods
   */
  private async processNotificationQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const batch = this.processingQueue.splice(0, this.config.batchSize);

      for (const notification of batch) {
        try {
          await this.broadcastTaskNotification(notification);
        } catch (error) {
          this.logger.error(`Failed to process notification ${notification.id}:`, error);

          // Retry logic for failed notifications
          if (notification.priority === 'urgent' || notification.priority === 'high') {
            // Re-queue for retry
            setTimeout(() => {
              this.processingQueue.unshift(notification);
            }, this.config.retryDelay);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private findApplicableRules(
    rules: TaskNotificationRule[],
    notification: TaskNotification
  ): TaskNotificationRule[] {
    return rules.filter((rule) => {
      if (!rule.isActive) return false;

      // Check event type
      if (!rule.eventTypes.includes(notification.type)) return false;

      // Check conditions
      if (rule.conditions) {
        const conditions = rule.conditions;

        if (
          conditions.priorities &&
          !conditions.priorities.includes(notification.priority.toUpperCase())
        ) {
          return false;
        }

        // Add more condition checks as needed
      }

      return true;
    });
  }

  private async findRelevantUsers(notification: TaskNotification): Promise<string[]> {
    const relevantUsers: Set<string> = new Set();

    // Always include the task owner
    relevantUsers.add(notification.userId);

    // Find users with applicable notification rules
    for (const [userId, rules] of this.notificationRules.entries()) {
      const applicableRules = this.findApplicableRules(rules, notification);
      if (applicableRules.length > 0) {
        relevantUsers.add(userId);
      }
    }

    // Add tenant-specific users if applicable
    if (notification.tenantId) {
      // This would be enhanced with actual tenant user lookup
      // For now, we'll use the existing logic
    }

    return Array.from(relevantUsers);
  }

  private async sendViaChannel(
    notification: TaskNotification,
    channel: NotificationChannel,
    userId: string
  ): Promise<void> {
    switch (channel.type) {
      case 'websocket':
        await this.sendViaWebSocket(notification, channel, userId);
        break;
      case 'email':
        await this.sendViaEmail(notification, channel, userId);
        break;
      case 'push':
        await this.sendViaPush(notification, channel, userId);
        break;
      case 'webhook':
        await this.sendViaWebhook(notification, channel, userId);
        break;
      default:
        this.logger.warn(`Unknown notification channel type: ${channel.type}`);
    }
  }

  private async sendViaWebSocket(
    notification: TaskNotification,
    channel: NotificationChannel,
    userId: string
  ): Promise<void> {
    try {
      const message = {
        id: this.generateMessageId(),
        type: 'task_notification',
        payload: {
          notification,
          channel: channel.config,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        priority: this.mapNotificationPriorityToMessagePriority(notification.priority),
        requiresAck: notification.requiresAck || channel.config.requiresAck || false,
      };

      const success = await this.wsService.sendMessage(userId, message);

      if (success) {
        await this.recordNotificationHistory(notification, userId, 'delivered');
      } else {
        await this.recordNotificationHistory(
          notification,
          userId,
          'failed',
          'WebSocket delivery failed'
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send via WebSocket:`, error);
      await this.recordNotificationHistory(notification, userId, 'failed', error.message);
    }
  }

  private async sendViaEmail(
    notification: TaskNotification,
    channel: NotificationChannel,
    userId: string
  ): Promise<void> {
    // Email implementation would go here
    // For now, just log and mark as sent
    this.logger.debug(`Email notification not implemented for user ${userId}`);
    await this.recordNotificationHistory(notification, userId, 'sent');
  }

  private async sendViaPush(
    notification: TaskNotification,
    channel: NotificationChannel,
    userId: string
  ): Promise<void> {
    // Push notification implementation would go here
    // For now, just log and mark as sent
    this.logger.debug(`Push notification not implemented for user ${userId}`);
    await this.recordNotificationHistory(notification, userId, 'sent');
  }

  private async sendViaWebhook(
    notification: TaskNotification,
    channel: NotificationChannel,
    userId: string
  ): Promise<void> {
    // Webhook implementation would go here
    // For now, just log and mark as sent
    this.logger.debug(`Webhook notification not implemented for user ${userId}`);
    await this.recordNotificationHistory(notification, userId, 'sent');
  }

  private async recordNotificationHistory(
    notification: TaskNotification,
    userId: string,
    status: 'sent' | 'delivered' | 'failed',
    error?: string
  ): Promise<void> {
    const historyItem: TaskNotificationHistory = {
      id: this.generateHistoryId(),
      notificationId: notification.id,
      userId,
      tenantId: notification.tenantId,
      channel: 'websocket', // Default for now
      status,
      sentAt: new Date(),
      deliveredAt: status === 'delivered' ? new Date() : undefined,
      error,
      metadata: {
        notificationType: notification.type,
        taskId: notification.taskId,
        priority: notification.priority,
      },
    };

    const userHistory = this.notificationHistory.get(userId) || [];
    userHistory.push(historyItem);

    // Keep only recent history (last 1000 items)
    if (userHistory.length > 1000) {
      userHistory.splice(0, userHistory.length - 1000);
    }

    this.notificationHistory.set(userId, userHistory);
  }

  private async handleNotificationMessage(message: any): Promise<void> {
    try {
      const notification = JSON.parse(message.message);
      await this.processTaskNotification(notification);
    } catch (error) {
      this.logger.error('Error handling notification message:', error);
    }
  }

  private async handleHistoryMessage(message: any): Promise<void> {
    try {
      const historyEvent = JSON.parse(message.message);
      // Process history events from other instances
      this.logger.debug('Received notification history event:', historyEvent);
    } catch (error) {
      this.logger.error('Error handling history message:', error);
    }
  }

  private startNotificationProcessor(): void {
    // Process queue every 2 seconds
    setInterval(async () => {
      await this.processNotificationQueue();
    }, 2000);
  }

  private startHistoryCleanup(): void {
    // Clean up old history every hour
    setInterval(() => {
      this.cleanupOldHistory();
    }, 3600000); // 1 hour
  }

  private cleanupOldHistory(): void {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    for (const [userId, history] of this.notificationHistory.entries()) {
      const filteredHistory = history.filter((h) => h.sentAt > cutoffDate);
      this.notificationHistory.set(userId, filteredHistory);
    }

    this.logger.debug('Cleaned up old notification history');
  }

  private mapNotificationPriorityToMessagePriority(priority: string): number {
    const mapping: Record<string, number> = {
      urgent: 1,
      high: 2,
      medium: 3,
      low: 4,
    };
    return mapping[priority] || 3;
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHistoryId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async cleanup(): Promise<void> {
    // Clean up resources
    this.processingQueue = [];
    this.pendingNotifications.clear();

    // Unsubscribe from Redis channels
    await this.redisService.punsubscribe(`${this.config.notificationChannelPrefix}*`);
    await this.redisService.punsubscribe(`${this.config.historyChannelPrefix}*`);
  }

  /**
   * Public API methods
   */
  async getNotificationRules(userId: string): Promise<TaskNotificationRule[]> {
    return this.notificationRules.get(userId) || [];
  }

  async getNotificationStats(userId: string): Promise<any> {
    const history = this.notificationHistory.get(userId) || [];
    const rules = this.notificationRules.get(userId) || [];

    return {
      totalRules: rules.length,
      activeRules: rules.filter((r) => r.isActive).length,
      totalNotifications: history.length,
      recentNotifications: history.filter(
        (h) => h.sentAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      deliveryStats: {
        sent: history.filter((h) => h.status === 'sent').length,
        delivered: history.filter((h) => h.status === 'delivered').length,
        failed: history.filter((h) => h.status === 'failed').length,
        acknowledged: history.filter((h) => h.status === 'acknowledged').length,
      },
    };
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Redis } from 'ioredis';
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  type: 'email' | 'sms' | 'push' | 'slack' | '
          config: JSON.parse((channel.config as string) || '{}'
          metadata: JSON.parse((channel.metadata as string) || '{}'
      this.logger.error(''Failed to load notification channels:''
          variables: JSON.parse((template.variables as string) || '[]'
          metadata: JSON.parse((template.metadata as string) || '{}'
      this.logger.error(''Failed to load notification templates:''
          channelPreferences: JSON.parse((preference.channelPreferences as string) || '{}'
          filters: JSON.parse((preference.filters as string) || '{}'
          metadata: JSON.parse((preference.metadata as string) || '{}'
      this.logger.error(''Failed to load notification preferences:''
      priority?: 'low' | 'medium' | 'high' | 'urgent'
        priority: data.priority || 'medium'
        channels: data.channels || ['email'
        status: 'pending'
    } catch (error) { this.logger.error(''Failed to send notification: ''
    await this.redis.set(key, JSON.stringify(notification), ''EX'
        notification.status = 'failed'';
      case 'email'
      case 'sms'
      case 'push'
      case 'slack'
      case '
      'notification:retries'
    const items = await this.redis.zrangebyscore('notification:retries';
        await this.redis.zrem('notification:retries'
        const now = new Date().toLocaleTimeString('en-US', { timeZone: 'timezone';
    status: 'sent' | 'delivered' | 'read' | 'failed'
        where: { id: 'notificationId'
      this.emit('notificationStatusUpdated'
      this.logger.error(''Failed to update notification status:''
      await Promise.all(notificationIds.map((id) => this.updateNotificationStatus(id, 'read';
      this.emit('notificationsRead'
      this.logger.error(''Failed to mark notifications as read:''
      orderBy: { timestamp: 'desc'
          expiresAt: { lt: 'now'
      this.logger.error(''Failed to clean up expired notifications:''
        this.logger.error(''Error during scheduled cleanup:''
      this.logger.error(''Failed to clean up notifications: ''
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { PrismaService } from '@the-new-fuse/database';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';

export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: low' | 'medium' | 'high' | 'critical';
  source: string;
  status: active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  severity: low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notificationChannels: string[];
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, unknown>;
  enabled: boolean;
}

/**
 * AlertService handles the creation, management, and notification of system alerts.
 * It provides functionality for defining alert rules, managing active alerts,
 * and sending notifications through various channels.
 */
@Injectable()
export class AlertService extends EventEmitter implements OnModuleInit {
  private logger: Logger;
  private redis: Redis;
  private db: PrismaService;
  private rules: Map<string, AlertRule>;
  private channels: Map<string, NotificationChannel>;
  private activeAlerts: Map<string, Alert>;
  private checkIntervals: Map<string, NodeJS.Timeout>;

  constructor() {
    super(): Promise<any> {
    this.logger.info('Initializing Alert Service'): Omit<Alert, 'id' | 'status' | 'createdAt'>): Promise<Alert> {
    try {
      const id: Alert  = crypto.randomUUID();
      const alert {
        id,
        ...alertData,
        status: active',
        createdAt: new Date()
      };

      // Store in memory
      this.activeAlerts.set(id, alert);

      // Persist to database
      await this.db.alerts.create({
        data: {
          id: alert.id,
          name: alert.name,
          description: alert.description,
          severity: alert.severity,
          source: alert.source,
          status: alert.status,
          createdAt: alert.createdAt,
          metadata: alert.metadata as any
        }
      });

      // Store in Redis for distributed awareness
      await this.redis.set(`alerts:${id}`, JSON.stringify(alert): $ {id}`, 30 * 24 * 60 * 60); // 30 days

      // Emit event for real-time notification
      this.emit('alert:created', alert): $ {alert.name}`, { alertId: id, severity: alert.severity });
      return alert;
    } catch (error: unknown){
      this.logger.error('Failed to create alert', { error, alertData }): string, userId: string): Promise<Alert | null> {
    try {
      const alert: ${alertId}`);
        return null;
      }

      if(alert.status ! = this.activeAlerts.get(alertId)): void {
        this.logger.warn(`Attempted to acknowledge non-existent alert= 'active': unknown){
        this.logger.warn(`Attempted to acknowledge alert that is not active: ${alertId}`): Alert = {
        ...alert,
        status: acknowledged',
        acknowledgedAt: new Date():  {
          ...alert.metadata,
          acknowledgedBy: userId
        }
      };

      // Update in memory
      this.activeAlerts.set(alertId, updatedAlert);

      // Update in database
      await this.db.alerts.update({
        where: { id: alertId },
        data: {
          status: acknowledged',
          acknowledgedAt: updatedAlert.acknowledgedAt,
          metadata: updatedAlert.metadata as any
        }
      });

      // Update in Redis
      await this.redis.set(`alerts:${alertId}`, JSON.stringify(updatedAlert): acknowledged', updatedAlert);

      this.logger.info(`Alert acknowledged: $ {alert.name}`, { alertId });
      return updatedAlert;
    } catch (error: unknown){
      this.logger.error('Failed to acknowledge alert', { error, alertId }): string, userId: string, resolution?: string): Promise<Alert | null> {
    try {
      const alert: ${alertId}`);
        return null;
      }

      if(alert.status  = this.activeAlerts.get(alertId)): void {
        this.logger.warn(`Attempted to resolve non-existent alert== 'resolved': unknown){
        this.logger.warn(`Attempted to resolve already resolved alert: ${alertId}`): Alert = {
        ...alert,
        status: resolved',
        resolvedAt: new Date():  {
          ...alert.metadata,
          resolvedBy: userId,
          resolution
        }
      };

      // Update in memory
      this.activeAlerts.set(alertId, updatedAlert);

      // Update in database
      await this.db.alerts.update({
        where: { id: alertId },
        data: {
          status: resolved',
          resolvedAt: updatedAlert.resolvedAt,
          metadata: updatedAlert.metadata as any
        }
      });

      // Update in Redis
      await this.redis.set(`alerts:${alertId}`, JSON.stringify(updatedAlert): resolved', updatedAlert);

      this.logger.info(`Alert resolved: $ {alert.name}`, { alertId });
      return updatedAlert;
    } catch (error: unknown){
      this.logger.error('Failed to resolve alert', { error, alertId }): Promise<Alert[]> {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.status === 'active')
      .sort((a, b) => {
        // Sort by severity(critical first): 0, high: 1, medium: 2, low: 3 };
        const severityDiff: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    try {
      const id: AlertRule   = { critical severityOrder[a.severity] - severityOrder[b.severity];
        if(severityDiff !== 0) crypto.randomUUID();
      const newRule {
        ...rule,
        id
      };

      // Store in memory
      this.rules.set(id, newRule);

      // Persist to database
      await this.db.alertRules.create({
        data: {
          id: newRule.id,
          name: newRule.name,
          description: newRule.description,
          condition: newRule.condition,
          threshold: newRule.threshold,
          severity: newRule.severity,
          enabled: newRule.enabled,
          notificationChannels: JSON.stringify(newRule.notificationChannels)): void {
        this.setupRuleCheck(newRule): $ {newRule.name}`, { ruleId: id });
      return newRule;
    } catch (error: unknown){
      this.logger.error('Failed to create alert rule', { error, rule }): string, updates: Partial<Omit<AlertRule, 'id'>>): Promise<AlertRule | null> {
    try {
      const rule: ${id}`);
        return null;
      }

      const updatedRule: AlertRule  = this.rules.get(id)): void {
        this.logger.warn(`Attempted to update non-existent alert rule {
        ...rule,
        ...updates
      };

      // Update in memory
      this.rules.set(id, updatedRule);

      // Update in database
      await this.db.alertRules.update({
        where: { id },
        data: {
          name: updatedRule.name,
          description: updatedRule.description,
          condition: updatedRule.condition,
          threshold: updatedRule.threshold,
          severity: updatedRule.severity,
          enabled: updatedRule.enabled,
          notificationChannels: JSON.stringify(updatedRule.notificationChannels)): void {
        if (updatedRule.enabled: unknown){
          this.setupRuleCheck(updatedRule);
        } else {
          this.clearRuleCheck(id): $ {updatedRule.name}`, { ruleId: id });
      return updatedRule;
    } catch (error: unknown){
      this.logger.error('Failed to update alert rule', { error, id, updates }): string): Promise<boolean> {
    try {
      if (!this.rules.has(id)) {
        this.logger.warn(`Attempted to delete non-existent alert rule: ${id}`);
        return false;
      }

      // Remove from memory
      this.rules.delete(id);

      // Remove from database
      await this.db.alertRules.delete({
        where: { id }
      });

      // Clear check interval
      this.clearRuleCheck(id): $ {id}`);
      return true;
    } catch (error: unknown){
      this.logger.error('Failed to delete alert rule', { error, id }): Omit<NotificationChannel, 'id'>): Promise<NotificationChannel> {
    try {
      const id: NotificationChannel  = crypto.randomUUID();
      const newChannel {
        ...channel,
        id
      };

      // Store in memory
      this.channels.set(id, newChannel);

      // Persist to database
      await this.db.notificationChannels.create({
        data: {
          id: newChannel.id,
          name: newChannel.name,
          type: newChannel.type,
          config: JSON.stringify(newChannel.config): newChannel.enabled
        }
      });

      this.logger.info(`Created notification channel: $ {newChannel.name}`, { channelId: id });
      return newChannel;
    } catch (error: unknown){
      this.logger.error('Failed to create notification channel', { error, channel }): Promise<void> {
    try {
      const rules: unknown){
        const alertRule: AlertRule  = await this.db.alertRules.findMany();

      for (const rule of rules {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          condition: rule.condition,
          threshold: rule.threshold,
          severity: rule.severity as any,
          enabled: rule.enabled,
          notificationChannels: JSON.parse(rule.notificationChannels || '[]')
        };

        this.rules.set(rule.id, alertRule);
      }

      this.logger.info(`Loaded ${rules.length} alert rules`);
    } catch (error: unknown){
      this.logger.error('Failed to load alert rules', { error }): Promise<void> {
    try {
      const channels: unknown){
        const notificationChannel: NotificationChannel  = await this.db.notificationChannels.findMany();
      
      for (const channel of channels {
          id: channel.id,
          name: channel.name,
          type: channel.type as any,
          config: JSON.parse(channel.config || '{}'): channel.enabled
        };
        
        this.channels.set(channel.id, notificationChannel);
      }
      
      this.logger.info(`Loaded $ {channels.length} notification channels`);
    } catch (error: unknown){
      this.logger.error('Failed to load notification channels', { error });
    }
  }
}
import { OnModuleInit } from '@nestjs/common';
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
export declare class AlertService extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private rules;
    private channels;
    private activeAlerts;
    private checkIntervals;
    constructor();
}

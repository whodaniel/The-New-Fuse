import { OnModuleInit } from '@nestjs/common';
import { LoggingService } from '../services/LoggingService';
import { ConfigService } from '../config/ConfigService';
import { CommunicationService } from '../services/CommunicationService';
import { MetricsService } from './MetricsService';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export interface Alert {
    id: string;
    source: string;
    title: string;
    message: string;
    severity: AlertSeverity;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface AlertChannel {
    name: string;
    type: 'email' | 'slack' | 'sms' | 'webhook';
    target: string;
    minSeverity: AlertSeverity;
}
export interface AlertRule {
    source: string;
    severities: AlertSeverity[];
    channels: string[];
}
export declare class AlertManagerService implements OnModuleInit {
    private readonly logger;
    private readonly configService;
    private readonly communicationService;
    private readonly metricsService;
    private channels;
    private rules;
    constructor(logger: LoggingService, configService: ConfigService, communicationService: CommunicationService, metricsService: MetricsService);
    onModuleInit(): void;
    private loadConfiguration;
    triggerAlert(source: string, title: string, message: string, severity: AlertSeverity, metadata?: Record<string, any>): Promise<void>;
    _$: any;
}
//# sourceMappingURL=AlertManager.d.ts.map
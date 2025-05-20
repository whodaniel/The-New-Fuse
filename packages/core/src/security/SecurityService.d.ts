import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare enum SecurityLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface SecurityPolicy {
    id: string;
    name: string;
    description?: string;
    level: SecurityLevel;
    allowedPatterns: string[];
    blockedPatterns: string[];
    maxMessageSize: number;
    requireEncryption: boolean;
    requireAuthentication: boolean;
    allowedRoles: string[];
    enabled: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface SecurityConfig {
    enabled: boolean;
    policies: SecurityPolicy[];
    defaultAction: allow' | 'deny';
    encryptionKey?: string;
    jwtSecret?: string;
    encryption: {
        algorithm: string;
        keySize: number;
        iterations: number;
    };
    audit: {
        enabled: boolean;
        storageRetention: number;
        sensitiveFields: string[];
    };
    threatDetection: {
        enabled: boolean;
        sensitivity: number;
        autoBlockThreshold: number;
    };
}
export declare class SecurityService extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private config;
    private policies;
    private encryptionKey;
    private jwtSecret;
    private metricsProcessor;
    private circuitBreaker;
    constructor();
    catch(error: unknown): void;
}

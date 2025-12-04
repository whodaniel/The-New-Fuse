import React from 'react';
interface AdminSettings {
    system: {
        maintenanceMode: boolean;
        debugMode: boolean;
        logLevel: string;
        maxConcurrentUsers: number;
        sessionTimeout: number;
        backupFrequency: string;
    };
    security: {
        enforceSSL: boolean;
        requireMFA: boolean;
        passwordPolicy: {
            minLength: number;
            requireSpecialChars: boolean;
            requireNumbers: boolean;
            requireUppercase: boolean;
        };
        sessionSecurity: {
            maxSessions: number;
            ipWhitelist: string[];
        };
    };
    database: {
        connectionPoolSize: number;
        queryTimeout: number;
        enableQueryLogging: boolean;
        autoBackup: boolean;
        retentionDays: number;
    };
    notifications: {
        emailNotifications: boolean;
        slackIntegration: boolean;
        webhookUrl: string;
        alertThresholds: {
            cpuUsage: number;
            memoryUsage: number;
            diskUsage: number;
        };
    };
}
declare const AdminSettings: React.FC;
export default AdminSettings;

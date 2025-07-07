export interface WorkflowConfig {
    audit: {
        retention: {
            days: number;
            highPriorityDays: number;
        };
        sampling: {
            enabled: boolean;
            rate: number;
        };
    };
    resources: {
        scaling: {
            enabled: boolean;
            minInstances: number;
            maxInstances: number;
            cooldownPeriod: number;
        };
        limits: {
            cpu: number;
            memory: number;
            storage: number;
        };
    };
    security: {
        encryption: {
            algorithm: string;
            keyRotationDays: number;
        };
        authentication: {
            sessionTimeout: number;
            maxAttempts: number;
        };
    };
    recovery: {
        backup: {
            schedule: string;
            retention: number;
            compressionLevel: number;
        };
        monitoring: {
            checkInterval: number;
            healthThreshold: number;
        };
    };
}

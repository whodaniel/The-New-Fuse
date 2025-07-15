export type ProtocolVersion = '1.0' | '2.0';
export interface A2AConfiguration {
    protocolVersion: ProtocolVersion;
    securityKey?: string;
    timeout: number;
    retryAttempts: number;
    endpoints: {
        primary: string;
        fallback?: string;
    };
    encryption?: {
        enabled: boolean;
        algorithm?: string;
        keySize?: number;
    };
    workflowIntegration?: {
        enabled: boolean;
        defaultCommunicationPattern?: 'direct' | 'broadcast' | 'request-response';
    };
}
export declare class ConfigurationManager {
    private static instance;
    private config;
    private constructor();
    static getInstance(): ConfigurationManager;
    getConfig(): A2AConfiguration;
    updateConfig(updates: Partial<A2AConfiguration>): void;
}
//# sourceMappingURL=A2AConfig.d.ts.map
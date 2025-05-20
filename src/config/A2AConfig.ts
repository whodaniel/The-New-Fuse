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

export class ConfigurationManager {
    private static instance: ConfigurationManager;
    private config: A2AConfiguration;

    private constructor() {
        this.config = {
            protocolVersion: '2.0', // Updated to use the latest protocol version
            timeout: 30000,
            retryAttempts: 3,
            endpoints: {
                primary: 'https://a2a.protocol.local'
            },
            encryption: {
                enabled: true,
                algorithm: 'AES-GCM',
                keySize: 256
            },
            workflowIntegration: {
                enabled: true,
                defaultCommunicationPattern: 'request-response'
            }
        };
    }

    static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    getConfig(): A2AConfiguration {
        return { ...this.config };
    }

    updateConfig(updates: Partial<A2AConfiguration>): void {
        this.config = {
            ...this.config,
            ...updates
        };
    }
}
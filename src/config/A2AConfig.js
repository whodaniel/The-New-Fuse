export class ConfigurationManager {
    static instance;
    config;
    constructor() {
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
    static getInstance() {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        this.config = {
            ...this.config,
            ...updates
        };
    }
}

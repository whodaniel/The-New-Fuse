import { ConfigService } from '@nestjs/config';
export interface RAGConfiguration {
    serverUrl: string;
    serverPort: number;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    crawlingConfig: {
        maxDepth: number;
        maxPages: number;
        userAgent: string;
        delay: number;
    };
    collections: {
        vscode: {
            name: string;
            defaultUrl: string;
        };
        copilot: {
            name: string;
            defaultUrl: string;
        };
        typescript: {
            name: string;
            defaultUrl: string;
        };
        nestjs: {
            name: string;
            defaultUrl: string;
        };
    };
}
export declare class RAGConfigurationService {
    private readonly configService;
    private readonly logger;
    private readonly config;
    constructor(configService: ConfigService);
    private loadConfiguration;
    getConfiguration(): RAGConfiguration;
    getServerUrl(): string;
    getCrawlingConfig(): {
        maxDepth: number;
        maxPages: number;
        userAgent: string;
        delay: number;
    };
    getCollectionConfig(collectionName: string): any;
    getAllCollections(): {
        vscode: {
            name: string;
            defaultUrl: string;
        };
        copilot: {
            name: string;
            defaultUrl: string;
        };
        typescript: {
            name: string;
            defaultUrl: string;
        };
        nestjs: {
            name: string;
            defaultUrl: string;
        };
    };
    updateConfiguration(updates: Partial<RAGConfiguration>): void;
    validateConfiguration(): boolean;
    /**
     * Get environment variables template for documentation
     */
    getEnvironmentTemplate(): Record<string, string>;
}
//# sourceMappingURL=rag-configuration.service.d.ts.map
import { AxiosInstance } from 'axios';
export interface ApiClientOptions {
    baseURL: string;
    timeout?: number;
    apiKey?: string;
    apiVersion?: string;
    retryAttempts?: number;
    retryDelay?: number;
}
export declare class ApiClientFactory {
    private static logger;
    static createClient(options: ApiClientOptions): AxiosInstance;
    static createRetryClient(options: ApiClientOptions): AxiosInstance;
    private static shouldRetry;
    private static delay;
}
//# sourceMappingURL=api-client-factory.d.ts.map
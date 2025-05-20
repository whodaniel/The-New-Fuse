interface ApiError {
    message: string;
    status?: number;
}
interface ApiOptions {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    token?: string | null;
}
export declare class ApiClient {
    static call<T>(options: ApiOptions): Promise<T | null>;
}
export type { ApiError, ApiOptions };

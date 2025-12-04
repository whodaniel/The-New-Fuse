export declare class ApiError extends Error {
    status: number;
    constructor(status: number, message: string);
}
export declare function handleApiResponse<T>(response: Response): Promise<T>;
export declare function createQueryString(params: Record<string, any>): string;
export interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
    headers?: Record<string, string>;
    params?: Record<string, any>;
}
export declare function apiRequest<T = any>(url: string, options?: ApiRequestOptions): Promise<{
    data: T;
}>;

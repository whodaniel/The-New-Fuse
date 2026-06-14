import type { GeneratedUser } from './userGenerator';
export interface GenerateAPIRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    withAuth?: boolean;
    withPagination?: boolean;
    withFilters?: boolean;
    user?: GeneratedUser;
}
export interface GenerateAPIResponseOptions {
    status?: number;
    withPagination?: boolean;
    withMeta?: boolean;
    withError?: boolean;
}
export interface GeneratedAPIRequest {
    id: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    query?: Record<string, string>;
    body?: any;
    timestamp: Date;
    user?: Partial<GeneratedUser>;
}
export interface GeneratedAPIResponse {
    id: string;
    status: number;
    headers: Record<string, string>;
    body: any;
    timestamp: Date;
    requestId: string;
    meta?: Record<string, any>;
}
export declare const generateAPIRequest: (options?: GenerateAPIRequestOptions) => GeneratedAPIRequest;
export declare const generateAPIResponse: (request: GeneratedAPIRequest, options?: GenerateAPIResponseOptions) => GeneratedAPIResponse;
//# sourceMappingURL=apiGenerator.d.ts.map
export interface APIResponse<T> {
    data: T;
    status: number;
    message?: string;
}
export interface APIError {
    status: number;
    message: string;
    code?: string;
    name: string;
}
export interface RequestOptions {
    headers?: Record<string, string>;
    token?: string;
    timeout?: number;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}
//# sourceMappingURL=api.d.ts.map
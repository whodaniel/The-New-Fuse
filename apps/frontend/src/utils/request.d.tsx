interface RequestOptions extends RequestInit {
    params?: Record<string, string>;
}
interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    status: number;
}
export declare function request<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>;
export declare function get<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>;
export declare function post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>;
export declare function put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>;
export declare function del<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>;
declare const _default: {
    request: typeof request;
    get: typeof get;
    post: typeof post;
    put: typeof put;
    delete: typeof del;
};
export default _default;

export interface HttpClientOptions {
    baseURL?: string;
    headers?: Record<string, string>;
    timeout?: number;
}

export interface HttpResponse<T = any> {
    data: T;
    status: number;
    headers: Record<string, string>;
}

export interface HttpClient {
    get<T = any>(url: string, options?: HttpClientOptions): Promise<HttpResponse<T>>;
    post<T = any>(url: string, data?: unknown, options?: HttpClientOptions): Promise<HttpResponse<T>>;
    put<T = any>(url: string, data?: unknown, options?: HttpClientOptions): Promise<HttpResponse<T>>;
    delete<T = any>(url: string, options?: HttpClientOptions): Promise<HttpResponse<T>>;
    patch<T = any>(url: string, data?: unknown, options?: HttpClientOptions): Promise<HttpResponse<T>>;
}

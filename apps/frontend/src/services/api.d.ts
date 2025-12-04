declare const api: import("axios").AxiosInstance;
export default api;
export declare const apiService: {
    get: <T>(url: string, params?: any) => Promise<T>;
    post: <T>(url: string, data: any) => Promise<T>;
    put: <T>(url: string, data: any) => Promise<T>;
    delete: <T>(url: string) => Promise<T>;
};

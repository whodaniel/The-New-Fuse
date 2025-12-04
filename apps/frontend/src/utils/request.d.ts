interface User {
    uid: string;
    email?: string;
    username?: string;
    role?: string;
    profileImage?: string;
    settings?: {
        [key: string]: any;
    };
}
interface RequestConfig extends RequestInit {
    params?: Record<string, string>;
    requiresAuth?: boolean;
}
export declare function userFromStorage(): User | null;
export declare function request(endpoint: string, config?: RequestConfig): Promise<any>;
export declare function uploadFile(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<any>;
export declare function get(url: string, options?: RequestConfig): any;
export declare function post(url: string, data: any, options?: RequestConfig): any;
export declare function put(url: string, data: any, options?: RequestConfig): any;
export declare function del(url: string, options?: RequestConfig): any;
declare const _default: {
    request: typeof request;
    get: typeof get;
    post: typeof post;
    put: typeof put;
    delete: typeof del;
    uploadFile: typeof uploadFile;
};
export default _default;

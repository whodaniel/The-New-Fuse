export interface FuseClientOptions {
    apiKey?: string;
    baseUrl?: string;
    headers?: Record<string, string>;
}
export interface FuseUserRecord {
    id: string;
    [key: string]: unknown;
}
declare class UsersApi {
    private readonly request;
    constructor(request: <T>(path: string, init?: RequestInit) => Promise<T>);
    list(): Promise<FuseUserRecord[]>;
}
export declare class FuseClient {
    private readonly baseUrl;
    private readonly apiKey?;
    private readonly extraHeaders;
    readonly users: UsersApi;
    constructor(options?: FuseClientOptions);
    request<T>(path: string, init?: RequestInit): Promise<T>;
}
export {};
//# sourceMappingURL=index.d.ts.map
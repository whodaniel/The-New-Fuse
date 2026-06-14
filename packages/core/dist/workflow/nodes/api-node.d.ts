export interface APIConfig {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}
export declare class APINode {
    execute(config: APIConfig): Promise<any>;
}
//# sourceMappingURL=api-node.d.ts.map
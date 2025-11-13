import { SSEBridge, SSEBridgeConfig } from '../types/integration-bridge-types';
export declare class SSEBridgeImplementation implements SSEBridge {
    private readonly config;
    constructor(config: SSEBridgeConfig);
    createConnection(clientId: string, response: any): Promise<void>;
    clientId: any;
    eventTypes: any;
    createdAt: new () => Date;
}
//# sourceMappingURL=SSEBridge.d.ts.map
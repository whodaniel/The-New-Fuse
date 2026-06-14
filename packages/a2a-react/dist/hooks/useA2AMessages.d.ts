import { A2AMessage } from '@the-new-fuse/a2a-core';
export declare function useA2AMessages(): {
    messages: A2AMessage[];
    sendMessage: (message: Partial<A2AMessage>) => Promise<void>;
    sendRequest: (request: any) => Promise<void>;
    broadcast: (payload: any, options?: any) => Promise<void>;
};
//# sourceMappingURL=useA2AMessages.d.ts.map
import { A2AMessage } from '@/services/A2AProtocolService';
export interface A2AAgent {
    id: string;
    name: string;
    capabilities: string[];
    status: 'online' | 'offline' | 'busy';
    lastSeen: number;
}
export declare const useA2ACommunication: () => {
    agents: A2AAgent[];
    messages: A2AMessage[];
    loading: boolean;
    error: Error | null;
    loadAgents: () => Promise<void>;
    sendMessage: (message: Omit<A2AMessage, "id" | "timestamp">) => Promise<any>;
    broadcastMessage: (message: Omit<A2AMessage, "id" | "timestamp" | "recipient">) => Promise<any>;
    sendRequestAndWaitForResponse: (message: Omit<A2AMessage, "id" | "timestamp">, timeout?: number) => Promise<any>;
};
export default useA2ACommunication;

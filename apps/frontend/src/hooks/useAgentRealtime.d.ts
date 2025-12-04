import { Socket } from 'socket.io-client';
import { Agent } from './useAgents';
interface UseAgentRealtimeOptions {
    enabled?: boolean;
    url?: string;
}
/**
 * Hook for real-time agent updates via WebSockets
 */
export declare function useAgentRealtime(options?: UseAgentRealtimeOptions): {
    isConnected: boolean;
    error: Error | null;
    subscribeToAgentEvents: (onCreated?: (agent: Agent) => void, onUpdated?: (agent: Agent) => void, onDeleted?: (agent: Agent) => void) => () => void;
    socket: Socket<import("@socket.io/component-emitter").DefaultEventsMap, import("@socket.io/component-emitter").DefaultEventsMap> | null;
};
export {};

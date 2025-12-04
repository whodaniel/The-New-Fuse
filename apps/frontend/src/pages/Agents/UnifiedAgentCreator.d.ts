import React from 'react';
export interface TerminalAgentWindow {
    windowId: string;
    processId: number;
    terminalPath: string;
    agentId: string;
    status: 'spawning' | 'active' | 'idle' | 'closed';
    createdAt: Date;
    lastActivity: Date;
    relayConnection?: {
        connected: boolean;
        endpoint: string;
        lastHeartbeat: Date;
    };
}
export declare const UnifiedAgentCreator: React.FC;
export default UnifiedAgentCreator;

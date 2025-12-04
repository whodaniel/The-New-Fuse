import React from 'react';
interface CreateStreamData {
    agentNftId: string;
    streamName: string;
    description?: string;
    tokenAddress: string;
    distributionThreshold: string;
}
interface AgentNFTRevenueDashboardProps {
    agentNftId?: string;
    userAddress?: string;
    onCreateStream?: (data: CreateStreamData) => Promise<void>;
    onDistributeRevenue?: (streamId: string) => Promise<void>;
    onAddRevenue?: (streamId: string, amount: string) => Promise<void>;
}
export declare const AgentNFTRevenueDashboard: React.FC<AgentNFTRevenueDashboardProps>;
export {};

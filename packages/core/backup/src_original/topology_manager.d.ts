import { Agent } from './types/agent/;';
export declare class TopologyManager {
    private nodes;
    private communicationMetrics;
    private taskHistory;
    private sparsityFactor;
    private anchorWeight;
    private virtualNodeEmbedding;
    constructor();
    addAgent(agent: Agent & {
        id: string;
    }): unknown[] | undefined;
    private updateVirtualNode;
}

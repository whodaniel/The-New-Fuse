import { EventEmitter } from 'events';
import { AgentMessage } from '@the-new-fuse/types';
import { FeatureTracker } from '@the-new-fuse/feature-tracker';
export declare class AgentCoordinator extends EventEmitter {
    private readonly name;
    private readonly featureTracker;
    private readonly messageQueue;
    private readonly agents;
    readonly agentMap: Map<string, any>;
    constructor(name: string, featureTracker: FeatureTracker);
    handleMessage(message: AgentMessage): Promise<void>;
    private findBestAgent;
    private handleResponse;
    private dispatchToAgent;
    private analyzeMessageRequirements;
    private matchAgentCapabilities;
    private validateResponse;
    private updateFeatureProgress;
    private notifySubscribers;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=agent-coordinator.d.ts.map
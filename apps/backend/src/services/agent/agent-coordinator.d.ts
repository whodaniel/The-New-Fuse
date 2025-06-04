import { EventEmitter } from 'events';
import { AgentMessage } from '@the-new-fuse/types';
import { FeatureTracker } from '@the-new-fuse/feature-tracker';
export declare class AgentCoordinator extends EventEmitter {
    private readonly name;
    private readonly featureTracker;
    private readonly messageQueue;
    private readonly agents;
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
}

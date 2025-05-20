export declare class IntroductionManager {
    private bridge;
    private logger;
    private connectionManager;
    constructor();
    sendIntroduction(agentId: string, capabilities: string[], preferences?: Record<string, any>, metadata?: Record<string, any>): Promise<void>;
    resendIntroduction(agentId: string): Promise<void>;
    private getStoredCapabilities;
    private getStoredPreferences;
}

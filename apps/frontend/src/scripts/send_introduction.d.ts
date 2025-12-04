export declare class IntroductionManager {
    constructor();
    sendIntroduction(agentId: any, capabilities: any, preferences: any, metadata: any): Promise<void>;
    resendIntroduction(agentId: any): Promise<void>;
    getStoredCapabilities(agentId: any): Promise<string[]>;
    getStoredPreferences(agentId: any): Promise<{
        language: string;
        timezone: string;
        theme: string;
    }>;
}

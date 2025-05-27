/// <reference types="node" />
import { EventEmitter } from 'events';
export declare class CoreFeaturesManager extends EventEmitter {
    private static instance;
    private logger;
    private conversationManager;
    private agentDiscovery;
    private relayService;
    private fileProtocol;
    private statusBarItem;
    private constructor();
    static getInstance(): CoreFeaturesManager;
    private createStatusBarItem;
    initialize(): Promise<void>;
    private registerSelfAsAgent;
    private setupEventHandlers;
    private handleAgentMessage;
    private handleFileProtocolMessage;
    private handleMCPMessage;
    private handleAIRequest;
    private handleCodeInput;
    private handleCapabilityQuery;
    private processMCPRequest;
    private handleMCPRequest;
    dispose(): void;
}
//# sourceMappingURL=core-features.d.ts.map
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentProtocolBridge } from '../../AgentProtocolBridge';
import { MessageBroker } from '@the-new-fuse/core/communication/MessageBroker';
export interface VideoStreamMetadata {
    streamId: string;
    sourceType: 'desktop' | 'webcam' | 'chrome-tab' | 'application-window' | 'browser-content';
    resolution: {
        width: number;
        height: number;
    };
    frameRate: number;
    quality: 'low' | 'medium' | 'high' | 'ultra';
    timestamp: Date;
    agentId?: string;
    contextTags?: string[];
    analysisRequests?: AnalysisRequest[];
}
export interface AnalysisRequest {
    id: string;
    agentId: string;
    analysisType: 'object-detection' | 'text-extraction' | 'ui-analysis' | 'code-review' | 'visual-debug' | 'general-vision';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    contextualPrompts?: string[];
    responseChannel: string;
    timeout?: number;
}
export interface VisualAnalysisResult {
    analysisId: string;
    agentId: string;
    streamId: string;
    frameTimestamp: Date;
    analysisType: string;
    findings: VisualFinding[];
    confidence: number;
    processingTimeMs: number;
    nextActionSuggestions?: string[];
}
export interface VisualFinding {
    type: 'text' | 'ui-element' | 'code-snippet' | 'error-message' | 'object' | 'action-needed';
    content: string;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    confidence: number;
    metadata?: Record<string, any>;
}
export declare class WebRTCAgentBridge {
    private messageBroker;
    private protocolBridge;
    private eventEmitter;
    private activeStreams;
    private agentSubscriptions;
    private analysisQueue;
    private frameProcessingWorkers;
    constructor(messageBroker: MessageBroker, protocolBridge: AgentProtocolBridge, eventEmitter: EventEmitter2);
    private setupMessageHandlers;
    private initializeFrameProcessing;
}
//# sourceMappingURL=WebRTCAgentBridge.d.ts.map
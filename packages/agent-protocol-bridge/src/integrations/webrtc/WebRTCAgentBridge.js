"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRTCAgentBridge = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const AgentProtocolBridge_1 = require("../../AgentProtocolBridge");
const MessageBroker_1 = require("@the-new-fuse/core/communication/MessageBroker");
let WebRTCAgentBridge = class WebRTCAgentBridge {
    messageBroker;
    protocolBridge;
    eventEmitter;
    activeStreams = new Map();
    agentSubscriptions = new Map(); // agentId -> streamIds
    analysisQueue = new Map(); // streamId -> requests
    frameProcessingWorkers = new Map();
    constructor(messageBroker, protocolBridge, eventEmitter) {
        this.messageBroker = messageBroker;
        this.protocolBridge = protocolBridge;
        this.eventEmitter = eventEmitter;
        this.setupMessageHandlers();
        this.initializeFrameProcessing();
    }
    setupMessageHandlers() {
        // Handle video stream registration
        this.messageBroker.subscribe('webrtc.stream.register', {
            topic: 'webrtc.stream.register',
            handle: async (message) => {
                await this.handleStreamRegistration(message.payload);
            }
        });
        // Handle agent visual analysis requests
        this.messageBroker.subscribe('webrtc.analysis.request', {
            topic: 'webrtc.analysis.request',
            handle: async (message) => {
                await this.handleAnalysisRequest(message.payload);
            }
        });
        // Handle agent subscription to visual streams
        this.messageBroker.subscribe('webrtc.agent.subscribe', {
            topic: 'webrtc.agent.subscribe',
            handle: async (message) => {
                await this.handleAgentSubscription(message.payload);
            }
        });
        // Handle frame data from WebRTC streams
        this.messageBroker.subscribe('webrtc.frame.data', {
            topic: 'webrtc.frame.data',
            handle: async (message) => {
                await this.processFrameData(message.payload);
            }
        });
    }
    async initializeFrameProcessing() {
        // Initialize AI vision processing workers for different analysis types
        const analysisTypes = ['object-detection', 'text-extraction', 'ui-analysis', 'code-review', 'visual-debug'];
        for (const type of analysisTypes) {
            // In a real implementation, these would be actual Web Workers or GPU-accelerated processes
            console.log(`Initializing ${type} processing pipeline...);
    }
  }

  async registerVideoStream(metadata: VideoStreamMetadata): Promise<void> {
    this.activeStreams.set(metadata.streamId, {
      ...metadata,
      timestamp: new Date()
    });

    // Notify all interested agents about new stream
    await this.messageBroker.publish('webrtc.stream.available', {
      streamId: metadata.streamId,
      metadata,
      availableAnalysis: this.getSupportedAnalysisTypes(metadata.sourceType)
    });

    // Initialize analysis queue for this stream
    this.analysisQueue.set(metadata.streamId, []);
`, console.log(`📹 Video stream registered: ${metadata.streamId}`($, { metadata, : .sourceType })));
        }
        async;
        subscribeAgentToStream(agentId, string, streamId, string, analysisTypes, string[]);
        Promise < void  > {
            : .activeStreams.has(streamId)
        };
        {
            `
      throw new Error(`;
            Stream;
            $;
            {
                streamId;
            }
            ` not found);
    }

    if (!this.agentSubscriptions.has(agentId)) {
      this.agentSubscriptions.set(agentId, new Set());
    }

    this.agentSubscriptions.get(agentId)!.add(streamId);

    // Add default analysis requests for this agent
    const requests: AnalysisRequest[] = analysisTypes.map(type => ({
      id: ${agentId}_${streamId}_${type}_${Date.now()},`;
            agentId, `
      analysisType: type as any,`;
            priority: 'medium',
                responseChannel;
            agent.$;
            {
                agentId;
            }
            visual.analysis,
                timeout;
            30000;
        }
        ;
        const existingRequests = this.analysisQueue.get(streamId) || [];
        this.analysisQueue.set(streamId, [...existingRequests, ...requests]);
        `
    console.log(`;
        Agent;
        $;
        {
            agentId;
        }
        subscribed;
        to;
        stream;
        $;
        {
            streamId;
        }
        for ($; { analysisTypes, : .join(', ') } `);
  }

  private async handleStreamRegistration(payload: any): Promise<void> {
    const metadata: VideoStreamMetadata = {
      streamId: payload.streamId,
      sourceType: payload.sourceType,
      resolution: payload.resolution,
      frameRate: payload.frameRate,
      quality: payload.quality,
      timestamp: new Date(),
      contextTags: payload.contextTags || [],
      analysisRequests: payload.analysisRequests || []
    };

    await this.registerVideoStream(metadata);
  }

  private async handleAnalysisRequest(payload: any): Promise<void> {
    const request: AnalysisRequest = payload;
    
    if (!this.analysisQueue.has(request.streamId)) {
      this.analysisQueue.set(request.streamId, []);
    }

    // Insert based on priority
    const queue = this.analysisQueue.get(request.streamId)!;
    const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
    const insertIndex = queue.findIndex(req => 
      priorityOrder[req.priority] > priorityOrder[request.priority]
    );

    if (insertIndex === -1) {
      queue.push(request);
    } else {
      queue.splice(insertIndex, 0, request);
    }

    console.log(📋 Analysis request queued: ${request.analysisType} for stream ${request.streamId});
  }

  private async handleAgentSubscription(payload: any): Promise<void> {
    const { agentId, streamId, analysisTypes } = payload;
    await this.subscribeAgentToStream(agentId, streamId, analysisTypes);
  }

  private async processFrameData(payload: any): Promise<void> {
    const { streamId, frameData, timestamp } = payload;
    const requests = this.analysisQueue.get(streamId) || [];

    if (requests.length === 0) return;

    // Process high-priority requests first
    const urgentRequests = requests.filter(req => req.priority === 'urgent');
    const processingRequests = urgentRequests.length > 0 ? urgentRequests : requests.slice(0, 3);

    for (const request of processingRequests) {
      try {
        const result = await this.performVisualAnalysis(request, frameData, timestamp);
        
        // Send result to requesting agent via message broker
        await this.messageBroker.publish(request.responseChannel, {
          analysisResult: result,
          streamId,
          requestId: request.id
        });

        // Also broadcast to protocol bridge for cross-protocol communication`; )
            const protocolMessage = {} `
          id: `, visual_$, { result, analysisId }, type, source, target, payload, timestamp;
        (),
            priority;
        request.priority;
    }
    ;
};
exports.WebRTCAgentBridge = WebRTCAgentBridge;
exports.WebRTCAgentBridge = WebRTCAgentBridge = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof MessageBroker_1.MessageBroker !== "undefined" && MessageBroker_1.MessageBroker) === "function" ? _a : Object, AgentProtocolBridge_1.AgentProtocolBridge, typeof (_b = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _b : Object])
], WebRTCAgentBridge);
await this.protocolBridge.sendMessage(protocolMessage);
// Remove completed request from queue
const queueIndex = requests.findIndex(req => req.id === request.id);
if (queueIndex !== -1) {
    requests.splice(queueIndex, 1);
}
`
      } catch (error) {`;
console.error(Visual, analysis, failed);
for (request; $; { request, : .id } `:, error);
        
        // Notify agent of analysis failure
        await this.messageBroker.publish(request.responseChannel, {
          error: Analysis failed: ${error.message},
          requestId: request.id,
          streamId
        });
      }
    }
  }

  private async performVisualAnalysis(
    request: AnalysisRequest, 
    frameData: any, 
    timestamp: Date
  ): Promise<VisualAnalysisResult> {
    const startTime = Date.now();
    
    // In a real implementation, this would use actual AI vision models
    // For now, we'll simulate different analysis types
    const findings: VisualFinding[] = await this.runAnalysisByType(request.analysisType, frameData);
    
    const result: VisualAnalysisResult = {`)
    analysisId: analysis_$;
{
    request.id;
}
`_${timestamp.getTime()}`,
    agentId;
request.agentId,
    streamId;
request.streamId || 'unknown',
    frameTimestamp;
timestamp,
    analysisType;
request.analysisType,
    findings,
    confidence;
this.calculateOverallConfidence(findings),
    processingTimeMs;
Date.now() - startTime,
    nextActionSuggestions;
this.generateActionSuggestions(request.analysisType, findings);
;
return result;
async;
runAnalysisByType(analysisType, string, frameData, any);
Promise < VisualFinding[] > {
    switch(analysisType) {
    },
    case: 'text-extraction',
    return: this.extractTextFromFrame(frameData),
    case: 'ui-analysis',
    return: this.analyzeUIElements(frameData),
    case: 'code-review',
    return: this.analyzeCodeInFrame(frameData),
    case: 'object-detection',
    return: this.detectObjects(frameData),
    case: 'visual-debug',
    return: this.analyzeVisualDebugging(frameData),
    default: ,
    return: this.performGeneralVisionAnalysis(frameData)
};
async;
extractTextFromFrame(frameData, any);
Promise < VisualFinding[] > {
    return: [{
            type: 'text',
            content: 'Simulated text extraction - would use OCR model',
            confidence: 0.85,
            boundingBox: { x: 100, y: 200, width: 300, height: 50 }
        }]
};
async;
analyzeUIElements(frameData, any);
Promise < VisualFinding[] > {
    return: [{
            type: 'ui-element',
            content: 'Button detected - "Submit" button in form',
            confidence: 0.92,
            boundingBox: { x: 400, y: 500, width: 120, height: 40 },
            metadata: { elementType: 'button', action: 'submit' }
        }]
};
async;
analyzeCodeInFrame(frameData, any);
Promise < VisualFinding[] > {
    return: [{
            type: 'code-snippet',
            content: 'TypeScript function with potential null reference issue',
            confidence: 0.78,
            boundingBox: { x: 50, y: 100, width: 600, height: 200 },
            metadata: { language: 'typescript', issue: 'null-reference' }
        }]
};
async;
detectObjects(frameData, any);
Promise < VisualFinding[] > {
    return: [{
            type: 'object',
            content: 'IDE window detected with multiple tabs open',
            confidence: 0.95,
            boundingBox: { x: 0, y: 0, width: 1920, height: 1080 },
            metadata: { objectClass: 'application-window', application: 'vscode' }
        }]
};
async;
analyzeVisualDebugging(frameData, any);
Promise < VisualFinding[] > {
    return: [{
            type: 'error-message',
            content: 'Error console showing TypeScript compilation error',
            confidence: 0.88,
            boundingBox: { x: 200, y: 800, width: 800, height: 100 },
            metadata: { errorType: 'compile-error', severity: 'high' }
        }]
};
async;
performGeneralVisionAnalysis(frameData, any);
Promise < VisualFinding[] > {
    return: [{
            type: 'object',
            content: 'General scene analysis - development environment detected',
            confidence: 0.82,
            metadata: { scene: 'development-workspace', applications: ['vscode', 'browser', 'terminal'] }
        }]
};
calculateOverallConfidence(findings, VisualFinding[]);
number;
{
    if (findings.length === 0)
        return 0;
    return findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length;
}
generateActionSuggestions(analysisType, string, findings, VisualFinding[]);
string[];
{
    const suggestions = [];
    switch (analysisType) {
        case 'code-review':
            suggestions.push('Consider adding null checks before property access');
            suggestions.push('Review error handling in the highlighted function');
            break;
        case 'visual-debug':
            suggestions.push('Focus on the error message in the console');
            suggestions.push('Check the file path and line number mentioned in error');
            break;
        case 'ui-analysis':
            suggestions.push('UI elements detected - ready for automated testing');
            suggestions.push('Consider accessibility improvements for detected buttons');
            break;
    }
    return suggestions;
}
getSupportedAnalysisTypes(sourceType, string);
string[];
{
    const baseTypes = ['object-detection', 'text-extraction', 'general-vision'];
    switch (sourceType) {
        case 'desktop':
            return [...baseTypes, 'ui-analysis', 'code-review', 'visual-debug'];
        case 'chrome-tab':
            return [...baseTypes, 'ui-analysis', 'text-extraction'];
        case 'application-window':
            return [...baseTypes, 'ui-analysis'];
        default:
            return baseTypes;
    }
}
// Public API methods for external integration
async;
getActiveStreams();
Promise < VideoStreamMetadata[] > {
    return: Array.from(this.activeStreams.values())
};
async;
getAgentSubscriptions(agentId, string);
Promise < string[] > {
    return: Array.from(this.agentSubscriptions.get(agentId) || [])
};
async;
requestImmediateAnalysis(streamId, string, analysisType, string, agentId, string);
Promise < string > {
    const: requestId = immediate_$
};
{
    agentId;
}
_$;
{
    streamId;
}
_$;
{
    Date.now();
}
;
const request = {
    id: requestId,
    agentId,
} `
      analysisType: analysisType as any,`;
priority: 'urgent', `
      responseChannel: agent.${agentId}.visual.immediate`,
    timeout;
10000;
;
await this.handleAnalysisRequest(request);
return requestId;
//# sourceMappingURL=WebRTCAgentBridge.js.map
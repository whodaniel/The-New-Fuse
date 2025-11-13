/**
 * Unified Integration Service
 *
 * Central service orchestrating all human-AI interactions with maximum cohesive synergy.
 * Provides seamless access to all system capabilities for both user types.
 */
import { EventEmitter } from 'events';
export type UserType = 'human' | 'ai_agent' | 'hybrid';
export type InterfaceMode = 'visual' | 'api' | 'natural_language' | 'collaborative';
export interface UnifiedRequest {
    id: string;
    userType: UserType;
    interfaceMode: InterfaceMode;
    intent: string;
    context: RequestContext;
    payload: any;
    metadata: {
        userId?: string;
        sessionId?: string;
        timestamp: Date;
        priority: 'low' | 'medium' | 'high' | 'critical';
        source: string;
    };
}
export interface RequestContext {
    conversationHistory?: any[];
    workflowContext?: any;
    taskContext?: any;
    userPreferences?: any;
    capabilities?: string[];
    constraints?: any;
}
export interface UnifiedResponse {
    requestId: string;
    success: boolean;
    data?: any;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metadata: {
        responseType: string;
        processingTime: number;
        resourcesUsed: string[];
        nextSuggestions?: any[];
    };
    presentation: {
        human?: HumanPresentationData;
        ai?: AIPresentationData;
        hybrid?: HybridPresentationData;
    };
}
export interface HumanPresentationData {
    visualComponents: ComponentSpecification[];
    naturalLanguage: {
        summary: string;
        details?: string;
        actionItems?: string[];
    };
    interactiveElements: InteractiveElement[];
    notifications?: NotificationData[];
}
export interface AIPresentationData {
    structuredData: any;
    executionInstructions?: ExecutionInstruction[];
    semanticMetadata: SemanticMetadata;
    followUpTasks?: TaskSpecification[];
}
export interface HybridPresentationData {
    collaborativeElements: CollaborativeElement[];
    sharedContext: SharedContextData;
    handoffInstructions?: HandoffInstruction[];
    synchronizationData: SyncData;
}
export interface ComponentSpecification {
    type: string;
    props: any;
    layout: LayoutSpecification;
    interactivity: InteractivitySpec;
}
export interface InteractiveElement {
    type: 'button' | 'form' | 'selector' | 'viewer';
    action: string;
    parameters?: any;
    validation?: ValidationRules;
}
export interface ExecutionInstruction {
    action: string;
    parameters: any;
    conditions?: any;
    timeout?: number;
}
export interface SemanticMetadata {
    ontology: string;
    concepts: string[];
    relationships: any[];
    confidence: number;
}
export interface TaskSpecification {
    id: string;
    type: string;
    description: string;
    parameters: any;
    dependencies?: string[];
    priority: number;
}
export interface CollaborativeElement {
    type: string;
    humanRole: string;
    aiRole: string;
    sharedState: any;
    conflictResolution?: ConflictResolutionStrategy;
}
export interface SharedContextData {
    state: any;
    history: any[];
    permissions: PermissionSet;
    synchronization: SyncConfiguration;
}
export interface HandoffInstruction {
    fromUserType: UserType;
    toUserType: UserType;
    context: any;
    requirements: string[];
    expectedOutcome: string;
}
export interface SyncData {
    version: number;
    lastModified: Date;
    conflicts?: ConflictData[];
    mergeStrategy: MergeStrategy;
}
export declare class UnifiedIntegrationService extends EventEmitter {
    private services;
    private adapters;
    private mediator;
    private contextBridge;
    private translator;
    constructor();
    /**
     * Initialize the unified integration service
     */
    initialize(): Promise<void>;
    /**
     * Process unified request with intelligent routing and adaptation
     */
    processRequest(request: UnifiedRequest): Promise<UnifiedResponse>;
    /**
     * Execute orchestration operations
     */
    private executeOrchestration;
    /**
     * Execute file protocol operations
     */
    private executeFileProtocol;
    /**
     * Execute handoff management operations
     */
    private executeHandoffManagement;
    /**
     * Generate appropriate presentation layers based on user type and interface mode
     */
    private generatePresentationLayers;
    /**
     * Generate error presentation for different user types
     */
    private generateErrorPresentation;
}
interface LayoutSpecification {
    position?: string;
    size?: string;
    responsive?: boolean;
}
interface InteractivitySpec {
    clickable?: boolean;
    draggable?: boolean;
    editable?: boolean;
    dismissible?: boolean;
}
interface ValidationRules {
    required?: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
}
interface ConflictResolutionStrategy {
    method: 'human_decides' | 'ai_decides' | 'merge' | 'fallback';
    parameters?: any;
}
interface PermissionSet {
    read?: boolean;
    write?: boolean;
    execute?: boolean;
    admin?: boolean;
}
interface SyncConfiguration {
    realTime?: boolean;
    conflictResolution?: string;
    version?: string;
}
interface ConflictData {
    field: string;
    humanValue: any;
    aiValue: any;
    timestamp: Date;
}
type MergeStrategy = 'latest_wins' | 'human_priority' | 'ai_priority' | 'manual_resolution';
interface NotificationData {
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    duration?: number;
}
export default UnifiedIntegrationService;
//# sourceMappingURL=UnifiedIntegrationService.d.ts.map
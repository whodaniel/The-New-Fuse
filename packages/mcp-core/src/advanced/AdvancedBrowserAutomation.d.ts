/**
 * Advanced Browser Automation System
 *
 * Provides sophisticated browser automation capabilities using Chrome DevTools Protocol (CDP),
 * intelligent element detection, multi-browser coordination, and advanced interaction patterns.
 */
import { EventEmitter } from 'events';
export declare namespace Protocol {
    namespace DOM {
        type NodeId = number;
    }
    namespace Page {
        interface CaptureScreenshotRequest {
            format?: 'png' | 'jpeg' | 'webp';
            quality?: number;
            captureBeyondViewport?: boolean;
        }
    }
}
export interface BrowserInstance {
    id: string;
    type: 'chrome' | 'firefox' | 'safari' | 'edge';
    version: string;
    debugPort: number;
    webSocketUrl: string;
    status: 'connected' | 'disconnected' | 'error';
    capabilities: string[];
    sessions: Map<string, BrowserSession>;
}
export interface BrowserSession {
    id: string;
    browserId: string;
    tabId: string;
    url: string;
    title: string;
    status: 'active' | 'loading' | 'idle' | 'error';
    context: Record<string, any>;
    automationHistory: AutomationAction[];
}
export interface AutomationAction {
    id: string;
    type: 'navigate' | 'click' | 'type' | 'scroll' | 'wait' | 'extract' | 'evaluate' | 'screenshot';
    target?: ElementSelector;
    parameters: Record<string, any>;
    timestamp: Date;
    duration: number;
    success: boolean;
    result?: any;
    error?: string;
}
export interface ElementSelector {
    strategy: 'css' | 'xpath' | 'text' | 'ai-vision' | 'smart-detection';
    value: string;
    confidence?: number;
    alternatives?: ElementSelector[];
}
export interface SmartDetectionConfig {
    enableAIVision: boolean;
    enableSemanticAnalysis: boolean;
    enableContextualUnderstanding: boolean;
    confidenceThreshold: number;
    fallbackStrategies: string[];
}
export interface AutomationWorkflow {
    id: string;
    name: string;
    description: string;
    steps: AutomationStep[];
    conditions: WorkflowCondition[];
    errorHandling: ErrorHandlingStrategy;
    parallelExecution: boolean;
    retryPolicy: RetryPolicy;
}
export interface AutomationStep {
    id: string;
    action: AutomationAction;
    conditions?: StepCondition[];
    timeout: number;
    optional: boolean;
    onSuccess?: string;
    onFailure?: string;
}
export interface WorkflowCondition {
    type: 'element-exists' | 'url-matches' | 'text-contains' | 'custom-script';
    parameters: Record<string, any>;
    required: boolean;
}
export interface StepCondition {
    type: 'wait-for-element' | 'wait-for-navigation' | 'wait-for-text' | 'wait-for-condition';
    parameters: Record<string, any>;
    timeout: number;
}
export interface ErrorHandlingStrategy {
    retryAttempts: number;
    retryDelay: number;
    fallbackActions: AutomationAction[];
    continueOnError: boolean;
    notificationLevel: 'none' | 'warning' | 'error' | 'critical';
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential' | 'custom';
    baseDelay: number;
    maxDelay: number;
    retryConditions: string[];
}
export declare class AdvancedBrowserAutomation extends EventEmitter {
    private config;
    private browsers;
    private activeSessions;
    private workflows;
    private cdpConnections;
    private smartDetectionConfig;
    constructor(config?: {
        enableMultiBrowser?: boolean;
        enableSmartDetection?: boolean;
        enableWorkflowEngine?: boolean;
        defaultTimeout?: number;
        maxConcurrentSessions?: number;
        screenshotPath?: string;
    });
    private initializeAutomationSystem;
    /**
     * Connect to a browser instance using CDP
     */
    connectToBrowser(type: 'chrome' | 'firefox' | 'safari' | 'edge', debugPort?: number): Promise<string>;
    /**
     * Create a new automation session
     */
    createSession(browserId: string, url?: string): Promise<string>;
    /**
     * Advanced element detection with multiple strategies
     */
    findElement(sessionId: string, selector: ElementSelector, options?: {
        timeout?: number;
        waitForVisible?: boolean;
        waitForInteractable?: boolean;
    }): Promise<Protocol.DOM.NodeId | null>;
    /**
     * Smart element detection using multiple strategies
     */
    private findElementWithSmartDetection;
    /**
     * Execute automation workflow
     */
    executeWorkflow(sessionId: string, workflowId: string, parameters?: Record<string, any>): Promise<{
        success: boolean;
        results: any[];
        errors: string[];
        duration: number;
    }>;
    /**
     * Advanced screenshot with element highlighting
     */
    takeAdvancedScreenshot(sessionId: string, options?: {
        fullPage?: boolean;
        highlightElements?: ElementSelector[];
        annotateElements?: boolean;
        quality?: number;
        format?: 'png' | 'jpeg' | 'webp';
    }): Promise<string>;
    /**
     * Multi-browser coordination
     */
    coordinateMultipleBrowsers(sessionIds: string[], coordination: {
        type: 'synchronized' | 'sequential' | 'parallel';
        actions: AutomationAction[];
        synchronizationPoints?: string[];
    }): Promise<Record<string, any>>;
    private discoverBrowsers;
    private getBrowserCapabilities;
    private establishCDPConnection;
    private sendCDPCommand;
    private handleCDPMessage;
    private findElementByCSS;
    private findElementByXPath;
    private findElementByText;
    private findElementByAIVision;
    private findElementBySemanticAnalysis;
    private isElementVisible;
    private isElementInteractable;
    private navigate;
    private sleep;
    private initializeWorkflowEngine;
    private initializeSmartDetection;
    private checkCondition;
    private executeStepsInParallel;
    private executeStepsSequentially;
    private executeActionsInSession;
    private highlightElements;
}
//# sourceMappingURL=AdvancedBrowserAutomation.d.ts.map
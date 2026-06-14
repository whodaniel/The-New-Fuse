export interface DOMSnapshot {
    url: string;
    title: string;
    timestamp: string;
    nodes: DOMNode[];
    metadata: {
        totalNodes: number;
        interactableCount: number;
        snapshotSizeBytes: number;
    };
}
export interface DOMNode {
    id: string;
    tagName: string;
    attributes: Record<string, string>;
    textContent: string;
    children: string[];
    interactable: boolean;
    rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    visibility: 'visible' | 'hidden' | 'zero-size' | 'off-screen';
}
export interface AgentAction {
    type: 'click' | 'type' | 'scroll' | 'select' | 'hover' | 'wait' | 'navigate';
    targetNodeId: string;
    value?: string;
    description: string;
    confidence: number;
}
export interface ActionResult {
    action: AgentAction;
    success: boolean;
    error?: string;
    snapshotBefore: string;
    snapshotAfter?: string;
    timestamp: string;
}
export declare class WebAgentDOMService {
    private readonly logger;
    private readonly snapshots;
    private readonly actionLog;
    minifySnapshot(snapshot: DOMSnapshot): DOMSnapshot;
    determineAction(snapshot: DOMSnapshot, goal: string): AgentAction;
    executeAction(action: AgentAction, snapshotId: string): ActionResult;
    storeSnapshot(snapshot: DOMSnapshot): string;
    getSnapshot(id: string): DOMSnapshot | undefined;
    getActionLog(): ActionResult[];
    clearHistory(): void;
}
//# sourceMappingURL=WebAgentDOMService.d.ts.map
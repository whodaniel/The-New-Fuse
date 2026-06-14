import { Page } from '@playwright/test';
import { BasePage } from './base.page';
export declare class WorkflowEditorPage extends BasePage {
    private readonly addNodeButton;
    private readonly nodeList;
    private readonly canvas;
    private readonly saveButton;
    private readonly runButton;
    constructor(page: Page);
    navigateToEditor(): Promise<void>;
    addNode(type: string): Promise<void>;
    connectNodes(sourceId: string, targetId: string): Promise<void>;
    saveWorkflow(): Promise<void>;
    runWorkflow(): Promise<void>;
    getNodeCount(): Promise<number>;
    getEdgeCount(): Promise<number>;
    isWorkflowValid(): Promise<boolean>;
}
//# sourceMappingURL=workflow-editor.page.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEditorPage = void 0;
const base_page_1 = require("./base.page");
class WorkflowEditorPage extends base_page_1.BasePage {
    constructor(page) {
        super(page);
        // Node and edge manipulation
        this.addNodeButton = 'button:has-text("Add Node")';
        this.nodeList = '[data-testid="node-list"]';
        this.canvas = '[data-testid="workflow-canvas"]';
        this.saveButton = 'button:has-text("Save")';
        this.runButton = 'button:has-text("Run")';
    }
    async navigateToEditor() {
        await this.navigate('/workflow/editor');
        await this.waitForLoad();
    }
    async addNode(type) {
        await this.waitAndClick(this.addNodeButton);
        await this.waitAndClick(`[data-node-type="${type}"]`);
    }
    async connectNodes(sourceId, targetId) {
        const sourceNode = this.page.locator(`[data-node-id="${sourceId}"]`);
        const targetNode = this.page.locator(`[data-node-id="${targetId}"]`);
        // Simulate drag and drop to connect nodes
        await sourceNode.hover();
        await this.page.mouse.down();
        const targetBounds = await targetNode.boundingBox();
        if (targetBounds) {
            await this.page.mouse.move(targetBounds.x + targetBounds.width / 2, targetBounds.y + targetBounds.height / 2);
        }
        await this.page.mouse.up();
    }
    async saveWorkflow() {
        await this.waitAndClick(this.saveButton);
        await this.waitForLoad();
    }
    async runWorkflow() {
        await this.waitAndClick(this.runButton);
        await this.waitForLoad();
    }
    async getNodeCount() {
        return this.page.locator('.react-flow__node').count();
    }
    async getEdgeCount() {
        return this.page.locator('.react-flow__edge').count();
    }
    async isWorkflowValid() {
        const errorNodes = await this.page.locator('.node-error').count();
        return errorNodes === 0;
    }
}
exports.WorkflowEditorPage = WorkflowEditorPage;
//# sourceMappingURL=workflow-editor.page.js.map
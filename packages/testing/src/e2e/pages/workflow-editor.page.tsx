import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page.js';

export class WorkflowEditorPage extends BasePage {
  // Node and edge manipulation
  private readonly addNodeButton = 'button:has-text("Add Node")';
  private readonly nodeList = '[data-testid="node-list"]';
  private readonly canvas = '[data-testid="workflow-canvas"]';
  private readonly saveButton = 'button:has-text("Save")';
  private readonly runButton = 'button:has-text("Run")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToEditor() {
    await this.navigate('/workflow/editor');
    await this.waitForLoad();
  }

  async addNode(type: string) {
    await this.waitAndClick(this.addNodeButton);
    await this.waitAndClick(`[data-node-type="${type}"]`);
  }

  async connectNodes(sourceId: string, targetId: string) {
    const sourceNode = this.page.locator(`[data-node-id="${sourceId}"]`);
    const targetNode = this.page.locator(`[data-node-id="${targetId}"]`);
    
    // Simulate drag and drop to connect nodes
    await sourceNode.hover();
    await this.page.mouse.down();
    const targetBounds = await targetNode.boundingBox();
    if (targetBounds) {
      await this.page.mouse.move(
        targetBounds.x + targetBounds.width / 2,
        targetBounds.y + targetBounds.height / 2
      );
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

  async getNodeCount(): Promise<number> {
    return this.page.locator('.react-flow__node').count();
  }

  async getEdgeCount(): Promise<number> {
    return this.page.locator('.react-flow__edge').count();
  }

  async isWorkflowValid(): Promise<boolean> {
    const errorNodes = await this.page.locator('.node-error').count();
    return errorNodes === 0;
  }
}
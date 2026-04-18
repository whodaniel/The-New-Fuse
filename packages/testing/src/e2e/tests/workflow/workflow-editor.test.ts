import { test, expect } from '../../fixtures/test.fixture.js';
import { WorkflowEditorPage } from '../../pages/workflow-editor.page.js';

test.describe('Workflow Editor', () => {
  let workflowEditor: WorkflowEditorPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    workflowEditor = new WorkflowEditorPage(authenticatedPage);
    await workflowEditor.navigateToEditor();
  });

  test('should create a new workflow with connected nodes', async () => {
    // Add source and target nodes
    await workflowEditor.addNode('source');
    await workflowEditor.addNode('target');
    
    // Verify nodes were added
    expect(await workflowEditor.getNodeCount()).toBe(2);
    
    // Connect nodes
    await workflowEditor.connectNodes('node-1', 'node-2');
    
    // Verify edge was created
    expect(await workflowEditor.getEdgeCount()).toBe(1);
    
    // Save workflow
    await workflowEditor.saveWorkflow();
    
    // Verify workflow is valid
    expect(await workflowEditor.isWorkflowValid()).toBeTruthy();
  });

  test('should run a valid workflow', async () => {
    // Create a simple workflow
    await workflowEditor.addNode('source');
    await workflowEditor.addNode('processor');
    await workflowEditor.connectNodes('node-1', 'node-2');
    await workflowEditor.saveWorkflow();
    
    // Run the workflow
    await workflowEditor.runWorkflow();
    
    // Wait for execution to complete and verify
    await expect(async () => {
      const isValid = await workflowEditor.isWorkflowValid();
      expect(isValid).toBeTruthy();
    }).toPass();
  });

  test('should handle invalid workflow configurations', async () => {
    // Add disconnected nodes
    await workflowEditor.addNode('source');
    await workflowEditor.addNode('target');
    
    // Try to save (should show validation errors)
    await workflowEditor.saveWorkflow();
    
    // Verify workflow is invalid
    expect(await workflowEditor.isWorkflowValid()).toBeFalsy();
  });
});
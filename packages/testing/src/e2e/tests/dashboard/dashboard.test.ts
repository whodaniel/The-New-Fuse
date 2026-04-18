import { test, expect } from '../../fixtures/test.fixture.js';
import { DashboardPage } from '../../pages/dashboard.page.js';
import { WorkflowEditorPage } from '../../pages/workflow-editor.page.js';

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;
  let workflowEditor: WorkflowEditorPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    workflowEditor = new WorkflowEditorPage(authenticatedPage);
    await dashboardPage.navigateToDashboard();
  });

  test('should load dashboard successfully', async () => {
    expect(await dashboardPage.isDashboardLoaded()).toBeTruthy();
  });

  test('should create new workflow', async () => {
    const initialCount = await dashboardPage.getWorkflowCount();
    await dashboardPage.createNewWorkflow();
    
    // Should navigate to workflow editor
    const url = await workflowEditor.getCurrentUrl();
    expect(url).toContain('/workflow/editor');
    
    // Add a simple workflow
    await workflowEditor.addNode('source');
    await workflowEditor.addNode('target');
    await workflowEditor.saveWorkflow();
    
    // Return to dashboard
    await dashboardPage.navigateToDashboard();
    const newCount = await dashboardPage.getWorkflowCount();
    expect(newCount).toBe(initialCount + 1);
  });

  test('should filter workflows by status', async () => {
    // Create a completed workflow first
    await dashboardPage.createNewWorkflow();
    await workflowEditor.addNode('source');
    await workflowEditor.addNode('target');
    await workflowEditor.saveWorkflow();
    await workflowEditor.runWorkflow();
    await dashboardPage.navigateToDashboard();
    
    // Filter by completed
    await dashboardPage.filterWorkflows('completed');
    const completedWorkflows = await dashboardPage.getWorkflowCount();
    expect(completedWorkflows).toBeGreaterThan(0);
    
    // Filter by failed
    await dashboardPage.filterWorkflows('failed');
    const failedWorkflows = await dashboardPage.getWorkflowCount();
    expect(failedWorkflows).toBe(0);
  });

  test('should search workflows', async () => {
    const testName = `Test-${Date.now()}`;
    
    // Create workflow with unique name
    await dashboardPage.createNewWorkflow();
    await workflowEditor.addNode('source');
    await workflowEditor.saveWorkflow();
    await dashboardPage.navigateToDashboard();
    
    // Search for the workflow
    await dashboardPage.searchWorkflows(testName);
    const results = await dashboardPage.getWorkflowCount();
    expect(results).toBe(1);
  });

  test('should open existing workflow', async () => {
    // Create a workflow first
    await dashboardPage.createNewWorkflow();
    await workflowEditor.addNode('source');
    await workflowEditor.saveWorkflow();
    const workflowName = 'Test Workflow';
    
    // Return to dashboard and open workflow
    await dashboardPage.navigateToDashboard();
    await dashboardPage.openWorkflow(workflowName);
    
    // Verify we're in the editor
    const url = await workflowEditor.getCurrentUrl();
    expect(url).toContain('/workflow/editor');
    expect(await workflowEditor.getNodeCount()).toBe(1);
  });
});
import { test } from '../../fixtures/test.fixture.js'; // Corrected import path
import { VisualTesting } from '../../utils/visual-testing.js';

test.describe('Visual Regression Tests - UI Components', () => {
  let visualTesting: VisualTesting;

  test.beforeEach(async ({ authenticatedPage }) => {
    visualTesting = new VisualTesting(authenticatedPage, test.info());
  });

  test('dashboard layout should match baseline', async ({ dashboardPage }) => {
    await dashboardPage.navigateToDashboard();
    await visualTesting.compareFullPage('dashboard');
    
    // Test responsive layouts
    await visualTesting.compareResponsive('dashboard-responsive');
  });

  test('workflow editor components should match baseline', async ({ workflowEditor }) => {
    await workflowEditor.navigateToEditor();
    
    // Test main editor components
    await visualTesting.compareElement('[data-testid="workflow-canvas"]', 'workflow-canvas');
    await visualTesting.compareElement('[data-testid="node-list"]', 'node-list');
    await visualTesting.compareElement('[data-testid="workflow-toolbar"]', 'workflow-toolbar');
    
    // Test node interactions
    await workflowEditor.addNode('source');
    await visualTesting.compareElement('[data-node-type="source"]', 'source-node');
  });

  test('settings panel components should match baseline', async ({ settingsPage }) => {
    await settingsPage.navigateToSettings();
    
    // Test each settings tab
    const tabs = ['profile', 'workflow', 'security', 'notifications'] as const;
    
    for (const tab of tabs) {
      await settingsPage.switchToTab(tab);
      await visualTesting.compareFullPage(`settings-${tab}`);
    }
  });

  test('interactive elements should maintain visual consistency', async ({ dashboardPage }) => {
    await dashboardPage.navigateToDashboard();
    
    // Test button states
    await visualTesting.captureInteractionStates(
      '[data-testid="create-workflow-btn"]',
      'create-workflow-button'
    );
    
    // Test navigation menu items
    await visualTesting.captureInteractionStates(
      '[data-testid="nav-menu"] [data-section="workflows"]',
      'nav-menu-item'
    );
  });

  test('workflow list items should match baseline', async ({ dashboardPage, testHelpers }) => {
    // Create test workflows with different states
    await testHelpers.createTestWorkflowData({ status: 'active' });
    await testHelpers.createTestWorkflowData({ status: 'completed' });
    await testHelpers.createTestWorkflowData({ status: 'failed' });
    
    await dashboardPage.navigateToDashboard();
    
    // Test workflow list items in different states
    await visualTesting.compareElement('[data-testid="workflow-list"]', 'workflow-list');
    await visualTesting.compareElement('[data-status="active"]', 'workflow-active');
    await visualTesting.compareElement('[data-status="completed"]', 'workflow-completed');
    await visualTesting.compareElement('[data-status="failed"]', 'workflow-failed');
  });

  test('modal dialogs should match baseline', async ({ workflowEditor }) => {
    await workflowEditor.navigateToEditor();
    
    // Open and test save dialog
    await workflowEditor.saveWorkflow();
    await visualTesting.compareElement('[data-testid="save-dialog"]', 'save-dialog');
    
    // Test dialog responsive behavior
    await visualTesting.compareResponsive('save-dialog-responsive');
  });
});
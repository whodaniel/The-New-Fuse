"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_fixture_1 = require("../../fixtures/test.fixture"); // Corrected import path
const visual_testing_1 = require("../../utils/visual-testing");
test_fixture_1.test.describe('Visual Regression Tests - UI Components', () => {
    let visualTesting;
    test_fixture_1.test.beforeEach(async ({ authenticatedPage }) => {
        visualTesting = new visual_testing_1.VisualTesting(authenticatedPage, test_fixture_1.test.info());
    });
    (0, test_fixture_1.test)('dashboard layout should match baseline', async ({ dashboardPage }) => {
        await dashboardPage.navigateToDashboard();
        await visualTesting.compareFullPage('dashboard');
        // Test responsive layouts
        await visualTesting.compareResponsive('dashboard-responsive');
    });
    (0, test_fixture_1.test)('workflow editor components should match baseline', async ({ workflowEditorPage }) => {
        await workflowEditorPage.navigateToEditor();
        // Test main editor components
        await visualTesting.compareElement('[data-testid="workflow-canvas"]', 'workflow-canvas');
        await visualTesting.compareElement('[data-testid="node-list"]', 'node-list');
        await visualTesting.compareElement('[data-testid="workflow-toolbar"]', 'workflow-toolbar');
        // Test node interactions
        await workflowEditorPage.addNode('source');
        await visualTesting.compareElement('[data-node-type="source"]', 'source-node');
    });
    (0, test_fixture_1.test)('settings panel components should match baseline', async ({ settingsPage }) => {
        await settingsPage.navigateToSettings();
        // Test each settings tab
        const tabs = ['profile', 'workflow', 'security', 'notifications'];
        for (const tab of tabs) {
            await settingsPage.switchToTab(tab);
            await visualTesting.compareFullPage(`settings-${tab}`);
        }
    });
    (0, test_fixture_1.test)('interactive elements should maintain visual consistency', async ({ dashboardPage }) => {
        await dashboardPage.navigateToDashboard();
        // Test button states
        await visualTesting.captureInteractionStates('[data-testid="create-workflow-btn"]', 'create-workflow-button');
        // Test navigation menu items
        await visualTesting.captureInteractionStates('[data-testid="nav-menu"] [data-section="workflows"]', 'nav-menu-item');
    });
    (0, test_fixture_1.test)('workflow list items should match baseline', async ({ dashboardPage, testHelpers }) => {
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
    (0, test_fixture_1.test)('modal dialogs should match baseline', async ({ workflowEditorPage }) => {
        await workflowEditorPage.navigateToEditor();
        // Open and test save dialog
        await workflowEditorPage.saveWorkflow();
        await visualTesting.compareElement('[data-testid="save-dialog"]', 'save-dialog');
        // Test dialog responsive behavior
        await visualTesting.compareResponsive('save-dialog-responsive');
    });
});
//# sourceMappingURL=ui-components.visual.js.map
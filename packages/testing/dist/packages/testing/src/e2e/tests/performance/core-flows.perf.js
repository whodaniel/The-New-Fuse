"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const custom_test_1 = require("../../fixtures/custom-test");
const perf_hooks_1 = require("perf_hooks");
custom_test_1.test.describe('Performance Tests - Core Flows', () => {
    const PERFORMANCE_THRESHOLDS = {
        pageLoad: 3000,
        workflowCreation: 5000,
        workflowExecution: 8000,
        navigation: 1000
    };
    (0, custom_test_1.test)('dashboard load performance', async ({ dashboardPage, testReporter }) => {
        const startTime = perf_hooks_1.performance.now();
        await dashboardPage.navigateToDashboard();
        const loadTime = perf_hooks_1.performance.now() - startTime;
        const metrics = await testReporter.capturePerformanceMetrics();
        (0, custom_test_1.expect)(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
        (0, custom_test_1.expect)(metrics.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
        // Log metrics for CI analysis
        console.log('Dashboard Load Metrics:', metrics);
    });
    (0, custom_test_1.test)('workflow creation performance', async ({ workflowEditor, testReporter }) => {
        const startTime = perf_hooks_1.performance.now();
        await workflowEditor.navigateToEditor();
        await workflowEditor.addNode('source');
        await workflowEditor.addNode('processor');
        await workflowEditor.addNode('target');
        await workflowEditor.connectNodes('node-1', 'node-2');
        await workflowEditor.connectNodes('node-2', 'node-3');
        await workflowEditor.saveWorkflow();
        const totalTime = perf_hooks_1.performance.now() - startTime;
        (0, custom_test_1.expect)(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.workflowCreation);
        const metrics = await testReporter.capturePerformanceMetrics();
        console.log('Workflow Creation Metrics:', {
            totalTime,
            resourceCount: metrics.resourceCount
        });
    });
    (0, custom_test_1.test)('workflow execution performance', async ({ workflowEditor, testReporter }) => {
        // Create a test workflow
        await workflowEditor.navigateToEditor();
        await workflowEditor.addNode('source');
        await workflowEditor.addNode('target');
        await workflowEditor.connectNodes('node-1', 'node-2');
        await workflowEditor.saveWorkflow();
        // Measure execution time
        const startTime = perf_hooks_1.performance.now();
        await workflowEditor.runWorkflow();
        const executionTime = perf_hooks_1.performance.now() - startTime;
        (0, custom_test_1.expect)(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.workflowExecution);
        // Log execution metrics
        console.log('Workflow Execution Time:', executionTime);
    });
    (0, custom_test_1.test)('navigation performance', async ({ navigationUtils, testReporter }) => {
        const sections = ['dashboard', 'workflows', 'settings', 'analytics'];
        const navigationTimes = {};
        for (const section of sections) {
            const startTime = perf_hooks_1.performance.now();
            await navigationUtils.navigateToSection(section);
            navigationTimes[section] = perf_hooks_1.performance.now() - startTime;
            (0, custom_test_1.expect)(navigationTimes[section]).toBeLessThan(PERFORMANCE_THRESHOLDS.navigation);
        }
        // Log navigation metrics
        console.log('Navigation Times:', navigationTimes);
    });
    (0, custom_test_1.test)('workflow list rendering performance', async ({ dashboardPage, testHelpers, testReporter }) => {
        // Create multiple test workflows
        const workflowCount = 20;
        for (let i = 0; i < workflowCount; i++) {
            await testHelpers.createTestWorkflowData({
                name: `Performance Test Workflow ${i}`,
                nodeCount: 3
            });
        }
        // Measure list rendering time
        const startTime = perf_hooks_1.performance.now();
        await dashboardPage.navigateToDashboard();
        const renderTime = perf_hooks_1.performance.now() - startTime;
        // Verify workflow count and render time
        const count = await dashboardPage.getWorkflowCount();
        (0, custom_test_1.expect)(count).toBe(workflowCount);
        (0, custom_test_1.expect)(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
        // Log metrics
        const metrics = await testReporter.capturePerformanceMetrics();
        console.log('Workflow List Render Metrics:', {
            renderTime,
            workflowCount,
            ...metrics
        });
    });
});
//# sourceMappingURL=core-flows.perf.js.map
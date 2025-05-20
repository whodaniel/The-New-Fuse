import { test, expect } from '../../fixtures/custom-test.js';
import { performance } from 'perf_hooks';

test.describe('Performance Tests - Core Flows', () => {
  const PERFORMANCE_THRESHOLDS = {
    pageLoad: 3000,
    workflowCreation: 5000,
    workflowExecution: 8000,
    navigation: 1000
  };

  test('dashboard load performance', async ({ dashboardPage, testReporter }) => {
    const startTime = performance.now();
    await dashboardPage.navigateToDashboard();
    const loadTime = performance.now() - startTime;

    const metrics = await testReporter.capturePerformanceMetrics();
    
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    expect(metrics.domContentLoaded).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    
    // Log metrics for CI analysis
    console.log('Dashboard Load Metrics:', metrics);
  });

  test('workflow creation performance', async ({ workflowEditor, testReporter }) => {
    const startTime = performance.now();
    
    await workflowEditor.navigateToEditor();
    await workflowEditor.addNode('source');
    await workflowEditor.addNode('processor');
    await workflowEditor.addNode('target');
    await workflowEditor.connectNodes('node-1', 'node-2');
    await workflowEditor.connectNodes('node-2', 'node-3');
    await workflowEditor.saveWorkflow();
    
    const totalTime = performance.now() - startTime;
    
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.workflowCreation);
    
    const metrics = await testReporter.capturePerformanceMetrics();
    console.log('Workflow Creation Metrics:', {
      totalTime,
      resourceCount: metrics.resourceCount
    });
  });

  test('workflow execution performance', async ({ workflowEditor, testReporter }) => {
    // Create a test workflow
    await workflowEditor.navigateToEditor();
    await workflowEditor.addNode('source');
    await workflowEditor.addNode('target');
    await workflowEditor.connectNodes('node-1', 'node-2');
    await workflowEditor.saveWorkflow();
    
    // Measure execution time
    const startTime = performance.now();
    await workflowEditor.runWorkflow();
    const executionTime = performance.now() - startTime;
    
    expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.workflowExecution);
    
    // Log execution metrics
    console.log('Workflow Execution Time:', executionTime);
  });

  test('navigation performance', async ({ navigationUtils, testReporter }) => {
    const sections = ['dashboard', 'workflows', 'settings', 'analytics'] as const;
    const navigationTimes: Record<string, number> = {};
    
    for (const section of sections) {
      const startTime = performance.now();
      await navigationUtils.navigateToSection(section);
      navigationTimes[section] = performance.now() - startTime;
      
      expect(navigationTimes[section]).toBeLessThan(
        PERFORMANCE_THRESHOLDS.navigation,
        `Navigation to ${section} took too long`
      );
    }
    
    // Log navigation metrics
    console.log('Navigation Times:', navigationTimes);
  });

  test('workflow list rendering performance', async ({ dashboardPage, testHelpers, testReporter }) => {
    // Create multiple test workflows
    const workflowCount = 20;
    for (let i = 0; i < workflowCount; i++) {
      await testHelpers.createTestWorkflowData({
        name: `Performance Test Workflow ${i}`,
        nodeCount: 3
      });
    }
    
    // Measure list rendering time
    const startTime = performance.now();
    await dashboardPage.navigateToDashboard();
    const renderTime = performance.now() - startTime;
    
    // Verify workflow count and render time
    const count = await dashboardPage.getWorkflowCount();
    expect(count).toBe(workflowCount);
    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    
    // Log metrics
    const metrics = await testReporter.capturePerformanceMetrics();
    console.log('Workflow List Render Metrics:', {
      renderTime,
      workflowCount,
      ...metrics
    });
  });
});
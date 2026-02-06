/**
 * Integration Tests for PromptHandoffFlywheel
 *
 * Tests the complete handoff system integration with existing services
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictManager } from '../services/ConflictManager';
import { MasterClockService } from '../services/MasterClockService';
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { EnhancedAgentHandoffTemplateService } from './EnhancedAgentHandoffTemplateService';
import { PromptHandoffFlywheel } from './PromptHandoffFlywheel';
import { PromptTemplateIntegration } from './PromptTemplateIntegration';
const vi = jest;

describe('PromptHandoffFlywheel Integration', () => {
  let flywheel: PromptHandoffFlywheel;
  let handoffService: EnhancedAgentHandoffTemplateService;
  let integration: PromptTemplateIntegration;
  let syncOrchestrator: SyncOrchestrator;
  let masterClock: MasterClockService;
  let conflictManager: ConflictManager;

  beforeEach(async () => {
    // Initialize real services for integration testing
    // Note: In a real environment, these would connect to actual Redis/DB
    syncOrchestrator = new SyncOrchestrator({} as any, {} as any, {} as any);
    masterClock = new MasterClockService({} as any, {} as any);
    conflictManager = new ConflictManager({} as any, {} as any);

    flywheel = new PromptHandoffFlywheel(syncOrchestrator, masterClock, conflictManager);

    handoffService = new EnhancedAgentHandoffTemplateService(
      flywheel,
      syncOrchestrator,
      masterClock
    );

    // Mock prompt template service for integration
    const mockPromptTemplateService = {
      createTemplate: async (template: any) => ({
        id: `template_${Date.now()}`,
        ...template,
        currentVersion: 'v1',
        versions: [],
      }),
      getTemplate: async (id: string) => ({
        id,
        name: 'Mock Template',
        content: 'Mock content',
        variables: {},
        updatedAt: new Date(),
      }),
      updateTemplate: async (id: string, updates: any) => ({ id, ...updates }),
      getTemplateAnalytics: async (id: string) => ({
        totalRuns: 10,
        successRate: 95,
      }),
      recordExecution: async (result: any) => {},
      createVersion: async (templateId: string, version: any) => ({
        id: `version_${Date.now()}`,
        ...version,
      }),
      setActiveVersion: async (templateId: string, versionId: string) => ({}),
    };

    integration = new PromptTemplateIntegration(
      handoffService,
      flywheel,
      syncOrchestrator,
      mockPromptTemplateService as any
    );
  });

  describe('End-to-End Handoff Flow', () => {
    it('should complete full handoff workflow with context preservation', async () => {
      // Step 1: Create enhanced handoff template
      const templateId = await handoffService.createEnhancedHandoffTemplate({
        name: 'Integration Test Template',
        description: 'Template for integration testing',
        version: '1.0.0',
        content: `# Handoff Task
        
Task: {{task_description}}
Context: {{execution_history}}
Agent: {{agent_id}}

Please continue with full context awareness.`,
        variables: {
          task_description: 'Complete the integration test',
          agent_id: 'test-agent',
        },
        contextRequirements: ['task_description', 'execution_history'],
        agentCapabilities: ['general', 'testing'],
        successCriteria: ['task_completed', 'context_preserved'],
        backpressureThreshold: 5,
        loadBalancingWeight: 1.0,
        integrationMetadata: {
          syncEnabled: true,
          conflictResolution: 'merge',
        },
      });

      expect(templateId).toBeDefined();

      // Step 2: Register agents
      await flywheel.registerAgent('agent-1', ['general', 'testing']);
      await flywheel.registerAgent('agent-2', ['general', 'testing']);

      // Step 3: Initiate handoff session
      const sessionId = await handoffService.initiateHandoffSession(
        'agent-1',
        templateId,
        {
          task_description: 'Integration test task',
          context_data: 'Initial context from agent-1',
        },
        {
          preserveContext: true,
          memoryIntegration: true,
          targetAgentId: 'agent-2',
        }
      );

      expect(sessionId).toBeDefined();

      // Step 4: Verify session creation
      const session = await handoffService.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.agentId).toBe('agent-1');
      expect(session?.templateId).toBe(templateId);
      expect(session?.status).toBe('active');

      // Step 5: Verify context creation
      expect(session?.contexts).toHaveLength(1);
      const context = session?.contexts[0];
      expect(context?.sourceAgentId).toBe('agent-1');
      expect(context?.targetAgentId).toBe('agent-2');
      expect(context?.variables).toMatchObject({
        task_description: 'Integration test task',
        context_data: 'Initial context from agent-1',
      });
    });

    it('should handle template integration with existing service', async () => {
      // Step 1: Create handoff template
      const templateId = await handoffService.createEnhancedHandoffTemplate({
        name: 'Integrated Template',
        description: 'Template with base integration',
        version: '1.0.0',
        content: 'Integrated content: {{message}}',
        variables: { message: 'Hello from integration' },
        contextRequirements: ['message'],
        agentCapabilities: ['general'],
        successCriteria: ['integration_success'],
        backpressureThreshold: 10,
        loadBalancingWeight: 1.0,
        integrationMetadata: {
          syncEnabled: true,
          conflictResolution: 'merge',
        },
      });

      // Step 2: Integrate with base template service
      const integrationId = await integration.integrateTemplate(templateId, {
        createBaseTemplate: true,
        autoSync: true,
        conflictResolution: 'merge',
      });

      expect(integrationId).toBe(templateId);

      // Step 3: Verify integration
      const integratedTemplate = await integration.getIntegratedTemplate(templateId);
      expect(integratedTemplate).toBeDefined();
      expect(integratedTemplate?.syncStatus).toBe('synced');
      expect(integratedTemplate?.baseTemplate).toBeDefined();

      // Step 4: Execute integrated template
      const result = await integration.executeIntegratedTemplate(
        templateId,
        { message: 'Integration test message' },
        { executionType: 'handoff', targetAgentId: 'agent-1' }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.executionType).toBe('handoff');
    });
  });

  describe('Load Balancing and Backpressure Integration', () => {
    it('should distribute load across multiple agents', async () => {
      // Register multiple agents with different capabilities
      await flywheel.registerAgent('agent-1', ['general']);
      await flywheel.registerAgent('agent-2', ['general']);
      await flywheel.registerAgent('agent-3', ['specialized']);

      // Set different load levels
      await flywheel.updateAgentStatus('agent-1', 'available', 20);
      await flywheel.updateAgentStatus('agent-2', 'available', 80);
      await flywheel.updateAgentStatus('agent-3', 'available', 30);

      // Create template requiring general capability
      const templateId = await handoffService.createEnhancedHandoffTemplate({
        name: 'Load Balance Test',
        description: 'Template for load balancing test',
        version: '1.0.0',
        content: 'Task: {{task}}',
        variables: { task: 'load balance test' },
        contextRequirements: [],
        agentCapabilities: ['general'],
        successCriteria: [],
        backpressureThreshold: 3,
        loadBalancingWeight: 1.0,
        integrationMetadata: {
          syncEnabled: true,
          conflictResolution: 'latest',
        },
      });

      // Get optimal target (should be agent-1 with lowest load)
      const optimalTarget = await handoffService.getOptimalHandoffTarget(
        templateId,
        { 'agent-1': 20, 'agent-2': 80, 'agent-3': 30 },
        {
          'agent-1': ['general'],
          'agent-2': ['general'],
          'agent-3': ['specialized'],
        }
      );

      expect(optimalTarget).toBe('agent-1');
    });

    it('should apply backpressure when agents are overloaded', async () => {
      // Create template with low backpressure threshold
      const templateId = await handoffService.createEnhancedHandoffTemplate({
        name: 'Backpressure Test',
        description: 'Template for backpressure testing',
        version: '1.0.0',
        content: 'Task: {{task}}',
        variables: { task: 'backpressure test' },
        contextRequirements: [],
        agentCapabilities: ['general'],
        successCriteria: [],
        backpressureThreshold: 1, // Very low threshold
        loadBalancingWeight: 1.0,
        integrationMetadata: {
          syncEnabled: true,
          conflictResolution: 'latest',
        },
      });

      // Register agent with high load
      await flywheel.registerAgent('agent-1', ['general']);
      await flywheel.updateAgentStatus('agent-1', 'available', 90);

      // Should return null due to backpressure
      const optimalTarget = await handoffService.getOptimalHandoffTarget(
        templateId,
        { 'agent-1': 90 },
        { 'agent-1': ['general'] }
      );

      expect(optimalTarget).toBeNull();
    });
  });

  describe('Analytics and Metrics Integration', () => {
    it('should collect and aggregate metrics across systems', async () => {
      const templateId = await handoffService.createEnhancedHandoffTemplate({
        name: 'Metrics Test Template',
        description: 'Template for metrics testing',
        version: '1.0.0',
        content: 'Metrics test: {{data}}',
        variables: { data: 'test data' },
        contextRequirements: ['data'],
        agentCapabilities: ['general'],
        successCriteria: ['metrics_collected'],
        backpressureThreshold: 10,
        loadBalancingWeight: 1.0,
        integrationMetadata: {
          syncEnabled: true,
          conflictResolution: 'merge',
        },
      });

      // Integrate with base template service
      await integration.integrateTemplate(templateId, {
        createBaseTemplate: true,
        autoSync: true,
      });

      // Execute multiple times to generate metrics
      for (let i = 0; i < 5; i++) {
        await integration.executeIntegratedTemplate(
          templateId,
          { data: `test data ${i}` },
          { executionType: i % 2 === 0 ? 'handoff' : 'direct' }
        );
      }

      // Get integrated analytics
      const analytics = await integration.getIntegratedAnalytics(templateId);

      expect(analytics).toBeDefined();
      expect(analytics.combinedMetrics.totalExecutions).toBe(5);
      expect(analytics.combinedMetrics.handoffExecutions).toBe(3);
      expect(analytics.combinedMetrics.directExecutions).toBe(2);
    });

    it('should generate comprehensive handoff reports', async () => {
      const templateId = await handoffService.createEnhancedHandoffTemplate({
        name: 'Report Test Template',
        description: 'Template for report generation',
        version: '1.0.0',
        content: 'Report test: {{task}}',
        variables: { task: 'generate report' },
        contextRequirements: ['task'],
        agentCapabilities: ['reporting'],
        successCriteria: ['report_generated'],
        backpressureThreshold: 5,
        loadBalancingWeight: 1.0,
        integrationMetadata: {
          syncEnabled: true,
          conflictResolution: 'merge',
        },
      });

      // Create some sessions
      const sessionId1 = await handoffService.initiateHandoffSession('agent-1', templateId, {
        task: 'report task 1',
      });

      const sessionId2 = await handoffService.initiateHandoffSession('agent-2', templateId, {
        task: 'report task 2',
      });

      // Generate report
      const report = await handoffService.generateHandoffReport(templateId, {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        end: new Date(),
      });

      expect(report).toBeDefined();
      expect(report.template.id).toBe(templateId);
      expect(report.sessions).toHaveLength(2);
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle template sync conflicts gracefully', async () => {
      const templateId = await handoffService.createEnhancedHandoffTemplate({
        name: 'Conflict Test Template',
        description: 'Template for conflict testing',
        version: '1.0.0',
        content: 'Original content',
        variables: { test: 'original' },
        contextRequirements: [],
        agentCapabilities: ['general'],
        successCriteria: [],
        backpressureThreshold: 10,
        loadBalancingWeight: 1.0,
        integrationMetadata: {
          syncEnabled: true,
          conflictResolution: 'merge',
        },
      });

      // Integrate template
      await integration.integrateTemplate(templateId);

      // Simulate conflict by updating both templates differently
      await handoffService.updateHandoffTemplate(templateId, {
        content: 'Handoff updated content',
      });

      // Resolve conflict with merge strategy
      await integration.resolveTemplateConflict(templateId, 'merge');

      const integratedTemplate = await integration.getIntegratedTemplate(templateId);
      expect(integratedTemplate?.syncStatus).toBe('synced');
    });

    it('should recover from agent failures during handoff', async () => {
      const templateId = await handoffService.createEnhancedHandoffTemplate({
        name: 'Failure Recovery Test',
        description: 'Template for failure recovery testing',
        version: '1.0.0',
        content: 'Recovery test: {{task}}',
        variables: { task: 'test recovery' },
        contextRequirements: ['task'],
        agentCapabilities: ['general'],
        successCriteria: ['recovery_successful'],
        backpressureThreshold: 10,
        loadBalancingWeight: 1.0,
        integrationMetadata: {
          syncEnabled: true,
          conflictResolution: 'latest',
        },
      });

      // Register agents
      await flywheel.registerAgent('agent-1', ['general']);
      await flywheel.registerAgent('agent-2', ['general']);

      // Start handoff session
      const sessionId = await handoffService.initiateHandoffSession(
        'agent-1',
        templateId,
        { task: 'recovery test task' },
        { targetAgentId: 'agent-1' }
      );

      // Simulate agent failure by setting status to error
      await flywheel.updateAgentStatus('agent-1', 'error');

      // System should handle the failure gracefully
      const session = await handoffService.getSession(sessionId);
      expect(session).toBeDefined();

      // The system should either retry or reassign to another agent
      // This would be handled by the flywheel's error handling mechanisms
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent handoffs efficiently', async () => {
      const templateId = await handoffService.createEnhancedHandoffTemplate({
        name: 'Concurrent Test Template',
        description: 'Template for concurrency testing',
        version: '1.0.0',
        content: 'Concurrent task: {{task_id}}',
        variables: { task_id: 'concurrent_test' },
        contextRequirements: ['task_id'],
        agentCapabilities: ['general'],
        successCriteria: ['concurrency_handled'],
        backpressureThreshold: 20,
        loadBalancingWeight: 1.0,
        integrationMetadata: {
          syncEnabled: true,
          conflictResolution: 'latest',
        },
      });

      // Register multiple agents
      for (let i = 1; i <= 5; i++) {
        await flywheel.registerAgent(`agent-${i}`, ['general']);
      }

      // Start multiple concurrent handoff sessions
      const sessionPromises = [];
      for (let i = 1; i <= 10; i++) {
        sessionPromises.push(
          handoffService.initiateHandoffSession(`agent-${(i % 5) + 1}`, templateId, {
            task_id: `concurrent_task_${i}`,
          })
        );
      }

      const sessionIds = await Promise.all(sessionPromises);

      expect(sessionIds).toHaveLength(10);
      expect(sessionIds.every((id) => typeof id === 'string')).toBe(true);

      // Verify all sessions were created
      const sessions = await Promise.all(sessionIds.map((id) => handoffService.getSession(id)));

      expect(sessions.every((session) => session !== null)).toBe(true);
    });
  });
});

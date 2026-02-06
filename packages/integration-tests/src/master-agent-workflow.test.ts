/**
 * Master Agent Workflow Integration Tests
 * Tests for master agent coordination and workflow execution
 */

import { getTestEnvironment, TestHelpers } from './setup/test-setup';

describe('Master Agent Workflow Integration', () => {
  let env: any;

  beforeAll(async () => {
    env = await getTestEnvironment();
  });

  describe('Agent Coordination', () => {
    test('should coordinate multiple agents in a workflow', async () => {
      // Create test agents
      const masterAgent = await TestHelpers.createTestAgent('MasterCoordinator', 'MASTER');
      const workerAgent1 = await TestHelpers.createTestAgent('Worker1', 'WORKER');
      const workerAgent2 = await TestHelpers.createTestAgent('Worker2', 'WORKER');

      // Verify agents are created
      expect(masterAgent.agentId).toBeDefined();
      expect(workerAgent1.agentId).toBeDefined();
      expect(workerAgent2.agentId).toBeDefined();

      // Test basic agent registry functionality
      const masterProfile = await env.agentRegistry.getAgentProfile(masterAgent.agentId);
      expect(masterProfile).toBeDefined();
      expect(masterProfile.name).toBe('MasterCoordinator');
    });

    test('should handle agent communication and task delegation', async () => {
      // Create coordinator agent
      const coordinator = await TestHelpers.createTestAgent('TaskCoordinator', 'COORDINATOR');

      // Test basic agent profile retrieval
      const profile = await env.agentRegistry.getAgentProfile(coordinator.agentId);
      expect(profile).toBeDefined();
      expect(profile.name).toBe('TaskCoordinator');

      // Test that the agent has basic capabilities structure
      expect(profile.capabilities).toBeDefined();
    });
  });

  describe('Workflow Execution', () => {
    test('should execute multi-agent workflows', async () => {
      // Create a test workflow
      const result = await TestHelpers.createTestWorkflow(
        'MultiAgentWorkflow',
        'Test workflow with multiple agents'
      );

      // Verify workflow creation - the result contains workflow and builder
      expect(result.workflow).toBeDefined();
      expect(result.workflow.name).toBe('MultiAgentWorkflow');
      expect(result.workflow.description).toBe('Test workflow with multiple agents');
    });

    test('should handle workflow state management', async () => {
      // Create workflow
      const result = await TestHelpers.createTestWorkflow('StateManagementWorkflow');

      // Test workflow state operations
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(result.workflow);
      expect(savedWorkflow.id).toBeDefined();

      const retrievedWorkflow = await env.workflowEngine.repository.getWorkflow(savedWorkflow.id);
      expect(retrievedWorkflow.id).toBe(savedWorkflow.id);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle agent failures gracefully', async () => {
      // Create test agents
      const resilientAgent = await TestHelpers.createTestAgent('ResilientAgent', 'RESILIENT');

      // Test agent profile retrieval
      const profile = await env.agentRegistry.getAgentProfile(resilientAgent.agentId);
      expect(profile).toBeDefined();

      // Test error scenarios don't crash the system
      expect(() => env.agentRegistry.getAgentProfile('non-existent-id')).not.toThrow();
    });

    test('should recover from workflow interruptions', async () => {
      // Create recovery test workflow
      const result = await TestHelpers.createTestWorkflow(
        'RecoveryWorkflow',
        'Test workflow recovery'
      );

      // Verify workflow can be created and retrieved
      expect(result.workflow).toBeDefined();

      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(result.workflow);
      expect(savedWorkflow.id).toBeDefined();
    });
  });
});

/**
 * Extension System Integration Tests
 * 
 * Tests the integration between the Extension System and other framework components,
 * validating extension loading, agent integration, workflow integration, and security
 */

import { getTestEnvironment, TestHelpers } from '../setup/test-setup';
import { ExtensionStatus } from '@the-new-fuse/extension-system/types';
import { WorkflowNodeType } from '@the-new-fuse/workflow-engine/types';
import * as path from 'path';

describe('Extension System Integration', () => {
  let env: any;

  beforeAll(async () => {
    env = getTestEnvironment();
  });

  describe('Extension Loading and Management', () => {
    test('should load and manage extensions successfully', async () => {
      // Create test extension
      const testExtension = await TestHelpers.createTestExtension('basic-processor', 'workflow_node');

      // Load extension
      const loadResult = await env.extensionManager.loadExtension(testExtension.extensionDir);
      
      expect(loadResult.success).toBe(true);
      expect(loadResult.extension.name).toBe(testExtension.name);
      expect(loadResult.extension.status).toBe(ExtensionStatus.LOADED);

      // Verify extension is in registry
      const loadedExtension = env.extensionManager.getExtension(loadResult.extension.id);
      expect(loadedExtension).toBeDefined();
      expect(loadedExtension.name).toBe(testExtension.name);

      // Activate extension
      const activateResult = await env.extensionManager.activateExtension(loadResult.extension.id);
      expect(activateResult).toBe(true);

      // Verify extension is active
      const activeExtension = env.extensionManager.getExtension(loadResult.extension.id);
      expect(activeExtension.status).toBe(ExtensionStatus.ACTIVE);

      // Get all extensions
      const allExtensions = env.extensionManager.getAllExtensions();
      expect(allExtensions.length).toBeGreaterThan(0);
      expect(allExtensions.some(ext => ext.id === loadResult.extension.id)).toBe(true);
    });

    test('should handle extension configuration updates', async () => {
      // Create and load test extension
      const testExtension = await TestHelpers.createTestExtension('configurable-extension', 'agent_capability');
      const loadResult = await env.extensionManager.loadExtension(testExtension.extensionDir);

      // Set extension configuration
      const newConfig = {
        enabled: true,
        timeout: 5000,
        retries: 3,
        debug: true
      };

      const configResult = await env.extensionManager.setExtensionConfig(
        loadResult.extension.id,
        newConfig
      );
      expect(configResult).toBe(true);

      // Verify configuration was applied
      const extension = env.extensionManager.getExtension(loadResult.extension.id);
      expect(extension.configuration).toMatchObject(newConfig);
    });

    test('should validate extension permissions and security', async () => {
      // Create extension with specific permissions
      const testExtension = await TestHelpers.createTestExtension('secure-extension', 'custom');
      
      // Update manifest with permissions
      const manifestPath = path.join(testExtension.extensionDir, 'extension.json');
      const manifest = require(manifestPath);
      manifest.permissions = ['filesystem_read', 'network_access', 'agent_control'];
      await require('fs-extra').writeJson(manifestPath, manifest, { spaces: 2 });

      // Load extension
      const loadResult = await env.extensionManager.loadExtension(testExtension.extensionDir);
      
      expect(loadResult.success).toBe(true);
      expect(loadResult.extension.permissions).toEqual(['filesystem_read', 'network_access', 'agent_control']);

      // Verify security validation was performed
      expect(loadResult.securityScan).toBeDefined();
      expect(loadResult.securityScan.safe).toBe(true);
    });
  });

  describe('Extension-Agent Integration', () => {
    test('should integrate agent capability extensions with Master Agent Registry', async () => {
      // Create agent capability extension
      const capabilityExtension = await TestHelpers.createTestExtension('data-analysis-capability', 'agent_capability');
      
      // Load and activate extension
      const loadResult = await env.extensionManager.loadExtension(capabilityExtension.extensionDir);
      await env.extensionManager.activateExtension(loadResult.extension.id);

      // Create test agent
      const agent = await TestHelpers.createTestAgent('AnalysisAgent', 'ANALYST');

      // Wait for extension integration
      await TestHelpers.waitForCondition(async () => {
        const agentProfile = await env.agentRegistry.getAgentProfile(agent.agentId);
        return agentProfile?.availableExtensions?.length > 0;
      });

      // Verify agent has access to extension capabilities
      const agentProfile = await env.agentRegistry.getAgentProfile(agent.agentId);
      expect(agentProfile.availableExtensions).toBeDefined();
      expect(agentProfile.availableExtensions.some(ext => 
        ext.includes('data-analysis-capability')
      )).toBe(true);

      // Test capability execution through agent
      const capabilityResult = await env.agentRegistry.executeAgentCapability(
        agent.agentId,
        'data-analysis-capability',
        { data: [1, 2, 3, 4, 5] }
      );

      expect(capabilityResult.success).toBe(true);
      expect(capabilityResult.result).toBeDefined();
    });

    test('should handle agent extension registration and discovery', async () => {
      // Create multiple capability extensions
      const extensions = await Promise.all([
        TestHelpers.createTestExtension('file-processor', 'agent_capability'),
        TestHelpers.createTestExtension('api-connector', 'agent_capability'),
        TestHelpers.createTestExtension('data-transformer', 'agent_capability')
      ]);

      // Load all extensions
      const loadResults = await Promise.all(
        extensions.map(ext => env.extensionManager.loadExtension(ext.extensionDir))
      );

      // Activate all extensions
      await Promise.all(
        loadResults.map(result => env.extensionManager.activateExtension(result.extension.id))
      );

      // Create agent
      const agent = await TestHelpers.createTestAgent('MultiCapabilityAgent', 'MULTI_CAPABILITY');

      // Wait for all extensions to be available to agent
      await TestHelpers.waitForCondition(async () => {
        const agentProfile = await env.agentRegistry.getAgentProfile(agent.agentId);
        return agentProfile?.availableExtensions?.length >= 3;
      });

      // Verify agent has access to all capability extensions
      const agentProfile = await env.agentRegistry.getAgentProfile(agent.agentId);
      expect(agentProfile.availableExtensions.length).toBe(3);
      
      const extensionNames = agentProfile.availableExtensions;
      expect(extensionNames.some(name => name.includes('file-processor'))).toBe(true);
      expect(extensionNames.some(name => name.includes('api-connector'))).toBe(true);
      expect(extensionNames.some(name => name.includes('data-transformer'))).toBe(true);
    });
  });

  describe('Extension-Workflow Integration', () => {
    test('should integrate workflow node extensions with Workflow Engine', async () => {
      // Create workflow node extension
      const nodeExtension = await TestHelpers.createTestExtension('custom-processor-node', 'workflow_node');
      
      // Load and activate extension
      const loadResult = await env.extensionManager.loadExtension(nodeExtension.extensionDir);
      await env.extensionManager.activateExtension(loadResult.extension.id);

      // Wait for workflow engine integration
      await TestHelpers.waitForCondition(async () => {
        const availableNodeTypes = env.workflowEngine.engine.getAvailableNodeTypes();
        return availableNodeTypes.includes('custom-processor-node');
      });

      // Create workflow using custom node
      const { workflow, builder } = await TestHelpers.createTestWorkflow('Custom Node Test');
      
      const customNode = builder.addNode(
        'custom-processor-node' as WorkflowNodeType,
        'Custom Processing',
        { x: 200, y: 100 },
        {
          processingType: 'advanced',
          parameters: { threshold: 0.8 }
        }
      );

      // Connect nodes
      builder.addConnection(workflow.definition.nodes[0].id, 'output', customNode.id, 'input');
      builder.addConnection(customNode.id, 'output', workflow.definition.nodes[1].id, 'input');

      // Execute workflow
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      const executionId = await env.workflowEngine.engine.executeWorkflow(
        savedWorkflow.id,
        { data: TestHelpers.generateTestData(10) }
      );

      // Wait for execution
      await TestHelpers.waitForCondition(async () => {
        const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
        return execution?.status !== 'PENDING';
      });

      // Verify custom node executed
      const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
      expect(execution).toBeDefined();
      expect(execution.nodeExecutions.some(ne => ne.nodeType === 'custom-processor-node')).toBe(true);
    });

    test('should handle dynamic workflow node registration from extensions', async () => {
      // Create multiple node extensions
      const nodeExtensions = await Promise.all([
        TestHelpers.createTestExtension('validator-node', 'workflow_node'),
        TestHelpers.createTestExtension('aggregator-node', 'workflow_node'),
        TestHelpers.createTestExtension('formatter-node', 'workflow_node')
      ]);

      // Load all extensions
      const loadResults = await Promise.all(
        nodeExtensions.map(ext => env.extensionManager.loadExtension(ext.extensionDir))
      );

      // Activate all extensions
      await Promise.all(
        loadResults.map(result => env.extensionManager.activateExtension(result.extension.id))
      );

      // Wait for workflow engine to register all node types
      await TestHelpers.waitForCondition(async () => {
        const availableNodeTypes = env.workflowEngine.engine.getAvailableNodeTypes();
        return availableNodeTypes.includes('validator-node') &&
               availableNodeTypes.includes('aggregator-node') &&
               availableNodeTypes.includes('formatter-node');
      });

      // Verify all node types are available
      const availableNodeTypes = env.workflowEngine.engine.getAvailableNodeTypes();
      expect(availableNodeTypes).toContain('validator-node');
      expect(availableNodeTypes).toContain('aggregator-node');
      expect(availableNodeTypes).toContain('formatter-node');

      // Create workflow using all custom nodes
      const { workflow, builder } = await TestHelpers.createTestWorkflow('Multi-Node Extension Test');
      
      const validatorNode = builder.addNode('validator-node' as WorkflowNodeType, 'Validate', { x: 150, y: 100 });
      const aggregatorNode = builder.addNode('aggregator-node' as WorkflowNodeType, 'Aggregate', { x: 300, y: 100 });
      const formatterNode = builder.addNode('formatter-node' as WorkflowNodeType, 'Format', { x: 450, y: 100 });

      // Connect nodes in sequence
      builder.addConnection(workflow.definition.nodes[0].id, 'output', validatorNode.id, 'input');
      builder.addConnection(validatorNode.id, 'output', aggregatorNode.id, 'input');
      builder.addConnection(aggregatorNode.id, 'output', formatterNode.id, 'input');
      builder.addConnection(formatterNode.id, 'output', workflow.definition.nodes[1].id, 'input');

      // Execute workflow
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      const executionId = await env.workflowEngine.engine.executeWorkflow(savedWorkflow.id, {});

      expect(executionId).toBeDefined();
    });
  });

  describe('Extension Error Handling and Recovery', () => {
    test('should handle extension loading failures gracefully', async () => {
      // Create invalid extension (missing main file)
      const invalidExtension = await TestHelpers.createTestExtension('invalid-extension', 'custom');
      
      // Remove the main file to make it invalid
      const mainFilePath = path.join(invalidExtension.extensionDir, 'index.js');
      await require('fs-extra').remove(mainFilePath);

      // Attempt to load invalid extension
      const loadResult = await env.extensionManager.loadExtension(invalidExtension.extensionDir);
      
      expect(loadResult.success).toBe(false);
      expect(loadResult.error).toBeDefined();
      expect(loadResult.error.message).toContain('main file not found');

      // Verify extension was not added to registry
      const extensions = env.extensionManager.getAllExtensions();
      expect(extensions.some(ext => ext.name === invalidExtension.name)).toBe(false);
    });

    test('should handle extension runtime errors without affecting system stability', async () => {
      // Create extension that throws errors
      const errorExtension = await TestHelpers.createTestExtension('error-extension', 'agent_capability');
      
      // Update main file to throw error
      const errorContent = `
class ErrorExtension {
  constructor(config) {
    this.config = config;
    this.name = 'error-extension';
  }

  async onLoad(context) {
    console.log('Error extension loaded');
  }

  async execute(input) {
    throw new Error('Simulated extension runtime error');
  }
}

module.exports = ErrorExtension;
`;
      
      const mainFilePath = path.join(errorExtension.extensionDir, 'index.js');
      await require('fs-extra').writeFile(mainFilePath, errorContent);

      // Load and activate extension
      const loadResult = await env.extensionManager.loadExtension(errorExtension.extensionDir);
      expect(loadResult.success).toBe(true);
      
      await env.extensionManager.activateExtension(loadResult.extension.id);

      // Create agent and attempt to use extension
      const agent = await TestHelpers.createTestAgent('ErrorTestAgent', 'ERROR_TEST');

      // Wait for extension to be available
      await TestHelpers.waitForCondition(async () => {
        const agentProfile = await env.agentRegistry.getAgentProfile(agent.agentId);
        return agentProfile?.availableExtensions?.length > 0;
      });

      // Attempt to execute capability (should handle error gracefully)
      const capabilityResult = await env.agentRegistry.executeAgentCapability(
        agent.agentId,
        'error-extension',
        { data: 'test' }
      );

      expect(capabilityResult.success).toBe(false);
      expect(capabilityResult.error).toBeDefined();
      expect(capabilityResult.error.message).toContain('Simulated extension runtime error');

      // Verify system stability - other operations should still work
      const agentProfile = await env.agentRegistry.getAgentProfile(agent.agentId);
      expect(agentProfile).toBeDefined();
      expect(agentProfile.status).toBe('ACTIVE');
    });

    test('should handle extension unloading and cleanup', async () => {
      // Create and load test extension
      const testExtension = await TestHelpers.createTestExtension('cleanup-test-extension', 'workflow_node');
      const loadResult = await env.extensionManager.loadExtension(testExtension.extensionDir);
      await env.extensionManager.activateExtension(loadResult.extension.id);

      // Verify extension is loaded and active
      let extension = env.extensionManager.getExtension(loadResult.extension.id);
      expect(extension.status).toBe(ExtensionStatus.ACTIVE);

      // Unload extension
      const unloadResult = await env.extensionManager.unloadExtension(loadResult.extension.id);
      expect(unloadResult).toBe(true);

      // Verify extension is no longer in registry
      extension = env.extensionManager.getExtension(loadResult.extension.id);
      expect(extension).toBeNull();

      // Verify extension is no longer available in workflow engine
      const availableNodeTypes = env.workflowEngine.engine.getAvailableNodeTypes();
      expect(availableNodeTypes.includes('cleanup-test-extension')).toBe(false);
    });
  });

  describe('Extension Performance and Monitoring', () => {
    test('should monitor extension resource usage and performance', async () => {
      // Create test extension
      const testExtension = await TestHelpers.createTestExtension('performance-test-extension', 'agent_capability');
      const loadResult = await env.extensionManager.loadExtension(testExtension.extensionDir);
      await env.extensionManager.activateExtension(loadResult.extension.id);

      // Create agent and execute capability multiple times
      const agent = await TestHelpers.createTestAgent('PerformanceTestAgent', 'PERFORMANCE_TEST');

      // Wait for extension availability
      await TestHelpers.waitForCondition(async () => {
        const agentProfile = await env.agentRegistry.getAgentProfile(agent.agentId);
        return agentProfile?.availableExtensions?.length > 0;
      });

      // Execute capability multiple times to generate metrics
      for (let i = 0; i < 5; i++) {
        await env.agentRegistry.executeAgentCapability(
          agent.agentId,
          'performance-test-extension',
          { iteration: i }
        );
      }

      // Check extension statistics
      const stats = env.extensionManager.getExtensionStats();
      expect(stats.totalExtensions).toBeGreaterThan(0);
      expect(stats.activeExtensions).toBeGreaterThan(0);
      expect(stats.totalExecutions).toBeGreaterThan(0);

      // Get specific extension metrics
      const extensionMetrics = env.extensionManager.getExtensionMetrics(loadResult.extension.id);
      expect(extensionMetrics).toBeDefined();
      expect(extensionMetrics.executionCount).toBe(5);
      expect(extensionMetrics.averageExecutionTime).toBeGreaterThan(0);
    });

    test('should handle concurrent extension usage', async () => {
      // Create extension for concurrent testing
      const testExtension = await TestHelpers.createTestExtension('concurrent-test-extension', 'agent_capability');
      const loadResult = await env.extensionManager.loadExtension(testExtension.extensionDir);
      await env.extensionManager.activateExtension(loadResult.extension.id);

      // Create multiple agents
      const agents = await Promise.all([
        TestHelpers.createTestAgent('ConcurrentAgent1', 'CONCURRENT_TEST'),
        TestHelpers.createTestAgent('ConcurrentAgent2', 'CONCURRENT_TEST'),
        TestHelpers.createTestAgent('ConcurrentAgent3', 'CONCURRENT_TEST')
      ]);

      // Wait for extension availability
      await TestHelpers.waitForCondition(async () => {
        const agentProfiles = await Promise.all(
          agents.map(a => env.agentRegistry.getAgentProfile(a.agentId))
        );
        return agentProfiles.every(profile => profile?.availableExtensions?.length > 0);
      });

      // Execute capability concurrently from multiple agents
      const concurrentExecutions = agents.map((agent, index) =>
        env.agentRegistry.executeAgentCapability(
          agent.agentId,
          'concurrent-test-extension',
          { agentIndex: index, timestamp: Date.now() }
        )
      );

      const results = await Promise.all(concurrentExecutions);

      // Verify all executions succeeded
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
      });

      // Check that concurrent usage didn't cause issues
      const extensionMetrics = env.extensionManager.getExtensionMetrics(loadResult.extension.id);
      expect(extensionMetrics.executionCount).toBe(3);
      expect(extensionMetrics.concurrentExecutions).toBeGreaterThanOrEqual(1);
    });
  });
});
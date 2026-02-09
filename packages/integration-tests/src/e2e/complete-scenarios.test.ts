/**
 * End-to-End Complete Scenarios Tests
 * 
 * Tests realistic scenarios that combine Master Agent Registry, Workflow Engine,
 * and Extension System working together to accomplish complex tasks
 */

import { getTestEnvironment, TestHelpers } from '../setup/test-setup';
// import { WorkflowNodeType, WorkflowExecutionStatus } from '@the-new-fuse/workflow-engine/types'; // Removed workflow-engine dependency
// import { ExtensionType } from '@the-new-fuse/extension-system/types'; // Removed unused import
import * as path from 'path';

// Define types locally since workflow-engine dependency was removed
enum WorkflowNodeType {
  AGENT_TASK = 'AGENT_TASK',
  CONDITION = 'CONDITION',
  PARALLEL = 'PARALLEL',
  SEQUENTIAL = 'SEQUENTIAL',
  CUSTOM = 'CUSTOM',
  AGENT_COORDINATION = 'AGENT_COORDINATION'
}

enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

describe('End-to-End Complete Scenarios', () => {
  let env: any;

  beforeAll(async () => {
    env = await getTestEnvironment();
  });

  beforeEach(() => {
    // Reset agent state for each test to ensure isolation
    if (env && env.agentState) {
      env.agentState.agents.clear();
      env.agentState.activeAgents = 0;
    }
  });

  describe('Data Processing Pipeline Scenario', () => {
    test('should execute complete data processing pipeline with agents and extensions', async () => {
      // Setup: Create specialized extensions for data processing
      const extensions = await Promise.all([
        TestHelpers.createTestExtension('data-validator', 'workflow_node'),
        TestHelpers.createTestExtension('data-cleaner', 'agent_capability'),
        TestHelpers.createTestExtension('data-analyzer', 'workflow_node'),
        TestHelpers.createTestExtension('report-generator', 'agent_capability')
      ]);

      // Load and activate all extensions
      const loadResults = await Promise.all(
        extensions.map(ext => env.extensionManager.loadExtension(ext.extensionDir))
      );
      
      await Promise.all(
        loadResults.map(result => env.extensionManager.activateExtension(result.extension.id))
      );

      // Create specialized agents for different pipeline stages
      const dataCleaningAgent = await TestHelpers.createTestAgent('DataCleaner', 'DATA_PROCESSOR');
      const reportingAgent = await TestHelpers.createTestAgent('ReportGenerator', 'ANALYST');

      // Agent capabilities are configured during agent creation

      // Wait for extensions to be available to agents
      await TestHelpers.waitForCondition(async () => {
        const cleanerProfile = await env.agentRegistry.getAgentProfile(dataCleaningAgent.agentId);
        const reporterProfile = await env.agentRegistry.getAgentProfile(reportingAgent.agentId);
        return cleanerProfile?.availableExtensions?.length >= 2 && 
               reporterProfile?.availableExtensions?.length >= 2;
      });

      // Create comprehensive data processing workflow
      const { workflow, builder } = await TestHelpers.createTestWorkflow(
        'Complete Data Processing Pipeline',
        'End-to-end data processing with validation, cleaning, analysis, and reporting'
      );

      // Build the pipeline workflow
      const dataValidatorNode = builder.addNode(
        'data-validator' as WorkflowNodeType,
        'Validate Input Data',
        { x: 150, y: 100 },
        {
          validationRules: ['not_null', 'format_check', 'range_validation'],
          strictMode: true
        }
      );

      const dataCleaningTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Clean Data',
        { x: 300, y: 100 },
        {
          agentId: dataCleaningAgent.agentId,
          task: 'Clean and normalize the validated data',
          priority: 'high',
          expectedDuration: 10,
          requiredExtensions: ['data-cleaner']
        }
      );

      const dataAnalyzerNode = builder.addNode(
        'data-analyzer' as WorkflowNodeType,
        'Analyze Data',
        { x: 450, y: 100 },
        {
          analysisType: 'comprehensive',
          includeStatistics: true,
          generateInsights: true
        }
      );

      const reportGenerationTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Generate Report',
        { x: 600, y: 100 },
        {
          agentId: reportingAgent.agentId,
          task: 'Generate comprehensive analysis report',
          priority: 'medium',
          expectedDuration: 15,
          requiredExtensions: ['report-generator']
        }
      );

      // Connect the pipeline
      builder.addConnection(workflow.definition.nodes[0].id, 'output', dataValidatorNode.id, 'input');
      builder.addConnection(dataValidatorNode.id, 'valid_data', dataCleaningTask.id, 'task');
      builder.addConnection(dataCleaningTask.id, 'result', dataAnalyzerNode.id, 'input');
      builder.addConnection(dataAnalyzerNode.id, 'analysis', reportGenerationTask.id, 'task');
      builder.addConnection(reportGenerationTask.id, 'result', workflow.definition.nodes[1].id, 'input');

      // Execute the complete pipeline
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      const testDataset = TestHelpers.generateTestData(100);
      
      const executionId = await env.workflowEngine.engine.executeWorkflow(
        savedWorkflow.id,
        { 
          rawData: testDataset,
          metadata: {
            source: 'test_scenario',
            timestamp: new Date(),
            requestId: 'e2e-test-001'
          }
        }
      );

      // Wait for pipeline completion
      await TestHelpers.waitForCondition(async () => {
        const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
        return execution?.status === WorkflowExecutionStatus.COMPLETED ||
               execution?.status === WorkflowExecutionStatus.FAILED;
      }, 60000); // Extended timeout for complex pipeline

      // Verify pipeline execution
      const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
      expect(execution).toBeDefined();
      expect(execution.status).toBe(WorkflowExecutionStatus.COMPLETED);

      // Verify all nodes executed
      expect(execution.nodeExecutions.length).toBe(6); // start + 4 pipeline nodes + end
      
      // Verify agents completed their tasks
      const cleanerProfile = await env.agentRegistry.getAgentProfile(dataCleaningAgent.agentId);
      const reporterProfile = await env.agentRegistry.getAgentProfile(reportingAgent.agentId);

      expect(cleanerProfile.completedTasks).toBeGreaterThan(0);
      expect(reporterProfile.completedTasks).toBeGreaterThan(0);

      // Verify extension usage
      const dataCleanerMetrics = env.extensionManager.getExtensionMetrics('data-cleaner');
      const reportGeneratorMetrics = env.extensionManager.getExtensionMetrics('report-generator');

      expect(dataCleanerMetrics.executionCount).toBeGreaterThan(0);
      expect(reportGeneratorMetrics.executionCount).toBeGreaterThan(0);
    });
  });

  describe('Multi-Agent Collaboration Scenario', () => {
    test('should coordinate multiple agents with extensions in complex workflow', async () => {
      // Create collaboration extensions
      const extensions = await Promise.all([
        TestHelpers.createTestExtension('task-coordinator', 'agent_capability'),
        TestHelpers.createTestExtension('message-router', 'workflow_node'),
        TestHelpers.createTestExtension('progress-tracker', 'agent_capability'),
        TestHelpers.createTestExtension('conflict-resolver', 'workflow_node')
      ]);

      // Load extensions
      const loadResults = await Promise.all(
        extensions.map(ext => env.extensionManager.loadExtension(ext.extensionDir))
      );
      
      await Promise.all(
        loadResults.map(result => env.extensionManager.activateExtension(result.extension.id))
      );

      // Create team of specialized agents
      const teamLeader = await TestHelpers.createTestAgent('TeamLeader', 'COORDINATOR');
      const developer1 = await TestHelpers.createTestAgent('Developer1', 'DEVELOPER');
      const developer2 = await TestHelpers.createTestAgent('Developer2', 'DEVELOPER');
      const tester = await TestHelpers.createTestAgent('Tester', 'QA_TESTER');
      const reviewer = await TestHelpers.createTestAgent('Reviewer', 'REVIEWER');

      // Configure agent capabilities
      const agentConfigs = [
        { agent: teamLeader, capabilities: { coordination: true, taskManagement: true, reporting: true } },
        { agent: developer1, capabilities: { coding: true, debugging: true, documentation: true } },
        { agent: developer2, capabilities: { coding: true, testing: true, optimization: true } },
        { agent: tester, capabilities: { testing: true, qualityAssurance: true, bugReporting: true } },
        { agent: reviewer, capabilities: { codeReview: true, qualityAssurance: true, approval: true } }
      ];

      // Agent capabilities are configured during agent creation

      // Wait for extensions to be available
      await TestHelpers.waitForCondition(async () => {
        const profiles = await Promise.all(
          agentConfigs.map(({ agent }) => env.agentRegistry.getAgentProfile(agent.agentId))
        );
        return profiles.every(profile => profile?.availableExtensions?.length >= 2);
      });

      // Create collaborative software development workflow
      const { workflow, builder } = await TestHelpers.createTestWorkflow(
        'Collaborative Software Development',
        'Multi-agent workflow for feature development with reviews and testing'
      );

      // Build collaboration workflow
      const coordinationNode = builder.addNode(
        WorkflowNodeType.AGENT_COORDINATION,
        'Team Coordination',
        { x: 150, y: 100 },
        {
          coordinationType: 'hierarchical',
          leaderAgentId: teamLeader.agentId,
          participantAgents: [developer1.agentId, developer2.agentId, tester.agentId, reviewer.agentId],
          task: 'Develop and test new feature',
          maxConcurrency: 2
        }
      );

      const messageRoutingNode = builder.addNode(
        'message-router' as WorkflowNodeType,
        'Route Communications',
        { x: 300, y: 50 },
        {
          routingStrategy: 'skill_based',
          enableBroadcast: true,
          messageFiltering: true
        }
      );

      const developmentTask1 = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Feature Development - Part 1',
        { x: 200, y: 200 },
        {
          agentId: developer1.agentId,
          task: 'Implement core feature functionality',
          priority: 'high',
          expectedDuration: 20,
          dependencies: ['coordination'],
          requiredExtensions: ['task-coordinator', 'progress-tracker']
        }
      );

      const developmentTask2 = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Feature Development - Part 2',
        { x: 350, y: 200 },
        {
          agentId: developer2.agentId,
          task: 'Implement feature UI and integration',
          priority: 'high',
          expectedDuration: 20,
          dependencies: ['coordination'],
          requiredExtensions: ['task-coordinator', 'progress-tracker']
        }
      );

      const conflictResolverNode = builder.addNode(
        'conflict-resolver' as WorkflowNodeType,
        'Resolve Integration Conflicts',
        { x: 500, y: 150 },
        {
          strategy: 'automated_merge',
          requireManualReview: true,
          notifyStakeholders: true
        }
      );

      const testingTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Feature Testing',
        { x: 650, y: 100 },
        {
          agentId: tester.agentId,
          task: 'Comprehensive feature testing',
          priority: 'high',
          expectedDuration: 15,
          requiredExtensions: ['progress-tracker']
        }
      );

      const reviewTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Code Review',
        { x: 800, y: 100 },
        {
          agentId: reviewer.agentId,
          task: 'Final code review and approval',
          priority: 'medium',
          expectedDuration: 10,
          requiredExtensions: ['progress-tracker']
        }
      );

      // Connect the collaborative workflow
      builder.addConnection(workflow.definition.nodes[0].id, 'output', coordinationNode.id, 'task');
      builder.addConnection(coordinationNode.id, 'coordination', messageRoutingNode.id, 'input');
      builder.addConnection(messageRoutingNode.id, 'routed', developmentTask1.id, 'task');
      builder.addConnection(messageRoutingNode.id, 'routed', developmentTask2.id, 'task');
      builder.addConnection(developmentTask1.id, 'result', conflictResolverNode.id, 'input1');
      builder.addConnection(developmentTask2.id, 'result', conflictResolverNode.id, 'input2');
      builder.addConnection(conflictResolverNode.id, 'resolved', testingTask.id, 'task');
      builder.addConnection(testingTask.id, 'result', reviewTask.id, 'task');
      builder.addConnection(reviewTask.id, 'result', workflow.definition.nodes[1].id, 'input');

      // Execute collaborative workflow
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      
      const executionId = await env.workflowEngine.engine.executeWorkflow(
        savedWorkflow.id,
        {
          featureSpec: {
            name: 'UserDashboard',
            requirements: ['responsive design', 'real-time updates', 'user preferences'],
            priority: 'high',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
          },
          projectContext: {
            repository: 'feature-branch',
            framework: 'react',
            testingFramework: 'jest'
          }
        }
      );

      // Wait for collaboration completion
      await TestHelpers.waitForCondition(async () => {
        const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
        return execution?.status === WorkflowExecutionStatus.COMPLETED ||
               execution?.status === WorkflowExecutionStatus.FAILED;
      }, 90000); // Extended timeout for complex collaboration

      // Verify collaboration results
      const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
      expect(execution).toBeDefined();
      expect(execution.status).toBe(WorkflowExecutionStatus.COMPLETED);

      // Verify all agents participated
      const agentProfiles = await Promise.all(
        agentConfigs.map(({ agent }) => env.agentRegistry.getAgentProfile(agent.agentId))
      );

      agentProfiles.forEach((profile, _index) => {
        expect(profile.completedTasks).toBeGreaterThan(0);
        expect(profile.collaborations).toBeGreaterThan(0);
      });

      // Verify coordination extensions were used
      const coordinatorMetrics = env.extensionManager.getExtensionMetrics('task-coordinator');
      const trackerMetrics = env.extensionManager.getExtensionMetrics('progress-tracker');

      expect(coordinatorMetrics.executionCount).toBeGreaterThan(0);
      expect(trackerMetrics.executionCount).toBeGreaterThan(0);

      // Verify handoffs occurred
      const teamLeaderProfile = await env.agentRegistry.getAgentProfile(teamLeader.agentId);
      expect(teamLeaderProfile.handoffsInitiated).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery and Resilience Scenario', () => {
    test('should handle failures and recover gracefully in complex multi-system scenario', async () => {
      // Create extensions with potential failure points
      const extensions = await Promise.all([
        TestHelpers.createTestExtension('unreliable-processor', 'workflow_node'),
        TestHelpers.createTestExtension('backup-processor', 'workflow_node'),
        TestHelpers.createTestExtension('error-handler', 'agent_capability'),
        TestHelpers.createTestExtension('recovery-coordinator', 'agent_capability')
      ]);

      // Modify unreliable-processor to fail occasionally
      const unreliableContent = `
class UnreliableProcessor {
  constructor(config) {
    this.config = config;
    this.name = 'unreliable-processor';
    this.failureRate = 0.3; // 30% failure rate
  }

  async onLoad(context) {
    // Unreliable processor loaded
  }

  async execute(input) {
    if (Math.random() < this.failureRate) {
      throw new Error('Simulated processor failure');
    }
    return { processed: true, input, processor: 'unreliable' };
  }
}

module.exports = UnreliableProcessor;
`;

      const unreliablePath = path.join(extensions[0].extensionDir, 'index.js');
      await require('fs-extra').writeFile(unreliablePath, unreliableContent);

      // Load all extensions
      const loadResults = await Promise.all(
        extensions.map(ext => env.extensionManager.loadExtension(ext.extensionDir))
      );
      
      await Promise.all(
        loadResults.map(result => env.extensionManager.activateExtension(result.extension.id))
      );

      // Create recovery-capable agents
      const primaryAgent = await TestHelpers.createTestAgent('PrimaryProcessor', 'PRIMARY');
      const backupAgent = await TestHelpers.createTestAgent('BackupProcessor', 'BACKUP');
      const monitorAgent = await TestHelpers.createTestAgent('SystemMonitor', 'MONITOR');

      // Configure agents for error handling

      // Wait for extensions
      await TestHelpers.waitForCondition(async () => {
        const profiles = await Promise.all([
          env.agentRegistry.getAgentProfile(primaryAgent.agentId),
          env.agentRegistry.getAgentProfile(backupAgent.agentId),
          env.agentRegistry.getAgentProfile(monitorAgent.agentId)
        ]);
        return profiles.every(profile => profile?.availableExtensions?.length >= 2);
      });

      // Create resilient workflow with error handling
      const { workflow, builder } = await TestHelpers.createTestWorkflow(
        'Resilient Processing Pipeline',
        'Error-prone workflow with recovery mechanisms'
      );

      // Build resilient workflow
      const monitoringTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'System Monitoring',
        { x: 100, y: 50 },
        {
          agentId: monitorAgent.agentId,
          task: 'Monitor system health and errors',
          priority: 'high',
          expectedDuration: 30,
          requiredExtensions: ['error-handler', 'recovery-coordinator']
        }
      );

      const unreliableNode = builder.addNode(
        'unreliable-processor' as WorkflowNodeType,
        'Primary Processing (Unreliable)',
        { x: 200, y: 100 },
        {
          retryAttempts: 3,
          timeoutMs: 10000,
          fallbackEnabled: true
        }
      );

      const errorDetectionTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Error Detection',
        { x: 350, y: 50 },
        {
          agentId: primaryAgent.agentId,
          task: 'Detect and handle processing errors',
          priority: 'critical',
          expectedDuration: 5,
          requiredExtensions: ['error-handler']
        }
      );

      const backupNode = builder.addNode(
        'backup-processor' as WorkflowNodeType,
        'Backup Processing',
        { x: 500, y: 150 },
        {
          activateOnFailure: true,
          preserveContext: true
        }
      );

      const recoveryTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Recovery Coordination',
        { x: 650, y: 100 },
        {
          agentId: backupAgent.agentId,
          task: 'Coordinate system recovery',
          priority: 'critical',
          expectedDuration: 10,
          requiredExtensions: ['recovery-coordinator']
        }
      );

      // Connect resilient workflow
      builder.addConnection(workflow.definition.nodes[0].id, 'output', monitoringTask.id, 'task');
      builder.addConnection(monitoringTask.id, 'monitoring', unreliableNode.id, 'input');
      builder.addConnection(unreliableNode.id, 'success', workflow.definition.nodes[1].id, 'input');
      builder.addConnection(unreliableNode.id, 'error', errorDetectionTask.id, 'task');
      builder.addConnection(errorDetectionTask.id, 'error_handled', backupNode.id, 'input');
      builder.addConnection(backupNode.id, 'success', recoveryTask.id, 'task');
      builder.addConnection(recoveryTask.id, 'result', workflow.definition.nodes[1].id, 'input');

      // Execute resilient workflow multiple times to test error handling
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
      const executionPromises = [];

      for (let i = 0; i < 5; i++) {
        const executionPromise = env.workflowEngine.engine.executeWorkflow(
          savedWorkflow.id,
          { 
            data: TestHelpers.generateTestData(20),
            executionIndex: i,
            expectFailures: true
          }
        );
        executionPromises.push(executionPromise);
      }

      const executionIds = await Promise.all(executionPromises);

      // Wait for all executions to complete (some may succeed, some may fail and recover)
      await TestHelpers.waitForCondition(async () => {
        const executions = await Promise.all(
          executionIds.map(id => env.workflowEngine.engine.getExecutionStatus(id))
        );
        return executions.every(exec => 
          exec?.status === WorkflowExecutionStatus.COMPLETED ||
          exec?.status === WorkflowExecutionStatus.FAILED
        );
      }, 120000); // Extended timeout for multiple executions

      // Verify resilience results
      const executions = await Promise.all(
        executionIds.map(id => env.workflowEngine.engine.getExecutionStatus(id))
      );

      // At least some executions should have completed (via backup if needed)
      const completedExecutions = executions.filter(exec => exec?.status === WorkflowExecutionStatus.COMPLETED);
      expect(completedExecutions.length).toBeGreaterThan(0);

      // Verify error handling occurred
      const errorHandlerMetrics = env.extensionManager.getExtensionMetrics('error-handler');
      const recoveryMetrics = env.extensionManager.getExtensionMetrics('recovery-coordinator');

      expect(errorHandlerMetrics.executionCount).toBeGreaterThan(0);
      expect(recoveryMetrics.executionCount).toBeGreaterThan(0);

      // Verify agents handled errors
      const primaryProfile = await env.agentRegistry.getAgentProfile(primaryAgent.agentId);
      // const _backupProfile = await env.agentRegistry.getAgentProfile(backupAgent.agentId); // Not used in current implementation
      const monitorProfile = await env.agentRegistry.getAgentProfile(monitorAgent.agentId);

      expect(primaryProfile.errorsHandled).toBeGreaterThan(0);
      expect(monitorProfile.completedTasks).toBeGreaterThan(0);

      // System should remain stable despite errors
      const systemHealth = await env.agentRegistry.getSystemHealth();
      expect(systemHealth.status).toBe('healthy');
      expect(systemHealth.activeAgents).toBe(3);
    }, 150000); // Very extended timeout for complex error scenarios
  });

  describe('Performance and Scalability Scenario', () => {
    test('should handle high-load scenario with multiple workflows and agents', async () => {
      // Create performance-optimized extensions
      const extensions = await Promise.all([
        TestHelpers.createTestExtension('high-throughput-processor', 'workflow_node'),
        TestHelpers.createTestExtension('load-balancer', 'agent_capability'),
        TestHelpers.createTestExtension('performance-monitor', 'agent_capability'),
        TestHelpers.createTestExtension('resource-optimizer', 'workflow_node')
      ]);

      // Load extensions
      const loadResults = await Promise.all(
        extensions.map(ext => env.extensionManager.loadExtension(ext.extensionDir))
      );
      
      await Promise.all(
        loadResults.map(result => env.extensionManager.activateExtension(result.extension.id))
      );

      // Create agent pool for high-load processing
      const agentPool = await Promise.all(
        Array.from({ length: 10 }, (_, i) => 
          TestHelpers.createTestAgent(`WorkerAgent${i}`, 'WORKER')
        )
      );

      const loadBalancer = await TestHelpers.createTestAgent('LoadBalancer', 'LOAD_BALANCER');
      const performanceMonitor = await TestHelpers.createTestAgent('PerformanceMonitor', 'MONITOR');

      // Configure agents for high performance
      // Agent capabilities are configured during agent creation

      // Wait for extensions
      await TestHelpers.waitForCondition(async () => {
        const profiles = await Promise.all([
          ...agentPool.map(agent => env.agentRegistry.getAgentProfile(agent.agentId)),
          env.agentRegistry.getAgentProfile(loadBalancer.agentId),
          env.agentRegistry.getAgentProfile(performanceMonitor.agentId)
        ]);
        return profiles.every(profile => profile?.availableExtensions?.length >= 2);
      });

      // Create high-performance workflow template
      const { workflow, builder } = await TestHelpers.createTestWorkflow(
        'High-Performance Processing Template',
        'Scalable workflow for high-load processing'
      );

      // Build high-performance workflow
      const performanceMonitoringTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Performance Monitoring',
        { x: 100, y: 50 },
        {
          agentId: performanceMonitor.agentId,
          task: 'Monitor system performance during high load',
          priority: 'high',
          expectedDuration: 60,
          requiredExtensions: ['performance-monitor']
        }
      );

      const loadBalancingTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Load Balancing',
        { x: 200, y: 100 },
        {
          agentId: loadBalancer.agentId,
          task: 'Distribute load across worker agents',
          priority: 'critical',
          expectedDuration: 30,
          requiredExtensions: ['load-balancer']
        }
      );

      const resourceOptimizerNode = builder.addNode(
        'resource-optimizer' as WorkflowNodeType,
        'Resource Optimization',
        { x: 350, y: 50 },
        {
          optimizationStrategy: 'dynamic',
          resourceThrottling: true,
          memoryManagement: true
        }
      );

      const highThroughputNode = builder.addNode(
        'high-throughput-processor' as WorkflowNodeType,
        'High Throughput Processing',
        { x: 500, y: 100 },
        {
          batchSize: 100,
          parallelism: 5,
          optimization: 'speed'
        }
      );

      const coordinationNode = builder.addNode(
        WorkflowNodeType.AGENT_COORDINATION,
        'Worker Coordination',
        { x: 650, y: 100 },
        {
          coordinationType: 'parallel',
          agentIds: agentPool.map(a => a.agentId),
          task: 'Process data chunks in parallel',
          maxConcurrency: 10
        }
      );

      // Connect high-performance workflow
      builder.addConnection(workflow.definition.nodes[0].id, 'output', performanceMonitoringTask.id, 'task');
      builder.addConnection(performanceMonitoringTask.id, 'monitoring', loadBalancingTask.id, 'task');
      builder.addConnection(loadBalancingTask.id, 'balanced', resourceOptimizerNode.id, 'input');
      builder.addConnection(resourceOptimizerNode.id, 'optimized', highThroughputNode.id, 'input');
      builder.addConnection(highThroughputNode.id, 'output', coordinationNode.id, 'agents');
      builder.addConnection(coordinationNode.id, 'results', workflow.definition.nodes[1].id, 'input');

      // Save workflow template
      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);

      // Execute multiple concurrent high-load workflows
      const startTime = Date.now();
      const concurrentExecutions = 20;
      const datasetSize = 500;

      const executionPromises = Array.from({ length: concurrentExecutions }, (_, i) =>
        env.workflowEngine.engine.executeWorkflow(
          savedWorkflow.id,
          {
            data: TestHelpers.generateTestData(datasetSize),
            executionBatch: Math.floor(i / 5),
            executionIndex: i,
            startTime: startTime
          }
        )
      );

      const executionIds = await Promise.all(executionPromises);

      // Wait for all high-load executions to complete
      await TestHelpers.waitForCondition(async () => {
        const executions = await Promise.all(
          executionIds.map(id => env.workflowEngine.engine.getExecutionStatus(id))
        );
        return executions.every(exec => 
          exec?.status === WorkflowExecutionStatus.COMPLETED ||
          exec?.status === WorkflowExecutionStatus.FAILED
        );
      }, 180000); // Very extended timeout for high-load testing

      const endTime = Date.now();
      const totalExecutionTime = endTime - startTime;

      // Verify high-performance results
      const executions = await Promise.all(
        executionIds.map(id => env.workflowEngine.engine.getExecutionStatus(id))
      );

      const completedExecutions = executions.filter(exec => exec?.status === WorkflowExecutionStatus.COMPLETED);
      const successRate = (completedExecutions.length / concurrentExecutions) * 100;

      // Performance assertions
      expect(successRate).toBeGreaterThan(80); // At least 80% success rate under high load
      expect(totalExecutionTime).toBeLessThan(180000); // Complete within 3 minutes
      
      // Verify system handled the load
      const systemStats = env.extensionManager.getExtensionStats();
      expect(systemStats.totalExecutions).toBeGreaterThan(concurrentExecutions * 2);

      // Verify agent pool utilization
      const agentProfiles = await Promise.all(
        agentPool.map(agent => env.agentRegistry.getAgentProfile(agent.agentId))
      );

      const totalTasksProcessed = agentProfiles.reduce((sum, profile) => sum + profile.completedTasks, 0);
      expect(totalTasksProcessed).toBeGreaterThan(concurrentExecutions);

      // Verify performance monitoring captured metrics
      const performanceMetrics = env.extensionManager.getExtensionMetrics('performance-monitor');
      const loadBalancerMetrics = env.extensionManager.getExtensionMetrics('load-balancer');

      expect(performanceMetrics.executionCount).toBeGreaterThan(0);
      expect(loadBalancerMetrics.executionCount).toBeGreaterThan(0);

      // System should remain healthy after high load
      const finalSystemHealth = await env.agentRegistry.getSystemHealth();
      expect(finalSystemHealth.status).toBe('healthy');
      expect(finalSystemHealth.activeAgents).toBe(agentPool.length + 2); // pool + load balancer + monitor

      // High-load test completed successfully with good metrics
    }, 240000); // Maximum timeout for performance testing
  });
});
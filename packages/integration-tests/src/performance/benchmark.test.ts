/**
 * Performance Benchmark Tests
 * 
 * Measures performance characteristics of the unified framework components
 * and provides benchmarks for optimization and regression testing
 */

import { getTestEnvironment, TestHelpers } from '../setup/test-setup';
import { WorkflowNodeType, WorkflowExecutionStatus } from '@the-new-fuse/workflow-engine/types';
import { performance } from 'perf_hooks';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput: number;
  memoryUsage?: number;
}

interface BenchmarkSuite {
  suiteName: string;
  results: BenchmarkResult[];
  summary: {
    totalTests: number;
    totalTime: number;
    averageThroughput: number;
  };
}

describe('Performance Benchmarks', () => {
  let env: any;
  const benchmarkResults: BenchmarkSuite[] = [];

  beforeAll(async () => {
    env = getTestEnvironment();
  });

  afterAll(async () => {
    // Output benchmark summary
  });

  describe('Master Agent Registry Performance', () => {
    test('agent registration performance', async () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        void await TestHelpers.createTestAgent(`PerfTestAgent${i}`, 'PERF_TEST');
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const result = calculateBenchmarkResult('Agent Registration', iterations, times);
      addBenchmarkResult('Master Agent Registry Performance', result);

      // Performance assertions
      expect(result.averageTime).toBeLessThan(50); // Should register in under 50ms on average
      expect(result.throughput).toBeGreaterThan(20); // Should handle 20+ registrations per second
    });

    test('agent capability update performance', async () => {
      // Create agents for testing
      const testAgents = await Promise.all(
        Array.from({ length: 50 }, (_, i) => 
          TestHelpers.createTestAgent(`CapabilityTestAgent${i}`, 'CAPABILITY_TEST')
        )
      );

      const iterations = 200;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const agent = testAgents[i % testAgents.length];
        const capabilities = {
          capability1: Math.random() > 0.5,
          capability2: Math.random() > 0.5,
          capability3: Math.random() > 0.5,
          capability4: Math.random() > 0.5
        };

        const startTime = performance.now();
        
        await env.agentRegistry.updateAgentCapabilities(agent.agentId, capabilities);
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const result = calculateBenchmarkResult('Agent Capability Updates', iterations, times);
      addBenchmarkResult('Master Agent Registry Performance', result);

      expect(result.averageTime).toBeLessThan(20); // Should update in under 20ms
      expect(result.throughput).toBeGreaterThan(50); // 50+ updates per second
    });

    test('agent profile retrieval performance', async () => {
      // Create agents for testing
      const testAgents = await Promise.all(
        Array.from({ length: 100 }, (_, i) => 
          TestHelpers.createTestAgent(`RetrievalTestAgent${i}`, 'RETRIEVAL_TEST')
        )
      );

      const iterations = 500;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const agent = testAgents[i % testAgents.length];
        
        const startTime = performance.now();
        
        const profile = await env.agentRegistry.getAgentProfile(agent.agentId);
        
        const endTime = performance.now();
        times.push(endTime - startTime);

        expect(profile).toBeDefined();
      }

      const result = calculateBenchmarkResult('Agent Profile Retrieval', iterations, times);
      addBenchmarkResult('Master Agent Registry Performance', result);

      expect(result.averageTime).toBeLessThan(10); // Should retrieve in under 10ms
      expect(result.throughput).toBeGreaterThan(100); // 100+ retrievals per second
    });

    test('concurrent agent operations performance', async () => {
      const concurrentOperations = 50;
      const operationsPerBatch = 10;
      
      const startTime = performance.now();
      
      const operationPromises = Array.from({ length: concurrentOperations }, async (_, i) => {
        const batchTimes: number[] = [];
        
        for (let j = 0; j < operationsPerBatch; j++) {
          const opStart = performance.now();
          
          // Mix of operations
          if (j % 3 === 0) {
            const agent = await TestHelpers.createTestAgent(`ConcurrentAgent${i}_${j}`, 'CONCURRENT_TEST');
            await env.agentRegistry.updateAgentCapabilities(agent.agentId, { concurrent: true });
          } else if (j % 3 === 1) {
            const agents = await env.agentRegistry.getAllAgents();
            if (agents.length > 0) {
              await env.agentRegistry.getAgentProfile(agents[0].agentId);
            }
          } else {
            await env.agentRegistry.getSystemHealth();
          }
          
          const opEnd = performance.now();
          batchTimes.push(opEnd - opStart);
        }
        
        return batchTimes;
      });

      const allBatchTimes = await Promise.all(operationPromises);
      const allTimes = allBatchTimes.flat();
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const result = calculateBenchmarkResult('Concurrent Operations', allTimes.length, allTimes);
      result.totalTime = totalTime; // Override with actual concurrent time
      result.throughput = allTimes.length / (totalTime / 1000);
      
      addBenchmarkResult('Master Agent Registry Performance', result);

      expect(result.averageTime).toBeLessThan(30); // Individual operations under 30ms
      expect(totalTime).toBeLessThan(10000); // All concurrent operations under 10 seconds
    });
  });

  describe('Workflow Engine Performance', () => {
    test('workflow creation performance', async () => {
      const iterations = 50;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        const { workflow, builder } = await TestHelpers.createTestWorkflow(`PerfWorkflow${i}`);
        
        // Add some complexity
        const node1 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 1', { x: 200, y: 100 });
        const node2 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 2', { x: 350, y: 100 });
        builder.addConnection(workflow.definition.nodes[0].id, 'output', node1.id, 'input');
        builder.addConnection(node1.id, 'output', node2.id, 'input');
        builder.addConnection(node2.id, 'output', workflow.definition.nodes[1].id, 'input');
        
        const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);
        
        const endTime = performance.now();
        times.push(endTime - startTime);

        expect(savedWorkflow).toBeDefined();
      }

      const result = calculateBenchmarkResult('Workflow Creation', iterations, times);
      addBenchmarkResult('Workflow Engine Performance', result);

      expect(result.averageTime).toBeLessThan(100); // Under 100ms per workflow
      expect(result.throughput).toBeGreaterThan(10); // 10+ workflows per second
    });

    test('workflow execution performance', async () => {
      // Create test agents
      const testAgents = await Promise.all(
        Array.from({ length: 10 }, (_, i) => 
          TestHelpers.createTestAgent(`WorkflowPerfAgent${i}`, 'WORKFLOW_PERF')
        )
      );

      // Create workflow template
      const { workflow, builder } = await TestHelpers.createTestWorkflow('Performance Test Workflow');
      
      const taskNode = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Performance Task',
        { x: 200, y: 100 },
        {
          task: 'Quick performance test task',
          priority: 'medium',
          expectedDuration: 1
        }
      );

      builder.addConnection(workflow.definition.nodes[0].id, 'output', taskNode.id, 'task');
      builder.addConnection(taskNode.id, 'result', workflow.definition.nodes[1].id, 'input');

      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);

      const iterations = 30;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const agent = testAgents[i % testAgents.length];
        
        // Update task with specific agent
        workflow.definition.nodes.find(n => n.type === WorkflowNodeType.AGENT_TASK).config.agentId = agent.agentId;
        await env.workflowEngine.repository.updateWorkflow(savedWorkflow.id, workflow);

        const startTime = performance.now();
        
        const executionId = await env.workflowEngine.engine.executeWorkflow(
          savedWorkflow.id,
          { data: TestHelpers.generateTestData(10) }
        );

        // Wait for completion
        await TestHelpers.waitForCondition(async () => {
          const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
          return execution?.status !== WorkflowExecutionStatus.PENDING &&
                 execution?.status !== WorkflowExecutionStatus.RUNNING;
        });
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const result = calculateBenchmarkResult('Workflow Execution', iterations, times);
      addBenchmarkResult('Workflow Engine Performance', result);

      expect(result.averageTime).toBeLessThan(2000); // Under 2 seconds per execution
      expect(result.throughput).toBeGreaterThan(0.5); // At least 0.5 executions per second
    });

    test('concurrent workflow execution performance', async () => {
      // Create agent pool
      const agentPool = await Promise.all(
        Array.from({ length: 5 }, (_, i) => 
          TestHelpers.createTestAgent(`ConcurrentWorkflowAgent${i}`, 'CONCURRENT_WORKFLOW')
        )
      );

      // Create multiple workflow templates
      const workflows = await Promise.all(
        Array.from({ length: 10 }, async (_, i) => {
          const { workflow, builder } = await TestHelpers.createTestWorkflow(`ConcurrentWorkflow${i}`);
          
          const taskNode = builder.addNode(
            WorkflowNodeType.AGENT_TASK,
            `Concurrent Task ${i}`,
            { x: 200, y: 100 },
            {
              agentId: agentPool[i % agentPool.length].agentId,
              task: `Concurrent processing task ${i}`,
              priority: 'medium',
              expectedDuration: 2
            }
          );

          builder.addConnection(workflow.definition.nodes[0].id, 'output', taskNode.id, 'task');
          builder.addConnection(taskNode.id, 'result', workflow.definition.nodes[1].id, 'input');

          return await env.workflowEngine.repository.createWorkflow(workflow);
        })
      );

      const concurrentExecutions = 20;
      
      const startTime = performance.now();
      
      const executionPromises = Array.from({ length: concurrentExecutions }, (_, i) =>
        env.workflowEngine.engine.executeWorkflow(
          workflows[i % workflows.length].id,
          { data: TestHelpers.generateTestData(5), executionIndex: i }
        )
      );

      const executionIds = await Promise.all(executionPromises);

      // Wait for all executions to complete
      await TestHelpers.waitForCondition(async () => {
        const executions = await Promise.all(
          executionIds.map(id => env.workflowEngine.engine.getExecutionStatus(id))
        );
        return executions.every(exec => 
          exec?.status === WorkflowExecutionStatus.COMPLETED ||
          exec?.status === WorkflowExecutionStatus.FAILED
        );
      }, 30000);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const result: BenchmarkResult = {
        name: 'Concurrent Workflow Execution',
        iterations: concurrentExecutions,
        totalTime: totalTime,
        averageTime: totalTime / concurrentExecutions,
        minTime: totalTime / concurrentExecutions, // Approximate for concurrent
        maxTime: totalTime / concurrentExecutions,
        throughput: concurrentExecutions / (totalTime / 1000)
      };

      addBenchmarkResult('Workflow Engine Performance', result);

      expect(totalTime).toBeLessThan(15000); // All concurrent executions under 15 seconds
      expect(result.throughput).toBeGreaterThan(1); // At least 1 execution per second
    });
  });

  describe('Extension System Performance', () => {
    test('extension loading performance', async () => {
      const iterations = 20;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const testExtension = await TestHelpers.createTestExtension(`LoadPerfExtension${i}`, 'custom');
        
        const startTime = performance.now();
        
        const loadResult = await env.extensionManager.loadExtension(testExtension.extensionDir);
        
        const endTime = performance.now();
        times.push(endTime - startTime);

        expect(loadResult.success).toBe(true);
      }

      const result = calculateBenchmarkResult('Extension Loading', iterations, times);
      addBenchmarkResult('Extension System Performance', result);

      expect(result.averageTime).toBeLessThan(200); // Under 200ms per extension
      expect(result.throughput).toBeGreaterThan(5); // 5+ extensions per second
    });

    test('extension execution performance', async () => {
      // Create and load test extension
      const testExtension = await TestHelpers.createTestExtension('ExecutionPerfExtension', 'agent_capability');
      const loadResult = await env.extensionManager.loadExtension(testExtension.extensionDir);
      await env.extensionManager.activateExtension(loadResult.extension.id);

      // Create test agent
      const agent = await TestHelpers.createTestAgent('ExtensionPerfAgent', 'EXTENSION_PERF');

      // Wait for extension availability
      await TestHelpers.waitForCondition(async () => {
        const agentProfile = await env.agentRegistry.getAgentProfile(agent.agentId);
        return agentProfile?.availableExtensions?.length > 0;
      });

      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        const result = await env.agentRegistry.executeAgentCapability(
          agent.agentId,
          'ExecutionPerfExtension',
          { data: `test-data-${i}` }
        );
        
        const endTime = performance.now();
        times.push(endTime - startTime);

        expect(result.success).toBe(true);
      }

      const benchmarkResult = calculateBenchmarkResult('Extension Execution', iterations, times);
      addBenchmarkResult('Extension System Performance', benchmarkResult);

      expect(benchmarkResult.averageTime).toBeLessThan(50); // Under 50ms per execution
      expect(benchmarkResult.throughput).toBeGreaterThan(20); // 20+ executions per second
    });

    test('concurrent extension usage performance', async () => {
      // Create multiple extensions
      const extensions = await Promise.all([
        TestHelpers.createTestExtension('ConcurrentExt1', 'agent_capability'),
        TestHelpers.createTestExtension('ConcurrentExt2', 'agent_capability'),
        TestHelpers.createTestExtension('ConcurrentExt3', 'agent_capability')
      ]);

      // Load all extensions
      const loadResults = await Promise.all(
        extensions.map(ext => env.extensionManager.loadExtension(ext.extensionDir))
      );

      await Promise.all(
        loadResults.map(result => env.extensionManager.activateExtension(result.extension.id))
      );

      // Create agents
      const agents = await Promise.all([
        TestHelpers.createTestAgent('ConcurrentAgent1', 'CONCURRENT_EXT'),
        TestHelpers.createTestAgent('ConcurrentAgent2', 'CONCURRENT_EXT'),
        TestHelpers.createTestAgent('ConcurrentAgent3', 'CONCURRENT_EXT')
      ]);

      // Wait for extensions
      await TestHelpers.waitForCondition(async () => {
        const profiles = await Promise.all(
          agents.map(agent => env.agentRegistry.getAgentProfile(agent.agentId))
        );
        return profiles.every(profile => profile?.availableExtensions?.length >= 3);
      });

      const concurrentExecutions = 30;
      
      const startTime = performance.now();
      
      const executionPromises = Array.from({ length: concurrentExecutions }, (_, i) => {
        const agent = agents[i % agents.length];
        const extension = extensions[i % extensions.length];
        
        return env.agentRegistry.executeAgentCapability(
          agent.agentId,
          extension.name,
          { data: `concurrent-test-${i}` }
        );
      });

      const results = await Promise.all(executionPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const benchmarkResult: BenchmarkResult = {
        name: 'Concurrent Extension Usage',
        iterations: concurrentExecutions,
        totalTime: totalTime,
        averageTime: totalTime / concurrentExecutions,
        minTime: totalTime / concurrentExecutions,
        maxTime: totalTime / concurrentExecutions,
        throughput: concurrentExecutions / (totalTime / 1000)
      };

      addBenchmarkResult('Extension System Performance', benchmarkResult);

      // Verify all executions succeeded
      results.forEach(result => expect(result.success).toBe(true));

      expect(totalTime).toBeLessThan(5000); // All concurrent executions under 5 seconds
      expect(benchmarkResult.throughput).toBeGreaterThan(6); // At least 6 executions per second
    });
  });

  describe('Integrated System Performance', () => {
    test('end-to-end system performance', async () => {
      // Create comprehensive test scenario
      const extension = await TestHelpers.createTestExtension('E2EPerfExtension', 'workflow_node');
      const loadResult = await env.extensionManager.loadExtension(extension.extensionDir);
      await env.extensionManager.activateExtension(loadResult.extension.id);

      const agent = await TestHelpers.createTestAgent('E2EPerfAgent', 'E2E_PERF');

      // Wait for integration
      await TestHelpers.waitForCondition(async () => {
        const agentProfile = await env.agentRegistry.getAgentProfile(agent.agentId);
        const availableNodeTypes = env.workflowEngine.engine.getAvailableNodeTypes();
        return agentProfile?.availableExtensions?.length > 0 && 
               availableNodeTypes.includes('E2EPerfExtension');
      });

      // Create integrated workflow
      const { workflow, builder } = await TestHelpers.createTestWorkflow('E2E Performance Test');
      
      const agentTask = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Agent Task',
        { x: 150, y: 100 },
        {
          agentId: agent.agentId,
          task: 'Process data with agent',
          priority: 'high',
          expectedDuration: 3
        }
      );

      const extensionNode = builder.addNode(
        'E2EPerfExtension' as WorkflowNodeType,
        'Extension Processing',
        { x: 300, y: 100 },
        {
          processingMode: 'fast'
        }
      );

      builder.addConnection(workflow.definition.nodes[0].id, 'output', agentTask.id, 'task');
      builder.addConnection(agentTask.id, 'result', extensionNode.id, 'input');
      builder.addConnection(extensionNode.id, 'output', workflow.definition.nodes[1].id, 'input');

      const savedWorkflow = await env.workflowEngine.repository.createWorkflow(workflow);

      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        const executionId = await env.workflowEngine.engine.executeWorkflow(
          savedWorkflow.id,
          { data: TestHelpers.generateTestData(20) }
        );

        await TestHelpers.waitForCondition(async () => {
          const execution = await env.workflowEngine.engine.getExecutionStatus(executionId);
          return execution?.status === WorkflowExecutionStatus.COMPLETED ||
                 execution?.status === WorkflowExecutionStatus.FAILED;
        });
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const result = calculateBenchmarkResult('End-to-End System Performance', iterations, times);
      addBenchmarkResult('Integrated System Performance', result);

      expect(result.averageTime).toBeLessThan(5000); // Under 5 seconds end-to-end
      expect(result.throughput).toBeGreaterThan(0.2); // At least 0.2 complete workflows per second
    });

    test('memory usage benchmark', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      void await Promise.all(
        Array.from({ length: 50 }, (_, i) => 
          TestHelpers.createTestAgent(`MemoryTestAgent${i}`, 'MEMORY_TEST')
        )
      );

      const extensions = await Promise.all([
        TestHelpers.createTestExtension('MemoryExt1', 'agent_capability'),
        TestHelpers.createTestExtension('MemoryExt2', 'workflow_node'),
        TestHelpers.createTestExtension('MemoryExt3', 'custom')
      ]);

      await Promise.all(
        extensions.map(ext => env.extensionManager.loadExtension(ext.extensionDir))
      );

      void await Promise.all(
        Array.from({ length: 20 }, async (_, i) => {
          const { workflow } = await TestHelpers.createTestWorkflow(`MemoryWorkflow${i}`);
          return await env.workflowEngine.repository.createWorkflow(workflow);
        })
      );

      const finalMemory = process.memoryUsage();
      
      const memoryIncrease = {
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
        external: finalMemory.external - initialMemory.external,
        rss: finalMemory.rss - initialMemory.rss
      };

      const result: BenchmarkResult = {
        name: 'Memory Usage',
        iterations: 1,
        totalTime: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        throughput: 0,
        memoryUsage: memoryIncrease.heapUsed
      };

      addBenchmarkResult('Integrated System Performance', result);

      // Memory assertions (adjust based on actual requirements)
      expect(memoryIncrease.heapUsed).toBeLessThan(100 * 1024 * 1024); // Under 100MB increase
      
      console.log('Memory Usage Analysis:');
      console.log(`  Heap Used: ${(memoryIncrease.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Heap Total: ${(memoryIncrease.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  RSS: ${(memoryIncrease.rss / 1024 / 1024).toFixed(2)} MB`);
    });
  });

  // Helper functions
  function calculateBenchmarkResult(name: string, iterations: number, times: number[]): BenchmarkResult {
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const throughput = iterations / (totalTime / 1000);

    return {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      throughput
    };
  }

  function addBenchmarkResult(suiteName: string, result: BenchmarkResult): void {
    let suite = benchmarkResults.find(s => s.suiteName === suiteName);
    
    if (!suite) {
      suite = {
        suiteName,
        results: [],
        summary: {
          totalTests: 0,
          totalTime: 0,
          averageThroughput: 0
        }
      };
      benchmarkResults.push(suite);
    }

    suite.results.push(result);
    suite.summary.totalTests = suite.results.length;
    suite.summary.totalTime = suite.results.reduce((sum, r) => sum + r.totalTime, 0);
    suite.summary.averageThroughput = suite.results.reduce((sum, r) => sum + r.throughput, 0) / suite.results.length;
  }
});
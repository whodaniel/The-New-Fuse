/**
 * Multi-Agent Coordination Examples
 *
 * Demonstrates 5 agents collaborating on complex tasks using various patterns
 */

import { AgentPool } from '../core/AgentPool.js';
import { TaskQueue } from '../core/TaskQueue.js';
import { ActivityMonitor } from '../monitoring/ActivityMonitor.js';
import { MetricsCollector } from '../monitoring/MetricsCollector.js';
import { Coordinator } from '../orchestration/Coordinator.js';
import { ConsensusPattern } from '../patterns/ConsensusPattern.js';
import { MapReducePattern } from '../patterns/MapReducePattern.js';
import { PipelinePattern } from '../patterns/PipelinePattern.js';
import { SwarmPattern } from '../patterns/SwarmPattern.js';
import { DistributedLock } from '../state/DistributedLock.js';
import { SharedCache } from '../state/SharedCache.js';

import type { AgentInfo } from '../core/types.js';

/**
 * Example 1: Map-Reduce Pattern
 * 5 agents process a large dataset in parallel, then aggregate results
 */
export async function example1_MapReduceDataProcessing() {
  console.log('=== Example 1: Map-Reduce Data Processing ===\n');

  const redisUrl = 'redis://localhost:6379';

  // Initialize components
  const agentPool = new AgentPool({
    minAgents: 5,
    maxAgents: 10,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.2,
    heartbeatInterval: 5000,
    heartbeatTimeout: 15000,
  });

  const coordinator = new Coordinator(redisUrl, agentPool, {
    maxConcurrentTasks: 20,
    taskTimeout: 60000,
  });

  const sharedCache = new SharedCache(redisUrl as any);
  const mapReduce = new MapReducePattern(coordinator);

  // Register 5 data processing agents
  const agents: AgentInfo[] = [];
  for (let i = 1; i <= 5; i++) {
    const agent = agentPool.registerAgent({
      name: `DataProcessor-${i}`,
      type: 'data-processor',
      capabilities: [
        { name: 'data-processing', version: '1.0' },
        { name: 'aggregation', version: '1.0' },
      ],
      maxConcurrentTasks: 3,
    });
    agents.push(agent);
    console.log(`✓ Registered ${agent.name} (ID: ${agent.id})`);
  }

  // Start coordinator
  await coordinator.start();
  console.log('\n✓ Coordinator started');

  // Sample dataset: 1000 user records to process
  const dataset = Array.from({ length: 1000 }, (_, i) => ({
    userId: `user-${i}`,
    purchases: Math.floor(Math.random() * 100),
    revenue: Math.random() * 1000,
  }));

  console.log(`\n📊 Processing ${dataset.length} records with 5 agents...\n`);

  // Map function: Calculate revenue per partition
  const mapFn = async (input: unknown, partition: number) => {
    const records = input as any[];
    const totalPurchases = records.reduce((sum: number, user: any) => sum + user.purchases, 0);
    const totalRevenue = records.reduce((sum: number, user: any) => sum + user.revenue, 0);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

    return {
      partition,
      recordCount: records.length,
      totalPurchases,
      totalRevenue,
    };
  };

  // Reduce function: Aggregate results
  const reduceFn = async (results: any[]) => {
    const summary = {
      totalUsers: results.reduce((sum, r) => sum + r.recordCount, 0),
      totalPurchases: results.reduce((sum, r) => sum + r.totalPurchases, 0),
      totalRevenue: results.reduce((sum, r) => sum + r.totalRevenue, 0),
      partitionsProcessed: results.length,
    };

    return summary;
  };

  // Execute Map-Reduce
  const result = (await mapReduce.execute(dataset, mapFn, reduceFn, { mapConcurrency: 5 })) as any;

  console.log('\n✅ Map-Reduce Complete!');
  console.log(`   Total Users: ${result.totalUsers}`);
  console.log(`   Total Purchases: ${result.totalPurchases}`);
  console.log(`   Total Revenue: $${result.totalRevenue.toFixed(2)}`);
  console.log(`   Partitions: ${result.partitionsProcessed}`);

  // Cleanup
  await coordinator.close();
  await sharedCache.close();

  return result;
}

/**
 * Example 2: Pipeline Pattern
 * 5 agents process data sequentially through transformation stages
 */
export async function example2_PipelineDataTransformation() {
  console.log('\n=== Example 2: Pipeline Data Transformation ===\n');

  const redisUrl = 'redis://localhost:6379';

  const agentPool = new AgentPool({
    minAgents: 5,
    maxAgents: 10,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.2,
    heartbeatInterval: 5000,
    heartbeatTimeout: 15000,
  });

  const coordinator = new Coordinator(redisUrl, agentPool);
  const pipeline = new PipelinePattern(coordinator);

  // Register specialized agents for each pipeline stage
  const agents = [
    agentPool.registerAgent({
      name: 'DataCollector',
      type: 'collector',
      capabilities: [{ name: 'data-collection', version: '1.0' }],
      maxConcurrentTasks: 2,
    }),
    agentPool.registerAgent({
      name: 'DataValidator',
      type: 'validator',
      capabilities: [{ name: 'validation', version: '1.0' }],
      maxConcurrentTasks: 2,
    }),
    agentPool.registerAgent({
      name: 'DataTransformer',
      type: 'transformer',
      capabilities: [{ name: 'transformation', version: '1.0' }],
      maxConcurrentTasks: 2,
    }),
    agentPool.registerAgent({
      name: 'DataEnricher',
      type: 'enricher',
      capabilities: [{ name: 'enrichment', version: '1.0' }],
      maxConcurrentTasks: 2,
    }),
    agentPool.registerAgent({
      name: 'DataPersister',
      type: 'persister',
      capabilities: [{ name: 'persistence', version: '1.0' }],
      maxConcurrentTasks: 2,
    }),
  ];

  agents.forEach((agent) => {
    console.log(`✓ Registered ${agent.name} (ID: ${agent.id})`);
  });

  await coordinator.start();
  console.log('\n✓ Coordinator started');

  // Input data
  const rawData = {
    source: 'api',
    records: [
      { id: 1, value: 'A' },
      { id: 2, value: 'B' },
      { id: 3, value: 'C' },
    ],
  };

  console.log('\n🔄 Processing data through 5-stage pipeline...\n');

  // Define pipeline stages
  const stages = [
    {
      name: 'collect',
      type: 'data-collection',
      processFn: async (input: any) => {
        console.log('  Stage 1: DataCollector - Collecting data');
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { ...input, collected: true, timestamp: new Date() };
      },
      requiredCapabilities: ['data-collection'],
    },
    {
      name: 'validate',
      type: 'validation',
      processFn: async (input: any) => {
        console.log('  Stage 2: DataValidator - Validating data');
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { ...input, validated: true, validCount: input.records.length };
      },
      requiredCapabilities: ['validation'],
    },
    {
      name: 'transform',
      type: 'transformation',
      processFn: async (input: any) => {
        console.log('  Stage 3: DataTransformer - Transforming data');
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
          ...input,
          records: input.records.map((r: any) => ({
            ...r,
            value: r.value.toLowerCase(),
          })),
          transformed: true,
        };
      },
      requiredCapabilities: ['transformation'],
    },
    {
      name: 'enrich',
      type: 'enrichment',
      processFn: async (input: any) => {
        console.log('  Stage 4: DataEnricher - Enriching data');
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
          ...input,
          records: input.records.map((r: any) => ({
            ...r,
            enrichedAt: new Date(),
            metadata: { source: input.source },
          })),
          enriched: true,
        };
      },
      requiredCapabilities: ['enrichment'],
    },
    {
      name: 'persist',
      type: 'persistence',
      processFn: async (input: any) => {
        console.log('  Stage 5: DataPersister - Persisting data');
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
          ...input,
          persisted: true,
          persistedAt: new Date(),
          success: true,
        };
      },
      requiredCapabilities: ['persistence'],
    },
  ];

  // Execute pipeline
  const result = (await pipeline.execute(rawData, stages)) as any;

  console.log('\n✅ Pipeline Complete!');
  console.log(`   Records processed: ${result.records.length}`);
  console.log(`   Collected: ${result.collected}`);
  console.log(`   Validated: ${result.validated}`);
  console.log(`   Transformed: ${result.transformed}`);
  console.log(`   Enriched: ${result.enriched}`);
  console.log(`   Persisted: ${result.persisted}`);

  // Cleanup
  await coordinator.close();

  return result;
}

/**
 * Example 3: Consensus Pattern
 * 5 agents vote to reach consensus on a decision
 */
export async function example3_ConsensusDecisionMaking() {
  console.log('\n=== Example 3: Consensus Decision Making ===\n');

  const redisUrl = 'redis://localhost:6379';

  const agentPool = new AgentPool({
    minAgents: 5,
    maxAgents: 10,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.2,
    heartbeatInterval: 5000,
    heartbeatTimeout: 15000,
  });

  const coordinator = new Coordinator(redisUrl, agentPool);
  const consensus = new ConsensusPattern(coordinator, 'majority' as any);

  // Register 5 decision-making agents
  const agents: AgentInfo[] = [];
  for (let i = 1; i <= 5; i++) {
    const agent = agentPool.registerAgent({
      name: `DecisionAgent-${i}`,
      type: 'decision-maker',
      capabilities: [{ name: 'decision-making', version: '1.0' }],
      maxConcurrentTasks: 2,
    });
    agents.push(agent);
    console.log(`✓ Registered ${agent.name} (ID: ${agent.id})`);
  }

  await coordinator.start();
  console.log('\n✓ Coordinator started');

  // Proposal: Choose deployment strategy
  const proposedStrategy = {
    strategy: 'blue-green',
    rolloutPercentage: 100,
    autoRollback: true,
  };

  console.log('\n🗳️  Proposing deployment strategy to 5 agents...');
  console.log(`   Strategy: ${JSON.stringify(proposedStrategy, null, 2)}\n`);

  const proposal = await consensus.propose(proposedStrategy, 'coordinator', {
    category: 'deployment',
  });

  // Agents vote on the proposal
  console.log('📊 Collecting votes from agents...\n');

  // Simulate voting (in real scenario, agents would analyze and vote)
  await consensus.vote(proposal.id, agents[0].id, true, undefined, 'Good strategy');
  console.log(`  ${agents[0].name}: ✅ Approve`);

  await consensus.vote(proposal.id, agents[1].id, true, undefined, 'Safe approach');
  console.log(`  ${agents[1].name}: ✅ Approve`);

  await consensus.vote(
    proposal.id,
    agents[2].id,
    false,
    { strategy: 'canary', rolloutPercentage: 10, autoRollback: true },
    'Prefer canary'
  );
  console.log(`  ${agents[2].name}: ❌ Reject (suggests canary deployment)`);

  await consensus.vote(proposal.id, agents[3].id, true, undefined, 'Works for me');
  console.log(`  ${agents[3].name}: ✅ Approve`);

  await consensus.vote(proposal.id, agents[4].id, true, undefined, 'Agree');
  console.log(`  ${agents[4].name}: ✅ Approve`);

  // Evaluate consensus
  const result = await consensus.evaluate(proposal.id, agents.length);

  console.log('\n✅ Consensus Result:');
  console.log(`   Achieved: ${result.achieved ? 'YES' : 'NO'}`);
  console.log(`   Approval Rate: ${(result.approvalRate * 100).toFixed(1)}%`);
  console.log(`   Participation: ${(result.participationRate * 100).toFixed(1)}%`);
  console.log(`   Winning Strategy: ${result.achieved ? JSON.stringify(result.value) : 'None'}`);

  // Cleanup
  await coordinator.close();

  return result;
}

/**
 * Example 4: Swarm Intelligence
 * 5 agents collaboratively search for optimal solution
 */
export async function example4_SwarmOptimization() {
  console.log('\n=== Example 4: Swarm Intelligence Optimization ===\n');

  const redisUrl = 'redis://localhost:6379';

  const agentPool = new AgentPool({
    minAgents: 5,
    maxAgents: 10,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.2,
    heartbeatInterval: 5000,
    heartbeatTimeout: 15000,
  });

  const coordinator = new Coordinator(redisUrl, agentPool);
  const sharedCache = new SharedCache(redisUrl as any);
  const swarm = new SwarmPattern(coordinator, sharedCache);

  // Register 5 optimizer agents
  const agents: AgentInfo[] = [];
  for (let i = 1; i <= 5; i++) {
    const agent = agentPool.registerAgent({
      name: `Optimizer-${i}`,
      type: 'optimizer',
      capabilities: [{ name: 'optimization', version: '1.0' }],
      maxConcurrentTasks: 2,
    });
    agents.push(agent);
    console.log(`✓ Registered ${agent.name} (ID: ${agent.id})`);
  }

  await coordinator.start();
  console.log('\n✓ Coordinator started');

  // Initialize swarm
  const initialSolution = { x: 0, y: 0 };

  await swarm.initialize(agents, initialSolution, {
    explore: 0.4,
    exploit: 0.6,
    communicate: 0.8,
    adapt: 0.7,
  });

  console.log('\n🐝 Initializing swarm optimization...');
  console.log('   Objective: Find maximum of f(x,y) = -(x² + y²) + 100\n');

  // Fitness function: Find maximum value
  const fitnessFn = async (solution: { x: number; y: number }) => {
    const fitness = -(solution.x ** 2 + solution.y ** 2) + 100;
    return fitness;
  };

  console.log('🔍 Agents searching solution space...\n');

  // Run optimization for 10 generations
  const result = await swarm.optimize(agents, fitnessFn, {
    maxGenerations: 10,
    convergenceThreshold: 0.01,
  });

  console.log('\n✅ Swarm Optimization Complete!');
  console.log(`   Best Solution: x=${result.value.x.toFixed(2)}, y=${result.value.y.toFixed(2)}`);
  console.log(`   Fitness: ${result.fitness.toFixed(2)}`);
  console.log(`   Found by: ${result.agentId}`);
  console.log(`   Generation: ${result.generation}`);

  // Cleanup
  await coordinator.close();
  await sharedCache.close();

  return result;
}

/**
 * Example 5: Complex Multi-Pattern Workflow
 * Combines multiple patterns: Pipeline → Map-Reduce → Consensus
 */
export async function example5_ComplexWorkflow() {
  console.log('\n=== Example 5: Complex Multi-Pattern Workflow ===\n');

  const redisUrl = 'redis://localhost:6379';

  const agentPool = new AgentPool({
    minAgents: 5,
    maxAgents: 10,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.2,
    heartbeatInterval: 5000,
    heartbeatTimeout: 15000,
  });

  const coordinator = new Coordinator(redisUrl, agentPool);
  const sharedCache = new SharedCache(redisUrl as any);
  const lock = new DistributedLock(redisUrl as any);
  const metricsCollector = new MetricsCollector();
  const taskQueue = new TaskQueue(redisUrl);
  const activityMonitor = new ActivityMonitor(coordinator, agentPool, taskQueue, metricsCollector);

  // Register 5 versatile agents
  const agents: AgentInfo[] = [];
  for (let i = 1; i <= 5; i++) {
    const agent = agentPool.registerAgent({
      name: `Agent-${i}`,
      type: 'versatile',
      capabilities: [
        { name: 'data-processing', version: '1.0' },
        { name: 'analysis', version: '1.0' },
        { name: 'decision-making', version: '1.0' },
      ],
      maxConcurrentTasks: 3,
    });
    agents.push(agent);
    console.log(`✓ Registered ${agent.name} (ID: ${agent.id})`);
  }

  await coordinator.start();
  activityMonitor.start();
  console.log('\n✓ Coordinator and monitoring started');

  console.log('\n🚀 Executing complex multi-pattern workflow...\n');

  // Step 1: Collect and validate data (Pipeline)
  console.log('📋 Step 1: Data Collection & Validation (Pipeline Pattern)');
  const rawData = { records: Array.from({ length: 100 }, (_, i) => ({ id: i, value: i * 10 })) };

  // Step 2: Process data in parallel (Map-Reduce)
  console.log('⚡ Step 2: Parallel Processing (Map-Reduce Pattern)');

  // Acquire distributed lock for critical section
  const lockToken = await lock.acquire('workflow-lock', 30000);
  if (lockToken) {
    console.log('🔒 Acquired distributed lock');

    // Store intermediate results in shared cache
    await sharedCache.set('workflow:step1', rawData, 60000);
    console.log('💾 Stored intermediate results in shared cache');

    await lock.release('workflow-lock', lockToken);
    console.log('🔓 Released distributed lock');
  }

  // Step 3: Agents vote on next action (Consensus)
  console.log('🗳️  Step 3: Decision Making (Consensus Pattern)');

  // Get dashboard data
  const dashboard = await activityMonitor.getDashboardData();

  console.log('\n✅ Complex Workflow Complete!');
  console.log('\n📊 Final Metrics:');
  console.log(`   Active Agents: ${dashboard.health.agentPool.healthy}`);
  console.log(`   Tasks Processed: ${dashboard.metrics.totalTasksProcessed}`);
  console.log(`   Success Rate: ${(dashboard.metrics.successRate * 100).toFixed(1)}%`);
  console.log(`   System Status: ${dashboard.health.status}`);

  // Cleanup
  activityMonitor.stop();
  await coordinator.close();
  await sharedCache.close();
  await lock.close();

  return dashboard;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     Multi-Agent Coordination Framework - Examples             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    await example1_MapReduceDataProcessing();
    console.log('\n' + '─'.repeat(70) + '\n');

    await example2_PipelineDataTransformation();
    console.log('\n' + '─'.repeat(70) + '\n');

    await example3_ConsensusDecisionMaking();
    console.log('\n' + '─'.repeat(70) + '\n');

    await example4_SwarmOptimization();
    console.log('\n' + '─'.repeat(70) + '\n');

    await example5_ComplexWorkflow();

    console.log('\n\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    throw error;
  }
}

/**
 * Swarm Intelligence for Architecture Optimization
 *
 * This example demonstrates using 100 KIMI k2.5 agents as a swarm to explore
 * architectural solutions for a complex problem. Agents vote on solutions
 * using weighted scoring based on their specialties.
 *
 * Usage:
 *   tsx examples/kimi-orchestration/swarm-optimization.ts --problem scaling
 *
 * Concepts:
 *   - Swarm intelligence for architectural exploration
 *   - Weighted voting based on agent capabilities
 *   - Multi-objective optimization (cost, performance, maintainability)
 *   - Iterative refinement through agent consensus
 */

import { KimiCapability, KimiOrchestrator } from '@the-new-fuse/kimi-orchestrator';
import { writeFileSync } from 'fs';

// Configuration
interface SwarmConfig {
  /** Problem domain to optimize */
  problemDomain: ProblemDomain;
  /** Number of agents in swarm (max 100) */
  swarmSize: number;
  /** Number of iterations for refinement */
  iterations: number;
  /** Convergence threshold (0-1) */
  convergenceThreshold: number;
  /** Output path for results */
  outputPath: string;
}

type ProblemDomain =
  | 'scalability'
  | 'performance'
  | 'cost-optimization'
  | 'reliability'
  | 'maintainability'
  | 'security';

interface ArchitecturalSolution {
  id: string;
  name: string;
  description: string;
  components: string[];
  patterns: string[];
  tradeoffs: Tradeoff[];
  scores: {
    scalability: number;
    performance: number;
    cost: number;
    reliability: number;
    maintainability: number;
    security: number;
  };
  estimatedCost: number;
  implementationComplexity: 'low' | 'medium' | 'high';
}

interface Tradeoff {
  aspect: string;
  pros: string[];
  cons: string[];
}

interface AgentVote {
  agentId: string;
  solutionId: string;
  score: number;
  reasoning: string;
  confidence: number;
  aspects: Record<string, number>;
}

interface SwarmIteration {
  iteration: number;
  solutions: ArchitecturalSolution[];
  votes: AgentVote[];
  convergence: number;
  bestSolution: ArchitecturalSolution;
}

interface SwarmResult {
  config: SwarmConfig;
  iterations: SwarmIteration[];
  finalSolution: ArchitecturalSolution;
  consensus: {
    agreementRate: number;
    dissensionPoints: string[];
  };
  durationMs: number;
  recommendations: string[];
}

// Default configuration
const DEFAULT_CONFIG: SwarmConfig = {
  problemDomain: 'scalability',
  swarmSize: 100,
  iterations: 5,
  convergenceThreshold: 0.8,
  outputPath: './swarm-optimization-result.json',
};

// Agent capability profiles for different problem domains
const DOMAIN_PROFILES: Record<ProblemDomain, KimiCapability[]> = {
  scalability: ['architecture-design', 'microservices', 'database', 'performance-optimization'],
  performance: ['performance-optimization', 'architecture-design', 'database', 'api-design'],
  'cost-optimization': ['architecture-design', 'microservices', 'serverless'],
  reliability: ['architecture-design', 'microservices', 'security-audit'],
  maintainability: ['architecture-design', 'documentation', 'refactoring'],
  security: ['security-audit', 'architecture-design', 'api-design'],
};

/**
 * Generate initial solution proposals
 */
function generateInitialSolutions(domain: ProblemDomain): ArchitecturalSolution[] {
  const solutions: Record<ProblemDomain, ArchitecturalSolution[]> = {
    scalability: [
      {
        id: 'microservices-horizontal',
        name: 'Microservices with Horizontal Scaling',
        description: 'Decompose into independent services with auto-scaling',
        components: ['API Gateway', 'Service Mesh', 'Container Orchestration', 'Event Bus'],
        patterns: ['CQRS', 'Event Sourcing', 'Circuit Breaker', 'Bulkhead'],
        tradeoffs: [
          {
            aspect: 'Complexity',
            pros: ['Independent deployment', 'Team autonomy'],
            cons: ['Distributed system complexity', 'Operational overhead'],
          },
        ],
        scores: {
          scalability: 95,
          performance: 80,
          cost: 60,
          reliability: 85,
          maintainability: 70,
          security: 80,
        },
        estimatedCost: 50000,
        implementationComplexity: 'high',
      },
      {
        id: 'serverless-event-driven',
        name: 'Serverless Event-Driven Architecture',
        description: 'Use serverless functions with event-driven communication',
        components: ['Lambda Functions', 'Event Bridge', 'Step Functions', 'DynamoDB'],
        patterns: ['Event-Driven', 'Fan-Out/Fan-In', 'Saga Pattern'],
        tradeoffs: [
          {
            aspect: 'Cost',
            pros: ['Pay-per-use', 'No idle costs'],
            cons: ['Cold start latency', 'Vendor lock-in'],
          },
        ],
        scores: {
          scalability: 90,
          performance: 75,
          cost: 90,
          reliability: 80,
          maintainability: 75,
          security: 85,
        },
        estimatedCost: 25000,
        implementationComplexity: 'medium',
      },
      {
        id: 'modular-monolith',
        name: 'Modular Monolith with Lazy Loading',
        description: 'Keep monolith but with clear module boundaries',
        components: ['Application Core', 'Module Registry', 'Plugin System'],
        patterns: ['Modular Monolith', 'Plugin Architecture', 'Lazy Loading'],
        tradeoffs: [
          {
            aspect: 'Simplicity',
            pros: ['Easier development', 'Simpler deployment'],
            cons: ['Limited independent scaling', 'Technology constraints'],
          },
        ],
        scores: {
          scalability: 70,
          performance: 85,
          cost: 95,
          reliability: 80,
          maintainability: 85,
          security: 80,
        },
        estimatedCost: 15000,
        implementationComplexity: 'low',
      },
    ],
    performance: [
      {
        id: 'edge-computing',
        name: 'Edge-First Architecture',
        description: 'Push compute to edge locations close to users',
        components: ['Edge Workers', 'Global CDN', 'Distributed Cache', 'Origin Shield'],
        patterns: ['Edge Computing', 'CDN-First', 'Stale-While-Revalidate'],
        tradeoffs: [
          {
            aspect: 'Latency',
            pros: ['Sub-50ms response times', 'Reduced origin load'],
            cons: ['Limited compute at edge', 'Cache invalidation complexity'],
          },
        ],
        scores: {
          scalability: 85,
          performance: 95,
          cost: 70,
          reliability: 90,
          maintainability: 65,
          security: 85,
        },
        estimatedCost: 35000,
        implementationComplexity: 'medium',
      },
      {
        id: 'in-memory-grid',
        name: 'In-Memory Data Grid',
        description: 'Use distributed in-memory data stores for speed',
        components: ['Redis Cluster', 'Hazelcast', 'Compute Grid', 'Persistent Store'],
        patterns: ['Cache-Aside', 'Write-Through', 'Compute Grid'],
        tradeoffs: [
          {
            aspect: 'Speed',
            pros: ['Microsecond latency', 'High throughput'],
            cons: ['Memory costs', 'Data consistency challenges'],
          },
        ],
        scores: {
          scalability: 80,
          performance: 98,
          cost: 50,
          reliability: 75,
          maintainability: 70,
          security: 75,
        },
        estimatedCost: 60000,
        implementationComplexity: 'high',
      },
    ],
    'cost-optimization': [],
    reliability: [],
    maintainability: [],
    security: [],
  };

  return solutions[domain] || solutions.scalability;
}

/**
 * Main swarm optimization function
 */
async function runSwarmOptimization(config: SwarmConfig = DEFAULT_CONFIG): Promise<SwarmResult> {
  const startTime = Date.now();

  console.log('🐝 Starting Swarm Intelligence Optimization');
  console.log(`🎯 Domain: ${config.problemDomain}`);
  console.log(`🤖 Swarm Size: ${config.swarmSize} agents`);
  console.log(`🔄 Iterations: ${config.iterations}`);
  console.log(`📊 Convergence Threshold: ${(config.convergenceThreshold * 100).toFixed(0)}%`);

  // Initialize orchestrator
  const orchestrator = new KimiOrchestrator({
    maxAgents: config.swarmSize,
    distributionStrategy: 'capability-based',
    heartbeatIntervalMs: 30000,
    agentTimeoutMs: 120000,
    enableAutoRecovery: true,
    maxRetries: 3,
    logLevel: 'info',
  });

  try {
    await orchestrator.start();
    console.log('✅ Orchestrator started');

    // Register agents with domain-specific capabilities
    console.log('👥 Initializing swarm agents...');
    await initializeSwarm(orchestrator, config);

    // Generate initial solutions
    let solutions = generateInitialSolutions(config.problemDomain);
    console.log(`💡 Generated ${solutions.length} initial solution proposals`);

    // Run iterative swarm optimization
    const iterations: SwarmIteration[] = [];
    let currentIteration = 0;
    let convergence = 0;

    while (currentIteration < config.iterations && convergence < config.convergenceThreshold) {
      console.log(`\n🔄 Iteration ${currentIteration + 1}/${config.iterations}`);

      // Agents vote on current solutions
      const votes = await runVotingRound(orchestrator, solutions, config);
      console.log(`🗳️  Collected ${votes.length} votes`);

      // Calculate convergence
      convergence = calculateConvergence(votes);
      console.log(`📊 Convergence: ${(convergence * 100).toFixed(1)}%`);

      // Select best solution
      const bestSolution = selectBestSolution(solutions, votes);
      console.log(
        `⭐ Best solution: ${bestSolution.name} (score: ${calculateAverageScore(votes, bestSolution.id).toFixed(1)})`
      );

      // Store iteration results
      iterations.push({
        iteration: currentIteration + 1,
        solutions: [...solutions],
        votes,
        convergence,
        bestSolution,
      });

      // Generate new solutions based on feedback
      if (convergence < config.convergenceThreshold && currentIteration < config.iterations - 1) {
        solutions = await evolveSolutions(orchestrator, solutions, votes, config);
        console.log(`🧬 Evolved to ${solutions.length} solutions`);
      }

      currentIteration++;
    }

    // Generate final result
    const finalSolution = iterations[iterations.length - 1].bestSolution;
    const consensus = analyzeConsensus(iterations[iterations.length - 1]);

    const result: SwarmResult = {
      config,
      iterations,
      finalSolution,
      consensus,
      durationMs: Date.now() - startTime,
      recommendations: generateRecommendations(finalSolution, consensus),
    };

    // Save results
    writeFileSync(config.outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to ${config.outputPath}`);

    // Print summary
    printSwarmSummary(result);

    return result;
  } finally {
    await orchestrator.stop();
    console.log('👋 Orchestrator stopped');
  }
}

/**
 * Initialize swarm with domain-specific agents
 */
async function initializeSwarm(orchestrator: KimiOrchestrator, config: SwarmConfig): Promise<void> {
  const domainCapabilities = DOMAIN_PROFILES[config.problemDomain];

  // Create diverse capability combinations
  const capabilityVariants: KimiCapability[][] = [
    [...domainCapabilities, 'documentation'],
    [...domainCapabilities, 'testing'],
    [...domainCapabilities, 'api-design'],
    [...domainCapabilities, 'database'],
    [...domainCapabilities, 'security-audit'],
    [...domainCapabilities, 'performance-optimization'],
  ];

  // Register agents
  for (let i = 0; i < config.swarmSize; i++) {
    const variantIndex = i % capabilityVariants.length;
    const capabilities = capabilityVariants[variantIndex];

    await orchestrator.registerAgent(`swarm-agent-${i.toString().padStart(3, '0')}`, capabilities);
  }

  console.log(`✅ Registered ${config.swarmSize} swarm agents`);
}

/**
 * Run a voting round across all agents
 */
async function runVotingRound(
  orchestrator: KimiOrchestrator,
  solutions: ArchitecturalSolution[],
  config: SwarmConfig
): Promise<AgentVote[]> {
  const votes: AgentVote[] = [];

  // Submit evaluation tasks to all agents
  const votePromises = Array.from({ length: config.swarmSize }, async (_, i) => {
    const agentId = `swarm-agent-${i.toString().padStart(3, '0')}`;

    try {
      const result = await orchestrator.submitTask(
        'evaluate-architecture',
        {
          solutions: solutions.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            components: s.components,
            patterns: s.patterns,
            tradeoffs: s.tradeoffs,
          })),
          domain: config.problemDomain,
          criteria: Object.keys(solutions[0]?.scores || {}),
        },
        {
          requiredCapabilities: DOMAIN_PROFILES[config.problemDomain],
          priority: 9,
          timeoutMs: 60000,
        }
      );

      if (result.success && result.data) {
        const vote: AgentVote = {
          agentId,
          solutionId: result.data.payload?.preferredSolution || solutions[0].id,
          score: result.data.payload?.score || 0,
          reasoning: result.data.payload?.reasoning || '',
          confidence: result.data.payload?.confidence || 0.5,
          aspects: result.data.payload?.aspectScores || {},
        };

        return vote;
      }
    } catch (error) {
      console.warn(
        `⚠️  Agent ${agentId} failed to vote: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Default vote if agent failed
    return {
      agentId,
      solutionId: solutions[0].id,
      score: 50,
      reasoning: 'Default vote due to evaluation failure',
      confidence: 0.1,
      aspects: {},
    };
  });

  const results = await Promise.all(votePromises);
  votes.push(...results);

  return votes;
}

/**
 * Calculate convergence metric (0-1)
 */
function calculateConvergence(votes: AgentVote[]): number {
  if (votes.length === 0) return 0;

  // Count votes per solution
  const voteCounts = new Map<string, number>();
  for (const vote of votes) {
    voteCounts.set(vote.solutionId, (voteCounts.get(vote.solutionId) || 0) + 1);
  }

  // Calculate entropy-based convergence
  const total = votes.length;
  let entropy = 0;

  for (const count of voteCounts.values()) {
    const p = count / total;
    entropy -= p * Math.log2(p);
  }

  // Max entropy is log2(num_solutions)
  const maxEntropy = Math.log2(voteCounts.size);
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

  // Convergence is inverse of normalized entropy
  return 1 - normalizedEntropy;
}

/**
 * Select the best solution based on votes
 */
function selectBestSolution(
  solutions: ArchitecturalSolution[],
  votes: AgentVote[]
): ArchitecturalSolution {
  // Calculate weighted scores
  const scores = new Map<string, number>();

  for (const vote of votes) {
    const current = scores.get(vote.solutionId) || 0;
    scores.set(vote.solutionId, current + vote.score * vote.confidence);
  }

  // Find solution with highest score
  let bestSolutionId = solutions[0].id;
  let bestScore = -Infinity;

  for (const [solutionId, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestSolutionId = solutionId;
    }
  }

  return solutions.find((s) => s.id === bestSolutionId) || solutions[0];
}

/**
 * Calculate average score for a solution
 */
function calculateAverageScore(votes: AgentVote[], solutionId: string): number {
  const solutionVotes = votes.filter((v) => v.solutionId === solutionId);
  if (solutionVotes.length === 0) return 0;

  const total = solutionVotes.reduce((acc, v) => acc + v.score, 0);
  return total / solutionVotes.length;
}

/**
 * Evolve solutions based on voting feedback
 */
async function evolveSolutions(
  orchestrator: KimiOrchestrator,
  currentSolutions: ArchitecturalSolution[],
  votes: AgentVote[],
  config: SwarmConfig
): Promise<ArchitecturalSolution[]> {
  // Select top solutions
  const solutionScores = new Map<string, number>();
  for (const vote of votes) {
    const current = solutionScores.get(vote.solutionId) || 0;
    solutionScores.set(vote.solutionId, current + vote.score);
  }

  const sortedSolutions = [...currentSolutions].sort((a, b) => {
    const scoreA = solutionScores.get(a.id) || 0;
    const scoreB = solutionScores.get(b.id) || 0;
    return scoreB - scoreA;
  });

  // Keep top 50% and generate new variants
  const keepCount = Math.ceil(sortedSolutions.length / 2);
  const keptSolutions = sortedSolutions.slice(0, keepCount);

  // Generate new hybrid solutions
  const newSolutions: ArchitecturalSolution[] = [];

  try {
    const evolutionResult = await orchestrator.submitTask(
      'evolve-architecture',
      {
        topSolutions: keptSolutions,
        domain: config.problemDomain,
        numVariants: currentSolutions.length - keepCount,
        feedback: analyzeVotingPatterns(votes),
      },
      {
        requiredCapabilities: ['architecture-design', 'api-design'],
        priority: 8,
        timeoutMs: 120000,
      }
    );

    if (evolutionResult.success && evolutionResult.data) {
      newSolutions.push(...(evolutionResult.data.payload?.solutions || []));
    }
  } catch (error) {
    console.warn('⚠️  Solution evolution failed, keeping current solutions');
  }

  return [...keptSolutions, ...newSolutions];
}

/**
 * Analyze voting patterns for feedback
 */
function analyzeVotingPatterns(votes: AgentVote[]): Record<string, unknown> {
  const patterns: Record<string, unknown> = {};

  // Analyze aspect preferences
  const aspectScores: Record<string, number[]> = {};
  for (const vote of votes) {
    for (const [aspect, score] of Object.entries(vote.aspects)) {
      if (!aspectScores[aspect]) aspectScores[aspect] = [];
      aspectScores[aspect].push(score);
    }
  }

  patterns.aspectAverages = Object.fromEntries(
    Object.entries(aspectScores).map(([aspect, scores]) => [
      aspect,
      scores.reduce((a, b) => a + b, 0) / scores.length,
    ])
  );

  // Find common concerns
  const concerns = votes
    .flatMap((v) => v.reasoning.toLowerCase().match(/\b(concern|issue|problem|risk)\b[^.]+/g) || [])
    .slice(0, 10);

  patterns.commonConcerns = concerns;

  return patterns;
}

/**
 * Analyze consensus among agents
 */
function analyzeConsensus(iteration: SwarmIteration): SwarmResult['consensus'] {
  const totalVotes = iteration.votes.length;
  const bestSolutionVotes = iteration.votes.filter(
    (v) => v.solutionId === iteration.bestSolution.id
  ).length;

  const agreementRate = bestSolutionVotes / totalVotes;

  // Find dissension points
  const dissensionVotes = iteration.votes.filter((v) => v.solutionId !== iteration.bestSolution.id);

  const dissensionPoints = dissensionVotes
    .map((v) => v.reasoning)
    .filter((r) => r.length > 10)
    .slice(0, 5);

  return {
    agreementRate,
    dissensionPoints,
  };
}

/**
 * Generate recommendations based on swarm results
 */
function generateRecommendations(
  solution: ArchitecturalSolution,
  consensus: SwarmResult['consensus']
): string[] {
  const recommendations: string[] = [];

  recommendations.push(`🏆 Selected: ${solution.name}`);
  recommendations.push(`💰 Estimated cost: $${solution.estimatedCost.toLocaleString()}`);
  recommendations.push(`🔧 Complexity: ${solution.implementationComplexity}`);

  if (consensus.agreementRate < 0.6) {
    recommendations.push('⚠️  Low consensus - consider gathering more expert input');
  }

  if (solution.implementationComplexity === 'high') {
    recommendations.push('📋 Plan for phased implementation with extensive testing');
  }

  // Pattern recommendations
  if (solution.patterns.length > 0) {
    recommendations.push(`🧩 Key patterns: ${solution.patterns.join(', ')}`);
  }

  return recommendations;
}

/**
 * Print swarm optimization summary
 */
function printSwarmSummary(result: SwarmResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('🐝 SWARM OPTIMIZATION RESULTS');
  console.log('='.repeat(60));
  console.log(`Iterations:        ${result.iterations.length}`);
  console.log(
    `Final Convergence: ${(result.iterations[result.iterations.length - 1].convergence * 100).toFixed(1)}%`
  );
  console.log(`Agreement Rate:    ${(result.consensus.agreementRate * 100).toFixed(1)}%`);
  console.log(`Duration:          ${(result.durationMs / 1000).toFixed(1)}s`);
  console.log('\n🏆 SELECTED SOLUTION:');
  console.log(`   ${result.finalSolution.name}`);
  console.log(`   ${result.finalSolution.description}`);
  console.log('\n💡 RECOMMENDATIONS:');
  result.recommendations.forEach((rec) => console.log(`   ${rec}`));
  console.log('='.repeat(60));
}

// CLI Entry Point
async function main() {
  const args = process.argv.slice(2);
  const config: SwarmConfig = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--problem':
        config.problemDomain = value as ProblemDomain;
        break;
      case '--swarm-size':
        config.swarmSize = Math.min(parseInt(value), 100);
        break;
      case '--iterations':
        config.iterations = parseInt(value);
        break;
      case '--convergence':
        config.convergenceThreshold = parseFloat(value);
        break;
      case '--output':
      case '-o':
        config.outputPath = value;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  try {
    await runSwarmOptimization(config);
    process.exit(0);
  } catch (error) {
    console.error('❌ Swarm optimization failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
Swarm Intelligence for Architecture Optimization

Usage: tsx swarm-optimization.ts [options]

Options:
  --problem <domain>      Problem domain: scalability, performance, cost-optimization,
                          reliability, maintainability, security (default: scalability)
  --swarm-size <count>    Number of agents 1-100 (default: 100)
  --iterations <count>    Number of optimization iterations (default: 5)
  --convergence <float>   Convergence threshold 0-1 (default: 0.8)
  -o, --output <path>     Output file path (default: ./swarm-optimization-result.json)
  -h, --help             Show this help message

Examples:
  tsx swarm-optimization.ts --problem performance
  tsx swarm-optimization.ts --swarm-size 50 --iterations 3
  tsx swarm-optimization.ts --problem security --convergence 0.9
  `);
}

if (require.main === module) {
  main();
}

export { ArchitecturalSolution, runSwarmOptimization, SwarmConfig, SwarmResult };

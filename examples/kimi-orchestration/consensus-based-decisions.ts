/**
 * Consensus-Based Architectural Decision Making with 100 KIMI k2.5 Agents
 *
 * This example demonstrates how to make important architectural decisions using
 * consensus voting among 100 specialized agents. Each agent evaluates proposals
 * from their area of expertise, and decisions require a configurable threshold
 * of agreement.
 *
 * Usage:
 *   tsx examples/kimi-orchestration/consensus-based-decisions.ts --topic "database-selection"
 *
 * Features:
 *   - Weighted voting based on agent expertise
 *   - Multiple consensus algorithms (simple majority, supermajority, quadratic)
 *   - Dissent capture and minority opinion preservation
 *   - Confidence scoring for decisions
 *   - Automatic run-off voting for close decisions
 */

import { KimiCapability, KimiOrchestrator } from '@the-new-fuse/kimi-orchestrator';
import { writeFileSync } from 'fs';

// Configuration
interface ConsensusConfig {
  /** Decision topic */
  topic: string;
  /** Number of agents participating */
  participantCount: number;
  /** Consensus threshold (0-1) */
  consensusThreshold: number;
  /** Consensus algorithm */
  algorithm: ConsensusAlgorithm;
  /** Minimum quorum for valid decision */
  minQuorum: number;
  /** Enable run-off voting for close results */
  enableRunoff: boolean;
  /** Run-off threshold (difference < this triggers run-off) */
  runoffThreshold: number;
  /** Output file path */
  outputPath: string;
}

type ConsensusAlgorithm =
  | 'simple-majority' // >50% of votes
  | 'supermajority' // >66% of votes
  | 'unanimous' // 100% agreement
  | 'weighted-expertise' // Weighted by capability match
  | 'quadratic' // Quadratic voting
  | 'liquid-democracy'; // Delegated voting

interface DecisionProposal {
  id: string;
  title: string;
  description: string;
  options: ProposalOption[];
  criteria: EvaluationCriterion[];
  context: Record<string, unknown>;
}

interface ProposalOption {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedCost: number;
  estimatedTimeline: string;
}

interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  requiredCapability?: KimiCapability;
}

interface AgentVote {
  agentId: string;
  agentCapabilities: KimiCapability[];
  selectedOption: string;
  confidence: number;
  reasoning: string;
  criteriaScores: Record<string, number>;
  concerns: string[];
  alternativesConsidered: string[];
}

interface ConsensusResult {
  proposal: DecisionProposal;
  votes: AgentVote[];
  tallies: Record<string, { count: number; weight: number; percentage: number }>;
  winningOption: ProposalOption | null;
  consensusAchieved: boolean;
  consensusLevel: number;
  confidenceScore: number;
  dissent: {
    minorityOptions: string[];
    keyConcerns: string[];
    alternativeProposals: string[];
  };
  algorithm: ConsensusAlgorithm;
  durationMs: number;
  runOffRequired: boolean;
}

interface DecisionReport {
  config: ConsensusConfig;
  result: ConsensusResult;
  recommendations: string[];
  riskAssessment: RiskAssessment;
  implementationGuide: ImplementationGuide;
  timestamp: string;
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    mitigation: string;
  }>;
}

interface ImplementationGuide {
  steps: string[];
  timeline: string;
  resources: string[];
  checkpoints: string[];
}

// Default configuration
const DEFAULT_CONFIG: ConsensusConfig = {
  topic: 'architecture-decision',
  participantCount: 100,
  consensusThreshold: 0.7, // 70% agreement
  algorithm: 'weighted-expertise',
  minQuorum: 0.8, // 80% participation required
  enableRunoff: true,
  runoffThreshold: 0.1, // 10% difference triggers runoff
  outputPath: './consensus-decision-report.json',
};

// Sample proposals for different decision types
const SAMPLE_PROPOSALS: Record<string, DecisionProposal> = {
  'database-selection': {
    id: 'db-selection-001',
    title: 'Primary Database Technology Selection',
    description: 'Select the primary database technology for the new microservices architecture',
    options: [
      {
        id: 'postgresql',
        name: 'PostgreSQL with Read Replicas',
        description: 'Use PostgreSQL as the primary database with read replicas for scaling',
        pros: ['ACID compliance', 'Rich ecosystem', 'JSON support', 'Proven at scale'],
        cons: ['Vertical scaling limits', 'Complex sharding', 'Read replica lag'],
        estimatedCost: 5000,
        estimatedTimeline: '2 weeks',
      },
      {
        id: 'mongodb',
        name: 'MongoDB Atlas',
        description: 'Use MongoDB Atlas with automatic sharding',
        pros: ['Horizontal scaling', 'Flexible schema', 'Built-in sharding', 'Managed service'],
        cons: ['Eventual consistency', 'Less mature ecosystem', 'Higher storage costs'],
        estimatedCost: 8000,
        estimatedTimeline: '1 week',
      },
      {
        id: 'dynamodb',
        name: 'Amazon DynamoDB',
        description: 'Use DynamoDB with DynamoDB Streams',
        pros: ['Serverless scaling', 'Single-digit ms latency', 'Managed service', 'Global tables'],
        cons: ['Vendor lock-in', 'Query limitations', 'Cost at scale'],
        estimatedCost: 12000,
        estimatedTimeline: '1 week',
      },
    ],
    criteria: [
      {
        id: 'scalability',
        name: 'Scalability',
        description: 'Ability to handle 10x growth',
        weight: 0.25,
        requiredCapability: 'architecture-design',
      },
      {
        id: 'reliability',
        name: 'Reliability',
        description: 'Uptime and data durability',
        weight: 0.25,
        requiredCapability: 'database',
      },
      {
        id: 'performance',
        name: 'Performance',
        description: 'Query response time',
        weight: 0.2,
        requiredCapability: 'performance-optimization',
      },
      { id: 'cost', name: 'Cost Efficiency', description: 'Total cost of ownership', weight: 0.15 },
      {
        id: 'maintainability',
        name: 'Maintainability',
        description: 'Ease of maintenance',
        weight: 0.15,
      },
    ],
    context: {
      currentScale: '100k daily active users',
      projectedScale: '1M daily active users in 12 months',
      teamExpertise: ['PostgreSQL', 'Redis'],
      budget: '$15000/month infrastructure',
    },
  },
  'api-strategy': {
    id: 'api-strategy-001',
    title: 'API Architecture Strategy',
    description: 'Determine the primary API architecture for the platform',
    options: [
      {
        id: 'rest',
        name: 'REST with OpenAPI',
        description: 'Traditional RESTful API with OpenAPI specification',
        pros: ['Widely understood', 'Great tooling', 'Caching support', 'Mature ecosystem'],
        cons: ['Over/under fetching', 'Multiple round trips', 'Versioning challenges'],
        estimatedCost: 3000,
        estimatedTimeline: '2 weeks',
      },
      {
        id: 'graphql',
        name: 'GraphQL Federation',
        description: 'GraphQL with Apollo Federation',
        pros: ['Flexible queries', 'Single endpoint', 'Strong typing', 'Federation support'],
        cons: ['Caching complexity', 'Query complexity attacks', 'Learning curve'],
        estimatedCost: 6000,
        estimatedTimeline: '4 weeks',
      },
      {
        id: 'grpc',
        name: 'gRPC with REST Gateway',
        description: 'gRPC for internal, REST gateway for external',
        pros: ['High performance', 'Strong typing', 'Streaming support', 'Code generation'],
        cons: ['Browser support limited', 'Complex infrastructure', 'Less debuggable'],
        estimatedCost: 8000,
        estimatedTimeline: '6 weeks',
      },
    ],
    criteria: [
      {
        id: 'performance',
        name: 'Performance',
        description: 'Response time and throughput',
        weight: 0.3,
        requiredCapability: 'performance-optimization',
      },
      {
        id: 'developer-experience',
        name: 'Developer Experience',
        description: 'Ease of use for API consumers',
        weight: 0.25,
        requiredCapability: 'api-design',
      },
      {
        id: 'scalability',
        name: 'Scalability',
        description: 'Ability to scale with growth',
        weight: 0.25,
        requiredCapability: 'architecture-design',
      },
      {
        id: 'maintainability',
        name: 'Maintainability',
        description: 'Long-term maintenance cost',
        weight: 0.2,
      },
    ],
    context: {
      clients: ['Web SPA', 'Mobile apps', 'Third-party integrators'],
      latencyRequirements: 'p99 < 200ms',
      teamSize: 12,
    },
  },
};

/**
 * Main consensus decision function
 */
async function runConsensusDecision(
  config: ConsensusConfig = DEFAULT_CONFIG
): Promise<DecisionReport> {
  const startTime = Date.now();

  console.log('🏛️  Starting Consensus-Based Decision Making');
  console.log(`📋 Topic: ${config.topic}`);
  console.log(`🤖 Participants: ${config.participantCount}`);
  console.log(`🎯 Consensus Threshold: ${(config.consensusThreshold * 100).toFixed(0)}%`);
  console.log(`⚖️  Algorithm: ${config.algorithm}`);

  // Get proposal
  const proposal = SAMPLE_PROPOSALS[config.topic] || generateGenericProposal(config.topic);
  console.log(`💡 Evaluating: ${proposal.title}`);
  console.log(`   Options: ${proposal.options.map((o) => o.name).join(', ')}`);

  // Initialize orchestrator
  const orchestrator = new KimiOrchestrator({
    maxAgents: config.participantCount,
    distributionStrategy: 'capability-based',
    heartbeatIntervalMs: 30000,
    agentTimeoutMs: 120000,
    enableAutoRecovery: true,
    maxRetries: 2,
    logLevel: 'info',
  });

  try {
    await orchestrator.start();
    console.log('✅ Orchestrator started');

    // Register agents with diverse expertise
    console.log('👥 Registering expert agents...');
    await registerExpertAgents(orchestrator, proposal, config);

    // Conduct voting
    console.log('🗳️  Conducting vote...');
    const votes = await conductVoting(orchestrator, proposal, config);
    console.log(`📊 Received ${votes.length} votes`);

    // Check quorum
    const participationRate = votes.length / config.participantCount;
    if (participationRate < config.minQuorum) {
      console.warn(
        `⚠️  Quorum not reached: ${(participationRate * 100).toFixed(0)}% < ${(config.minQuorum * 100).toFixed(0)}%`
      );
    }

    // Calculate consensus
    const result = calculateConsensus(votes, proposal, config);

    // Run-off voting if needed
    if (result.runOffRequired && config.enableRunoff) {
      console.log('🔄 Run-off voting required...');
      const runOffResult = await conductRunoffVoting(orchestrator, result, proposal, config);
      Object.assign(result, runOffResult);
    }

    // Generate report
    console.log('📊 Generating decision report...');
    const report = generateDecisionReport(result, proposal, config, Date.now() - startTime);

    // Save report
    writeFileSync(config.outputPath, JSON.stringify(report, null, 2));
    console.log(`💾 Report saved to ${config.outputPath}`);

    // Print summary
    printDecisionSummary(report);

    return report;
  } finally {
    await orchestrator.stop();
    console.log('👋 Orchestrator stopped');
  }
}

/**
 * Register agents with expertise relevant to the proposal
 */
async function registerExpertAgents(
  orchestrator: KimiOrchestrator,
  proposal: DecisionProposal,
  config: ConsensusConfig
): Promise<void> {
  // Extract required capabilities from criteria
  const requiredCapabilities = proposal.criteria
    .map((c) => c.requiredCapability)
    .filter((c): c is KimiCapability => Boolean(c));

  // Create diverse expert profiles
  const expertProfiles: KimiCapability[][] = [
    ['architecture-design', 'analysis'],
    ['performance-optimization', 'analysis'],
    ['database', 'analysis'],
    ['api-design', 'analysis'],
    ['security-audit', 'analysis'],
    ['microservices', 'architecture-design'],
    ['nodejs', 'architecture-design'],
    ['typescript', 'analysis'],
  ];

  // Add criteria-specific capabilities
  for (const capability of requiredCapabilities) {
    expertProfiles.push([capability, 'analysis']);
  }

  // Register agents
  for (let i = 0; i < config.participantCount; i++) {
    const profile = expertProfiles[i % expertProfiles.length];
    await orchestrator.registerAgent(`voter-${i.toString().padStart(3, '0')}`, profile);
  }

  console.log(`✅ Registered ${config.participantCount} expert agents`);
}

/**
 * Conduct voting across all agents
 */
async function conductVoting(
  orchestrator: KimiOrchestrator,
  proposal: DecisionProposal,
  config: ConsensusConfig
): Promise<AgentVote[]> {
  const votes: AgentVote[] = [];

  const votePromises = Array.from({ length: config.participantCount }, async (_, i) => {
    const agentId = `voter-${i.toString().padStart(3, '0')}`;

    try {
      const result = await orchestrator.submitTask(
        'evaluate-proposal',
        {
          proposal: {
            id: proposal.id,
            title: proposal.title,
            description: proposal.description,
            options: proposal.options,
            criteria: proposal.criteria,
          },
          context: proposal.context,
        },
        {
          requiredCapabilities: ['analysis', 'architecture-design'],
          priority: 10,
          timeoutMs: 60000,
        }
      );

      if (result.success && result.data) {
        const vote: AgentVote = {
          agentId,
          agentCapabilities: result.data.payload?.capabilities || [],
          selectedOption: result.data.payload?.selectedOption || proposal.options[0].id,
          confidence: result.data.payload?.confidence || 0.5,
          reasoning: result.data.payload?.reasoning || '',
          criteriaScores: result.data.payload?.criteriaScores || {},
          concerns: result.data.payload?.concerns || [],
          alternativesConsidered: result.data.payload?.alternativesConsidered || [],
        };

        return vote;
      }
    } catch (error) {
      console.warn(
        `⚠️  Agent ${agentId} failed to vote: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }

    // Default abstention vote
    return {
      agentId,
      agentCapabilities: [],
      selectedOption: 'abstain',
      confidence: 0,
      reasoning: 'Failed to evaluate',
      criteriaScores: {},
      concerns: [],
      alternativesConsidered: [],
    };
  });

  const results = await Promise.all(votePromises);
  votes.push(...results.filter((v) => v.selectedOption !== 'abstain'));

  return votes;
}

/**
 * Calculate consensus from votes
 */
function calculateConsensus(
  votes: AgentVote[],
  proposal: DecisionProposal,
  config: ConsensusConfig
): ConsensusResult {
  // Calculate tallies based on algorithm
  const tallies: ConsensusResult['tallies'] = {};

  for (const option of proposal.options) {
    tallies[option.id] = { count: 0, weight: 0, percentage: 0 };
  }

  // Count votes
  for (const vote of votes) {
    if (!tallies[vote.selectedOption]) continue;

    let weight = 1;

    // Apply algorithm-specific weighting
    switch (config.algorithm) {
      case 'weighted-expertise':
        // Weight by matching capabilities to criteria
        const relevantCapabilities = vote.agentCapabilities.filter((cap) =>
          proposal.criteria.some((c) => c.requiredCapability === cap)
        );
        weight = 1 + relevantCapabilities.length * 0.5;
        break;

      case 'quadratic':
        // Quadratic voting - confidence acts as "voice credits"
        weight = Math.sqrt(vote.confidence * 10);
        break;

      case 'liquid-democracy':
        // Simplified liquid democracy - higher confidence = more delegated weight
        weight = 1 + vote.confidence;
        break;

      default:
        weight = 1;
    }

    tallies[vote.selectedOption].count++;
    tallies[vote.selectedOption].weight += weight;
  }

  // Calculate percentages
  const totalWeight = Object.values(tallies).reduce((sum, t) => sum + t.weight, 0);
  for (const tally of Object.values(tallies)) {
    tally.percentage = totalWeight > 0 ? tally.weight / totalWeight : 0;
  }

  // Find winner
  const sortedOptions = Object.entries(tallies).sort((a, b) => b[1].weight - a[1].weight);

  const [winnerId, winnerTally] = sortedOptions[0];
  const runnerUp = sortedOptions[1]?.[1];

  const winningOption = proposal.options.find((o) => o.id === winnerId) || null;
  const consensusLevel = winnerTally.percentage;
  const consensusAchieved = consensusLevel >= config.consensusThreshold;

  // Check if run-off is needed
  const runOffRequired =
    config.enableRunoff &&
    runnerUp &&
    winnerTally.percentage - runnerUp.percentage < config.runoffThreshold;

  // Calculate confidence score
  const avgConfidence = votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;

  // Collect dissent
  const minorityOptions = sortedOptions
    .slice(1)
    .filter(([, t]) => t.percentage > 0.1)
    .map(([id]) => id);

  const keyConcerns = [...new Set(votes.flatMap((v) => v.concerns))].slice(0, 10);
  const alternativeProposals = [...new Set(votes.flatMap((v) => v.alternativesConsidered))].slice(
    0,
    5
  );

  return {
    proposal,
    votes,
    tallies,
    winningOption,
    consensusAchieved,
    consensusLevel,
    confidenceScore: avgConfidence,
    dissent: {
      minorityOptions,
      keyConcerns,
      alternativeProposals,
    },
    algorithm: config.algorithm,
    durationMs: 0,
    runOffRequired,
  };
}

/**
 * Conduct run-off voting between top options
 */
async function conductRunoffVoting(
  orchestrator: KimiOrchestrator,
  initialResult: ConsensusResult,
  proposal: DecisionProposal,
  config: ConsensusConfig
): Promise<Partial<ConsensusResult>> {
  // Get top 2 options
  const sortedOptions = Object.entries(initialResult.tallies)
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, 2)
    .map(([id]) => proposal.options.find((o) => o.id === id))
    .filter((o): o is ProposalOption => Boolean(o));

  console.log(`   Run-off between: ${sortedOptions.map((o) => o.name).join(' vs ')}`);

  // Create run-off proposal
  const runOffProposal: DecisionProposal = {
    ...proposal,
    id: `${proposal.id}-runoff`,
    title: `${proposal.title} (Run-off)`,
    options: sortedOptions,
  };

  // Re-vote with simplified options
  const runOffVotes = await conductVoting(orchestrator, runOffProposal, {
    ...config,
    consensusThreshold: 0.5, // Simple majority for run-off
  });

  // Recalculate with run-off votes
  return calculateConsensus(runOffVotes, runOffProposal, config);
}

/**
 * Generate generic proposal for unknown topics
 */
function generateGenericProposal(topic: string): DecisionProposal {
  return {
    id: `generic-${Date.now()}`,
    title: `Decision: ${topic}`,
    description: `Architectural decision regarding ${topic}`,
    options: [
      {
        id: 'option-a',
        name: 'Option A',
        description: 'First approach',
        pros: [],
        cons: [],
        estimatedCost: 0,
        estimatedTimeline: 'TBD',
      },
      {
        id: 'option-b',
        name: 'Option B',
        description: 'Alternative approach',
        pros: [],
        cons: [],
        estimatedCost: 0,
        estimatedTimeline: 'TBD',
      },
      {
        id: 'option-c',
        name: 'Option C',
        description: 'Conservative approach',
        pros: [],
        cons: [],
        estimatedCost: 0,
        estimatedTimeline: 'TBD',
      },
    ],
    criteria: [
      { id: 'feasibility', name: 'Feasibility', description: 'Technical feasibility', weight: 0.4 },
      { id: 'cost', name: 'Cost', description: 'Implementation cost', weight: 0.3 },
      { id: 'impact', name: 'Impact', description: 'Business impact', weight: 0.3 },
    ],
    context: { topic },
  };
}

/**
 * Generate comprehensive decision report
 */
function generateDecisionReport(
  result: ConsensusResult,
  proposal: DecisionProposal,
  config: ConsensusConfig,
  durationMs: number
): DecisionReport {
  result.durationMs = durationMs;

  // Generate recommendations
  const recommendations: string[] = [];

  if (result.consensusAchieved) {
    recommendations.push(`✅ Proceed with ${result.winningOption?.name}`);
    recommendations.push(`📊 Consensus level: ${(result.consensusLevel * 100).toFixed(1)}%`);
  } else {
    recommendations.push(
      `⚠️  Consensus not reached (${(result.consensusLevel * 100).toFixed(1)}% < ${(config.consensusThreshold * 100).toFixed(0)}%)`
    );
    recommendations.push(
      '🔄 Consider: Additional discussion, revised proposal, or delegated decision'
    );
  }

  if (result.dissent.keyConcerns.length > 0) {
    recommendations.push('📝 Address key concerns before implementation');
  }

  // Risk assessment
  const riskAssessment = assessRisks(result, proposal);

  // Implementation guide
  const implementationGuide = generateImplementationGuide(result, proposal);

  return {
    config,
    result,
    recommendations,
    riskAssessment,
    implementationGuide,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Assess risks for the decision
 */
function assessRisks(result: ConsensusResult, proposal: DecisionProposal): RiskAssessment {
  const riskFactors: RiskAssessment['riskFactors'] = [];

  // Consensus risk
  if (!result.consensusAchieved) {
    riskFactors.push({
      category: 'Consensus',
      severity: 'high',
      description: 'Lack of strong consensus may lead to implementation resistance',
      mitigation: 'Address minority concerns through targeted discussions',
    });
  }

  // Confidence risk
  if (result.confidenceScore < 0.6) {
    riskFactors.push({
      category: 'Confidence',
      severity: 'medium',
      description: 'Low confidence scores suggest uncertainty about the decision',
      mitigation: 'Gather more data or conduct proof-of-concept',
    });
  }

  // Dissent risk
  if (result.dissent.keyConcerns.length > 5) {
    riskFactors.push({
      category: 'Dissent',
      severity: 'medium',
      description: 'Multiple significant concerns raised by participants',
      mitigation: 'Create action plan to address top concerns',
    });
  }

  // Determine overall risk
  const highRisks = riskFactors.filter((r) => r.severity === 'high').length;
  const mediumRisks = riskFactors.filter((r) => r.severity === 'medium').length;

  let overallRisk: RiskAssessment['overallRisk'] = 'low';
  if (highRisks > 0) overallRisk = 'high';
  else if (mediumRisks > 2) overallRisk = 'high';
  else if (mediumRisks > 0) overallRisk = 'medium';

  return {
    overallRisk,
    riskFactors,
  };
}

/**
 * Generate implementation guide
 */
function generateImplementationGuide(
  result: ConsensusResult,
  proposal: DecisionProposal
): ImplementationGuide {
  const steps: string[] = [];
  const checkpoints: string[] = [];

  if (result.winningOption) {
    steps.push(`1. Finalize ${result.winningOption.name} design`);
    steps.push('2. Create detailed implementation plan');
    steps.push('3. Set up monitoring and metrics');
    steps.push('4. Implement in phases');
    steps.push('5. Validate against success criteria');

    checkpoints.push('Design review completed');
    checkpoints.push('Proof of concept validated');
    checkpoints.push('50% rollout complete');
    checkpoints.push('Full rollout with monitoring');
    checkpoints.push('Post-implementation review');
  }

  return {
    steps,
    timeline: result.winningOption?.estimatedTimeline || 'TBD',
    resources: ['Engineering team', 'DevOps support', 'QA resources'],
    checkpoints,
  };
}

/**
 * Print decision summary
 */
function printDecisionSummary(report: DecisionReport): void {
  const { result, config } = report;

  console.log('\n' + '='.repeat(60));
  console.log('🏛️  CONSENSUS DECISION RESULTS');
  console.log('='.repeat(60));
  console.log(`Topic:             ${result.proposal.title}`);
  console.log(`Algorithm:         ${config.algorithm}`);
  console.log(`Participants:      ${result.votes.length}/${config.participantCount}`);

  console.log('\n📊 VOTE TALLIES:');
  for (const [optionId, tally] of Object.entries(result.tallies)) {
    const option = result.proposal.options.find((o) => o.id === optionId);
    const bar = '█'.repeat(Math.round(tally.percentage * 20));
    console.log(`   ${option?.name || optionId}: ${(tally.percentage * 100).toFixed(1)}% ${bar}`);
  }

  if (result.winningOption) {
    console.log(`\n🏆 WINNER: ${result.winningOption.name}`);
    console.log(
      `   Consensus: ${(result.consensusLevel * 100).toFixed(1)}% ${result.consensusAchieved ? '✅' : '❌'}`
    );
    console.log(`   Confidence: ${(result.confidenceScore * 100).toFixed(1)}%`);
  }

  console.log(`\n⚠️  Risk Level: ${report.riskAssessment.overallRisk.toUpperCase()}`);

  console.log('\n💡 RECOMMENDATIONS:');
  report.recommendations.forEach((rec) => console.log(`   ${rec}`));
  console.log('='.repeat(60));
}

// CLI Entry Point
async function main() {
  const args = process.argv.slice(2);
  const config: ConsensusConfig = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--topic':
      case '-t':
        config.topic = value;
        break;
      case '--participants':
      case '-p':
        config.participantCount = Math.min(parseInt(value), 100);
        break;
      case '--threshold':
        config.consensusThreshold = parseFloat(value);
        break;
      case '--algorithm':
      case '-a':
        config.algorithm = value as ConsensusAlgorithm;
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
    await runConsensusDecision(config);
    process.exit(0);
  } catch (error) {
    console.error('❌ Consensus decision failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
Consensus-Based Decision Making with KIMI k2.5 Agents

Usage: tsx consensus-based-decisions.ts [options]

Options:
  -t, --topic <name>         Decision topic:
                             - database-selection
                             - api-strategy
                             - (or custom topic name)
  -p, --participants <count> Number of agents 1-100 (default: 100)
  --threshold <float>        Consensus threshold 0-1 (default: 0.7)
  -a, --algorithm <name>     Voting algorithm:
                             - simple-majority
                             - supermajority
                             - unanimous
                             - weighted-expertise (default)
                             - quadratic
                             - liquid-democracy
  -o, --output <path>        Output file path (default: ./consensus-decision-report.json)
  -h, --help                 Show this help message

Examples:
  tsx consensus-based-decisions.ts --topic database-selection
  tsx consensus-based-decisions.ts -t api-strategy -p 50 --threshold 0.8
  tsx consensus-based-decisions.ts --algorithm quadratic --participants 100
  `);
}

if (require.main === module) {
  main();
}

export { ConsensusConfig, ConsensusResult, DecisionReport, runConsensusDecision };

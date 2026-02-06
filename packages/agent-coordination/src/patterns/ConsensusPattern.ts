import { EventEmitter } from 'events';
import { AgentInfo } from '../core/types';
import { Coordinator } from '../orchestration/Coordinator';

/**
 * Consensus proposal
 */
export interface ConsensusProposal<T = any> {
  id: string;
  value: T;
  proposerId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Vote on a proposal
 */
export interface Vote<T = any> {
  proposalId: string;
  voterId: string;
  approve: boolean;
  value?: T; // Alternative value if not approving
  timestamp: Date;
  reason?: string;
}

/**
 * Consensus result
 */
export interface ConsensusResult<T = any> {
  achieved: boolean;
  value?: T;
  votes: Vote<T>[];
  approvalRate: number;
  participationRate: number;
  winningProposal?: ConsensusProposal<T>;
}

/**
 * Consensus strategy
 */
export enum ConsensusStrategy {
  UNANIMOUS = 'unanimous', // All must agree
  MAJORITY = 'majority', // >50% must agree
  SUPERMAJORITY = 'supermajority', // ≥2/3 must agree
  WEIGHTED = 'weighted', // Weighted by agent capabilities
  QUORUM = 'quorum', // Minimum participation required
}

/**
 * Consensus pattern for multi-agent decision making
 */
export class ConsensusPattern<T = any> extends EventEmitter {
  private coordinator: Coordinator;
  private proposals: Map<string, ConsensusProposal<T>> = new Map();
  private votes: Map<string, Vote<T>[]> = new Map();
  private strategy: ConsensusStrategy;

  constructor(coordinator: Coordinator, strategy: ConsensusStrategy = ConsensusStrategy.MAJORITY) {
    super();
    this.coordinator = coordinator;
    this.strategy = strategy;
  }

  /**
   * Propose a value for consensus
   */
  async propose(
    value: T,
    proposerId: string,
    metadata?: Record<string, any>
  ): Promise<ConsensusProposal<T>> {
    const proposal: ConsensusProposal<T> = {
      id: this.generateProposalId(),
      value,
      proposerId,
      timestamp: new Date(),
      metadata,
    };

    this.proposals.set(proposal.id, proposal);
    this.votes.set(proposal.id, []);

    this.emit('consensus:proposal:created', proposal);

    return proposal;
  }

  /**
   * Submit a vote on a proposal
   */
  async vote(
    proposalId: string,
    voterId: string,
    approve: boolean,
    alternativeValue?: T,
    reason?: string
  ): Promise<Vote<T>> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    const vote: Vote<T> = {
      proposalId,
      voterId,
      approve,
      value: alternativeValue,
      timestamp: new Date(),
      reason,
    };

    const proposalVotes = this.votes.get(proposalId) || [];
    proposalVotes.push(vote);
    this.votes.set(proposalId, proposalVotes);

    this.emit('consensus:vote:cast', vote);

    return vote;
  }

  /**
   * Request votes from all agents
   */
  async requestVotes(
    proposal: ConsensusProposal<T>,
    agents: AgentInfo[],
    timeout: number = 30000
  ): Promise<Vote<T>[]> {
    this.emit('consensus:voting:started', {
      proposalId: proposal.id,
      agentCount: agents.length,
    });

    const votingTasks = agents.map((agent) =>
      this.coordinator.submitTask('vote', {
        proposalId: proposal.id,
        proposal: proposal.value,
        voterId: agent.id,
        metadata: proposal.metadata,
      })
    );

    // Wait for all votes (with timeout)
    return new Promise((resolve) => {
      const votes: Vote<T>[] = [];
      const startTime = Date.now();

      const checkCompletion = setInterval(() => {
        const proposalVotes = this.votes.get(proposal.id) || [];

        if (proposalVotes.length === agents.length || Date.now() - startTime > timeout) {
          clearInterval(checkCompletion);
          this.emit('consensus:voting:completed', {
            proposalId: proposal.id,
            voteCount: proposalVotes.length,
          });
          resolve(proposalVotes);
        }
      }, 100);
    });
  }

  /**
   * Evaluate consensus based on strategy
   */
  async evaluate(proposalId: string, totalAgents: number): Promise<ConsensusResult<T>> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    const votes = this.votes.get(proposalId) || [];
    const approvalVotes = votes.filter((v) => v.approve).length;
    const totalVotes = votes.length;

    const approvalRate = totalVotes > 0 ? approvalVotes / totalVotes : 0;
    const participationRate = totalAgents > 0 ? totalVotes / totalAgents : 0;

    let achieved = false;

    switch (this.strategy) {
      case ConsensusStrategy.UNANIMOUS:
        achieved = approvalRate === 1.0 && participationRate === 1.0;
        break;

      case ConsensusStrategy.MAJORITY:
        achieved = approvalRate > 0.5;
        break;

      case ConsensusStrategy.SUPERMAJORITY:
        achieved = approvalRate >= 2 / 3;
        break;

      case ConsensusStrategy.QUORUM:
        // Requires 50% participation and 50% approval
        achieved = participationRate >= 0.5 && approvalRate > 0.5;
        break;

      case ConsensusStrategy.WEIGHTED:
        achieved = await this.evaluateWeighted(votes);
        break;

      default:
        achieved = approvalRate > 0.5;
    }

    const result: ConsensusResult<T> = {
      achieved,
      value: achieved ? proposal.value : undefined,
      votes,
      approvalRate,
      participationRate,
      winningProposal: achieved ? proposal : undefined,
    };

    this.emit('consensus:evaluated', result);

    return result;
  }

  /**
   * Evaluate weighted consensus
   */
  private async evaluateWeighted(votes: Vote<T>[]): Promise<boolean> {
    // In a real implementation, this would weight votes by agent capabilities
    // For now, simple majority
    const approvalVotes = votes.filter((v) => v.approve).length;
    return approvalVotes / votes.length > 0.5;
  }

  /**
   * Achieve consensus through multiple rounds
   */
  async achieveConsensus(
    initialValue: T,
    proposerId: string,
    agents: AgentInfo[],
    options: {
      maxRounds?: number;
      timeout?: number;
      strategy?: ConsensusStrategy;
    } = {}
  ): Promise<ConsensusResult<T>> {
    const { maxRounds = 3, timeout = 30000, strategy } = options;

    if (strategy) {
      this.strategy = strategy;
    }

    this.emit('consensus:started', {
      agentCount: agents.length,
      strategy: this.strategy,
      maxRounds,
    });

    let currentValue = initialValue;
    let round = 0;

    while (round < maxRounds) {
      round++;

      this.emit('consensus:round:started', { round, value: currentValue });

      // Create proposal
      const proposal = await this.propose(currentValue, proposerId, { round });

      // Request votes
      const votes = await this.requestVotes(proposal, agents, timeout);

      // Evaluate consensus
      const result = await this.evaluate(proposal.id, agents.length);

      if (result.achieved) {
        this.emit('consensus:achieved', { round, result });
        return result;
      }

      // If not achieved, try to find alternative value from votes
      const alternatives = votes
        .filter((v) => !v.approve && v.value !== undefined)
        .map((v) => v.value as T);

      if (alternatives.length > 0) {
        // Pick most common alternative
        currentValue = this.findMostCommon(alternatives);
        this.emit('consensus:round:adjusted', {
          round,
          newValue: currentValue,
        });
      } else {
        // No alternatives, consensus failed
        this.emit('consensus:failed', { round, result });
        return result;
      }
    }

    // Max rounds reached without consensus
    const finalResult: ConsensusResult<T> = {
      achieved: false,
      votes: [],
      approvalRate: 0,
      participationRate: 0,
    };

    this.emit('consensus:failed', { rounds: maxRounds, result: finalResult });

    return finalResult;
  }

  /**
   * Find most common value in array
   */
  private findMostCommon(values: T[]): T {
    const counts = new Map<string, { value: T; count: number }>();

    for (const value of values) {
      const key = JSON.stringify(value);
      const existing = counts.get(key);

      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { value, count: 1 });
      }
    }

    let maxCount = 0;
    let mostCommon = values[0];

    for (const { value, count } of counts.values()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = value;
      }
    }

    return mostCommon;
  }

  /**
   * Generate unique proposal ID
   */
  private generateProposalId(): string {
    return `proposal-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get proposal by ID
   */
  getProposal(proposalId: string): ConsensusProposal<T> | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Get votes for a proposal
   */
  getVotes(proposalId: string): Vote<T>[] {
    return this.votes.get(proposalId) || [];
  }

  /**
   * Clear all proposals and votes
   */
  clear(): void {
    this.proposals.clear();
    this.votes.clear();
  }
}

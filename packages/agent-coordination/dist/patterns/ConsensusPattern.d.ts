import { EventEmitter } from 'events';
import { AgentInfo } from '../core/types.js';
import { Coordinator } from '../orchestration/Coordinator.js';
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
    value?: T;
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
export declare enum ConsensusStrategy {
    UNANIMOUS = "unanimous",// All must agree
    MAJORITY = "majority",// >50% must agree
    SUPERMAJORITY = "supermajority",// ≥2/3 must agree
    WEIGHTED = "weighted",// Weighted by agent capabilities
    QUORUM = "quorum"
}
/**
 * Consensus pattern for multi-agent decision making
 */
export declare class ConsensusPattern<T = any> extends EventEmitter {
    private coordinator;
    private proposals;
    private votes;
    private strategy;
    constructor(coordinator: Coordinator, strategy?: ConsensusStrategy);
    /**
     * Propose a value for consensus
     */
    propose(value: T, proposerId: string, metadata?: Record<string, any>): Promise<ConsensusProposal<T>>;
    /**
     * Submit a vote on a proposal
     */
    vote(proposalId: string, voterId: string, approve: boolean, alternativeValue?: T, reason?: string): Promise<Vote<T>>;
    /**
     * Request votes from all agents
     */
    requestVotes(proposal: ConsensusProposal<T>, agents: AgentInfo[], timeout?: number): Promise<Vote<T>[]>;
    /**
     * Evaluate consensus based on strategy
     */
    evaluate(proposalId: string, totalAgents: number): Promise<ConsensusResult<T>>;
    /**
     * Evaluate weighted consensus
     */
    private evaluateWeighted;
    /**
     * Achieve consensus through multiple rounds
     */
    achieveConsensus(initialValue: T, proposerId: string, agents: AgentInfo[], options?: {
        maxRounds?: number;
        timeout?: number;
        strategy?: ConsensusStrategy;
    }): Promise<ConsensusResult<T>>;
    /**
     * Find most common value in array
     */
    private findMostCommon;
    /**
     * Generate unique proposal ID
     */
    private generateProposalId;
    /**
     * Get proposal by ID
     */
    getProposal(proposalId: string): ConsensusProposal<T> | undefined;
    /**
     * Get votes for a proposal
     */
    getVotes(proposalId: string): Vote<T>[];
    /**
     * Clear all proposals and votes
     */
    clear(): void;
}
//# sourceMappingURL=ConsensusPattern.d.ts.map
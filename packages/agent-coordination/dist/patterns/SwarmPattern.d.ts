import { EventEmitter } from 'events';
import type { AgentInfo } from '../core/types.js';
import type { Coordinator } from '../orchestration/Coordinator.js';
import type { SharedCache } from '../state/SharedCache.js';
/**
 * Swarm agent behavior
 */
export interface SwarmBehavior {
    explore: number;
    exploit: number;
    communicate: number;
    adapt: number;
}
/**
 * Swarm solution candidate
 */
export interface SwarmSolution<T = any> {
    id: string;
    value: T;
    fitness: number;
    agentId: string;
    generation: number;
    timestamp: Date;
}
/**
 * Swarm intelligence pattern for self-organizing agents
 */
export declare class SwarmPattern<T = any> extends EventEmitter {
    private coordinator;
    private sharedCache;
    private solutions;
    private bestSolution?;
    private generation;
    constructor(coordinator: Coordinator, sharedCache: SharedCache);
    /**
     * Initialize swarm optimization
     */
    initialize(agents: AgentInfo[], initialSolution: T, behavior?: SwarmBehavior): Promise<void>;
    /**
     * Execute swarm optimization
     */
    optimize(agents: AgentInfo[], fitnessFn: (solution: T) => Promise<number>, options?: {
        maxGenerations?: number;
        convergenceThreshold?: number;
        timeout?: number;
    }): Promise<SwarmSolution<T>>;
    /**
     * Execute one generation of swarm optimization
     */
    private executeGeneration;
    /**
     * Create a task for an agent to generate a solution
     */
    private createSolutionTask;
    /**
     * Wait for solution from task
     */
    private waitForSolution;
    /**
     * Get solutions from neighboring agents
     */
    private getNeighborSolutions;
    /**
     * Share solutions in the swarm (pheromone trail)
     */
    private shareSolutions;
    /**
     * Remove old solutions to prevent memory bloat
     */
    private pruneOldSolutions;
    /**
     * Find best solution in array
     */
    private findBestSolution;
    /**
     * Perturb a solution for exploration
     */
    private perturbSolution;
    /**
     * Store solution (called by agents)
     */
    storeSolution(solution: SwarmSolution<T>): void;
    /**
     * Execute swarm search (exploration-focused)
     */
    search(agents: AgentInfo[], searchSpace: T[], evaluateFn: (solution: T) => Promise<number>, options?: {
        maxIterations?: number;
        timeout?: number;
    }): Promise<SwarmSolution<T>[]>;
    /**
     * Get current best solution
     */
    getBestSolution(): SwarmSolution<T> | undefined;
    /**
     * Get all solutions
     */
    getAllSolutions(): SwarmSolution<T>[];
    /**
     * Clear all solutions
     */
    clear(): void;
}
//# sourceMappingURL=SwarmPattern.d.ts.map
import { EventEmitter } from 'events';
import { AgentInfo, Task, TaskPriority } from '../core/types';
import { Coordinator } from '../orchestration/Coordinator';
import { SharedCache } from '../state/SharedCache';

/**
 * Swarm agent behavior
 */
export interface SwarmBehavior {
  explore: number; // 0-1: tendency to explore new solutions
  exploit: number; // 0-1: tendency to exploit known good solutions
  communicate: number; // 0-1: tendency to share findings
  adapt: number; // 0-1: tendency to adapt based on others
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
export class SwarmPattern<T = any> extends EventEmitter {
  private coordinator: Coordinator;
  private sharedCache: SharedCache;
  private solutions: Map<string, SwarmSolution<T>> = new Map();
  private bestSolution?: SwarmSolution<T>;
  private generation: number = 0;

  constructor(coordinator: Coordinator, sharedCache: SharedCache) {
    super();
    this.coordinator = coordinator;
    this.sharedCache = sharedCache;
  }

  /**
   * Initialize swarm optimization
   */
  async initialize(
    agents: AgentInfo[],
    initialSolution: T,
    behavior: SwarmBehavior = {
      explore: 0.3,
      exploit: 0.7,
      communicate: 0.8,
      adapt: 0.6,
    }
  ): Promise<void> {
    this.emit('swarm:initialized', {
      agentCount: agents.length,
      behavior,
    });

    // Share behavior parameters with all agents
    await this.sharedCache.set('swarm:behavior', behavior);
    await this.sharedCache.set('swarm:generation', 0);
    await this.sharedCache.set('swarm:best-solution', null);

    // Initialize each agent with a starting solution
    for (const agent of agents) {
      const solution: SwarmSolution<T> = {
        id: `sol-${agent.id}-0`,
        value: this.perturbSolution(initialSolution, behavior.explore),
        fitness: 0,
        agentId: agent.id,
        generation: 0,
        timestamp: new Date(),
      };

      await this.sharedCache.setHashField(
        'swarm:solutions',
        solution.id,
        solution
      );
    }
  }

  /**
   * Execute swarm optimization
   */
  async optimize(
    agents: AgentInfo[],
    fitnessFn: (solution: T) => Promise<number>,
    options: {
      maxGenerations?: number;
      convergenceThreshold?: number;
      timeout?: number;
    } = {}
  ): Promise<SwarmSolution<T>> {
    const {
      maxGenerations = 100,
      convergenceThreshold = 0.001,
      timeout = 300000,
    } = options;

    this.emit('swarm:optimization:started', {
      maxGenerations,
      agentCount: agents.length,
    });

    const startTime = Date.now();
    let previousBestFitness = 0;
    let stagnantGenerations = 0;

    while (
      this.generation < maxGenerations &&
      Date.now() - startTime < timeout
    ) {
      this.generation++;

      this.emit('swarm:generation:started', {
        generation: this.generation,
      });

      // Each agent generates and evaluates solutions
      const generationSolutions = await this.executeGeneration(
        agents,
        fitnessFn
      );

      // Update best solution
      const bestInGeneration = this.findBestSolution(generationSolutions);

      if (
        !this.bestSolution ||
        bestInGeneration.fitness > this.bestSolution.fitness
      ) {
        this.bestSolution = bestInGeneration;
        await this.sharedCache.set('swarm:best-solution', this.bestSolution);

        this.emit('swarm:best:updated', {
          generation: this.generation,
          solution: this.bestSolution,
        });
      }

      // Check for convergence
      const improvement = this.bestSolution.fitness - previousBestFitness;

      if (Math.abs(improvement) < convergenceThreshold) {
        stagnantGenerations++;

        if (stagnantGenerations >= 5) {
          this.emit('swarm:converged', {
            generation: this.generation,
            solution: this.bestSolution,
          });
          break;
        }
      } else {
        stagnantGenerations = 0;
      }

      previousBestFitness = this.bestSolution.fitness;

      // Share solutions among agents (pheromone trail)
      await this.shareSolutions(generationSolutions);

      this.emit('swarm:generation:completed', {
        generation: this.generation,
        bestFitness: this.bestSolution.fitness,
        improvement,
      });
    }

    this.emit('swarm:optimization:completed', {
      generations: this.generation,
      bestSolution: this.bestSolution,
    });

    return this.bestSolution!;
  }

  /**
   * Execute one generation of swarm optimization
   */
  private async executeGeneration(
    agents: AgentInfo[],
    fitnessFn: (solution: T) => Promise<number>
  ): Promise<SwarmSolution<T>[]> {
    const behavior = await this.sharedCache.get<SwarmBehavior>(
      'swarm:behavior'
    );

    if (!behavior) {
      throw new Error('Swarm behavior not initialized');
    }

    const tasks = agents.map((agent) =>
      this.createSolutionTask(agent, behavior, fitnessFn)
    );

    // Wait for all agents to complete
    const solutions = await Promise.all(
      tasks.map((task) => this.waitForSolution(task))
    );

    return solutions;
  }

  /**
   * Create a task for an agent to generate a solution
   */
  private async createSolutionTask(
    agent: AgentInfo,
    behavior: SwarmBehavior,
    fitnessFn: (solution: T) => Promise<number>
  ): Promise<Task> {
    // Get best known solutions for this agent to learn from
    const neighborSolutions = await this.getNeighborSolutions(agent.id);

    const task = await this.coordinator.submitTask(
      'swarm:generate-solution',
      {
        agentId: agent.id,
        generation: this.generation,
        behavior,
        neighborSolutions,
        bestSolution: this.bestSolution,
        fitnessFn: fitnessFn.toString(),
      },
      {
        priority: TaskPriority.HIGH,
      }
    );

    return task;
  }

  /**
   * Wait for solution from task
   */
  private async waitForSolution(task: Task): Promise<SwarmSolution<T>> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Solution task ${task.id} timeout`));
      }, 60000);

      this.coordinator.on('task:completed', (completedTask: Task) => {
        if (completedTask.id === task.id) {
          clearTimeout(timeout);
          const solution = this.solutions.get(task.id);
          if (solution) {
            resolve(solution);
          } else {
            reject(new Error('Solution not found'));
          }
        }
      });
    });
  }

  /**
   * Get solutions from neighboring agents
   */
  private async getNeighborSolutions(
    agentId: string,
    neighborCount: number = 3
  ): Promise<SwarmSolution<T>[]> {
    const allSolutions = await this.sharedCache.getHashAll<SwarmSolution<T>>(
      'swarm:solutions'
    );

    // Get random neighbors (excluding self)
    const neighbors = Object.values(allSolutions)
      .filter((sol) => sol.agentId !== agentId)
      .sort(() => Math.random() - 0.5)
      .slice(0, neighborCount);

    return neighbors;
  }

  /**
   * Share solutions in the swarm (pheromone trail)
   */
  private async shareSolutions(solutions: SwarmSolution<T>[]): Promise<void> {
    for (const solution of solutions) {
      await this.sharedCache.setHashField(
        'swarm:solutions',
        solution.id,
        solution
      );
    }

    // Keep only best N solutions per agent
    await this.pruneOldSolutions(5);
  }

  /**
   * Remove old solutions to prevent memory bloat
   */
  private async pruneOldSolutions(keepPerAgent: number): Promise<void> {
    const allSolutions = await this.sharedCache.getHashAll<SwarmSolution<T>>(
      'swarm:solutions'
    );

    const solutionsByAgent = new Map<string, SwarmSolution<T>[]>();

    for (const solution of Object.values(allSolutions)) {
      const agentSolutions = solutionsByAgent.get(solution.agentId) || [];
      agentSolutions.push(solution);
      solutionsByAgent.set(solution.agentId, agentSolutions);
    }

    // Keep only top N solutions per agent
    for (const [agentId, solutions] of solutionsByAgent.entries()) {
      const sorted = solutions.sort((a, b) => b.fitness - a.fitness);
      const toRemove = sorted.slice(keepPerAgent);

      for (const solution of toRemove) {
        await this.sharedCache.deleteHashField('swarm:solutions', solution.id);
      }
    }
  }

  /**
   * Find best solution in array
   */
  private findBestSolution(solutions: SwarmSolution<T>[]): SwarmSolution<T> {
    return solutions.reduce((best, current) =>
      current.fitness > best.fitness ? current : best
    );
  }

  /**
   * Perturb a solution for exploration
   */
  private perturbSolution(solution: T, exploreRate: number): T {
    // In a real implementation, this would depend on the solution type
    // For now, return a copy of the solution
    return JSON.parse(JSON.stringify(solution));
  }

  /**
   * Store solution (called by agents)
   */
  storeSolution(solution: SwarmSolution<T>): void {
    this.solutions.set(solution.id, solution);
    this.emit('swarm:solution:stored', solution);
  }

  /**
   * Execute swarm search (exploration-focused)
   */
  async search(
    agents: AgentInfo[],
    searchSpace: T[],
    evaluateFn: (solution: T) => Promise<number>,
    options: {
      maxIterations?: number;
      timeout?: number;
    } = {}
  ): Promise<SwarmSolution<T>[]> {
    const { maxIterations = 50, timeout = 120000 } = options;

    this.emit('swarm:search:started', {
      searchSpaceSize: searchSpace.length,
      agentCount: agents.length,
    });

    const foundSolutions: SwarmSolution<T>[] = [];
    const startTime = Date.now();

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      if (Date.now() - startTime > timeout) {
        break;
      }

      // Assign portions of search space to agents
      const tasksPerAgent = Math.ceil(searchSpace.length / agents.length);

      const tasks = agents.map(async (agent, index) => {
        const start = index * tasksPerAgent;
        const end = Math.min(start + tasksPerAgent, searchSpace.length);
        const agentSearchSpace = searchSpace.slice(start, end);

        for (const candidate of agentSearchSpace) {
          const fitness = await evaluateFn(candidate);
          const solution: SwarmSolution<T> = {
            id: `search-${agent.id}-${iteration}-${Date.now()}`,
            value: candidate,
            fitness,
            agentId: agent.id,
            generation: iteration,
            timestamp: new Date(),
          };

          foundSolutions.push(solution);

          // Share promising solutions
          if (fitness > 0.7) {
            // Threshold for "promising"
            await this.sharedCache.setHashField(
              'swarm:search:promising',
              solution.id,
              solution
            );
          }
        }
      });

      await Promise.all(tasks);

      this.emit('swarm:search:iteration', {
        iteration,
        solutionsFound: foundSolutions.length,
      });
    }

    this.emit('swarm:search:completed', {
      solutionsFound: foundSolutions.length,
    });

    return foundSolutions.sort((a, b) => b.fitness - a.fitness);
  }

  /**
   * Get current best solution
   */
  getBestSolution(): SwarmSolution<T> | undefined {
    return this.bestSolution;
  }

  /**
   * Get all solutions
   */
  getAllSolutions(): SwarmSolution<T>[] {
    return Array.from(this.solutions.values());
  }

  /**
   * Clear all solutions
   */
  clear(): void {
    this.solutions.clear();
    this.bestSolution = undefined;
    this.generation = 0;
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwarmPattern = void 0;
const events_1 = require("events");
const types_js_1 = require("../core/types.js");
/**
 * Swarm intelligence pattern for self-organizing agents
 */
class SwarmPattern extends events_1.EventEmitter {
    constructor(coordinator, sharedCache) {
        super();
        this.solutions = new Map();
        this.generation = 0;
        this.coordinator = coordinator;
        this.sharedCache = sharedCache;
    }
    /**
     * Initialize swarm optimization
     */
    async initialize(agents, initialSolution, behavior = {
        explore: 0.3,
        exploit: 0.7,
        communicate: 0.8,
        adapt: 0.6,
    }) {
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
            const solution = {
                id: `sol-${agent.id}-0`,
                value: this.perturbSolution(initialSolution, behavior.explore),
                fitness: 0,
                agentId: agent.id,
                generation: 0,
                timestamp: new Date(),
            };
            await this.sharedCache.setHashField('swarm:solutions', solution.id, solution);
        }
    }
    /**
     * Execute swarm optimization
     */
    async optimize(agents, fitnessFn, options = {}) {
        const { maxGenerations = 100, convergenceThreshold = 0.001, timeout = 300000 } = options;
        this.emit('swarm:optimization:started', {
            maxGenerations,
            agentCount: agents.length,
        });
        const startTime = Date.now();
        let previousBestFitness = 0;
        let stagnantGenerations = 0;
        while (this.generation < maxGenerations && Date.now() - startTime < timeout) {
            this.generation++;
            this.emit('swarm:generation:started', {
                generation: this.generation,
            });
            // Each agent generates and evaluates solutions
            const generationSolutions = await this.executeGeneration(agents, fitnessFn);
            // Update best solution
            const bestInGeneration = this.findBestSolution(generationSolutions);
            if (!this.bestSolution || bestInGeneration.fitness > this.bestSolution.fitness) {
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
            }
            else {
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
        return this.bestSolution;
    }
    /**
     * Execute one generation of swarm optimization
     */
    async executeGeneration(agents, fitnessFn) {
        const behavior = await this.sharedCache.get('swarm:behavior');
        if (!behavior) {
            throw new Error('Swarm behavior not initialized');
        }
        const taskPromises = agents.map((agent) => this.createSolutionTask(agent, behavior, fitnessFn));
        // Create all tasks, then wait for their solutions
        const createdTasks = await Promise.all(taskPromises);
        const solutions = await Promise.all(createdTasks.map((task) => this.waitForSolution(task)));
        return solutions;
    }
    /**
     * Create a task for an agent to generate a solution
     */
    async createSolutionTask(agent, behavior, fitnessFn) {
        // Get best known solutions for this agent to learn from
        const neighborSolutions = await this.getNeighborSolutions(agent.id);
        const task = await this.coordinator.submitTask('swarm:generate-solution', {
            sourceAgentId: agent.id,
            generation: this.generation,
            behavior,
            neighborSolutions,
            bestSolution: this.bestSolution,
            fitnessFn: fitnessFn.toString(),
        }, {
            priority: types_js_1.TaskPriority.HIGH,
        });
        return task;
    }
    /**
     * Wait for solution from task
     */
    async waitForSolution(task) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Solution task ${task.id} timeout`));
            }, 60000);
            this.coordinator.on('task:completed', (completedTask) => {
                if (completedTask.id === task.id) {
                    clearTimeout(timeout);
                    const solution = this.solutions.get(task.id);
                    if (solution) {
                        resolve(solution);
                    }
                    else {
                        reject(new Error('Solution not found'));
                    }
                }
            });
        });
    }
    /**
     * Get solutions from neighboring agents
     */
    async getNeighborSolutions(agentId, neighborCount = 3) {
        const allSolutions = await this.sharedCache.getHashAll('swarm:solutions');
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
    async shareSolutions(solutions) {
        for (const solution of solutions) {
            await this.sharedCache.setHashField('swarm:solutions', solution.id, solution);
        }
        // Keep only best N solutions per agent
        await this.pruneOldSolutions(5);
    }
    /**
     * Remove old solutions to prevent memory bloat
     */
    async pruneOldSolutions(keepPerAgent) {
        const allSolutions = await this.sharedCache.getHashAll('swarm:solutions');
        const solutionsByAgent = new Map();
        for (const solution of Object.values(allSolutions)) {
            const agentSolutions = solutionsByAgent.get(solution.agentId) || [];
            agentSolutions.push(solution);
            solutionsByAgent.set(solution.agentId, agentSolutions);
        }
        // Keep only top N solutions per agent
        for (const [_agentId, solutions] of solutionsByAgent.entries()) {
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
    findBestSolution(solutions) {
        return solutions.reduce((best, current) => (current.fitness > best.fitness ? current : best));
    }
    /**
     * Perturb a solution for exploration
     */
    perturbSolution(solution, _exploreRate) {
        // In a real implementation, this would depend on the solution type
        // For now, return a copy of the solution
        return JSON.parse(JSON.stringify(solution));
    }
    /**
     * Store solution (called by agents)
     */
    storeSolution(solution) {
        this.solutions.set(solution.id, solution);
        this.emit('swarm:solution:stored', solution);
    }
    /**
     * Execute swarm search (exploration-focused)
     */
    async search(agents, searchSpace, evaluateFn, options = {}) {
        const { maxIterations = 50, timeout = 120000 } = options;
        this.emit('swarm:search:started', {
            searchSpaceSize: searchSpace.length,
            agentCount: agents.length,
        });
        const foundSolutions = [];
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
                    const solution = {
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
                        await this.sharedCache.setHashField('swarm:search:promising', solution.id, solution);
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
    getBestSolution() {
        return this.bestSolution;
    }
    /**
     * Get all solutions
     */
    getAllSolutions() {
        return Array.from(this.solutions.values());
    }
    /**
     * Clear all solutions
     */
    clear() {
        this.solutions.clear();
        this.bestSolution = undefined;
        this.generation = 0;
    }
}
exports.SwarmPattern = SwarmPattern;
//# sourceMappingURL=SwarmPattern.js.map
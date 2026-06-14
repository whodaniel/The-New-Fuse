"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelinePattern = void 0;
const events_1 = require("events");
/**
 * Pipeline pattern for sequential task processing (A → B → C)
 */
class PipelinePattern extends events_1.EventEmitter {
    constructor(coordinator) {
        super();
        this.stageResults = new Map();
        this.coordinator = coordinator;
    }
    /**
     * Execute pipeline with sequential stages
     */
    async execute(input, stages, options = {}) {
        this.emit('pipeline:started', { stageCount: stages.length });
        let currentInput = input;
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            this.emit('pipeline:stage:started', {
                stage: stage.name,
                index: i,
                input: currentInput,
            });
            try {
                const stageOutput = await this.executeStage(stage, currentInput, i, options);
                this.stageResults.set(`${stage.name}:${i}`, stageOutput);
                this.emit('pipeline:stage:completed', {
                    stage: stage.name,
                    index: i,
                    output: stageOutput,
                });
                currentInput = stageOutput;
            }
            catch (error) {
                this.emit('pipeline:stage:failed', {
                    stage: stage.name,
                    index: i,
                    error,
                });
                throw error;
            }
        }
        this.emit('pipeline:completed', { result: currentInput });
        return currentInput;
    }
    /**
     * Execute a single pipeline stage
     */
    async executeStage(stage, input, index, options) {
        const task = await this.coordinator.submitTask(stage.type, {
            input,
            stageName: stage.name,
            stageIndex: index,
            processFn: stage.processFn.toString(),
        }, {
            priority: options.priority,
            requiredCapabilities: stage.requiredCapabilities,
            timeout: stage.timeout || options.timeout,
            maxRetries: stage.retries || 3,
            metadata: {
                pipelineStage: stage.name,
                pipelineIndex: index,
            },
        });
        // Wait for task completion
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Stage ${stage.name} timeout`));
            }, stage.timeout || options.timeout || 60000);
            this.coordinator.on('task:completed', (completedTask) => {
                if (completedTask.id === task.id) {
                    clearTimeout(timeout);
                    const result = this.stageResults.get(`${stage.name}:${index}`);
                    resolve(result);
                }
            });
            this.coordinator.on('task:failed', (failedTask, error) => {
                if (failedTask.id === task.id) {
                    clearTimeout(timeout);
                    reject(error);
                }
            });
        });
    }
    /**
     * Execute pipeline with parallel stages at specific points
     */
    async executeHybrid(input, stageGroups, options = {}) {
        this.emit('pipeline:hybrid:started', {
            groupCount: stageGroups.length,
        });
        let currentInput = input;
        for (let i = 0; i < stageGroups.length; i++) {
            const group = stageGroups[i];
            if (group.length === 1) {
                // Sequential stage
                currentInput = await this.executeStage(group[0], currentInput, i, options);
            }
            else {
                // Parallel stages
                const results = await this.executeParallelStages(group, currentInput, i, options);
                // Combine results (simple concatenation for arrays)
                if (Array.isArray(results[0])) {
                    currentInput = results.flat();
                }
                else {
                    currentInput = results;
                }
            }
        }
        this.emit('pipeline:hybrid:completed', { result: currentInput });
        return currentInput;
    }
    /**
     * Execute multiple stages in parallel
     */
    async executeParallelStages(stages, input, groupIndex, options) {
        this.emit('pipeline:parallel:started', {
            stageCount: stages.length,
            groupIndex,
        });
        const stagePromises = stages.map((stage, index) => this.executeStage(stage, input, groupIndex * 100 + index, options));
        const results = await Promise.all(stagePromises);
        this.emit('pipeline:parallel:completed', {
            resultCount: results.length,
            groupIndex,
        });
        return results;
    }
    /**
     * Execute pipeline with conditional branching
     */
    async executeConditional(input, branches, options = {}) {
        this.emit('pipeline:conditional:started', {
            branchCount: branches.length,
        });
        // Find matching branch
        for (const branch of branches) {
            if (branch.condition(input)) {
                this.emit('pipeline:conditional:branch:selected', {
                    stageCount: branch.stages.length,
                });
                return this.execute(input, branch.stages, options);
            }
        }
        throw new Error('No matching branch found in conditional pipeline');
    }
    /**
     * Store stage result (called by coordinator)
     */
    storeStageResult(stageName, index, result) {
        this.stageResults.set(`${stageName}:${index}`, result);
        this.emit('stage:result:stored', { stageName, index, result });
    }
    /**
     * Get stage result
     */
    getStageResult(stageName, index) {
        return this.stageResults.get(`${stageName}:${index}`);
    }
    /**
     * Get all stage results
     */
    getAllStageResults() {
        return new Map(this.stageResults);
    }
    /**
     * Clear stored results
     */
    clear() {
        this.stageResults.clear();
    }
}
exports.PipelinePattern = PipelinePattern;
//# sourceMappingURL=PipelinePattern.js.map
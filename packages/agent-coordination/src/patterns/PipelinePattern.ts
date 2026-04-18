import { EventEmitter } from 'events';
import { Task, TaskPriority } from '../core/types.js';
import { Coordinator } from '../orchestration/Coordinator.js';

/**
 * Pipeline stage function
 */
export type StageFunction<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

/**
 * Pipeline stage definition
 */
export interface PipelineStage<TInput = any, TOutput = any> {
  name: string;
  type: string;
  processFn: StageFunction<TInput, TOutput>;
  requiredCapabilities?: string[];
  timeout?: number;
  retries?: number;
}

/**
 * Pipeline pattern for sequential task processing (A → B → C)
 */
export class PipelinePattern extends EventEmitter {
  private coordinator: Coordinator;
  private stageResults: Map<string, any> = new Map();

  constructor(coordinator: Coordinator) {
    super();
    this.coordinator = coordinator;
  }

  /**
   * Execute pipeline with sequential stages
   */
  async execute<TInput, TOutput>(
    input: TInput,
    stages: PipelineStage[],
    options: {
      priority?: TaskPriority;
      timeout?: number;
    } = {}
  ): Promise<TOutput> {
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
        const stageOutput = await this.executeStage(
          stage,
          currentInput,
          i,
          options
        );

        this.stageResults.set(`${stage.name}:${i}`, stageOutput);

        this.emit('pipeline:stage:completed', {
          stage: stage.name,
          index: i,
          output: stageOutput,
        });

        currentInput = stageOutput;
      } catch (error) {
        this.emit('pipeline:stage:failed', {
          stage: stage.name,
          index: i,
          error,
        });
        throw error;
      }
    }

    this.emit('pipeline:completed', { result: currentInput });

    return currentInput as unknown as TOutput;
  }

  /**
   * Execute a single pipeline stage
   */
  private async executeStage<TInput, TOutput>(
    stage: PipelineStage<TInput, TOutput>,
    input: TInput,
    index: number,
    options: any
  ): Promise<TOutput> {
    const task = await this.coordinator.submitTask(
      stage.type,
      {
        input,
        stageName: stage.name,
        stageIndex: index,
        processFn: stage.processFn.toString(),
      },
      {
        priority: options.priority,
        requiredCapabilities: stage.requiredCapabilities,
        timeout: stage.timeout || options.timeout,
        maxRetries: stage.retries || 3,
        metadata: {
          pipelineStage: stage.name,
          pipelineIndex: index,
        },
      }
    );

    // Wait for task completion
    return new Promise<TOutput>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Stage ${stage.name} timeout`));
      }, stage.timeout || options.timeout || 60000);

      this.coordinator.on('task:completed', (completedTask: Task) => {
        if (completedTask.id === task.id) {
          clearTimeout(timeout);
          const result = this.stageResults.get(`${stage.name}:${index}`);
          resolve(result);
        }
      });

      this.coordinator.on('task:failed', (failedTask: Task, error: Error) => {
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
  async executeHybrid<TInput, TOutput>(
    input: TInput,
    stageGroups: PipelineStage[][],
    options: {
      priority?: TaskPriority;
      timeout?: number;
    } = {}
  ): Promise<TOutput> {
    this.emit('pipeline:hybrid:started', {
      groupCount: stageGroups.length,
    });

    let currentInput = input;

    for (let i = 0; i < stageGroups.length; i++) {
      const group = stageGroups[i];

      if (group.length === 1) {
        // Sequential stage
        currentInput = await this.executeStage(
          group[0],
          currentInput,
          i,
          options
        );
      } else {
        // Parallel stages
        const results = await this.executeParallelStages(
          group,
          currentInput,
          i,
          options
        );

        // Combine results (simple concatenation for arrays)
        if (Array.isArray(results[0])) {
          currentInput = results.flat() as any;
        } else {
          currentInput = results as any;
        }
      }
    }

    this.emit('pipeline:hybrid:completed', { result: currentInput });

    return currentInput as unknown as TOutput;
  }

  /**
   * Execute multiple stages in parallel
   */
  private async executeParallelStages<TInput>(
    stages: PipelineStage[],
    input: TInput,
    groupIndex: number,
    options: any
  ): Promise<any[]> {
    this.emit('pipeline:parallel:started', {
      stageCount: stages.length,
      groupIndex,
    });

    const stagePromises = stages.map((stage, index) =>
      this.executeStage(stage, input, groupIndex * 100 + index, options)
    );

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
  async executeConditional<TInput, TOutput>(
    input: TInput,
    branches: Array<{
      condition: (input: any) => boolean;
      stages: PipelineStage[];
    }>,
    options: {
      priority?: TaskPriority;
      timeout?: number;
    } = {}
  ): Promise<TOutput> {
    this.emit('pipeline:conditional:started', {
      branchCount: branches.length,
    });

    // Find matching branch
    for (const branch of branches) {
      if (branch.condition(input)) {
        this.emit('pipeline:conditional:branch:selected', {
          stageCount: branch.stages.length,
        });

        return this.execute<TInput, TOutput>(input, branch.stages, options);
      }
    }

    throw new Error('No matching branch found in conditional pipeline');
  }

  /**
   * Store stage result (called by coordinator)
   */
  storeStageResult(stageName: string, index: number, result: any): void {
    this.stageResults.set(`${stageName}:${index}`, result);
    this.emit('stage:result:stored', { stageName, index, result });
  }

  /**
   * Get stage result
   */
  getStageResult(stageName: string, index: number): any {
    return this.stageResults.get(`${stageName}:${index}`);
  }

  /**
   * Get all stage results
   */
  getAllStageResults(): Map<string, any> {
    return new Map(this.stageResults);
  }

  /**
   * Clear stored results
   */
  clear(): void {
    this.stageResults.clear();
  }
}

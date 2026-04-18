import { EventEmitter } from 'events';
import { Task, TaskResult } from '../core/types';
import { Coordinator } from '../orchestration/Coordinator';

/**
 * Map function type
 */
export type MapFunction<TInput, TMapOutput> = (
  input: TInput,
  partition: number
) => Promise<TMapOutput>;

/**
 * Reduce function type
 */
export type ReduceFunction<TMapOutput, TFinalOutput> = (
  results: TMapOutput[]
) => Promise<TFinalOutput>;

/**
 * Map-Reduce pattern for distributed data processing
 */
export class MapReducePattern<TInput, TMapOutput, TFinalOutput> extends EventEmitter {
  private coordinator: Coordinator;
  private mapResults: Map<string, TMapOutput> = new Map();

  constructor(coordinator: Coordinator) {
    super();
    this.coordinator = coordinator;
  }

  /**
   * Execute Map-Reduce workflow
   */
  async execute(
    input: TInput[],
    mapFn: MapFunction<TInput, TMapOutput>,
    reduceFn: ReduceFunction<TMapOutput, TFinalOutput>,
    options: {
      mapConcurrency?: number;
      timeout?: number;
    } = {}
  ): Promise<TFinalOutput> {
    const { mapConcurrency = 5, timeout = 60000 } = options;

    this.emit('mapreduce:started', { inputSize: input.length });

    // Phase 1: Map
    const mapTasks = await this.createMapTasks(input, mapFn, mapConcurrency);

    this.emit('mapreduce:map:started', { taskCount: mapTasks.length });

    // Wait for all map tasks to complete
    const mapResults = await this.waitForMapResults(mapTasks, timeout);

    this.emit('mapreduce:map:completed', { resultCount: mapResults.length });

    // Phase 2: Reduce
    this.emit('mapreduce:reduce:started');

    const finalResult = await reduceFn(mapResults);

    this.emit('mapreduce:reduce:completed', { result: finalResult });
    this.emit('mapreduce:completed', { result: finalResult });

    return finalResult;
  }

  /**
   * Create map tasks
   */
  private async createMapTasks(
    input: TInput[],
    mapFn: MapFunction<TInput, TMapOutput>,
    concurrency: number
  ): Promise<Task[]> {
    const tasks: Task[] = [];
    const partitions = Math.min(input.length, concurrency);
    const partitionSize = Math.ceil(input.length / partitions);

    for (let i = 0; i < partitions; i++) {
      const start = i * partitionSize;
      const end = Math.min(start + partitionSize, input.length);
      const partitionData = input.slice(start, end);

      const task = await this.coordinator.submitTask('map', {
        data: partitionData,
        mapFn: mapFn.toString(), // Serialize function
        partition: i,
        start,
        end,
      });

      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Wait for all map results
   */
  private async waitForMapResults(
    tasks: Task[],
    timeout: number
  ): Promise<TMapOutput[]> {
    const results: TMapOutput[] = [];
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      let completed = 0;

      const checkTimeout = setInterval(() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(checkTimeout);
          reject(new Error('Map phase timeout'));
        }
      }, 1000);

      this.coordinator.on('task:completed', (task: Task) => {
        if (tasks.find((t) => t.id === task.id)) {
          // Get result from task
          const result = this.mapResults.get(task.id);
          if (result) {
            results.push(result);
          }

          completed++;

          if (completed === tasks.length) {
            clearInterval(checkTimeout);
            resolve(results);
          }
        }
      });

      this.coordinator.on('task:failed', (task: Task) => {
        if (tasks.find((t) => t.id === task.id)) {
          clearInterval(checkTimeout);
          reject(new Error(`Map task ${task.id} failed`));
        }
      });
    });
  }

  /**
   * Store map result
   */
  storeMapResult(taskId: string, result: TMapOutput): void {
    this.mapResults.set(taskId, result);
    this.emit('map:result:stored', { taskId, result });
  }

  /**
   * Clear stored results
   */
  clear(): void {
    this.mapResults.clear();
  }
}

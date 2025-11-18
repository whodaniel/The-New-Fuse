import { v4 as uuidv4 } from 'uuid';
import { Task, TaskPriority, TaskStatus, TaskDependency } from '../core/types';

/**
 * Decomposition strategy
 */
export interface DecompositionStrategy {
  name: string;
  decompose(task: Task): Task[];
}

/**
 * Task decomposer for breaking complex tasks into subtasks
 */
export class TaskDecomposer {
  private strategies: Map<string, DecompositionStrategy> = new Map();

  /**
   * Register a decomposition strategy
   */
  registerStrategy(taskType: string, strategy: DecompositionStrategy): void {
    this.strategies.set(taskType, strategy);
  }

  /**
   * Decompose a task into subtasks
   */
  decompose(task: Task): Task[] {
    const strategy = this.strategies.get(task.type);

    if (!strategy) {
      // No decomposition strategy, return original task
      return [task];
    }

    const subtasks = strategy.decompose(task);

    // Set up dependencies between subtasks and parent
    subtasks.forEach((subtask, index) => {
      subtask.parentTaskId = task.id;

      // Sequential dependency: each subtask depends on previous
      if (index > 0) {
        const prevTaskId = subtasks[index - 1].id;
        if (!subtask.dependencies) {
          subtask.dependencies = [];
        }
        subtask.dependencies.push({
          taskId: prevTaskId,
          type: 'completion',
        });
      }
    });

    return subtasks;
  }

  /**
   * Decompose task with parallel execution
   */
  decomposeParallel(task: Task, count: number): Task[] {
    const subtasks: Task[] = [];

    for (let i = 0; i < count; i++) {
      subtasks.push({
        ...task,
        id: uuidv4(),
        parentTaskId: task.id,
        metadata: {
          ...task.metadata,
          partitionIndex: i,
          partitionCount: count,
        },
      });
    }

    return subtasks;
  }

  /**
   * Decompose task with sequential execution
   */
  decomposeSequential(task: Task, steps: Partial<Task>[]): Task[] {
    const subtasks: Task[] = [];

    steps.forEach((step, index) => {
      const subtask: Task = {
        id: uuidv4(),
        type: step.type || task.type,
        priority: step.priority || task.priority,
        status: TaskStatus.PENDING,
        payload: step.payload || task.payload,
        requiredCapabilities: step.requiredCapabilities || task.requiredCapabilities,
        parentTaskId: task.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...task.metadata,
          ...step.metadata,
          stepIndex: index,
          stepCount: steps.length,
        },
      };

      // Add dependency on previous step
      if (index > 0) {
        subtask.dependencies = [
          {
            taskId: subtasks[index - 1].id,
            type: 'completion',
          },
        ];
      }

      subtasks.push(subtask);
    });

    return subtasks;
  }

  /**
   * Map-Reduce decomposition
   */
  decomposeMapReduce(
    task: Task,
    mapCount: number,
    reducerConfig?: Partial<Task>
  ): { mapTasks: Task[]; reduceTasks: Task[] } {
    // Create map tasks (parallel)
    const mapTasks: Task[] = [];
    for (let i = 0; i < mapCount; i++) {
      mapTasks.push({
        ...task,
        id: uuidv4(),
        type: `${task.type}:map`,
        parentTaskId: task.id,
        metadata: {
          ...task.metadata,
          phase: 'map',
          mapIndex: i,
          mapCount,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create reduce task (depends on all map tasks)
    const reduceDependencies: TaskDependency[] = mapTasks.map((t) => ({
      taskId: t.id,
      type: 'completion',
    }));

    const reduceTask: Task = {
      id: uuidv4(),
      type: reducerConfig?.type || `${task.type}:reduce`,
      priority: reducerConfig?.priority || task.priority,
      status: TaskStatus.PENDING,
      payload: reducerConfig?.payload || task.payload,
      requiredCapabilities: reducerConfig?.requiredCapabilities,
      parentTaskId: task.id,
      dependencies: reduceDependencies,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        ...task.metadata,
        ...reducerConfig?.metadata,
        phase: 'reduce',
        mapTaskIds: mapTasks.map((t) => t.id),
      },
    };

    return {
      mapTasks,
      reduceTasks: [reduceTask],
    };
  }

  /**
   * Pipeline decomposition (A → B → C)
   */
  decomposePipeline(task: Task, stages: Partial<Task>[]): Task[] {
    const pipelineTasks: Task[] = [];

    stages.forEach((stage, index) => {
      const stageTask: Task = {
        id: uuidv4(),
        type: stage.type || `${task.type}:stage${index}`,
        priority: stage.priority || task.priority,
        status: TaskStatus.PENDING,
        payload: stage.payload || task.payload,
        requiredCapabilities: stage.requiredCapabilities,
        parentTaskId: task.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...task.metadata,
          ...stage.metadata,
          pipelineStage: index,
          pipelineStageCount: stages.length,
        },
      };

      // Each stage depends on previous stage's output
      if (index > 0) {
        stageTask.dependencies = [
          {
            taskId: pipelineTasks[index - 1].id,
            type: 'output',
          },
        ];
      }

      pipelineTasks.push(stageTask);
    });

    return pipelineTasks;
  }

  /**
   * Tree decomposition (hierarchical tasks)
   */
  decomposeTree(task: Task, childConfigs: Partial<Task>[]): Task[] {
    const allTasks: Task[] = [];

    childConfigs.forEach((childConfig) => {
      const childTask: Task = {
        id: uuidv4(),
        type: childConfig.type || task.type,
        priority: childConfig.priority || task.priority,
        status: TaskStatus.PENDING,
        payload: childConfig.payload || task.payload,
        requiredCapabilities: childConfig.requiredCapabilities,
        parentTaskId: task.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...task.metadata,
          ...childConfig.metadata,
        },
      };

      allTasks.push(childTask);
    });

    return allTasks;
  }

  /**
   * Conditional decomposition
   */
  decomposeConditional(
    task: Task,
    branches: Array<{
      condition: (payload: any) => boolean;
      tasks: Partial<Task>[];
    }>
  ): Task[] {
    for (const branch of branches) {
      if (branch.condition(task.payload)) {
        return this.decomposeSequential(task, branch.tasks);
      }
    }

    // If no condition matches, return original task
    return [task];
  }

  /**
   * Dynamic decomposition based on data size
   */
  decomposeByDataSize(
    task: Task,
    dataSize: number,
    chunkSize: number
  ): Task[] {
    const chunks = Math.ceil(dataSize / chunkSize);
    const tasks: Task[] = [];

    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, dataSize);

      tasks.push({
        ...task,
        id: uuidv4(),
        parentTaskId: task.id,
        payload: {
          ...task.payload,
          chunkStart: start,
          chunkEnd: end,
        },
        metadata: {
          ...task.metadata,
          chunkIndex: i,
          chunkCount: chunks,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return tasks;
  }

  /**
   * Aggregate results from subtasks
   */
  aggregateResults(
    subtasks: Task[],
    results: Map<string, any>,
    aggregator: (results: any[]) => any
  ): any {
    const subtaskResults = subtasks
      .map((task) => results.get(task.id))
      .filter((result) => result !== undefined);

    return aggregator(subtaskResults);
  }
}

import { ClineBridge } from '../cline_bridge.js';
import { jest } from '@jest/globals';
import { Task } from '../types/task.js';
import { ImplementationPhase } from '../types/phase.js';

export interface PriorityFactors {
    basePriority: number;
    dependencyWeight: number;
    failureWeight: number;
    resourceWeight: number;
    retryPenalty: number;
}

export class PriorityManager {
    private static readonly DEFAULT_FACTORS: PriorityFactors = {
        basePriority: 1,
        dependencyWeight: 1.5,
        failureWeight: 1.2,
        resourceWeight: 0.8,
        retryPenalty: 0.7
    };

    private factors: PriorityFactors;

    constructor(factors?: Partial<PriorityFactors>) {
        this.factors = { ...PriorityManager.DEFAULT_FACTORS, ...factors };
    }

    calculateTaskPriority(
        task: Task,
        dependencies: Task[],
        phase: ImplementationPhase,
        resourceAvailability: number
    ): number {
        let priority = task.basePriority || this.factors.basePriority;

        // Adjust for dependencies
        if (dependencies.some(dep => dep.status === 'failed')) {
            priority *= this.factors.dependencyWeight;
        }

        // Adjust for previous failures in the phase
        const failureRate = this.calculatePhaseFailureRate(phase);
        if (failureRate > 0) {
            priority *= (1 + failureRate * this.factors.failureWeight);
        }

        // Adjust for resource availability
        priority *= (resourceAvailability * this.factors.resourceWeight);

        // Adjust for retry attempts
        if (task.retryCount && task.retryCount > 0) {
            priority *= Math.pow(this.factors.retryPenalty, task.retryCount);
        }

        return priority;
    }

    private calculatePhaseFailureRate(phase: ImplementationPhase): number {
        if (!phase.tasks || phase.tasks.length === 0) return 0;

        const failedTasks = phase.tasks.filter(task => task.status === 'failed').length;
        return failedTasks / phase.tasks.length;
    }
}

describe('ClineBridge', () => {
    let bridge: ClineBridge;

    beforeEach(() => {
        bridge = new ClineBridge();
    });

    afterEach(async () => {
        await bridge.shutdown();
    });

    test('initializes successfully', async () => {
        const result = await bridge.initialize();
        expect(result).toBe(true);
    });

    test('sends task successfully', async () => {
        await bridge.initialize();
        const task = { type: 'test', data: 'sample' };
        await expect(bridge.sendTask(task)).resolves.not.toThrow();
    });

    test('receives results correctly', async () => {
        await bridge.initialize();
        const callback = jest.fn();
        
        await bridge.onResult(callback);
        
        // Simulate receiving a result
        const mockResult = { status: 'success', data: 'test' };
        await bridge['client'].emit('message', 'AI_RESULT_CHANNEL', JSON.stringify(mockResult));
        
        expect(callback).toHaveBeenCalledWith(mockResult);
    });

    test('health check returns correct status', async () => {
        await bridge.initialize();
        const health = await bridge.isHealthy();
        expect(health).toBe(true);
    });
});

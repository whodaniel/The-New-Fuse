import { Injectable } from '@nestjs/common';
import { A2ALogger } from './A2ALogger.js';
import { A2ATransactionManager } from './A2ATransactionManager.js';
import { A2ADeadlockDetector } from './A2ADeadlockDetector.js';
import { RedisClient } from './RedisClient.js';

interface ConflictResolution {
    strategy: 'retry' | 'compensate' | 'force' | 'abort';
    compensation?: CompensationAction[];
}

interface CompensationAction {
    operationId: string;
    type: string;
    params: any;
    order: number;
}

@Injectable()
export class A2AConflictResolver {
    private readonly conflictKey = 'a2a:conflicts:';
    private readonly compensationKey = 'a2a:compensations:';

    constructor(
        private transactions: A2ATransactionManager,
        private deadlockDetector: A2ADeadlockDetector,
        private redis: RedisClient,
        private logger: A2ALogger
    ) {}

    async handleConflict(
        workflowId: string,
        conflictType: string,
        context: any
    ): Promise<ConflictResolution> {
        const resolution = await this.determineResolutionStrategy(
            workflowId,
            conflictType,
            context
        );

        if (resolution.strategy === 'compensate') {
            await this.registerCompensation(workflowId, resolution.compensation);
        }

        await this.logConflictResolution(workflowId, conflictType, resolution);
        return resolution;
    }

    async executeCompensation(workflowId: string): Promise<void> {
        const actions = await this.getCompensationActions(workflowId);
        
        // Sort actions by order to ensure correct compensation sequence
        actions.sort((a, b) => b.order - a.order);

        for (const action of actions) {
            await this.executeCompensationAction(action);
        }
    }

    private async determineResolutionStrategy(
        workflowId: string,
        conflictType: string,
        context: any
    ): Promise<ConflictResolution> {
        switch (conflictType) {
            case 'resource_conflict':
                return this.handleResourceConflict(context);
            case 'version_conflict':
                return this.handleVersionConflict(context);
            case 'state_conflict':
                return this.handleStateConflict(context);
            default:
                return { strategy: 'abort' };
        }
    }

    private async handleResourceConflict(context: any): Promise<ConflictResolution> {
        const { resourceId, requestingAgent } = context;
        
        const isDeadlocked = await this.deadlockDetector.checkDeadlock(
            resourceId,
            requestingAgent
        );

        if (isDeadlocked) {
            return {
                strategy: 'compensate',
                compensation: await this.createCompensationPlan(context)
            };
        }

        return { strategy: 'retry' };
    }

    private async handleVersionConflict(context: any): Promise<ConflictResolution> {
        // Version conflict resolution logic
        return { strategy: 'abort' };
    }

    private async handleStateConflict(context: any): Promise<ConflictResolution> {
        // State conflict resolution logic
        return { strategy: 'compensate' };
    }

    private async createCompensationPlan(
        context: any
    ): Promise<CompensationAction[]> {
        const actions: CompensationAction[] = [];
        // Build compensation plan based on context
        return actions;
    }

    private async executeCompensationAction(
        action: CompensationAction
    ): Promise<void> {
        try {
            await this.transactions.beginTransaction(action.operationId);
            // Execute compensation logic
            await this.transactions.commit(action.operationId);
        } catch (error) {
            await this.transactions.rollback(action.operationId);
            throw error;
        }
    }

    private async registerCompensation(
        workflowId: string,
        actions: CompensationAction[]
    ): Promise<void> {
        const key = `${this.compensationKey}${workflowId}`;
        await this.redis.set(key, JSON.stringify(actions));
    }

    private async getCompensationActions(
        workflowId: string
    ): Promise<CompensationAction[]> {
        const key = `${this.compensationKey}${workflowId}`;
        const data = await this.redis.get(key);
        return JSON.parse(data || '[]');
    }

    private async logConflictResolution(
        workflowId: string,
        conflictType: string,
        resolution: ConflictResolution
    ): Promise<void> {
        this.logger.logProtocolMessage({
            type: 'CONFLICT_RESOLUTION',
            workflowId,
            conflictType,
            resolution: resolution.strategy,
            timestamp: Date.now()
        }, { conflict: true });
    }
}
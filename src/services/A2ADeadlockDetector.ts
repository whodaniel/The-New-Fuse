import { Injectable, OnModuleInit } from '@nestjs/common';
import { A2ALogger } from './A2ALogger.js';
import { RedisClient } from './RedisClient.js';
import { A2ATransactionManager } from './A2ATransactionManager.js';

interface ResourceLock {
    resourceId: string;
    holder: string;
    waiters: string[];
    timestamp: number;
}

@Injectable()
export class A2ADeadlockDetector implements OnModuleInit {
    private readonly lockKey = 'a2a:resource_locks';
    private readonly detectionInterval = 10000; // 10 seconds

    constructor(
        private redis: RedisClient,
        private transactionManager: A2ATransactionManager,
        private logger: A2ALogger
    ) {}

    async onModuleInit() {
        this.startDeadlockDetection();
    }

    private startDeadlockDetection() {
        setInterval(async () => {
            await this.detectDeadlocks();
        }, this.detectionInterval);
    }

    async acquireResource(
        transactionId: string,
        resourceId: string
    ): Promise<boolean> {
        const lockInfo = await this.getLockInfo(resourceId);

        if (!lockInfo || !lockInfo.holder) {
            await this.setLock(resourceId, transactionId);
            return true;
        }

        await this.addWaiter(resourceId, transactionId);
        return false;
    }

    async releaseResource(
        transactionId: string,
        resourceId: string
    ): Promise<void> {
        const lockInfo = await this.getLockInfo(resourceId);
        
        if (lockInfo?.holder === transactionId) {
            if (lockInfo.waiters.length > 0) {
                const nextHolder = lockInfo.waiters[0];
                lockInfo.waiters = lockInfo.waiters.slice(1);
                lockInfo.holder = nextHolder;
                await this.setLockInfo(resourceId, lockInfo);
            } else {
                await this.removeLock(resourceId);
            }
        }
    }

    private async detectDeadlocks(): Promise<void> {
        const locks = await this.getAllLocks();
        const graph = this.buildWaitForGraph(locks);
        const cycles = this.findCycles(graph);

        for (const cycle of cycles) {
            await this.resolveDeadlock(cycle);
        }
    }

    private buildWaitForGraph(locks: Map<string, ResourceLock>): Map<string, string[]> {
        const graph = new Map<string, string[]>();

        for (const lock of locks.values()) {
            for (const waiter of lock.waiters) {
                if (!graph.has(waiter)) {
                    graph.set(waiter, []);
                }
                graph.get(waiter).push(lock.holder);
            }
        }

        return graph;
    }

    private findCycles(graph: Map<string, string[]>): string[][] {
        const visited = new Set<string>();
        const cycles: string[][] = [];

        for (const node of graph.keys()) {
            if (!visited.has(node)) {
                this.dfs(node, [], visited, new Set(), graph, cycles);
            }
        }

        return cycles;
    }

    private dfs(
        node: string,
        path: string[],
        visited: Set<string>,
        stack: Set<string>,
        graph: Map<string, string[]>,
        cycles: string[][]
    ): void {
        visited.add(node);
        stack.add(node);
        path.push(node);

        for (const neighbor of graph.get(node) || []) {
            if (!visited.has(neighbor)) {
                this.dfs(neighbor, [...path], visited, stack, graph, cycles);
            } else if (stack.has(neighbor)) {
                const cycle = path.slice(path.indexOf(neighbor));
                cycles.push(cycle);
            }
        }

        stack.delete(node);
    }

    private async resolveDeadlock(cycle: string[]): Promise<void> {
        const victim = await this.selectVictim(cycle);
        await this.transactionManager.rollback(victim);
        this.logger.logProtocolMessage({
            type: 'DEADLOCK_RESOLVED',
            cycle,
            victim
        }, { deadlock: true });
    }

    private async selectVictim(cycle: string[]): Promise<string> {
        // Select transaction with lowest priority or youngest timestamp
        return cycle[0];
    }

    private async getLockInfo(resourceId: string): Promise<ResourceLock | null> {
        const data = await this.redis.hget(this.lockKey, resourceId);
        return data ? JSON.parse(data) : null;
    }

    private async setLockInfo(resourceId: string, lock: ResourceLock): Promise<void> {
        await this.redis.hset(this.lockKey, resourceId, JSON.stringify(lock));
    }

    private async getAllLocks(): Promise<Map<string, ResourceLock>> {
        const data = await this.redis.hgetall(this.lockKey);
        return new Map(
            Object.entries(data).map(([key, value]) => [key, JSON.parse(value)])
        );
    }

    private async setLock(resourceId: string, holder: string): Promise<void> {
        const lock: ResourceLock = {
            resourceId,
            holder,
            waiters: [],
            timestamp: Date.now()
        };
        await this.setLockInfo(resourceId, lock);
    }

    private async addWaiter(resourceId: string, transactionId: string): Promise<void> {
        const lock = await this.getLockInfo(resourceId);
        if (lock && !lock.waiters.includes(transactionId)) {
            lock.waiters.push(transactionId);
            await this.setLockInfo(resourceId, lock);
        }
    }

    private async removeLock(resourceId: string): Promise<void> {
        await this.redis.hdel(this.lockKey, resourceId);
    }
}
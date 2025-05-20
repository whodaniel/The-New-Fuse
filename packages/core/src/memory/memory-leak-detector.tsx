import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import v8 from 'v8';
import { Logger } from '../utils/logger.js';

interface HeapSnapshot {
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    objectCounts: Map<string, number>;
}

@Injectable()
export class MemoryLeakDetector {
    private snapshots: HeapSnapshot[] = [];
    private monitoringInterval: NodeJS.Timeout | null = null;
    private readonly SNAPSHOT_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private readonly SNAPSHOT_RETENTION = 12; // Keep last 12 snapshots (1 hour worth)
    private readonly GROWTH_THRESHOLD = 0.1; // 10% growth threshold
    private logger = new Logger(MemoryLeakDetector.name);

    constructor(private readonly eventEmitter: EventEmitter2) {}

    public startMonitoring(): void {
        if (this.monitoringInterval) {
            return;
        }

        this.monitoringInterval = setInterval(() => {
            this.takeSnapshot();
            this.analyzeMemoryGrowth();
        }, this.SNAPSHOT_INTERVAL);

        this.logger.log('Memory leak detection started');
    }

    public stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.logger.log('Memory leak detection stopped');
        }
    }

    private takeSnapshot(): void {
        const memoryUsage = process.memoryUsage();
        const heapStats = v8.getHeapStatistics();
        
        // Get object counts by type
        const objectCounts = new Map<string, number>();
        // Note: In a production environment, you'd want to use v8.getHeapSnapshot()
        // but for performance reasons we're using getHeapStatistics here

        const snapshot: HeapSnapshot = {
            timestamp: Date.now(),
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            objectCounts
        };

        this.snapshots.push(snapshot);

        // Keep only the most recent snapshots
        if (this.snapshots.length > this.SNAPSHOT_RETENTION) {
            this.snapshots.shift();
        }
    }

    private analyzeMemoryGrowth(): void {
        if (this.snapshots.length < 2) {
            return;
        }

        const recentSnapshots = this.snapshots.slice(-2);
        const [previousSnapshot, currentSnapshot] = recentSnapshots;

        // Calculate growth rate
        const growthRate = (currentSnapshot.heapUsed - previousSnapshot.heapUsed) / previousSnapshot.heapUsed;

        // Check for memory leak indicators
        const potentialLeak = this.detectPotentialLeak(growthRate);
        if (potentialLeak) {
            this.handlePotentialLeak(growthRate, currentSnapshot);
        }

        // Analyze object count changes
        this.analyzeObjectCounts(previousSnapshot, currentSnapshot);
    }

    private detectPotentialLeak(growthRate: number): boolean {
        return growthRate > this.GROWTH_THRESHOLD;
    }

    private handlePotentialLeak(growthRate: number, snapshot: HeapSnapshot): void {
        const warning = {
            type: 'memory_leak_warning',
            growthRate: growthRate * 100,
            currentHeapUsed: snapshot.heapUsed,
            currentHeapTotal: snapshot.heapTotal,
            timestamp: new Date(),
            objectCounts: Object.fromEntries(snapshot.objectCounts)
        };

        this.logger.warn('Potential memory leak detected', warning);
        this.eventEmitter.emit('memory.leak.detected', warning);
    }

    private analyzeObjectCounts(previous: HeapSnapshot, current: HeapSnapshot): void {
        const growingObjects = new Map<string, number>();

        current.objectCounts.forEach((count, type) => {
            const previousCount = previous.objectCounts.get(type) || 0;
            const growth = count - previousCount;
            if (growth > 0) {
                growingObjects.set(type, growth);
            }
        });

        if (growingObjects.size > 0) {
            this.logger.debug('Object count changes detected', {
                changes: Object.fromEntries(growingObjects)
            });
        }
    }

    public getLeakReport() {
        if (this.snapshots.length < 2) {
            return {
                hasLeak: false,
                growthRate: 0,
                largestObjects: []
            };
        }

        const [previousSnapshot, currentSnapshot] = this.snapshots.slice(-2);
        const growthRate = (currentSnapshot.heapUsed - previousSnapshot.heapUsed) / previousSnapshot.heapUsed;

        // Get the top 5 growing object types
        const objectGrowth = Array.from(currentSnapshot.objectCounts.entries())
            .map(([type, count]) => ({
                type,
                count,
                growth: count - (previousSnapshot.objectCounts.get(type) || 0)
            }))
            .sort((a, b) => b.growth - a.growth)
            .slice(0, 5);

        return {
            hasLeak: growthRate > this.GROWTH_THRESHOLD,
            growthRate,
            largestObjects: objectGrowth.map(({ type, count }) => ({ type, count }))
        };
    }
}
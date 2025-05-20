import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import v8 from 'v8';
import { Logger } from '../utils/logger.js';
import { MemoryProfile } from './types/MemoryTypes.js';

@Injectable()
export class PerformanceProfiler {
    private profiles: MemoryProfile[] = [];
    private profilingInterval: NodeJS.Timeout | null = null;
    private readonly PROFILE_INTERVAL = 60000; // 1 minute
    private readonly MAX_PROFILES = 60; // Keep 1 hour of profiles
    private logger = new Logger(PerformanceProfiler.name);

    constructor(private readonly eventEmitter: EventEmitter2) {}

    public startProfiling(): void {
        if (this.profilingInterval) {
            return;
        }

        this.profilingInterval = setInterval(() => {
            this.takeProfile();
        }, this.PROFILE_INTERVAL);

        // Take initial profile
        this.takeProfile();
        this.logger.log('Performance profiling started');
    }

    public stopProfiling(): void {
        if (this.profilingInterval) {
            clearInterval(this.profilingInterval);
            this.profilingInterval = null;
            this.logger.log('Performance profiling stopped');
        }
    }

    private takeProfile(): void {
        const heapStats = v8.getHeapStatistics();
        const memoryUsage = process.memoryUsage();

        const profile: MemoryProfile = {
            timestamp: new Date(),
            heapStats: {
                heapSizeLimit: heapStats.heap_size_limit,
                totalHeapSize: heapStats.total_heap_size,
                usedHeapSize: heapStats.used_heap_size,
                heapSizeExecutable: heapStats.heap_size_executable,
                totalPhysicalSize: heapStats.total_physical_size,
                totalAvailableSize: heapStats.total_available_size,
                mallocedMemory: heapStats.malloced_memory,
                peakMallocedMemory: heapStats.peak_malloced_memory
            },
            objectCounts: this.getObjectCounts(),
            retainedSize: memoryUsage.heapUsed
        };

        this.profiles.push(profile);

        // Keep only recent profiles
        if (this.profiles.length > this.MAX_PROFILES) {
            this.profiles.shift();
        }

        // Emit profile for monitoring
        this.eventEmitter.emit('memory.profile.created', profile);

        // Check for performance issues
        this.analyzeProfile(profile);
    }

    private getObjectCounts(): Map<string, number> {
        const counts = new Map<string, number>();
        
        // In a production environment, you would use v8.getHeapSnapshot()
        // to get detailed object counts. This is a simplified version.
        const memoryUsage = process.memoryUsage();
        counts.set('heap', memoryUsage.heapUsed);
        counts.set('external', memoryUsage.external);
        counts.set('arrayBuffers', memoryUsage.arrayBuffers || 0);

        return counts;
    }

    private analyzeProfile(profile: MemoryProfile): void {
        // Check heap usage threshold (80%)
        const heapUsageRatio = profile.heapStats.usedHeapSize / profile.heapStats.totalHeapSize;
        if (heapUsageRatio > 0.8) {
            this.logger.warn('High heap usage detected', {
                usageRatio: heapUsageRatio,
                usedHeapSize: profile.heapStats.usedHeapSize,
                totalHeapSize: profile.heapStats.totalHeapSize
            });
            
            this.eventEmitter.emit('memory.threshold.exceeded', {
                type: 'heap_usage',
                value: heapUsageRatio * 100,
                threshold: 80
            });
        }

        // Check fragmentation
        const fragmentationRatio = 1 - (profile.heapStats.usedHeapSize / profile.heapStats.totalPhysicalSize);
        if (fragmentationRatio > 0.5) {
            this.logger.warn('High heap fragmentation detected', {
                fragmentationRatio,
                usedHeapSize: profile.heapStats.usedHeapSize,
                totalPhysicalSize: profile.heapStats.totalPhysicalSize
            });
        }

        // Analyze growth patterns
        if (this.profiles.length > 1) {
            const previousProfile = this.profiles[this.profiles.length - 2];
            const growthRate = (profile.retainedSize - previousProfile.retainedSize) / previousProfile.retainedSize;
            
            if (growthRate > 0.2) { // 20% growth
                this.logger.warn('Significant memory growth detected', {
                    growthRate: growthRate * 100,
                    previousSize: previousProfile.retainedSize,
                    currentSize: profile.retainedSize
                });
            }
        }
    }

    public async queryProfiles(options: {
        type: 'memory' | 'gc';
        startTime: Date;
        endTime?: Date;
    }): Promise<MemoryProfile[]> {
        const endTime = options.endTime || new Date();
        
        return this.profiles.filter(profile => 
            profile.timestamp >= options.startTime &&
            profile.timestamp <= endTime
        );
    }

    public getLatestProfile(): MemoryProfile | null {
        return this.profiles[this.profiles.length - 1] || null;
    }

    public getProfileSummary() {
        if (this.profiles.length === 0) {
            return null;
        }

        const latestProfile = this.profiles[this.profiles.length - 1];
        const oldestProfile = this.profiles[0];

        const memoryGrowth = (latestProfile.retainedSize - oldestProfile.retainedSize) / oldestProfile.retainedSize;
        const avgHeapUsage = this.profiles.reduce((sum, p) => sum + p.heapStats.usedHeapSize, 0) / this.profiles.length;

        return {
            timeSpan: latestProfile.timestamp.getTime() - oldestProfile.timestamp.getTime(),
            memoryGrowth: memoryGrowth * 100,
            averageHeapUsage: avgHeapUsage,
            currentHeapUsage: latestProfile.heapStats.usedHeapSize,
            totalHeapSize: latestProfile.heapStats.totalHeapSize,
            profileCount: this.profiles.length
        };
    }
}
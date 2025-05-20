import { MemoryProfile, MemoryLeakWarning } from './types/MemoryTypes.js';

export class MemoryLeakDetector {
    private memoryProfiles: MemoryProfile[] = [];
    private readonly profileLimit = 100;
    private readonly growthThreshold = 0.1; // 10% growth rate threshold
    private readonly samplingInterval = 60000; // 1 minute
    private timer: NodeJS.Timer | null = null;

    constructor(private onLeakDetected: (warning: MemoryLeakWarning) => void) {}

    public startMonitoring(): void {
        if (this.timer) return;
        
        this.timer = setInterval(() => this.takeSnapshot(), this.samplingInterval);
    }

    public stopMonitoring(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private takeSnapshot(): void {
        const heapStats = process.memoryUsage();
        const profile: MemoryProfile = {
            timestamp: new Date(),
            heapStats: {
                heapSizeLimit: process.memoryUsage().heapTotal,
                totalHeapSize: heapStats.heapTotal,
                usedHeapSize: heapStats.heapUsed,
                heapSizeExecutable: 0, // Not available in Node.js
                totalPhysicalSize: heapStats.rss,
                totalAvailableSize: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed,
                mallocedMemory: heapStats.external,
                peakMallocedMemory: heapStats.external
            },
            objectCounts: new Map(),
            retainedSize: heapStats.heapUsed
        };

        this.memoryProfiles.push(profile);
        
        if (this.memoryProfiles.length > this.profileLimit) {
            this.memoryProfiles.shift();
        }

        this.analyzeMemoryGrowth();
    }

    private analyzeMemoryGrowth(): void {
        if (this.memoryProfiles.length < 2) return;

        const recentProfiles = this.memoryProfiles.slice(-10);
        const growthRate = this.calculateGrowthRate(recentProfiles);

        if (growthRate > this.growthThreshold) {
            const latestProfile = this.memoryProfiles[this.memoryProfiles.length - 1];
            const warning: MemoryLeakWarning = {
                type: 'memory_leak_warning',
                growthRate,
                currentHeapUsed: latestProfile.heapStats.usedHeapSize,
                currentHeapTotal: latestProfile.heapStats.totalHeapSize,
                timestamp: new Date(),
                objectCounts: Object.fromEntries(latestProfile.objectCounts)
            };
            
            this.onLeakDetected(warning);
        }
    }

    private calculateGrowthRate(profiles: MemoryProfile[]): number {
        if (profiles.length < 2) return 0;

        const first = profiles[0].heapStats.usedHeapSize;
        const last = profiles[profiles.length - 1].heapStats.usedHeapSize;
        const timeSpan = profiles[profiles.length - 1].timestamp.getTime() - profiles[0].timestamp.getTime();
        
        return (last - first) / first / (timeSpan / 1000 / 3600); // Growth rate per hour
    }

    public getMemoryGrowthTrend(): number[] {
        return this.memoryProfiles.map(profile => profile.heapStats.usedHeapSize);
    }

    public getCurrentMemoryUsage(): number {
        const latest = this.memoryProfiles[this.memoryProfiles.length - 1];
        return latest ? latest.heapStats.usedHeapSize : 0;
    }
}
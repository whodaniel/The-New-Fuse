"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MemoryMonitor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryMonitor = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
let MemoryMonitor = MemoryMonitor_1 = class MemoryMonitor {
    eventEmitter;
    logger = new common_1.Logger(MemoryMonitor_1.name);
    monitoringInterval = null;
    CHECK_INTERVAL = 30000; // 30 seconds
    WARNING_THRESHOLD = 0.75; // 75% of heap limit
    CRITICAL_THRESHOLD = 0.90; // 90% of heap limit
    MAX_HISTORY = 100; // Keep last 100 measurements
    memoryHistory = [];
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    async onModuleInit() {
        this.startMonitoring();
        this.logger.log('Memory monitoring started');
    }
    async onModuleDestroy() {
        this.stopMonitoring();
        this.memoryHistory = [];
        this.logger.log('Memory monitoring stopped');
    }
    startMonitoring() {
        if (this.monitoringInterval) {
            return;
        }
        this.monitoringInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, this.CHECK_INTERVAL);
    }
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
    checkMemoryUsage() {
        const memUsage = process.memoryUsage();
        const usage = {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            arrayBuffers: memUsage.arrayBuffers,
            rss: memUsage.rss,
            timestamp: Date.now(),
            percentage: memUsage.heapUsed / memUsage.heapTotal
        };
        // Add to history
        this.memoryHistory.push(usage);
        if (this.memoryHistory.length > this.MAX_HISTORY) {
            this.memoryHistory.shift();
        }
        // Check thresholds
        this.checkThresholds(usage);
        // Emit memory usage event
        this.eventEmitter.emit('memory.usage', usage);
    }
    checkThresholds(usage) {
        if (usage.percentage >= this.CRITICAL_THRESHOLD) {
            this.handleCriticalMemoryUsage(usage);
        }
        else if (usage.percentage >= this.WARNING_THRESHOLD) {
            this.handleWarningMemoryUsage(usage);
        }
    }
    handleWarningMemoryUsage(usage) {
        const alert = {
            type: 'warning',
            usage,
            threshold: this.WARNING_THRESHOLD,
            message: `High memory usage detected: ${Math.round(usage.percentage * 100)}%
    };

    this.logger.warn(alert.message, {`,
            heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}`, MB,
            heapTotal: $
        }, { Math, round };
        (usage.heapTotal / 1024 / 1024);
    }
    MB;
};
exports.MemoryMonitor = MemoryMonitor;
exports.MemoryMonitor = MemoryMonitor = MemoryMonitor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], MemoryMonitor);
`
      percentage: ${Math.round(usage.percentage * 100)}` %
;
;
this.eventEmitter.emit('memory.warning', alert);
handleCriticalMemoryUsage(usage, MemoryUsage);
{
    const alert = {
        type: 'critical',
        usage,
        threshold: this.CRITICAL_THRESHOLD,
        message: Critical, memory, usage, detected: $
    }, { Math, round };
    (usage.percentage * 100);
}
 %
;
;
`
`;
this.logger.error(alert.message, {
    heapUsed: $
}, { Math, : .round(usage.heapUsed / 1024 / 1024) } `MB,
      heapTotal: ${Math.round(usage.heapTotal / 1024 / 1024)}MB,`, percentage, $, { Math, : .round(usage.percentage * 100) } %
);
// Trigger garbage collection if available
if (global.gc) {
    this.logger.log('Triggering garbage collection...');
    global.gc();
}
// Emit critical alert
this.eventEmitter.emit('memory.critical', alert);
// Emit cleanup signal for other services
this.eventEmitter.emit('memory.cleanup.required', alert);
getCurrentUsage();
MemoryUsage | null;
{
    return this.memoryHistory.length > 0
        ? this.memoryHistory[this.memoryHistory.length - 1]
        : null;
}
getMemoryHistory();
MemoryUsage[];
{
    return [...this.memoryHistory];
}
getMemoryTrend();
'increasing' | 'decreasing' | 'stable';
{
    if (this.memoryHistory.length < 5) {
        return 'stable';
    }
    const recent = this.memoryHistory.slice(-5);
    const first = recent[0].percentage;
    const last = recent[recent.length - 1].percentage;
    const diff = last - first;
    if (diff > 0.05)
        return 'increasing'; // 5% increase
    if (diff < -0.05)
        return 'decreasing'; // 5% decrease
    return 'stable';
}
getAverageMemoryUsage(minutes, number = 5);
number;
{
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentUsage = this.memoryHistory.filter(usage => usage.timestamp >= cutoff);
    if (recentUsage.length === 0)
        return 0;
    const total = recentUsage.reduce((sum, usage) => sum + usage.percentage, 0);
    return total / recentUsage.length;
}
isMemoryLeakSuspected();
boolean;
{
    const trend = this.getMemoryTrend();
    const avgUsage = this.getAverageMemoryUsage(10); // 10 minutes
    return trend === 'increasing' && avgUsage > this.WARNING_THRESHOLD;
}
forceGarbageCollection();
boolean;
{
    if (global.gc) {
        this.logger.log('Forcing garbage collection...');
        global.gc();
        return true;
    }
    this.logger.warn('Garbage collection not available. Start Node.js with --expose-gc flag.');
    return false;
}
getMemoryStats();
{
    const current = this.getCurrentUsage();
    if (!current)
        return null;
    return {
        current: {} `
        heapUsed: ${Math.round(current.heapUsed / 1024 / 1024)}MB,`,
        heapTotal: $
    };
    {
        Math.round(current.heapTotal / 1024 / 1024);
    }
    `MB,
        percentage: ${Math.round(current.percentage * 100)}%,
        rss: ${Math.round(current.rss / 1024 / 1024)}MB
      },`;
    trend: this.getMemoryTrend(), `
      averageUsage: ${Math.round(this.getAverageMemoryUsage() * 100)}%`,
        leakSuspected;
    this.isMemoryLeakSuspected(),
        historyCount;
    this.memoryHistory.length;
}
;
// Emergency cleanup method
async;
performEmergencyCleanup();
Promise < void  > {
    this: .logger.warn('Performing emergency memory cleanup...'),
    : .memoryHistory.length > 10
};
{
    this.memoryHistory = this.memoryHistory.slice(-10);
}
// Force garbage collection
this.forceGarbageCollection();
// Emit cleanup signal
this.eventEmitter.emit('memory.emergency.cleanup');
this.logger.log('Emergency cleanup completed');
//# sourceMappingURL=memory-monitor.js.map
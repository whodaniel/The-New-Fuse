"use strict";
/**
 * Example usage of MasterClockService with existing infrastructure integration
 * This demonstrates how to set up and use the MasterClockService in a real application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationWithMasterClock = exports.MasterClockServiceFactory = void 0;
exports.demonstrateMasterClockService = demonstrateMasterClockService;
const MasterClockService_1 = require("./MasterClockService");
// Example configuration for production use
const createMasterClockConfig = () => ({
    syncIntervalMs: 5000, // Sync every 5 seconds
    driftThresholdMs: 100, // Alert if drift > 100ms
    maxDriftMs: 1000, // Critical if drift > 1000ms
    correctionIntervalMs: 30000, // Check for corrections every 30 seconds
    instanceId: `master-clock-${process.env.NODE_ENV || 'development'}-${Date.now()}`,
    redisChannels: {
        clockSync: 'sync:master-clock:sync',
        driftAlert: 'sync:master-clock:drift-alert',
        correction: 'sync:master-clock:correction',
    },
});
// Mock services for demonstration (in real app, these would be injected)
const createMockServices = () => {
    const mockRedisService = {
        async subscribe(channel, callback) {
            console.log(`Subscribed to Redis channel: ${channel}`);
        },
        async unsubscribe(channel) {
            console.log(`Unsubscribed from Redis channel: ${channel}`);
        },
        async publish(channel, message) {
            console.log(`Published to ${channel}: ${message.substring(0, 100)}...`);
            return 1;
        },
        async hset(key, field, value) {
            console.log(`Redis HSET: ${key}.${field} = ${value.substring(0, 50)}...`);
        },
    };
    const mockHeartbeatService = {
        on(event, callback) {
            console.log(`Registered heartbeat listener for: ${event}`);
        },
        emit(event, ...args) {
            console.log(`Heartbeat event emitted: ${event}`);
            return true;
        },
    };
    const mockMetricsService = {
        async collectMetric(...args) {
            console.log('Metric collected:', args);
        },
        async getMetrics() {
            return { clockSync: { operations: 100, errors: 0 } };
        },
    };
    return { mockRedisService, mockHeartbeatService, mockMetricsService };
};
// Example usage
async function demonstrateMasterClockService() {
    console.log('=== MasterClockService Integration Example ===\n');
    // 1. Create configuration
    const config = createMasterClockConfig();
    console.log('Configuration created:', {
        instanceId: config.instanceId,
        syncInterval: `${config.syncIntervalMs}ms`,
        driftThreshold: `${config.driftThresholdMs}ms`,
    });
    // 2. Create mock services (in real app, these would be dependency injected)
    const { mockRedisService, mockHeartbeatService, mockMetricsService } = createMockServices();
    // 3. Initialize MasterClockService
    const masterClock = new MasterClockService_1.MasterClockService(config, mockRedisService, mockHeartbeatService, mockMetricsService);
    // 4. Set up event listeners to demonstrate integration
    masterClock.on('initialized', () => {
        console.log('✅ MasterClockService initialized successfully');
    });
    masterClock.on('drift_detected', (report) => {
        console.log('⚠️  Clock drift detected:', {
            maxDrift: `${report.maxDrift}ms`,
            instanceCount: report.instances.length,
            requiresCorrection: report.requiresCorrection,
        });
    });
    masterClock.on('drift_corrected', (data) => {
        console.log('🔧 Clock drift corrected for instances:', data.instanceIds);
    });
    masterClock.on('health_status_changed', (data) => {
        console.log('📊 Health status changed:', {
            from: data.oldStatus,
            to: data.newStatus,
            maxDrift: `${data.maxDrift}ms`,
        });
    });
    try {
        // 5. Initialize the service
        console.log('\n--- Initializing MasterClockService ---');
        await masterClock.initialize();
        // 6. Demonstrate time synchronization
        console.log('\n--- Time Synchronization ---');
        const syncedTime = await masterClock.now();
        console.log('Synchronized timestamp:', syncedTime.toISOString());
        // 7. Sync with specific instances
        await masterClock.syncTime('agent-instance-1');
        await masterClock.syncTime('agent-instance-2');
        // 8. Demonstrate drift detection
        console.log('\n--- Drift Detection ---');
        const driftReport = await masterClock.detectDrift();
        console.log('Drift report:', {
            instanceCount: driftReport.instances.length,
            maxDrift: `${driftReport.maxDrift}ms`,
            requiresCorrection: driftReport.requiresCorrection,
        });
        // 9. Show metrics
        console.log('\n--- Clock Metrics ---');
        const metrics = masterClock.getClockMetrics();
        console.log('Clock metrics:', {
            syncOperations: metrics.syncOperations,
            driftCorrections: metrics.driftCorrections,
            healthStatus: metrics.healthStatus,
            instanceCount: metrics.instanceCount,
        });
        // 10. Force synchronization
        console.log('\n--- Force Synchronization ---');
        await masterClock.forceSync();
        console.log('Force sync completed');
        // 11. Demonstrate graceful shutdown
        console.log('\n--- Shutdown ---');
        await masterClock.shutdown();
        console.log('✅ MasterClockService shutdown completed');
    }
    catch (error) {
        console.error('❌ Error during demonstration:', error);
    }
}
// Integration patterns for real applications
class MasterClockServiceFactory {
    /**
     * Create a MasterClockService instance with production-ready configuration
     */
    static create(redisService, heartbeatService, metricsService, options = {}) {
        const defaultConfig = createMasterClockConfig();
        const config = { ...defaultConfig, ...options };
        return new MasterClockService_1.MasterClockService(config, redisService, heartbeatService, metricsService);
    }
    /**
     * Create a MasterClockService with development-friendly settings
     */
    static createForDevelopment(redisService, heartbeatService, metricsService) {
        return this.create(redisService, heartbeatService, metricsService, {
            syncIntervalMs: 2000, // More frequent sync for development
            driftThresholdMs: 50, // Lower threshold for testing
            correctionIntervalMs: 10000, // More frequent corrections
        });
    }
    /**
     * Create a MasterClockService with high-availability settings
     */
    static createForProduction(redisService, heartbeatService, metricsService) {
        return this.create(redisService, heartbeatService, metricsService, {
            syncIntervalMs: 10000, // Less frequent sync for production
            driftThresholdMs: 200, // Higher threshold for stability
            maxDriftMs: 2000, // Higher critical threshold
            correctionIntervalMs: 60000, // Less frequent corrections
        });
    }
}
exports.MasterClockServiceFactory = MasterClockServiceFactory;
// Example of integration with existing application lifecycle
class ApplicationWithMasterClock {
    constructor(redisService, heartbeatService, metricsService) {
        this.redisService = redisService;
        this.heartbeatService = heartbeatService;
        this.metricsService = metricsService;
    }
    async start() {
        console.log('Starting application with MasterClockService...');
        // Create and initialize master clock
        this.masterClock = MasterClockServiceFactory.createForProduction(this.redisService, this.heartbeatService, this.metricsService);
        // Set up monitoring
        this.setupClockMonitoring();
        // Initialize
        await this.masterClock.initialize();
        console.log('Application started with synchronized clock');
    }
    async stop() {
        console.log('Stopping application...');
        if (this.masterClock) {
            await this.masterClock.shutdown();
        }
        console.log('Application stopped');
    }
    setupClockMonitoring() {
        if (!this.masterClock)
            return;
        // Monitor for critical drift
        this.masterClock.on('drift_detected', (report) => {
            if (report.maxDrift > 1000) {
                // Critical drift
                console.error('CRITICAL: Clock drift exceeds 1 second!', report);
                // Could trigger alerts, notifications, etc.
            }
        });
        // Monitor health status changes
        this.masterClock.on('health_status_changed', (data) => {
            if (data.newStatus === 'critical') {
                console.error('CRITICAL: Clock health status is critical!', data);
                // Could trigger emergency procedures
            }
        });
    }
    // Expose clock functionality to the rest of the application
    async getCurrentTime() {
        if (!this.masterClock) {
            throw new Error('MasterClockService not initialized');
        }
        return this.masterClock.now();
    }
    getClockMetrics() {
        return this.masterClock?.getClockMetrics();
    }
}
exports.ApplicationWithMasterClock = ApplicationWithMasterClock;
// Run the demonstration if this file is executed directly
// Note: Uncomment the following line to run the demonstration
// demonstrateMasterClockService().catch(console.error);
//# sourceMappingURL=MasterClockService.example.js.map
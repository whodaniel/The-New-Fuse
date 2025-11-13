"use strict";
/**
 * Unit tests for Service Mesh Scaler
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ServiceMeshScaler_1 = require("./ServiceMeshScaler");
// Mock service mesh provider
class MockServiceMeshProvider {
    name = 'mock-scaler';
    version = '1.0.0';
    services = new Map();
    available = true;
    async registerService() { return 'mock-id'; }
    async unregisterService() { }
    async discoverServices() { return []; }
    async getServiceHealth() { return { serviceId: 'test', status: 'online', uptime: 0, responseTime: 0, errorRate: 0, lastCheck: new Date(), score: 1 }; }
    async updateServiceHealth() { }
    async isAvailable() { return this.available; }
    async configureScaling(serviceId, config) {
        const service = this.services.get(serviceId) || {};
        service.scalingConfig = config;
        this.services.set(serviceId, service);
    }
    async getScalingStatus(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error('Service not found');
        }
        return service.scalingStatus || {
            currentInstances: 2,
            desiredInstances: 2,
            scalingEvents: []
        };
    }
    async getServiceMetrics(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error('Service not found');
        }
        return service.metrics || {
            serviceId,
            requests: { total: 1000, successful: 950, failed: 50, rps: 10 },
            responseTime: { average: 100, p50: 80, p95: 200, p99: 500 },
            connections: { active: 5, total: 100, errors: 2 },
            resources: { cpu: 0.5, memory: 0.6, networkIO: 1024 },
            timestamp: new Date()
        };
    }
    // Test helpers
    setScalingStatus(serviceId, status) {
        const service = this.services.get(serviceId) || {};
        service.scalingStatus = status;
        this.services.set(serviceId, service);
    }
    setServiceMetrics(serviceId, metrics) {
        const service = this.services.get(serviceId) || {};
        service.metrics = {
            serviceId,
            requests: { total: 1000, successful: 950, failed: 50, rps: 10 },
            responseTime: { average: 100, p50: 80, p95: 200, p99: 500 },
            connections: { active: 5, total: 100, errors: 2 },
            resources: { cpu: 0.5, memory: 0.6, networkIO: 1024 },
            timestamp: new Date(),
            ...metrics
        };
        this.services.set(serviceId, service);
    }
    setAvailable(available) {
        this.available = available;
    }
    addService(serviceId) {
        this.services.set(serviceId, {});
    }
    clear() {
        this.services.clear();
    }
}
describe('ServiceMeshScaler', () => {
    let scaler;
    let mockProvider;
    let config;
    beforeEach(() => {
        mockProvider = new MockServiceMeshProvider();
        config = {
            evaluationInterval: 1, // 1 second for testing
            defaultScalingConfig: {
                minInstances: 1,
                maxInstances: 10,
                targetCPU: 0.7,
                scaleUpCooldown: 300,
                scaleDownCooldown: 600,
                policies: [
                    {
                        name: 'cpu-policy',
                        metric: 'cpu',
                        targetValue: 0.7,
                        scaleUpThreshold: 0.8,
                        scaleDownThreshold: 0.5
                    }
                ]
            },
            enablePredictiveScaling: false,
            historyRetention: 3600,
            maxScalingOpsPerHour: 10,
            enableNotifications: true
        };
        scaler = new ServiceMeshScaler_1.ServiceMeshScaler(mockProvider, config);
    });
    afterEach(async () => {
        await scaler.cleanup();
        mockProvider.clear();
    });
    describe('startScaling', () => {
        it('should start scaling successfully', async () => {
            const result = await scaler.startScaling();
            expect(result.success).toBe(true);
            expect(result.message).toContain('started successfully');
            expect(result.metadata?.evaluationInterval).toBe(1);
        });
        it('should not start scaling if already running', async () => {
            await scaler.startScaling();
            const result = await scaler.startScaling();
            expect(result.success).toBe(false);
            expect(result.message).toContain('already running');
        });
        it('should emit scaling-started event', async () => {
            const eventSpy = jest.fn();
            scaler.on('scaling-started', eventSpy);
            await scaler.startScaling();
            expect(eventSpy).toHaveBeenCalled();
        });
    });
    describe('stopScaling', () => {
        it('should stop scaling successfully', async () => {
            await scaler.startScaling();
            const result = await scaler.stopScaling();
            expect(result.success).toBe(true);
            expect(result.message).toContain('stopped successfully');
        });
        it('should not stop scaling if not running', async () => {
            const result = await scaler.stopScaling();
            expect(result.success).toBe(false);
            expect(result.message).toContain('not running');
        });
        it('should emit scaling-stopped event', async () => {
            const eventSpy = jest.fn();
            scaler.on('scaling-stopped', eventSpy);
            await scaler.startScaling();
            await scaler.stopScaling();
            expect(eventSpy).toHaveBeenCalled();
        });
    });
    describe('addService', () => {
        beforeEach(() => {
            mockProvider.addService('test-service');
        });
        it('should add service to scaling management successfully', async () => {
            const result = await scaler.addService('test-service');
            expect(result.success).toBe(true);
            expect(result.message).toContain('added to scaling management');
            expect(result.metadata?.serviceId).toBe('test-service');
        });
        it('should add service with custom scaling config', async () => {
            const customConfig = {
                minInstances: 2,
                maxInstances: 20,
                targetCPU: 0.8,
                scaleUpCooldown: 180,
                scaleDownCooldown: 360,
                policies: [
                    {
                        name: 'memory-policy',
                        metric: 'memory',
                        targetValue: 0.8,
                        scaleUpThreshold: 0.9,
                        scaleDownThreshold: 0.6
                    }
                ]
            };
            const result = await scaler.addService('test-service', customConfig);
            expect(result.success).toBe(true);
            expect(result.metadata?.minInstances).toBe(2);
            expect(result.metadata?.maxInstances).toBe(20);
        });
        it('should not add service if already managed', async () => {
            await scaler.addService('test-service');
            const result = await scaler.addService('test-service');
            expect(result.success).toBe(false);
            expect(result.message).toContain('already under scaling management');
        });
        it('should emit service-added event', async () => {
            const eventSpy = jest.fn();
            scaler.on('service-added', eventSpy);
            await scaler.addService('test-service');
            expect(eventSpy).toHaveBeenCalledWith('test-service');
        });
    });
    describe('removeService', () => {
        beforeEach(async () => {
            mockProvider.addService('test-service');
            await scaler.addService('test-service');
        });
        it('should remove service from scaling management successfully', async () => {
            const result = await scaler.removeService('test-service');
            expect(result.success).toBe(true);
            expect(result.message).toContain('removed from scaling management');
        });
        it('should not remove service if not managed', async () => {
            const result = await scaler.removeService('non-managed-service');
            expect(result.success).toBe(false);
            expect(result.message).toContain('not under scaling management');
        });
        it('should emit service-removed event', async () => {
            const eventSpy = jest.fn();
            scaler.on('service-removed', eventSpy);
            await scaler.removeService('test-service');
            expect(eventSpy).toHaveBeenCalledWith('test-service');
        });
    });
    describe('getServiceScalingState', () => {
        beforeEach(async () => {
            mockProvider.addService('test-service');
            await scaler.addService('test-service');
        });
        it('should return scaling state for existing service', () => {
            const state = scaler.getServiceScalingState('test-service');
            expect(state).toBeDefined();
            expect(state?.serviceId).toBe('test-service');
            expect(state?.config).toBeDefined();
            expect(state?.status).toBeDefined();
        });
        it('should return undefined for non-managed service', () => {
            const state = scaler.getServiceScalingState('non-managed-service');
            expect(state).toBeUndefined();
        });
    });
    describe('getManagedServices', () => {
        it('should return empty array when no services managed', () => {
            const services = scaler.getManagedServices();
            expect(services).toEqual([]);
        });
        it('should return list of managed services', async () => {
            mockProvider.addService('service-1');
            mockProvider.addService('service-2');
            await scaler.addService('service-1');
            await scaler.addService('service-2');
            const services = scaler.getManagedServices();
            expect(services).toHaveLength(2);
            expect(services).toContain('service-1');
            expect(services).toContain('service-2');
        });
    });
    describe('getStatistics', () => {
        it('should return scaling statistics', async () => {
            mockProvider.addService('service-1');
            mockProvider.addService('service-2');
            await scaler.addService('service-1');
            await scaler.addService('service-2');
            const stats = scaler.getStatistics();
            expect(stats.totalServices).toBe(2);
            expect(stats.servicesScaling).toBe(0);
            expect(stats.servicesInCooldown).toBe(0);
            expect(stats.lastUpdate).toBeInstanceOf(Date);
        });
    });
    describe('evaluateService', () => {
        beforeEach(async () => {
            mockProvider.addService('test-service');
            await scaler.addService('test-service');
        });
        it('should evaluate scaling decision for service', async () => {
            const decision = await scaler.evaluateService('test-service');
            expect(decision).toBeDefined();
            expect(decision.serviceId).toBe('test-service');
            expect(decision.type).toMatch(/scale_up|scale_down|no_action/);
            expect(decision.confidence).toBeGreaterThanOrEqual(0);
            expect(decision.confidence).toBeLessThanOrEqual(1);
        });
        it('should recommend scale up when CPU is high', async () => {
            mockProvider.setServiceMetrics('test-service', {
                resources: { cpu: 0.9, memory: 0.5, networkIO: 1024 } // CPU above scale up threshold
            });
            const decision = await scaler.evaluateService('test-service');
            expect(decision.type).toBe('scale_up');
            expect(decision.reason).toContain('cpu');
        });
        it('should recommend scale down when CPU is low', async () => {
            mockProvider.setServiceMetrics('test-service', {
                resources: { cpu: 0.3, memory: 0.5, networkIO: 1024 } // CPU below scale down threshold
            });
            const decision = await scaler.evaluateService('test-service');
            expect(decision.type).toBe('scale_down');
            expect(decision.reason).toContain('cpu');
        });
        it('should recommend no action when metrics are within thresholds', async () => {
            mockProvider.setServiceMetrics('test-service', {
                resources: { cpu: 0.6, memory: 0.5, networkIO: 1024 } // CPU within normal range
            });
            const decision = await scaler.evaluateService('test-service');
            expect(decision.type).toBe('no_action');
        });
        it('should throw error for non-managed service', async () => {
            await expect(scaler.evaluateService('non-managed-service'))
                .rejects.toThrow('not under scaling management');
        });
    });
    describe('scaleService', () => {
        beforeEach(async () => {
            mockProvider.addService('test-service');
            mockProvider.setScalingStatus('test-service', {
                currentInstances: 2,
                desiredInstances: 2,
                scalingEvents: []
            });
            await scaler.addService('test-service');
        });
        it('should scale service successfully', async () => {
            const result = await scaler.scaleService('test-service', 3, 'Manual scale up for testing');
            expect(result.success).toBe(true);
            expect(result.message).toContain('successfully scaled');
            expect(result.metadata?.previousInstances).toBe(2);
            expect(result.metadata?.newInstances).toBe(3);
            expect(result.metadata?.scalingType).toBe('scale_up');
        });
        it('should not scale if already at target instances', async () => {
            const result = await scaler.scaleService('test-service', 2, 'Already at target');
            expect(result.success).toBe(true);
            expect(result.message).toContain('already at 2 instances');
        });
        it('should fail if target instances outside allowed range', async () => {
            const result = await scaler.scaleService('test-service', 15, 'Scale beyond max');
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('outside allowed range');
        });
        it('should fail for non-managed service', async () => {
            const result = await scaler.scaleService('non-managed-service', 3, 'Test');
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('not under scaling management');
        });
    });
    describe('getScalingHistory', () => {
        beforeEach(async () => {
            mockProvider.addService('test-service');
            await scaler.addService('test-service');
        });
        it('should return empty history for new service', () => {
            const history = scaler.getScalingHistory('test-service');
            expect(history).toEqual([]);
        });
        it('should return scaling history after scaling operations', async () => {
            await scaler.scaleService('test-service', 3, 'Test scale up');
            await scaler.scaleService('test-service', 2, 'Test scale down');
            const history = scaler.getScalingHistory('test-service');
            expect(history).toHaveLength(2);
            expect(history[0].event.type).toBe('scale_down'); // Most recent first
            expect(history[1].event.type).toBe('scale_up');
        });
        it('should limit history when limit specified', async () => {
            await scaler.scaleService('test-service', 3, 'Scale 1');
            await scaler.scaleService('test-service', 4, 'Scale 2');
            await scaler.scaleService('test-service', 2, 'Scale 3');
            const history = scaler.getScalingHistory('test-service', 2);
            expect(history).toHaveLength(2);
        });
        it('should return empty array for non-managed service', () => {
            const history = scaler.getScalingHistory('non-managed-service');
            expect(history).toEqual([]);
        });
    });
    describe('automatic scaling evaluation', () => {
        beforeEach(async () => {
            mockProvider.addService('test-service');
            await scaler.addService('test-service');
            await scaler.startScaling();
        });
        it('should emit scaling-decision event during evaluation', (done) => {
            scaler.on('scaling-decision', (serviceId, decision) => {
                expect(serviceId).toBe('test-service');
                expect(decision).toBeDefined();
                expect(decision.type).toMatch(/scale_up|scale_down|no_action/);
                done();
            });
            // Wait for evaluation to run
        }, 2000);
        it('should emit scaling-completed event when scaling occurs', (done) => {
            // Set high CPU to trigger scale up
            mockProvider.setServiceMetrics('test-service', {
                resources: { cpu: 0.9, memory: 0.5, networkIO: 1024 }
            });
            scaler.on('scaling-completed', (serviceId, event) => {
                expect(serviceId).toBe('test-service');
                expect(event.type).toBe('scale_up');
                done();
            });
            // Wait for evaluation and scaling to run
        }, 3000);
    });
    describe('cooldown management', () => {
        beforeEach(async () => {
            mockProvider.addService('test-service');
            await scaler.addService('test-service');
        });
        it('should respect cooldown period after scaling', async () => {
            // Perform initial scaling
            await scaler.scaleService('test-service', 3, 'Initial scale');
            const state = scaler.getServiceScalingState('test-service');
            expect(state?.status.cooldownUntil).toBeDefined();
            expect(state?.status.cooldownUntil).toBeInstanceOf(Date);
            expect(state?.status.cooldownUntil.getTime()).toBeGreaterThan(Date.now());
        });
    });
    describe('cleanup', () => {
        it('should cleanup all resources', async () => {
            mockProvider.addService('test-service');
            await scaler.addService('test-service');
            await scaler.startScaling();
            expect(scaler.getManagedServices()).toHaveLength(1);
            await scaler.cleanup();
            expect(scaler.getManagedServices()).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=ServiceMeshScaler.test.js.map
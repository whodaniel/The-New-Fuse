var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable } from '@nestjs/common';
let MonitoringService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MonitoringService = _classThis = class {
        constructor(systemMonitor, metricsCollector, performanceMonitor, agentService) {
            this.systemMonitor = systemMonitor;
            this.metricsCollector = metricsCollector;
            this.performanceMonitor = performanceMonitor;
            this.agentService = agentService;
        }
        async getHealth() {
            const [system, database] = await Promise.all([
                this.systemMonitor.getHealth(),
                this.checkDatabaseHealth(),
            ]);
            return {
                status: 'ok',
                timestamp: new Date(),
                services: {
                    system,
                    database,
                },
            };
        }
        async getMetrics() {
            return {
                system: await this.systemMonitor.getLatestStats(),
                performance: await this.performanceMonitor.getMetrics(),
                custom: await this.metricsCollector.getCustomMetrics(),
            };
        }
        async getAgentStatus() {
            const agents = await this.agentService.findAll();
            const statuses = await Promise.all(agents.map(async (agent) => ({
                id: agent.id,
                status: await this.systemMonitor.getAgentStatus(agent.id),
            })));
            return {
                timestamp: new Date(),
                agents: statuses,
            };
        }
        async getPerformance() {
            return {
                ...(await this.performanceMonitor.getDetailedMetrics()),
                timestamp: new Date(),
            };
        }
        async getErrors() {
            return {
                recent: await this.systemMonitor.getRecentErrors(),
                summary: await this.metricsCollector.getErrorMetrics(),
            };
        }
        async getResources() {
            return {
                ...(await this.systemMonitor.getResourceUsage()),
            };
        }
        async getMemoryItems() {
            // TODO: connect to real memory store
            return { items: [], stats: { totalItems: 0, hitRate: 0 } };
        }
        async getCustomMetrics() {
            const custom = await this.metricsCollector.getCustomMetrics();
            // Expect custom has stepMetrics and memoryMetrics
            return {
                stepMetrics: custom.stepMetrics || [],
                memoryMetrics: custom.memoryMetrics || { totalItems: 0, hitRate: 0 },
            };
        }
        async checkDatabaseHealth() {
            try {
                // Add database health check logic here
                return {
                    status: 'ok',
                    latency: 0,
                };
            }
            catch (error) { // Explicitly type error as unknown
                return {
                    status: 'error',
                    // Check if error is an instance of Error before accessing message
                    error: error instanceof Error ? error.message : 'An unknown database error occurred',
                };
            }
        }
    };
    __setFunctionName(_classThis, "MonitoringService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MonitoringService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MonitoringService = _classThis;
})();
export { MonitoringService };

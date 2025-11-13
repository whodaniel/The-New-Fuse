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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitorService = void 0;
exports.MeasurePerformance = MeasurePerformance;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
const MetricsService_1 = require("./MetricsService");
const ConfigService_1 = require("../config/ConfigService");
const perf_hooks_1 = require("perf_hooks");
let PerformanceMonitorService = class PerformanceMonitorService {
    logger;
    metricsService;
    configService;
    collectionInterval;
    intervalId;
    performanceObserver;
    constructor(logger, metricsService, configService) {
        this.logger = logger;
        this.metricsService = metricsService;
        this.configService = configService;
        this.collectionInterval = this.configService.get('PERFORMANCE_MONITOR_INTERVAL', 15000);
        this.logger.log('PerformanceMonitorService initialized', 'PerformanceMonitorService');
    }
    onModuleInit() {
        this.startMonitoring();
    }
    onModuleDestroy() {
        this.stopMonitoring();
    }
    startMonitoring() {
        this.logger.log('Starting performance monitoring...', 'PerformanceMonitorService');
        this.intervalId = setInterval(() => {
            this.collectSystemMetrics();
        }, this.collectionInterval);
        this.setupPerformanceObserver();
    }
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        this.logger.log('Stopped performance monitoring.', 'PerformanceMonitorService');
    }
    setupPerformanceObserver() {
        this.performanceObserver = new perf_hooks_1.PerformanceObserver((items) => {
            items.getEntries().forEach((entry) => {
                this.metricsService.observeHistogram('method_execution_time_ms', entry.duration, {
                    labels: { method_name: entry.name },
                    help: 'Execution time of methods in milliseconds'
                });
            });
        });
        this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
    collectSystemMetrics() {
        // Event Loop Lag
        const start = perf_hooks_1.performance.now();
        setTimeout(() => {
            const delay = perf_hooks_1.performance.now() - start - 50; // 50ms is the timeout
            this.metricsService.setGauge('event_loop_lag_ms', delay, { help: 'Event loop lag in milliseconds', labels: {} });
        }, 50);
        // Memory Usage
        const memoryUsage = process.memoryUsage();
        this.metricsService.setGauge('memory_rss_bytes', memoryUsage.rss, { help: 'Resident Set Size' });
        this.metricsService.setGauge('memory_heap_used_bytes', memoryUsage.heapUsed, { help: 'Heap Used' });
        this.metricsService.setGauge('memory_heap_total_bytes', memoryUsage.heapTotal, { help: 'Heap Total' });
        // CPU Usage
        const cpuUsage = process.cpuUsage();
        this.metricsService.setGauge('cpu_user_usage_seconds', cpuUsage.user, { help: 'CPU User Usage', labels: {} });
        this.metricsService.setGauge('cpu_system_usage_seconds', cpuUsage.system, { help: 'CPU System Usage' });
    }
    measureExecutionTime(fn, name) {
        const start = perf_hooks_1.performance.now();
        try {
            return fn();
        }
        finally {
            const end = perf_hooks_1.performance.now();
            const duration = end - start;
            perf_hooks_1.performance.mark(`${name}-start);`, perf_hooks_1.performance.mark(`${name}` - end));
            perf_hooks_1.performance.measure(name, $, { name } - start, $, { name } - end);
            `
      this.logger.debug(Execution time for ${name}: ${duration}ms`, 'PerformanceMonitorService';
            ;
        }
    }
};
exports.PerformanceMonitorService = PerformanceMonitorService;
exports.PerformanceMonitorService = PerformanceMonitorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        MetricsService_1.MetricsService,
        ConfigService_1.ConfigService])
], PerformanceMonitorService);
function MeasurePerformance(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args) {
        const service = this;
        if (service.performanceMonitorService && typeof service.performanceMonitorService.measureExecutionTime === 'function') {
            return service.performanceMonitorService.measureExecutionTime(() => {
                return originalMethod.apply(this, args);
            }, $, { target, : .constructor.name }.$, { propertyKey });
        }
        else {
            // Fallback if the service is not available
            const start = Date.now();
            try {
                return originalMethod.apply(this, args);
                `
      } finally {`;
                const duration = Date.now() - start;
                console.log(Execution, time);
                for ($; { target, : .constructor.name } `.${propertyKey}: ${duration}ms`;)
                    ;
            }
            finally {
            }
        }
    };
    return descriptor;
}
//# sourceMappingURL=performanceMonitor.js.map
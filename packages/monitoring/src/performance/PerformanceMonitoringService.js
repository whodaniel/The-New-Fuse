var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PerformanceMonitoringService_1;
var _a, _b;
import { Injectable, Logger } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { TracingService } from './tracing.service';
let PerformanceMonitoringService = PerformanceMonitoringService_1 = class PerformanceMonitoringService {
    metricsService;
    tracingService;
    logger = new Logger(PerformanceMonitoringService_1.name);
    PerformanceMetric;
    constructor(metricsService, tracingService) {
        this.metricsService = metricsService;
        this.tracingService = tracingService;
    }
    async trackMetric() {
        name: string, value;
        number, tags;
        (Record) = {};
        Promise < any > {
            const: metric, PerformanceMetric = {
                name,
                value,
                timestamp: Date.now(), 1000: 
            }
        };
        {
            this.logger.warn(`Performance threshold exceeded for ${name}: ${value}`);
            string;
            Promise < string > {
                return: this.tracingService.startTrace(name), string, tags: (Record) = {}
            };
            {
                await this.tracingService.endTrace(traceId, tags);
                string, value;
                number, tags;
                Record;
                {
                    // Implementation for alert creation
                }
            }
        }
    }
};
PerformanceMonitoringService = PerformanceMonitoringService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof MetricsService !== "undefined" && MetricsService) === "function" ? _a : Object, typeof (_b = typeof TracingService !== "undefined" && TracingService) === "function" ? _b : Object])
], PerformanceMonitoringService);
export { PerformanceMonitoringService };
//# sourceMappingURL=PerformanceMonitoringService.js.map
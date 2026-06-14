var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let MetricsService = class MetricsService {
    constructor() {
        this.metrics = new Map();
        this.maxMetricsPerKey = 1000;
    }
    recordMetric(name, value, tags) {
        const metric = {
            name,
            value,
            timestamp: new Date(),
            tags
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        const metricsList = this.metrics.get(name);
        metricsList.push(metric);
        // Keep only the most recent metrics
        if (metricsList.length > this.maxMetricsPerKey) {
            metricsList.shift();
        }
    }
    getMetrics(name) {
        return this.metrics.get(name) || [];
    }
    getAllMetrics() {
        return new Map(this.metrics);
    }
    getSnapshot() {
        const allMetrics = [];
        for (const metricsList of this.metrics.values()) {
            allMetrics.push(...metricsList);
        }
        const values = allMetrics.map(m => m.value);
        const summary = {
            total: values.length,
            average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
            min: values.length > 0 ? Math.min(...values) : 0,
            max: values.length > 0 ? Math.max(...values) : 0
        };
        return {
            timestamp: new Date(),
            metrics: allMetrics,
            summary
        };
    }
    clearMetrics(name) {
        if (name) {
            this.metrics.delete(name);
        }
        else {
            this.metrics.clear();
        }
    }
    getMetricsSummary(name) {
        const metricsList = this.getMetrics(name);
        if (metricsList.length === 0) {
            return { count: 0, latest: 0, average: 0 };
        }
        const values = metricsList.map(m => m.value);
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        const latest = values[values.length - 1];
        return {
            count: metricsList.length,
            latest,
            average
        };
    }
};
MetricsService = __decorate([
    Injectable()
], MetricsService);
export { MetricsService };
//# sourceMappingURL=MetricsService.js.map
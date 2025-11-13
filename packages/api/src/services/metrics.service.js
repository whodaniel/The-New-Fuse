var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MetricsService_1;
import { Injectable, Logger } from '@nestjs/common';
let MetricsService = MetricsService_1 = class MetricsService {
    logger = new Logger(MetricsService_1.name);
    metrics = new Map();
    recordQuery(operation, duration) {
        this.recordMetric('query_duration', duration, {
            operation,
            type: 'database'
        });
    }
    recordError(operation, error) {
        this.recordMetric('error_count', 1, {
            operation,
            error_type: error.constructor.name,
            type: 'error'
        });
    }
    recordCacheHit(key) {
        this.recordMetric('cache_hit', 1, {
            cache_key: key,
            type: 'cache'
        });
    }
    recordCacheMiss(key) {
        this.recordMetric('cache_miss', 1, {
            cache_key: key,
            type: 'cache'
        });
    }
    recordWorkflowExecution(workflowId, duration, success) {
        this.recordMetric('workflow_execution', duration, {
            workflow_id: workflowId,
            success: success.toString(),
            type: 'workflow'
        });
    }
    recordUserAction(userId, action) {
        this.recordMetric('user_action', 1, {
            user_id: userId,
            action,
            type: 'user'
        });
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
        const metricList = this.metrics.get(name);
        metricList.push(metric);
        // Keep only last 1000 metrics per type to prevent memory leaks
        if (metricList.length > 1000) {
            metricList.splice(0, metricList.length - 1000);
        }
        this.logger.debug(`Metric recorded: ${name} = ${value}`, tags);
    }
    getMetrics(name) {
        if (name) {
            return this.metrics.get(name) || [];
        }
        const allMetrics = [];
        for (const metricList of this.metrics.values()) {
            allMetrics.push(...metricList);
        }
        return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getMetricSummary(name, timeRangeMinutes = 60) {
        const metrics = this.metrics.get(name);
        if (!metrics || metrics.length === 0) {
            return null;
        }
        const cutoff = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
        const recentMetrics = metrics.filter(m => m.timestamp >= cutoff);
        if (recentMetrics.length === 0) {
            return null;
        }
        const values = recentMetrics.map(m => m.value);
        const sum = values.reduce((a, b) => a + b, 0);
        return {
            count: recentMetrics.length,
            sum,
            avg: sum / recentMetrics.length,
            min: Math.min(...values),
            max: Math.max(...values)
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
};
MetricsService = MetricsService_1 = __decorate([
    Injectable()
], MetricsService);
export { MetricsService };
//# sourceMappingURL=metrics.service.js.map
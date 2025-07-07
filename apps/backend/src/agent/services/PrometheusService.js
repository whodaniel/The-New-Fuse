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
exports.PrometheusService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let PrometheusService = class PrometheusService {
    configService;
    metrics = new Map();
    constructor(configService) {
        this.configService = configService;
    }
    /**
     * Register a new metric
     */
    registerMetric(name, help, type = 'counter') {
        this.metrics.set(name, {
            name,
            help,
            type,
            value: type === 'counter' ? 0 : null,
            labels: new Map(),
        });
    }
    /**
     * Increment a counter metric
     */
    incrementCounter(name, value = 1, labels = {}) {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== 'counter') {
            return;
        }
        metric.value += value;
        // Store labeled values
        const labelKey = this.getLabelKey(labels);
        if (labelKey) {
            if (!metric.labels.has(labelKey)) {
                metric.labels.set(labelKey, value);
            }
            else {
                metric.labels.set(labelKey, metric.labels.get(labelKey) + value);
            }
        }
    }
    /**
     * Set a gauge metric value
     */
    setGauge(name, value, labels = {}) {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== 'gauge') {
            return;
        }
        metric.value = value;
        // Store labeled values
        const labelKey = this.getLabelKey(labels);
        if (labelKey) {
            metric.labels.set(labelKey, value);
        }
    }
    /**
     * Observe a value for a histogram metric
     */
    observeHistogram(name, value, labels = {}) {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== 'histogram') {
            return;
        }
        // For simplicity, we're just storing the raw values
        // A real implementation would calculate buckets
        if (!metric.values) {
            metric.values = [];
        }
        metric.values.push(value);
        // Store labeled values
        const labelKey = this.getLabelKey(labels);
        if (labelKey) {
            if (!metric.labeledValues) {
                metric.labeledValues = new Map();
            }
            if (!metric.labeledValues.has(labelKey)) {
                metric.labeledValues.set(labelKey, []);
            }
            metric.labeledValues.get(labelKey).push(value);
        }
    }
    /**
     * Get all metrics in Prometheus format
     */
    getMetrics() {
        let output = '';
        for (const [name, metric] of this.metrics.entries()) {
            output += `# HELP ${name} ${metric.help}\n`;
            output += `# TYPE ${name} ${metric.type}\n`;
            if (metric.type === 'counter' || metric.type === 'gauge') {
                output += `${name} ${metric.value}\n`;
                // Add labeled metrics
                for (const [labelKey, labelValue] of metric.labels.entries()) {
                    output += `${name}{${labelKey}} ${labelValue}\n`;
                }
            }
            else if (metric.type === 'histogram') {
                // Simplified histogram output
                if (metric.values && metric.values.length > 0) {
                    const sum = metric.values.reduce((a, b) => a + b, 0);
                    const count = metric.values.length;
                    output += `${name}_sum ${sum}\n`;
                    output += `${name}_count ${count}\n`;
                }
            }
            output += '\n';
        }
        return output;
    }
    /**
     * Reset all metrics
     */
    resetMetrics() {
        for (const metric of this.metrics.values()) {
            if (metric.type === 'counter') {
                metric.value = 0;
            }
            else if (metric.type === 'gauge') {
                metric.value = null;
            }
            else if (metric.type === 'histogram') {
                metric.values = [];
            }
            metric.labels = new Map();
            if (metric.labeledValues) {
                metric.labeledValues = new Map();
            }
        }
    }
    /**
     * Helper to create a string key from labels object
     */
    getLabelKey(labels) {
        if (Object.keys(labels).length === 0) {
            return '';
        }
        return Object.entries(labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');
    }
};
exports.PrometheusService = PrometheusService;
exports.PrometheusService = PrometheusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrometheusService);

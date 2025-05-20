"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
var __decorate = (this && this.__decorate) ||
    function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3
            ? target
            : desc === null
                ? (desc = Object.getOwnPropertyDescriptor(target, key))
                : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i]))
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
var __metadata = (this && this.__metadata) ||
    function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
            return Reflect.metadata(k, v);
    };
var __param = (this && this.__param) ||
    function (paramIndex, decorator) {
        return function (target, key) {
            decorator(target, key, paramIndex);
        };
    };
var _a;
import inversify_1 from 'inversify';
import types_1 from '../di/types.js';
import config_service_1 from '../config/config-service.js';
import prom_client_1 from 'prom-client';
let MetricsCollector = class MetricsCollector {
    constructor(config) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config,
        });
        Object.defineProperty(this, "registry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0,
        });
        Object.defineProperty(this, "counters", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0,
        });
        Object.defineProperty(this, "gauges", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0,
        });
        Object.defineProperty(this, "histograms", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0,
        });
        this.registry = new prom_client_1.Registry();
        this.counters = new Map();
        this.gauges = new Map();
        this.histograms = new Map();
        this.initialize();
    }
    initialize() {
        // Register default metrics
        this.createCounter("http_requests_total", "Total HTTP requests", [
            "method",
            "status",
        ]);
        this.createCounter("error_logs_total", "Total error logs");
        this.createCounter("log_entries_total", "Total log entries", ["level"]);
        this.createGauge("active_connections", "Number of active connections");
        this.createHistogram("http_request_duration_seconds", "HTTP request duration", ["method"]);
    }
    createCounter(name, help, labelNames = []) {
        if (!this.counters.has(name)) {
            const counter = new prom_client_1.Counter({
                name,
                help,
                labelNames,
                registers: [this.registry],
            });
            this.counters.set(name, counter);
        }
        return this.counters.get(name);
    }
    createGauge(name, help, labelNames = []) {
        if (!this.gauges.has(name)) {
            const gauge = new prom_client_1.Gauge({
                name,
                help,
                labelNames,
                registers: [this.registry],
            });
            this.gauges.set(name, gauge);
        }
        return this.gauges.get(name);
    }
    createHistogram(name, help, labelNames = [], buckets = [0.1, 0.5, 1, 2, 5]) {
        if (!this.histograms.has(name)) {
            const histogram = new prom_client_1.Histogram({
                name,
                help,
                labelNames,
                buckets,
                registers: [this.registry],
            });
            this.histograms.set(name, histogram);
        }
        return this.histograms.get(name);
    }
    incrementCounter(name, labels = {}) {
        const counter = this.counters.get(name);
        if (counter) {
            counter.inc(labels);
        }
    }
    setGauge(name, value, labels = {}) {
        const gauge = this.gauges.get(name);
        if (gauge) {
            gauge.set(labels, value);
        }
    }
    observeHistogram(name, value, labels = {}) {
        const histogram = this.histograms.get(name);
        if (histogram) {
            histogram.observe(labels, value);
        }
    }
    getMetrics() {
        return this.registry.metrics();
    }
    clearMetrics() {
        this.registry.clear();
    }
};
exports.MetricsCollector = MetricsCollector;
exports.MetricsCollector = MetricsCollector = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.Config)),
    __metadata("design:paramtypes", [
        typeof (_a = typeof config_service_1.ConfigService !== "undefined" && config_service_1.ConfigService) ===
            "function"
            ? _a
            : Object,
    ]),
], MetricsCollector);
//# sourceMappingURL=metrics-collector.js.map

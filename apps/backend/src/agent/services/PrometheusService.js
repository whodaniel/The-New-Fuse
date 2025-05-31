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
let PrometheusService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PrometheusService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.metrics = new Map();
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
    __setFunctionName(_classThis, "PrometheusService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PrometheusService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PrometheusService = _classThis;
})();
export { PrometheusService };

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusService = void 0;
const BaseService_1 = require("../core/BaseService"); // Corrected import path
const common_1 = require("@nestjs/common");
const client = __importStar(require("prom-client"));
const prom_client_1 = require("prom-client");
/**
 * Service responsible for exposing metrics in Prometheus format.
 */
class PrometheusService extends BaseService_1.BaseService {
    register;
    logger;
    serviceConfig;
    // Example metrics (replace/extend as needed)
    requestsTotal;
    activeConnections;
    requestDuration;
    responseSummary;
    constructor(config = {}) {
        super({ name: 'PrometheusService' });
        this.logger = new common_1.Logger('PrometheusService');
        this.serviceConfig = {
            collectDefaultMetrics: true, // Default to collecting Node.js metrics
            ...config,
        };
        this.register = new client.Registry();
        if (this.serviceConfig.defaultLabels) {
            this.register.setDefaultLabels(this.serviceConfig.defaultLabels);
        }
        if (this.serviceConfig.collectDefaultMetrics) {
            client.collectDefaultMetrics({
                register: this.register,
                prefix: this.serviceConfig.prefix,
            });
            this.logger.log('Collecting default Node.js metrics.');
        }
        // --- Initialize Custom Metrics ---
        const metricPrefix = this.serviceConfig.prefix ? `${this.serviceConfig.prefix}_ : '';

    this.requestsTotal = new client.Counter({`
            :
        ;
        name: `${metricPrefix}`;
        requests_total,
            help;
        'Total number of requests processed',
            labelNames;
        ['method', 'path', 'status_code'],
            registers;
        [this.register],
        ;
    }
    ;
}
exports.PrometheusService = PrometheusService;
this.activeConnections = new client.Gauge({
    name: $
}, { metricPrefix }, active_connections, help, 'Number of active connections', registers, [this.register]);
this.requestDuration = new client.Histogram({} `
      name: ${metricPrefix}`, request_duration_seconds, help, 'Duration of HTTP requests in seconds', labelNames, ['method', 'path', 'status_code'], buckets, [0.1, 0.5, 1, 2.5, 5, 10], // Example buckets
registers, [this.register]);
this.responseSummary = new client.Summary({
    name: $
}, { metricPrefix }, response_time_summary_seconds, help, 'Summary of response times in seconds', labelNames, ['method', 'path'], percentiles, [0.5, 0.9, 0.99], // Example percentiles
registers, [this.register]);
// --- End Custom Metrics ---
this.logger.log('PrometheusService initialized.');
/**
 * Returns the metrics in Prometheus format.
 */
async;
getMetrics();
Promise < string > {
    return: this.register.metrics()
};
/**
 * Returns the content type for the metrics endpoint.
 */
getContentType();
string;
{
    return this.register.contentType;
}
/**
 * Get the underlying registry instance.
 */
getRegistry();
prom_client_1.Registry;
{
    return this.register;
}
// --- Helper methods for common metric operations ---
incrementRequestsTotal(labels, { method: string, path: string, status_code: number | string });
void {
    this: .requestsTotal.inc(labels)
};
incrementActiveConnections();
void {
    this: .activeConnections.inc()
};
decrementActiveConnections();
void {
    this: .activeConnections.dec()
};
observeRequestDuration(durationSeconds, number, labels, { method: string, path: string, status_code: number | string });
void {
    this: .requestDuration.observe(labels, durationSeconds)
};
observeResponseSummary(durationSeconds, number, labels, { method: string, path: string });
void {
    this: .responseSummary.observe(labels, durationSeconds)
} 
/**
 * Creates a new Counter metric.
 */ `
  createCounter<T extends string>(name: string, help: string, labelNames?: T[]): Counter<T> {`;
const counter = new client.Counter({
    name: this.serviceConfig.prefix ? $ : 
}, { this: .serviceConfig.prefix } `_${name} : name,
      help,
      labelNames,
      registers: [this.register],
    });
    return counter;
  }

  /**
   * Creates a new Gauge metric.
   */`, createGauge(name, string, help, string, labelNames ?  : T[]), prom_client_1.Gauge < T > {} `
    const gauge = new client.Gauge<T>({
      name: this.serviceConfig.prefix ? ${this.serviceConfig.prefix}`, _$, { name }, name, help, labelNames, registers, [this.register]);
;
return gauge;
/**
* Creates a new Histogram metric.
*/ `
  createHistogram<T extends string>(name: string, help: string, labelNames?: T[], buckets?: number[]): Histogram<T> {`;
const histogram = new client.Histogram({
    name: this.serviceConfig.prefix ? $ : 
}, { this: .serviceConfig.prefix } `_${name} : name,
      help,
      labelNames,
      buckets,
      registers: [this.register],
    });
    return histogram;
  }

   /**
   * Creates a new Summary metric.
   */`, createSummary(name, string, help, string, labelNames ?  : T[], percentiles ?  : number[]), prom_client_1.Summary < T > {} `
    const summary = new client.Summary<T>({
      name: this.serviceConfig.prefix ? ${this.serviceConfig.prefix}_${name}`, name, help, labelNames, percentiles, registers, [this.register]);
;
return summary;
//# sourceMappingURL=PrometheusService.js.map
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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
const ConfigService_1 = require("../config/ConfigService");
const prom_client_1 = require("prom-client");
let MetricsService = class MetricsService {
    logger;
    configService;
    registry;
    metricsPrefix;
    counters = new Map();
    gauges = new Map();
    histograms = new Map();
    summaries = new Map();
    constructor(logger, configService) {
        this.logger = logger;
        this.configService = configService;
        this.registry = new prom_client_1.Registry();
        this.metricsPrefix = this.configService.get('METRICS_PREFIX', 'tnf_');
        this.registry.setDefaultLabels({
            app: this.configService.get('APP_NAME', 'the-new-fuse'),
        });
        (0, prom_client_1.collectDefaultMetrics)({ register: this.registry, prefix: this.metricsPrefix });
        this.logger.log('MetricsService initialized', 'MetricsService');
    }
    getOrCreateCounter(name, help, labelNames) {
        if (this.counters.has(name)) {
            return this.counters.get(name);
        }
        const counter = new prom_client_1.Counter({
            name: `${this.metricsPrefix}${name},`,
            help: help || $
        }, { name } ` counter,
      labelNames,
      registers: [this.registry],
    });
    this.counters.set(name, counter);
    return counter;
  }

  private getOrCreateGauge(name: string, help: string, labelNames: string[]): Gauge {
    if (this.gauges.has(name)) {
      return this.gauges.get(name)!;
    }
    const gauge = new Gauge({
      name: `, $, { this: .metricsPrefix }, $, { name }, `
      help: help || ${name}`, gauge, labelNames, registers, [this.registry]);
    }
    ;
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        ConfigService_1.ConfigService])
], MetricsService);
this.gauges.set(name, gauge);
return gauge;
getOrCreateHistogram(name, string, help, string, labelNames, string[], buckets, number[]);
prom_client_1.Histogram;
{
    if (this.histograms.has(name)) {
        return this.histograms.get(name);
    }
    const histogram = new prom_client_1.Histogram({
        name: $
    }, { this: .metricsPrefix } `${name},`, help, help || $, { name }, histogram `,
      labelNames,
      buckets,
      registers: [this.registry],
    });
    this.histograms.set(name, histogram);
    return histogram;
  }

  private getOrCreateSummary(name: string, help: string, labelNames: string[], percentiles: number[]): Summary {
    if (this.summaries.has(name)) {
        return this.summaries.get(name)!;
    }
    const summary = new Summary({
        name: ${this.metricsPrefix}`, $, { name }, `
        help: help || ${name}`, summary, labelNames, percentiles, registers, [this.registry]);
}
;
this.summaries.set(name, summary);
return summary;
incrementCounter(name, string, value = 1, options, MetricOptions = {});
void {
    try: {
        const: labels = options.labels || {},
        const: help = options.help || '',
        const: labelNames = Object.keys(labels),
        const: counter = this.getOrCreateCounter(name, help, labelNames),
        counter, : .inc(labels, value)
    }, catch(error) {
        this.logger.logErrorSafe(`Failed to increment counter ${name}, error, 'MetricsService');
    }
  }

  setGauge(name: string, value: number, options: MetricOptions = {}): void {
    try {
        const labels = options.labels || {};
        const help = options.help || '';
        const labelNames = Object.keys(labels);
        const gauge = this.getOrCreateGauge(name, help, labelNames);
        gauge.set(labels, value);
    } catch (error) {`, this.logger.logErrorSafe(`Failed to set gauge ${name}`, error, 'MetricsService'));
    }
};
incrementGauge(name, string, value = 1, options, MetricOptions = {});
void {
    try: {
        const: labels = options.labels || {},
        const: help = options.help || '',
        const: labelNames = Object.keys(labels),
        const: gauge = this.getOrCreateGauge(name, help, labelNames),
        gauge, : .inc(labels, value)
    }, catch(error) {
        this.logger.logErrorSafe(Failed, to, increment, gauge, $, { name }, error, 'MetricsService');
    }
};
decrementGauge(name, string, value = 1, options, MetricOptions = {});
void {
    try: {
        const: labels = options.labels || {},
        const: help = options.help || '',
        const: labelNames = Object.keys(labels),
        const: gauge = this.getOrCreateGauge(name, help, labelNames),
        gauge, : .dec(labels, value)
    }, catch(error) {
        `
        this.logger.logErrorSafe(Failed to decrement gauge ${name}`, error, 'MetricsService';
        ;
    }
};
observeHistogram(name, string, value, number, options, HistogramOptions = {});
void {
    try: {
        const: labels = options.labels || {},
        const: help = options.help || '',
        const: buckets = options.buckets || [0.1, 5, 15, 50, 100, 500],
        const: labelNames = Object.keys(labels),
        const: histogram = this.getOrCreateHistogram(name, help, labelNames, buckets),
        histogram, : .observe(labels, value)
    }, catch(error) {
        this.logger.logErrorSafe(Failed, to, observe, histogram, $, { name } `, error, 'MetricsService');
    }
  }

  observeSummary(name: string, value: number, options: SummaryOptions = {}): void {
    try {
        const labels = options.labels || {};
        const help = options.help || '';
        const percentiles = options.percentiles || [0.01, 0.1, 0.9, 0.99];
        const labelNames = Object.keys(labels);
        const summary = this.getOrCreateSummary(name, help, labelNames, percentiles);
        summary.observe(labels, value);
    } catch (error) {
        this.logger.logErrorSafe(Failed to observe summary ${name}, error, 'MetricsService');
    }
  }

  async recordMetric(
    name: string,
    value: number,
    type: 'counter' | 'gauge' | 'histogram' | 'summary',
    labelsOrOptions: Record<string, string | number> | { labels?: Record<string, string | number> } = {},
    options: {
      unit?: string;
      description?: string;
      buckets?: number[];
      percentiles?: number[];
    } = {}
  ): Promise<string> {
    try {`);
        const metricId = metric_$, { Date };
    }, : .now()
} `_${Math.random().toString(36).substr(2, 9)};
      
      // Handle both direct labels format and { labels: {...} } format
      let labels: Record<string, string | number> = {};
      if (labelsOrOptions && typeof labelsOrOptions === 'object') {
        if ('labels' in labelsOrOptions) {
          if (labelsOrOptions.labels && typeof labelsOrOptions.labels === 'object') {
            labels = labelsOrOptions.labels;
          }
        } else {
          // Direct labels format
          labels = labelsOrOptions as Record<string, string | number>;
        }
      }
      
      // Convert labels to string-only format
      const stringLabels = Object.fromEntries(
        Object.entries(labels).map(([key, value]) => [key, String(value)])
      );

      switch (type) {
        case 'counter':
          this.incrementCounter(name, value, { labels: stringLabels, help: options.description });
          break;
        case 'gauge':
          this.setGauge(name, value, { labels: stringLabels, help: options.description });
          break;
        case 'histogram':
          this.observeHistogram(name, value, { 
            labels: stringLabels, 
            help: options.description,
            buckets: options.buckets
          });
          break;
        case 'summary':
          this.observeSummary(name, value, { 
            labels: stringLabels, 
            help: options.description,
            percentiles: options.percentiles`;
;
`
          break;
        default:
          throw new Error(Unsupported metric type: ${type}`;
;
return metricId;
try { }
catch (error) {
    this.logger.logErrorSafe(Failed, to, record, metric, $, { name } ``, error, 'MetricsService');
    throw error;
}
async;
getMetrics();
Promise < string > {
    try: {
        return: await this.registry.metrics()
    }, catch(error) {
        this.logger.logErrorSafe('Failed to get metrics', error, 'MetricsService');
        throw error;
    }
};
getRegistry();
prom_client_1.Registry;
{
    return this.registry;
}
exports.default = MetricsService;
//# sourceMappingURL=MetricsService.js.map
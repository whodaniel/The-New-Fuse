'use strict';
/**
 * Core monitoring system exports
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.performanceDashboard =
  exports.PerformanceDashboard =
  exports.defaultAlertRules =
  exports.AlertManager =
  exports.HealthCheckService =
  exports.createLogger =
  exports.WinstonLogger =
    void 0;
// Interfaces
__exportStar(require('./interfaces/IMonitoring.js'), exports);
// Base classes
__exportStar(require('./base/BaseMetricsCollector.js'), exports);
__exportStar(require('./base/BaseMonitoringSystem.js'), exports);
// Utils
// Re-export simple logger (includes LogEntry/LogLevel)
__exportStar(require('./utils/Logger.js'), exports);
// Sentry
__exportStar(require('./sentry/sentry-config.js'), exports);
__exportStar(require('./sentry/sentry-integrations.js'), exports);
// Logging
// Avoid duplicate type names
var winston_logger_js_1 = require('./logging/winston-logger.js');
Object.defineProperty(exports, 'WinstonLogger', {
  enumerable: true,
  get: function () {
    return winston_logger_js_1.WinstonLogger;
  },
});
Object.defineProperty(exports, 'createLogger', {
  enumerable: true,
  get: function () {
    return winston_logger_js_1.createLogger;
  },
});
// Metrics
__exportStar(require('./metrics/prometheus-metrics.js'), exports);
// Health checks
// Avoid duplicate HealthStatus name (already exported by IMonitoring)
var health_check_js_1 = require('./health/health-check.js');
Object.defineProperty(exports, 'HealthCheckService', {
  enumerable: true,
  get: function () {
    return health_check_js_1.HealthCheckService;
  },
});
// Alerts
// Avoid duplicate Alert/AlertRule types (IMonitoring already exports them)
var alert_manager_js_1 = require('./alerts/alert-manager.js');
Object.defineProperty(exports, 'AlertManager', {
  enumerable: true,
  get: function () {
    return alert_manager_js_1.AlertManager;
  },
});
Object.defineProperty(exports, 'defaultAlertRules', {
  enumerable: true,
  get: function () {
    return alert_manager_js_1.defaultAlertRules;
  },
});
// Performance monitoring
__exportStar(require('./performance/index.js'), exports);
// Dashboards
// Avoid duplicate QueryPattern type by exporting explicit members
var performance_dashboard_js_1 = require('./dashboards/performance-dashboard.js');
Object.defineProperty(exports, 'PerformanceDashboard', {
  enumerable: true,
  get: function () {
    return performance_dashboard_js_1.PerformanceDashboard;
  },
});
Object.defineProperty(exports, 'performanceDashboard', {
  enumerable: true,
  get: function () {
    return performance_dashboard_js_1.performanceDashboard;
  },
});
// NestJS integrations
__exportStar(require('./nestjs/health.controller.js'), exports);
__exportStar(require('./nestjs/metrics.controller.js'), exports);
__exportStar(require('./nestjs/monitoring.interceptor.js'), exports);
__exportStar(require('./nestjs/monitoring.module.js'), exports);
// Legacy compatibility facades (migrated from @the-new-fuse/monitoring)
__exportStar(require('./compat/legacy-monitoring.js'), exports);
//# sourceMappingURL=index.js.map

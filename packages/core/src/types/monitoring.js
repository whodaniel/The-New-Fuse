"use strict";
/**
 * @fileoverview Monitoring and metrics type definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.AlertStatus = exports.AlertSeverity = exports.MetricType = void 0;
var MetricType;
(function (MetricType) {
    MetricType["COUNTER"] = "COUNTER";
    MetricType["GAUGE"] = "GAUGE";
    MetricType["HISTOGRAM"] = "HISTOGRAM";
    MetricType["TIMER"] = "TIMER";
})(MetricType || (exports.MetricType = MetricType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "INFO";
    AlertSeverity["WARNING"] = "WARNING";
    AlertSeverity["ERROR"] = "ERROR";
    AlertSeverity["CRITICAL"] = "CRITICAL";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "ACTIVE";
    AlertStatus["RESOLVED"] = "RESOLVED";
    AlertStatus["SUPPRESSED"] = "SUPPRESSED";
    AlertStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["FATAL"] = "FATAL";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
//# sourceMappingURL=monitoring.js.map
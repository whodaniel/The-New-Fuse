/**
 * @fileoverview Monitoring and metrics type definitions
 */
export var MetricType;
(function (MetricType) {
    MetricType["COUNTER"] = "COUNTER";
    MetricType["GAUGE"] = "GAUGE";
    MetricType["HISTOGRAM"] = "HISTOGRAM";
    MetricType["TIMER"] = "TIMER";
})(MetricType || (MetricType = {}));
export var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "INFO";
    AlertSeverity["WARNING"] = "WARNING";
    AlertSeverity["ERROR"] = "ERROR";
    AlertSeverity["CRITICAL"] = "CRITICAL";
})(AlertSeverity || (AlertSeverity = {}));
export var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "ACTIVE";
    AlertStatus["RESOLVED"] = "RESOLVED";
    AlertStatus["SUPPRESSED"] = "SUPPRESSED";
    AlertStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
})(AlertStatus || (AlertStatus = {}));
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["FATAL"] = "FATAL";
})(LogLevel || (LogLevel = {}));
//# sourceMappingURL=monitoring.js.map
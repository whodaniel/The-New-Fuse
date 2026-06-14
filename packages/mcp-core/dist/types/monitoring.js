/**
 * Monitoring and metrics type definitions
 */
/**
 * Alert severity levels
 */
export var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (AlertSeverity = {}));
/**
 * Alert status
 */
export var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "active";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["ACKNOWLEDGED"] = "acknowledged";
    AlertStatus["SUPPRESSED"] = "suppressed";
})(AlertStatus || (AlertStatus = {}));
//# sourceMappingURL=monitoring.js.map
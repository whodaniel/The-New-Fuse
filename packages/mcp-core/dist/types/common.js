/**
 * Common types used throughout the MCP system
 */
/**
 * Log level enumeration
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
    LogLevel["TRACE"] = "trace";
})(LogLevel || (LogLevel = {}));
/**
 * Service status enumeration
 */
export var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["ONLINE"] = "online";
    ServiceStatus["OFFLINE"] = "offline";
    ServiceStatus["DEGRADED"] = "degraded";
    ServiceStatus["MAINTENANCE"] = "maintenance";
})(ServiceStatus || (ServiceStatus = {}));
/**
 * Load balancing strategy enumeration
 */
export var LoadBalancingStrategy;
(function (LoadBalancingStrategy) {
    LoadBalancingStrategy["ROUND_ROBIN"] = "round_robin";
    LoadBalancingStrategy["LEAST_CONNECTIONS"] = "least_connections";
    LoadBalancingStrategy["WEIGHTED"] = "weighted";
    LoadBalancingStrategy["RANDOM"] = "random";
})(LoadBalancingStrategy || (LoadBalancingStrategy = {}));
//# sourceMappingURL=common.js.map
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["RATE_LIMITED"] = "RATE_LIMITED";
})(ErrorCode || (ErrorCode = {}));
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
export var Environment;
(function (Environment) {
    Environment["DEVELOPMENT"] = "development";
    Environment["STAGING"] = "staging";
    Environment["PRODUCTION"] = "production";
    Environment["TEST"] = "test";
})(Environment || (Environment = {}));
export var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["STARTING"] = "starting";
    ServiceStatus["RUNNING"] = "running";
    ServiceStatus["STOPPING"] = "stopping";
    ServiceStatus["STOPPED"] = "stopped";
    ServiceStatus["ERROR"] = "error";
})(ServiceStatus || (ServiceStatus = {}));
//# sourceMappingURL=enums.js.map
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["RUNTIME"] = "runtime";
    ErrorCategory["PROMISE_REJECTION"] = "promise_rejection";
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["AUTHORIZATION"] = "authorization";
    ErrorCategory["DATABASE"] = "database";
    ErrorCategory["EXTERNAL_SERVICE"] = "external_service";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (ErrorCategory = {}));
export var ErrorPriority;
(function (ErrorPriority) {
    ErrorPriority["LOW"] = "low";
    ErrorPriority["MEDIUM"] = "medium";
    ErrorPriority["HIGH"] = "high";
    ErrorPriority["CRITICAL"] = "critical";
})(ErrorPriority || (ErrorPriority = {}));

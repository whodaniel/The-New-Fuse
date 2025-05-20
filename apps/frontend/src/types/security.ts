export var SecurityLevel;
(function (SecurityLevel): any {
    SecurityLevel["HIGH"] = "high";
    SecurityLevel["MEDIUM"] = "medium";
    SecurityLevel["LOW"] = "low";
})(SecurityLevel || (SecurityLevel = {}));
export var ThreatType;
(function (ThreatType): any {
    ThreatType["INJECTION"] = "injection";
    ThreatType["XSS"] = "xss";
    ThreatType["SENSITIVE_DATA"] = "sensitive_data";
    ThreatType["AUTH_BYPASS"] = "auth_bypass";
    ThreatType["CODE_EXECUTION"] = "code_execution";
})(ThreatType || (ThreatType = {}));
//# sourceMappingURL=security.js.map
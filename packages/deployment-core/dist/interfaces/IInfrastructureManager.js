"use strict";
/**
 * Infrastructure Manager Interface
 * Defines the contract for infrastructure management operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationPriority = exports.SecurityRecommendationType = exports.ComplianceLevel = exports.VulnerabilitySeverity = exports.OptimizationType = exports.CostTrend = exports.IssueSeverity = exports.HealthLevel = void 0;
var HealthLevel;
(function (HealthLevel) {
    HealthLevel["HEALTHY"] = "healthy";
    HealthLevel["DEGRADED"] = "degraded";
    HealthLevel["UNHEALTHY"] = "unhealthy";
    HealthLevel["UNKNOWN"] = "unknown";
})(HealthLevel || (exports.HealthLevel = HealthLevel = {}));
var IssueSeverity;
(function (IssueSeverity) {
    IssueSeverity["CRITICAL"] = "critical";
    IssueSeverity["HIGH"] = "high";
    IssueSeverity["MEDIUM"] = "medium";
    IssueSeverity["LOW"] = "low";
    IssueSeverity["INFO"] = "info";
})(IssueSeverity || (exports.IssueSeverity = IssueSeverity = {}));
var CostTrend;
(function (CostTrend) {
    CostTrend["INCREASING"] = "increasing";
    CostTrend["DECREASING"] = "decreasing";
    CostTrend["STABLE"] = "stable";
})(CostTrend || (exports.CostTrend = CostTrend = {}));
var OptimizationType;
(function (OptimizationType) {
    OptimizationType["RIGHT_SIZING"] = "right_sizing";
    OptimizationType["RESERVED_INSTANCES"] = "reserved_instances";
    OptimizationType["SPOT_INSTANCES"] = "spot_instances";
    OptimizationType["STORAGE_OPTIMIZATION"] = "storage_optimization";
    OptimizationType["NETWORK_OPTIMIZATION"] = "network_optimization";
})(OptimizationType || (exports.OptimizationType = OptimizationType = {}));
var VulnerabilitySeverity;
(function (VulnerabilitySeverity) {
    VulnerabilitySeverity["CRITICAL"] = "critical";
    VulnerabilitySeverity["HIGH"] = "high";
    VulnerabilitySeverity["MEDIUM"] = "medium";
    VulnerabilitySeverity["LOW"] = "low";
})(VulnerabilitySeverity || (exports.VulnerabilitySeverity = VulnerabilitySeverity = {}));
var ComplianceLevel;
(function (ComplianceLevel) {
    ComplianceLevel["COMPLIANT"] = "compliant";
    ComplianceLevel["NON_COMPLIANT"] = "non_compliant";
    ComplianceLevel["PARTIALLY_COMPLIANT"] = "partially_compliant";
    ComplianceLevel["NOT_ASSESSED"] = "not_assessed";
})(ComplianceLevel || (exports.ComplianceLevel = ComplianceLevel = {}));
var SecurityRecommendationType;
(function (SecurityRecommendationType) {
    SecurityRecommendationType["ACCESS_CONTROL"] = "access_control";
    SecurityRecommendationType["ENCRYPTION"] = "encryption";
    SecurityRecommendationType["NETWORK_SECURITY"] = "network_security";
    SecurityRecommendationType["MONITORING"] = "monitoring";
    SecurityRecommendationType["PATCH_MANAGEMENT"] = "patch_management";
})(SecurityRecommendationType || (exports.SecurityRecommendationType = SecurityRecommendationType = {}));
var RecommendationPriority;
(function (RecommendationPriority) {
    RecommendationPriority["CRITICAL"] = "critical";
    RecommendationPriority["HIGH"] = "high";
    RecommendationPriority["MEDIUM"] = "medium";
    RecommendationPriority["LOW"] = "low";
})(RecommendationPriority || (exports.RecommendationPriority = RecommendationPriority = {}));
//# sourceMappingURL=IInfrastructureManager.js.map
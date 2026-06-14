"use strict";
/**
 * Infrastructure as Code Types
 * Defines types for infrastructure management, provisioning, and lifecycle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyType = exports.ProbabilityLevel = exports.ImpactLevel = exports.RiskType = exports.SuggestionType = exports.ErrorSeverity = exports.ApprovalType = exports.RiskLevel = exports.ChangeAction = exports.InfrastructureStatus = exports.VariableType = exports.EnvironmentType = exports.ResourceState = exports.ResourceType = exports.CloudProvider = void 0;
var CloudProvider;
(function (CloudProvider) {
    CloudProvider["GCP"] = "gcp";
})(CloudProvider || (exports.CloudProvider = CloudProvider = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType["COMPUTE"] = "compute";
    ResourceType["STORAGE"] = "storage";
    ResourceType["NETWORK"] = "network";
    ResourceType["DATABASE"] = "database";
    ResourceType["SECURITY_GROUP"] = "security_group";
    ResourceType["COMPUTE_ENGINE"] = "compute_engine";
    ResourceType["CLOUD_STORAGE"] = "cloud_storage";
    ResourceType["VPC_NETWORK"] = "vpc_network";
    ResourceType["CLOUD_SQL"] = "cloud_sql";
    ResourceType["LOAD_BALANCER"] = "load_balancer";
    ResourceType["FIREWALL_RULE"] = "firewall_rule";
    ResourceType["IAM_ROLE"] = "iam_role";
    ResourceType["CLOUD_DNS"] = "cloud_dns";
    ResourceType["SSL_CERTIFICATE"] = "ssl_certificate";
    ResourceType["CONTAINER_REGISTRY"] = "container_registry";
    ResourceType["GKE_CLUSTER"] = "gke_cluster";
    ResourceType["CLOUD_FUNCTION"] = "cloud_function";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var ResourceState;
(function (ResourceState) {
    ResourceState["CREATING"] = "creating";
    ResourceState["CREATED"] = "created";
    ResourceState["UPDATING"] = "updating";
    ResourceState["DELETING"] = "deleting";
    ResourceState["DELETED"] = "deleted";
    ResourceState["ERROR"] = "error";
    ResourceState["UNKNOWN"] = "unknown";
})(ResourceState || (exports.ResourceState = ResourceState = {}));
var EnvironmentType;
(function (EnvironmentType) {
    EnvironmentType["DEVELOPMENT"] = "development";
    EnvironmentType["STAGING"] = "staging";
    EnvironmentType["PRODUCTION"] = "production";
    EnvironmentType["TEST"] = "test";
})(EnvironmentType || (exports.EnvironmentType = EnvironmentType = {}));
var VariableType;
(function (VariableType) {
    VariableType["STRING"] = "string";
    VariableType["NUMBER"] = "number";
    VariableType["BOOLEAN"] = "boolean";
    VariableType["LIST"] = "list";
    VariableType["MAP"] = "map";
    VariableType["OBJECT"] = "object";
})(VariableType || (exports.VariableType = VariableType = {}));
var InfrastructureStatus;
(function (InfrastructureStatus) {
    InfrastructureStatus["PROVISIONING"] = "provisioning";
    InfrastructureStatus["PROVISIONED"] = "provisioned";
    InfrastructureStatus["UPDATING"] = "updating";
    InfrastructureStatus["DESTROYING"] = "destroying";
    InfrastructureStatus["DESTROYED"] = "destroyed";
    InfrastructureStatus["ERROR"] = "error";
})(InfrastructureStatus || (exports.InfrastructureStatus = InfrastructureStatus = {}));
var ChangeAction;
(function (ChangeAction) {
    ChangeAction["CREATE"] = "create";
    ChangeAction["UPDATE"] = "update";
    ChangeAction["DELETE"] = "delete";
    ChangeAction["REPLACE"] = "replace";
    ChangeAction["NO_CHANGE"] = "no_change";
})(ChangeAction || (exports.ChangeAction = ChangeAction = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "low";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
    RiskLevel["CRITICAL"] = "critical";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var ApprovalType;
(function (ApprovalType) {
    ApprovalType["MANUAL"] = "manual";
    ApprovalType["AUTOMATED"] = "automated";
    ApprovalType["POLICY_BASED"] = "policy_based";
})(ApprovalType || (exports.ApprovalType = ApprovalType = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["ERROR"] = "error";
    ErrorSeverity["WARNING"] = "warning";
    ErrorSeverity["INFO"] = "info";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
var SuggestionType;
(function (SuggestionType) {
    SuggestionType["OPTIMIZATION"] = "optimization";
    SuggestionType["SECURITY"] = "security";
    SuggestionType["COST"] = "cost";
    SuggestionType["PERFORMANCE"] = "performance";
})(SuggestionType || (exports.SuggestionType = SuggestionType = {}));
var RiskType;
(function (RiskType) {
    RiskType["DOWNTIME"] = "downtime";
    RiskType["DATA_LOSS"] = "data_loss";
    RiskType["SECURITY"] = "security";
    RiskType["COST"] = "cost";
    RiskType["PERFORMANCE"] = "performance";
})(RiskType || (exports.RiskType = RiskType = {}));
var ImpactLevel;
(function (ImpactLevel) {
    ImpactLevel["LOW"] = "low";
    ImpactLevel["MEDIUM"] = "medium";
    ImpactLevel["HIGH"] = "high";
    ImpactLevel["CRITICAL"] = "critical";
})(ImpactLevel || (exports.ImpactLevel = ImpactLevel = {}));
var ProbabilityLevel;
(function (ProbabilityLevel) {
    ProbabilityLevel["UNLIKELY"] = "unlikely";
    ProbabilityLevel["POSSIBLE"] = "possible";
    ProbabilityLevel["LIKELY"] = "likely";
    ProbabilityLevel["CERTAIN"] = "certain";
})(ProbabilityLevel || (exports.ProbabilityLevel = ProbabilityLevel = {}));
var DependencyType;
(function (DependencyType) {
    DependencyType["HARD"] = "hard";
    DependencyType["SOFT"] = "soft";
    DependencyType["OPTIONAL"] = "optional";
})(DependencyType || (exports.DependencyType = DependencyType = {}));
//# sourceMappingURL=infrastructure.js.map
"use strict";
/**
 * Core types for CI/CD Pipeline functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentType = exports.DeploymentStrategy = exports.TriggerType = exports.StageType = exports.PipelineStatus = void 0;
var PipelineStatus;
(function (PipelineStatus) {
    PipelineStatus["PENDING"] = "pending";
    PipelineStatus["RUNNING"] = "running";
    PipelineStatus["SUCCESS"] = "success";
    PipelineStatus["FAILED"] = "failed";
    PipelineStatus["CANCELLED"] = "cancelled";
    PipelineStatus["SKIPPED"] = "skipped";
})(PipelineStatus || (exports.PipelineStatus = PipelineStatus = {}));
var StageType;
(function (StageType) {
    StageType["BUILD"] = "build";
    StageType["TEST"] = "test";
    StageType["SECURITY_SCAN"] = "security_scan";
    StageType["QUALITY_CHECK"] = "quality_check";
    StageType["DEPLOY"] = "deploy";
    StageType["NOTIFY"] = "notify";
    StageType["CUSTOM"] = "custom";
})(StageType || (exports.StageType = StageType = {}));
var TriggerType;
(function (TriggerType) {
    TriggerType["PUSH"] = "push";
    TriggerType["PULL_REQUEST"] = "pull_request";
    TriggerType["SCHEDULE"] = "schedule";
    TriggerType["MANUAL"] = "manual";
    TriggerType["WEBHOOK"] = "webhook";
    TriggerType["API"] = "api";
})(TriggerType || (exports.TriggerType = TriggerType = {}));
var DeploymentStrategy;
(function (DeploymentStrategy) {
    DeploymentStrategy["ROLLING_UPDATE"] = "rolling_update";
    DeploymentStrategy["BLUE_GREEN"] = "blue_green";
    DeploymentStrategy["CANARY"] = "canary";
    DeploymentStrategy["RECREATE"] = "recreate";
})(DeploymentStrategy || (exports.DeploymentStrategy = DeploymentStrategy = {}));
var EnvironmentType;
(function (EnvironmentType) {
    EnvironmentType["DEVELOPMENT"] = "development";
    EnvironmentType["STAGING"] = "staging";
    EnvironmentType["PRODUCTION"] = "production";
    EnvironmentType["TEST"] = "test";
})(EnvironmentType || (exports.EnvironmentType = EnvironmentType = {}));
//# sourceMappingURL=pipeline.js.map
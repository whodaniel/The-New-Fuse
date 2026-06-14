"use strict";
/**
 * Unified Extension Types for The New Fuse Framework
 *
 * Consolidates module, plugin, and extension definitions into a single type system
 * Provides comprehensive interfaces for extension lifecycle management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionEventType = exports.PermissionType = exports.ExtensionStatus = exports.ExtensionCategory = exports.ExtensionType = void 0;
exports.isNestJSModuleExtension = isNestJSModuleExtension;
exports.isWorkflowNodeExtension = isWorkflowNodeExtension;
exports.isAgentCapabilityExtension = isAgentCapabilityExtension;
exports.isVSCodeExtensionWrapper = isVSCodeExtensionWrapper;
var ExtensionType;
(function (ExtensionType) {
    // NestJS Modules
    ExtensionType["NESTJS_MODULE"] = "nestjs_module";
    // Workflow Extensions
    ExtensionType["WORKFLOW_NODE"] = "workflow_node";
    ExtensionType["WORKFLOW_TRIGGER"] = "workflow_trigger";
    ExtensionType["WORKFLOW_VALIDATOR"] = "workflow_validator";
    // Agent Extensions
    ExtensionType["AGENT_CAPABILITY"] = "agent_capability";
    ExtensionType["AGENT_PROTOCOL"] = "agent_protocol";
    ExtensionType["AGENT_HANDOFF_TEMPLATE"] = "agent_handoff_template";
    // Communication Extensions
    ExtensionType["RELAY_TRANSPORT"] = "relay_transport";
    ExtensionType["MESSAGE_HANDLER"] = "message_handler";
    // Integration Extensions
    ExtensionType["API_INTEGRATION"] = "api_integration";
    ExtensionType["DATABASE_CONNECTOR"] = "database_connector";
    ExtensionType["AUTHENTICATION_PROVIDER"] = "auth_provider";
    // UI Extensions
    ExtensionType["VSCODE_EXTENSION"] = "vscode_extension";
    ExtensionType["CHROME_EXTENSION"] = "chrome_extension";
    ExtensionType["WEB_COMPONENT"] = "web_component";
    // Development Extensions
    ExtensionType["DEVELOPER_TOOL"] = "developer_tool";
    ExtensionType["DEBUG_PLUGIN"] = "debug_plugin";
    ExtensionType["TESTING_FRAMEWORK"] = "testing_framework";
    // Analytics Extensions
    ExtensionType["MONITORING_PLUGIN"] = "monitoring_plugin";
    ExtensionType["METRICS_COLLECTOR"] = "metrics_collector";
    // Custom Extensions
    ExtensionType["CUSTOM"] = "custom";
})(ExtensionType || (exports.ExtensionType = ExtensionType = {}));
var ExtensionCategory;
(function (ExtensionCategory) {
    ExtensionCategory["CORE"] = "core";
    ExtensionCategory["WORKFLOW"] = "workflow";
    ExtensionCategory["AGENT"] = "agent";
    ExtensionCategory["COMMUNICATION"] = "communication";
    ExtensionCategory["INTEGRATION"] = "integration";
    ExtensionCategory["UI"] = "ui";
    ExtensionCategory["DEVELOPMENT"] = "development";
    ExtensionCategory["ANALYTICS"] = "analytics";
    ExtensionCategory["UTILITY"] = "utility";
    ExtensionCategory["EXPERIMENTAL"] = "experimental";
})(ExtensionCategory || (exports.ExtensionCategory = ExtensionCategory = {}));
var ExtensionStatus;
(function (ExtensionStatus) {
    ExtensionStatus["UNLOADED"] = "unloaded";
    ExtensionStatus["LOADING"] = "loading";
    ExtensionStatus["LOADED"] = "loaded";
    ExtensionStatus["ACTIVE"] = "active";
    ExtensionStatus["INACTIVE"] = "inactive";
    ExtensionStatus["ERROR"] = "error";
    ExtensionStatus["DISABLED"] = "disabled";
    ExtensionStatus["UNLOADING"] = "unloading";
})(ExtensionStatus || (exports.ExtensionStatus = ExtensionStatus = {}));
var PermissionType;
(function (PermissionType) {
    PermissionType["FILE_SYSTEM_READ"] = "filesystem_read";
    PermissionType["FILE_SYSTEM_WRITE"] = "filesystem_write";
    PermissionType["NETWORK_ACCESS"] = "network_access";
    PermissionType["DATABASE_ACCESS"] = "database_access";
    PermissionType["AGENT_CONTROL"] = "agent_control";
    PermissionType["WORKFLOW_MODIFY"] = "workflow_modify";
    PermissionType["SYSTEM_INFO"] = "system_info";
    PermissionType["USER_DATA"] = "user_data";
    PermissionType["SENSITIVE_DATA"] = "sensitive_data";
    PermissionType["EXECUTION_CONTEXT"] = "execution_context";
})(PermissionType || (exports.PermissionType = PermissionType = {}));
var ExtensionEventType;
(function (ExtensionEventType) {
    ExtensionEventType["EXTENSION_DISCOVERED"] = "extension_discovered";
    ExtensionEventType["EXTENSION_LOADED"] = "extension_loaded";
    ExtensionEventType["EXTENSION_UNLOADED"] = "extension_unloaded";
    ExtensionEventType["EXTENSION_ACTIVATED"] = "extension_activated";
    ExtensionEventType["EXTENSION_DEACTIVATED"] = "extension_deactivated";
    ExtensionEventType["EXTENSION_ERROR"] = "extension_error";
    ExtensionEventType["EXTENSION_CONFIG_CHANGED"] = "extension_config_changed";
    ExtensionEventType["DEPENDENCY_RESOLVED"] = "dependency_resolved";
    ExtensionEventType["DEPENDENCY_FAILED"] = "dependency_failed";
})(ExtensionEventType || (exports.ExtensionEventType = ExtensionEventType = {}));
// Export utility type guards
function isNestJSModuleExtension(ext) {
    return ext.type === ExtensionType.NESTJS_MODULE;
}
function isWorkflowNodeExtension(ext) {
    return ext.type === ExtensionType.WORKFLOW_NODE;
}
function isAgentCapabilityExtension(ext) {
    return ext.type === ExtensionType.AGENT_CAPABILITY;
}
function isVSCodeExtensionWrapper(ext) {
    return ext.type === ExtensionType.VSCODE_EXTENSION;
}
//# sourceMappingURL=ExtensionTypes.js.map
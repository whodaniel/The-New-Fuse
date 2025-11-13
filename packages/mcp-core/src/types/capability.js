/**
 * MCP Capability type definitions
 */
/**
 * Capability category enumeration
 */
export var CapabilityCategory;
(function (CapabilityCategory) {
    CapabilityCategory["CORE"] = "core";
    CapabilityCategory["RESOURCE"] = "resource";
    CapabilityCategory["TOOL"] = "tool";
    CapabilityCategory["COMMUNICATION"] = "communication";
    CapabilityCategory["SECURITY"] = "security";
    CapabilityCategory["MONITORING"] = "monitoring";
    CapabilityCategory["EXTENSION"] = "extension";
})(CapabilityCategory || (CapabilityCategory = {}));
/**
 * Capability lifecycle state enumeration
 */
export var CapabilityLifecycleState;
(function (CapabilityLifecycleState) {
    CapabilityLifecycleState["DRAFT"] = "draft";
    CapabilityLifecycleState["PROPOSED"] = "proposed";
    CapabilityLifecycleState["ACCEPTED"] = "accepted";
    CapabilityLifecycleState["DEPRECATED"] = "deprecated";
    CapabilityLifecycleState["RETIRED"] = "retired";
})(CapabilityLifecycleState || (CapabilityLifecycleState = {}));
/**
 * Capability compatibility level enumeration
 */
export var CapabilityCompatibilityLevel;
(function (CapabilityCompatibilityLevel) {
    CapabilityCompatibilityLevel["FULL"] = "full";
    CapabilityCompatibilityLevel["PARTIAL"] = "partial";
    CapabilityCompatibilityLevel["NONE"] = "none";
})(CapabilityCompatibilityLevel || (CapabilityCompatibilityLevel = {}));
//# sourceMappingURL=capability.js.map
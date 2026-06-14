/**
 * MCP Resource type definitions
 */
/**
 * Resource type enumeration
 */
export var ResourceType;
(function (ResourceType) {
    ResourceType["FILE"] = "file";
    ResourceType["DATABASE"] = "database";
    ResourceType["API"] = "api";
    ResourceType["MEMORY"] = "memory";
    ResourceType["STREAM"] = "stream";
    ResourceType["CUSTOM"] = "custom";
})(ResourceType || (ResourceType = {}));
/**
 * Resource access mode enumeration
 */
export var ResourceAccessMode;
(function (ResourceAccessMode) {
    ResourceAccessMode["READ_ONLY"] = "read_only";
    ResourceAccessMode["WRITE_ONLY"] = "write_only";
    ResourceAccessMode["READ_WRITE"] = "read_write";
    ResourceAccessMode["APPEND_ONLY"] = "append_only";
})(ResourceAccessMode || (ResourceAccessMode = {}));
/**
 * Resource status enumeration
 */
export var ResourceStatus;
(function (ResourceStatus) {
    ResourceStatus["AVAILABLE"] = "available";
    ResourceStatus["UNAVAILABLE"] = "unavailable";
    ResourceStatus["LOCKED"] = "locked";
    ResourceStatus["ERROR"] = "error";
})(ResourceStatus || (ResourceStatus = {}));
//# sourceMappingURL=resource.js.map
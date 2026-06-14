"use strict";
/**
 * Extension System Types - The New Fuse
 *
 * This file consolidates the definitions for modules, plugins, and extensions,
 * creating a unified and authoritative source for all extension-related data structures.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionStatus = exports.ExtensionType = void 0;
// ------------------- Core Extension Enums -------------------
var ExtensionType;
(function (ExtensionType) {
    ExtensionType["MODULE"] = "MODULE";
    ExtensionType["PLUGIN"] = "PLUGIN";
    ExtensionType["INTEGRATION"] = "INTEGRATION";
})(ExtensionType || (exports.ExtensionType = ExtensionType = {}));
var ExtensionStatus;
(function (ExtensionStatus) {
    ExtensionStatus["LOADED"] = "LOADED";
    ExtensionStatus["UNLOADED"] = "UNLOADED";
    ExtensionStatus["ENABLED"] = "ENABLED";
    ExtensionStatus["DISABLED"] = "DISABLED";
    ExtensionStatus["ERROR"] = "ERROR";
})(ExtensionStatus || (exports.ExtensionStatus = ExtensionStatus = {}));
//# sourceMappingURL=ExtensionTypes.js.map
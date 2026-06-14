"use strict";
/**
 * @the-new-fuse/fairtable-adapters
 *
 * Migration adapters for transitioning from legacy components to fairtable-based implementations.
 * Provides backward compatibility while enabling gradual migration to new fairtable architecture.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ADAPTER_CONFIG = exports.TARGET_AIRTABLE_VERSION = exports.SUPPORTED_LEGACY_VERSIONS = exports.ADAPTER_VERSION = exports.createMigrationStatus = exports.KanbanBoardAdapter = void 0;
// Core adapter components
var KanbanBoardAdapter_js_1 = require("./KanbanBoardAdapter.js");
Object.defineProperty(exports, "KanbanBoardAdapter", { enumerable: true, get: function () { return __importDefault(KanbanBoardAdapter_js_1).default; } });
// Migration utilities
__exportStar(require("./migration-utils.js"), exports);
// Helper functions for common migration tasks
const createMigrationStatus = (component, status, warnings = [], migrationGuide) => ({
    component,
    status,
    warnings,
    migrationGuide
});
exports.createMigrationStatus = createMigrationStatus;
// Version information
exports.ADAPTER_VERSION = '1.0.0';
exports.SUPPORTED_LEGACY_VERSIONS = ['1.x', '2.x'];
exports.TARGET_AIRTABLE_VERSION = '1.0.0';
// Default configuration for migration adapters
exports.DEFAULT_ADAPTER_CONFIG = {
    enableDeprecationWarnings: process.env.NODE_ENV === 'development',
    showMigrationTips: true,
    logMigrationEvents: false,
    validateDataIntegrity: true
};
//# sourceMappingURL=index.js.map
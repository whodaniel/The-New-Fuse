"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.CommandError = exports.BaseCommand = void 0;
// Core interfaces
__exportStar(require("./interfaces"), exports);
// Base classes
// Export BaseCommand separately to avoid CommandError conflict
var base_1 = require("./base");
Object.defineProperty(exports, "BaseCommand", { enumerable: true, get: function () { return base_1.BaseCommand; } });
Object.defineProperty(exports, "CommandError", { enumerable: true, get: function () { return base_1.CommandError; } });
// Command bus implementation
__exportStar(require("./command-bus"), exports);
// Registry
__exportStar(require("./registry"), exports);
// Execution engine
__exportStar(require("./engine"), exports);
// Events
__exportStar(require("./events"), exports);
// Error handling
__exportStar(require("./errors"), exports);
// Logging
__exportStar(require("./logging"), exports);
// Version
exports.VERSION = '1.0.0';
//# sourceMappingURL=index.js.map
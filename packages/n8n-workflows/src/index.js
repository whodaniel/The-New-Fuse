"use strict";
/**
 * N8N Workflows Package
 * Main entry point
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = exports.WorkflowRegistry = exports.WorkflowParser = exports.WorkflowFetcher = exports.WorkflowCategorizer = void 0;
var WorkflowCategorizer_js_1 = require("./categorizer/WorkflowCategorizer.js");
Object.defineProperty(exports, "WorkflowCategorizer", { enumerable: true, get: function () { return WorkflowCategorizer_js_1.WorkflowCategorizer; } });
var WorkflowFetcher_js_1 = require("./fetcher/WorkflowFetcher.js");
Object.defineProperty(exports, "WorkflowFetcher", { enumerable: true, get: function () { return WorkflowFetcher_js_1.WorkflowFetcher; } });
var WorkflowParser_js_1 = require("./parser/WorkflowParser.js");
Object.defineProperty(exports, "WorkflowParser", { enumerable: true, get: function () { return WorkflowParser_js_1.WorkflowParser; } });
var WorkflowRegistry_js_1 = require("./registry/WorkflowRegistry.js");
Object.defineProperty(exports, "WorkflowRegistry", { enumerable: true, get: function () { return WorkflowRegistry_js_1.WorkflowRegistry; } });
var WorkflowService_js_1 = require("./services/WorkflowService.js");
Object.defineProperty(exports, "WorkflowService", { enumerable: true, get: function () { return WorkflowService_js_1.WorkflowService; } });
__exportStar(require("./types/index.js"), exports);
//# sourceMappingURL=index.js.map
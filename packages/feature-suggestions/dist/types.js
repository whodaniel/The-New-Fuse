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
exports.SuggestionStatus = exports.SuggestionPriority = exports.FeatureStage = void 0;
var FeatureStage;
(function (FeatureStage) {
    FeatureStage["ANALYSIS"] = "ANALYSIS";
    FeatureStage["DESIGN"] = "DESIGN";
    FeatureStage["DEVELOPMENT"] = "DEVELOPMENT";
    FeatureStage["TESTING"] = "TESTING";
    FeatureStage["REVIEW"] = "REVIEW";
    FeatureStage["DEPLOYMENT"] = "DEPLOYMENT";
    FeatureStage["COMPLETED"] = "COMPLETED";
    FeatureStage["IN_PROGRESS"] = "IN_PROGRESS"; // Adding this for compatibility with EnhancedTimelineView
})(FeatureStage || (exports.FeatureStage = FeatureStage = {}));
var SuggestionPriority;
(function (SuggestionPriority) {
    SuggestionPriority["LOW"] = "LOW";
    SuggestionPriority["MEDIUM"] = "MEDIUM";
    SuggestionPriority["HIGH"] = "HIGH";
    SuggestionPriority["CRITICAL"] = "CRITICAL";
})(SuggestionPriority || (exports.SuggestionPriority = SuggestionPriority = {}));
// Define SuggestionStatus directly instead of trying to import it
var SuggestionStatus;
(function (SuggestionStatus) {
    SuggestionStatus["NEW"] = "NEW";
    SuggestionStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    SuggestionStatus["APPROVED"] = "APPROVED";
    SuggestionStatus["REJECTED"] = "REJECTED";
    SuggestionStatus["IMPLEMENTED"] = "IMPLEMENTED";
    SuggestionStatus["SUBMITTED"] = "SUBMITTED";
    SuggestionStatus["PENDING"] = "PENDING";
    SuggestionStatus["CONVERTED"] = "CONVERTED";
})(SuggestionStatus || (exports.SuggestionStatus = SuggestionStatus = {}));
// Import from types package instead of direct file
__exportStar(require("@the-new-fuse/types"), exports);
//# sourceMappingURL=types.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionPriority = exports.SuggestionStatus = void 0;
/**
 * Suggestion status enumeration
 */
var SuggestionStatus;
(function (SuggestionStatus) {
    SuggestionStatus["SUBMITTED"] = "submitted";
    SuggestionStatus["UNDER_REVIEW"] = "under_review";
    SuggestionStatus["APPROVED"] = "approved";
    SuggestionStatus["REJECTED"] = "rejected";
    SuggestionStatus["IMPLEMENTED"] = "implemented";
})(SuggestionStatus || (exports.SuggestionStatus = SuggestionStatus = {}));
/**
 * Suggestion priority enumeration
 */
var SuggestionPriority;
(function (SuggestionPriority) {
    SuggestionPriority["LOW"] = "low";
    SuggestionPriority["MEDIUM"] = "medium";
    SuggestionPriority["HIGH"] = "high";
    SuggestionPriority["CRITICAL"] = "critical";
})(SuggestionPriority || (exports.SuggestionPriority = SuggestionPriority = {}));

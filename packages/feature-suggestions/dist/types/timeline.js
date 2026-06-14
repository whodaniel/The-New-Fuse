"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionStatus = void 0;
// Re-export SuggestionStatus enum for use throughout the application
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
//# sourceMappingURL=timeline.js.map
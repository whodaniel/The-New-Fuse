/**
 * Suggestion status enumeration
 */
export var SuggestionStatus;
(function (SuggestionStatus) {
    SuggestionStatus["SUBMITTED"] = "submitted";
    SuggestionStatus["UNDER_REVIEW"] = "under_review";
    SuggestionStatus["APPROVED"] = "approved";
    SuggestionStatus["REJECTED"] = "rejected";
    SuggestionStatus["IMPLEMENTED"] = "implemented";
})(SuggestionStatus || (SuggestionStatus = {}));
/**
 * Suggestion priority enumeration
 */
export var SuggestionPriority;
(function (SuggestionPriority) {
    SuggestionPriority["LOW"] = "low";
    SuggestionPriority["MEDIUM"] = "medium";
    SuggestionPriority["HIGH"] = "high";
    SuggestionPriority["CRITICAL"] = "critical";
})(SuggestionPriority || (SuggestionPriority = {}));

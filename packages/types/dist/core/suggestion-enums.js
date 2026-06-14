/**
 * Suggestion related enums
 */
export var SuggestionStatus;
(function (SuggestionStatus) {
    SuggestionStatus["NEW"] = "new";
    SuggestionStatus["UNDER_REVIEW"] = "under_review";
    SuggestionStatus["ACCEPTED"] = "accepted";
    SuggestionStatus["REJECTED"] = "rejected";
    SuggestionStatus["IMPLEMENTED"] = "implemented";
})(SuggestionStatus || (SuggestionStatus = {}));
export var SuggestionPriority;
(function (SuggestionPriority) {
    SuggestionPriority["LOW"] = "low";
    SuggestionPriority["MEDIUM"] = "medium";
    SuggestionPriority["HIGH"] = "high";
    SuggestionPriority["CRITICAL"] = "critical";
})(SuggestionPriority || (SuggestionPriority = {}));
export var FeatureStage;
(function (FeatureStage) {
    FeatureStage["PLANNING"] = "planning";
    FeatureStage["DEVELOPMENT"] = "development";
    FeatureStage["TESTING"] = "testing";
    FeatureStage["REVIEW"] = "review";
    FeatureStage["DEPLOYED"] = "deployed";
})(FeatureStage || (FeatureStage = {}));
//# sourceMappingURL=suggestion-enums.js.map
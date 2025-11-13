// Define types locally to avoid external dependencies
export var FeatureStage;
(function (FeatureStage) {
    FeatureStage["IDEA"] = "IDEA";
    FeatureStage["PLANNING"] = "PLANNING";
    FeatureStage["DEVELOPMENT"] = "DEVELOPMENT";
    FeatureStage["TESTING"] = "TESTING";
    FeatureStage["DEPLOYED"] = "DEPLOYED";
    FeatureStage["DEPRECATED"] = "DEPRECATED";
})(FeatureStage || (FeatureStage = {}));
export var SuggestionPriority;
(function (SuggestionPriority) {
    SuggestionPriority["LOW"] = "LOW";
    SuggestionPriority["MEDIUM"] = "MEDIUM";
    SuggestionPriority["HIGH"] = "HIGH";
    SuggestionPriority["URGENT"] = "URGENT";
})(SuggestionPriority || (SuggestionPriority = {}));
export var Environment;
(function (Environment) {
    Environment["LOCAL"] = "local";
    Environment["DEVELOPMENT"] = "development";
    Environment["STAGING"] = "staging";
    Environment["PRODUCTION"] = "production";
})(Environment || (Environment = {}));
//# sourceMappingURL=featureFlags.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureStage = exports.SuggestionPriority = exports.SuggestionStatus = void 0;
// Import enums from the central types package
const types_1 = require("@the-new-fuse/types");
Object.defineProperty(exports, "SuggestionStatus", { enumerable: true, get: function () { return types_1.SuggestionStatus; } });
Object.defineProperty(exports, "SuggestionPriority", { enumerable: true, get: function () { return types_1.SuggestionPriority; } });
var FeatureStage;
(function (FeatureStage) {
    FeatureStage["DISCOVERY"] = "DISCOVERY";
    FeatureStage["DESIGN"] = "DESIGN";
    FeatureStage["DEVELOPMENT"] = "DEVELOPMENT";
    FeatureStage["TESTING"] = "TESTING";
    FeatureStage["REVIEW"] = "REVIEW";
    FeatureStage["DEPLOYED"] = "DEPLOYED";
})(FeatureStage || (exports.FeatureStage = FeatureStage = {}));
//# sourceMappingURL=index.js.map
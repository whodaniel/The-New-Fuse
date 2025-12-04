export var ContentCategory;
(function (ContentCategory) {
    ContentCategory["SAFE"] = "safe";
    ContentCategory["MILD"] = "mild";
    ContentCategory["MODERATE"] = "moderate";
    ContentCategory["SEVERE"] = "severe";
})(ContentCategory || (ContentCategory = {}));
var HarmlessnessScreen = /** @class */ (function () {
    function HarmlessnessScreen() {
        this.harmful_patterns = {
            severe: [
                /malware/i,
                /exploit/i,
                /hack/i,
                /attack/i,
                /vulnerability/i,
                /breach/i,
                /steal/i,
                /threat/i
            ],
            moderate: [
                /risk/i,
                /danger/i,
                /warning/i,
                /caution/i,
                /unsafe/i
            ],
            mild: [
                /issue/i,
                /problem/i,
                /concern/i,
                /attention/i
            ]
        };
    }
    HarmlessnessScreen.prototype.screen = function (content) {
        var issues = [];
        var recommendations = [];
        var highestCategory = ContentCategory.SAFE;
        var severeMatches = this.findMatches(content, this.harmful_patterns.severe);
        if (severeMatches.length > 0) {
            highestCategory = ContentCategory.SEVERE;
            issues.push.apply(issues, severeMatches.map(function (match) { return "Severe security concern: Contains \"".concat(match, "\""); }));
            recommendations.push("Remove or rephrase content with severe security implications", "Consider using more neutral language");
        }
        var moderateMatches = this.findMatches(content, this.harmful_patterns.moderate);
        if (moderateMatches.length > 0 && highestCategory === ContentCategory.SAFE) {
            highestCategory = ContentCategory.MODERATE;
            issues.push.apply(issues, moderateMatches.map(function (match) { return "Moderate concern: Contains \"".concat(match, "\""); }));
            recommendations.push("Review and possibly rephrase cautionary language", "Consider providing more context or clarification");
        }
        var mildMatches = this.findMatches(content, this.harmful_patterns.mild);
        if (mildMatches.length > 0 && highestCategory === ContentCategory.SAFE) {
            highestCategory = ContentCategory.MILD;
            issues.push.apply(issues, mildMatches.map(function (match) { return "Mild concern: Contains \"".concat(match, "\""); }));
            recommendations.push("Consider if the concerning language is necessary", "Review for clearer communication");
        }
        return {
            category: highestCategory,
            issues: issues,
            recommendations: recommendations,
            metadata: {
                timestamp: new Date().toISOString(),
                contentLength: content.length,
                matchCounts: {
                    severe: severeMatches.length,
                    moderate: moderateMatches.length,
                    mild: mildMatches.length
                }
            }
        };
    };
    HarmlessnessScreen.prototype.findMatches = function (content, patterns) {
        var matches = [];
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            var match = content.match(pattern);
            if (match) {
                matches.push(match[0]);
            }
        }
        return matches;
    };
    return HarmlessnessScreen;
}());
export { HarmlessnessScreen };

export var ContentCategory;
(function (ContentCategory): any {
    ContentCategory["SAFE"] = "safe";
    ContentCategory["MILD"] = "mild";
    ContentCategory["MODERATE"] = "moderate";
    ContentCategory["SEVERE"] = "severe";
})(ContentCategory || (ContentCategory = {}));
export class HarmlessnessScreen {
    constructor() {
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
    screen(content) {
        const issues = [];
        const recommendations = [];
        let highestCategory = ContentCategory.SAFE;
        const severeMatches = this.findMatches(content, this.harmful_patterns.severe);
        if (severeMatches.length > 0) {
            highestCategory = ContentCategory.SEVERE;
            issues.push(...severeMatches.map(match => `Severe security concern: Contains "${match}"`));
            recommendations.push("Remove or rephrase content with severe security implications", "Consider using more neutral language");
        }
        const moderateMatches = this.findMatches(content, this.harmful_patterns.moderate);
        if (moderateMatches.length > 0 && highestCategory === ContentCategory.SAFE) {
            highestCategory = ContentCategory.MODERATE;
            issues.push(...moderateMatches.map(match => `Moderate concern: Contains "${match}"`));
            recommendations.push("Review and possibly rephrase cautionary language", "Consider providing more context or clarification");
        }
        const mildMatches = this.findMatches(content, this.harmful_patterns.mild);
        if (mildMatches.length > 0 && highestCategory === ContentCategory.SAFE) {
            highestCategory = ContentCategory.MILD;
            issues.push(...mildMatches.map(match => `Mild concern: Contains "${match}"`));
            recommendations.push("Consider if the concerning language is necessary", "Review for clearer communication");
        }
        return {
            category: highestCategory,
            issues,
            recommendations,
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
    }
    findMatches(content, patterns) {
        const matches = [];
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                matches.push(match[0]);
            }
        }
        return matches;
    }
}
//# sourceMappingURL=harmlessness.js.map
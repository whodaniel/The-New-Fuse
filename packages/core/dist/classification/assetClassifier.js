export var AssetQuality;
(function (AssetQuality) {
    AssetQuality["INNOVATIVE"] = "innovative";
    AssetQuality["EFFICIENT"] = "efficient";
    AssetQuality["SCALABLE"] = "scalable";
    AssetQuality["MAINTAINABLE"] = "maintainable";
    AssetQuality["SECURE"] = "secure";
    AssetQuality["PERFORMANT"] = "performant";
    AssetQuality["REUSABLE"] = "reusable";
    AssetQuality["DOCUMENTED"] = "documented";
})(AssetQuality || (AssetQuality = {}));
export var AssetCategory;
(function (AssetCategory) {
    AssetCategory["ALGORITHM"] = "algorithm";
    AssetCategory["PROTOCOL"] = "protocol";
    AssetCategory["FRAMEWORK"] = "framework";
    AssetCategory["TOOL"] = "tool";
    AssetCategory["MODEL"] = "model";
    AssetCategory["LIBRARY"] = "library";
    AssetCategory["API"] = "api";
    AssetCategory["ARCHITECTURE"] = "architecture";
})(AssetCategory || (AssetCategory = {}));
export class AssetClassifier {
    constructor() {
        this.categoryKeywords = {
            [AssetCategory.ALGORITHM]: ['complexity', 'optimization', 'computation', 'algorithm', 'sort', 'search'],
            [AssetCategory.PROTOCOL]: ['communication', 'handshake', 'exchange', 'protocol', 'tcp', 'udp'],
            [AssetCategory.FRAMEWORK]: ['extensible', 'configurable', 'plugin', 'framework', 'mvc', 'architecture'],
            [AssetCategory.TOOL]: ['utility', 'cli', 'standalone', 'tool', 'helper'],
            [AssetCategory.MODEL]: ['training', 'inference', 'prediction', 'model', 'ml', 'ai'],
            [AssetCategory.LIBRARY]: ['reusable', 'import', 'module', 'library', 'package', 'dependency'],
            [AssetCategory.API]: ['endpoint', 'request', 'response', 'api', 'rest', 'graphql'],
            [AssetCategory.ARCHITECTURE]: ['system', 'structure', 'pattern', 'architecture', 'design'],
        };
        this.qualityKeywords = {
            [AssetQuality.INNOVATIVE]: ['novel', 'innovative', 'breakthrough', 'cutting-edge', 'pioneering'],
            [AssetQuality.EFFICIENT]: ['efficient', 'optimized', 'fast', 'performance', 'speed'],
            [AssetQuality.SCALABLE]: ['scalable', 'distributed', 'horizontal', 'vertical', 'growth'],
            [AssetQuality.MAINTAINABLE]: ['maintainable', 'clean', 'readable', 'testable', 'modular'],
            [AssetQuality.SECURE]: ['secure', 'encryption', 'authentication', 'authorization', 'safe'],
            [AssetQuality.PERFORMANT]: ['performant', 'fast', 'responsive', 'low-latency', 'high-throughput'],
            [AssetQuality.REUSABLE]: ['reusable', 'modular', 'component', 'library', 'generic'],
            [AssetQuality.DOCUMENTED]: ['documented', 'readme', 'docs', 'comments', 'examples'],
        };
    }
    classify(assetData) {
        const content = String(assetData.content || '').toLowerCase();
        // Determine category
        let bestCategory = AssetCategory.LIBRARY;
        let categoryScore = 0;
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            const score = keywords.reduce((sum, keyword) => {
                return sum + (content.includes(keyword) ? 1 : 0);
            }, 0);
            if (score > categoryScore) {
                categoryScore = score;
                bestCategory = category;
            }
        }
        // Determine quality attributes
        const qualities = [];
        for (const [quality, keywords] of Object.entries(this.qualityKeywords)) {
            const hasQuality = keywords.some(keyword => content.includes(keyword));
            if (hasQuality) {
                qualities.push(quality);
            }
        }
        // Extract tags from content
        const tags = this.extractTags(content);
        // Calculate confidence
        const confidence = Math.min((categoryScore / 3) * 100, 100);
        return {
            category: bestCategory,
            quality: qualities,
            confidence,
            tags,
            summary: this.generateSummary(assetData, bestCategory, qualities)
        };
    }
    extractTags(content) {
        // Simple tag extraction based on common technical terms
        const commonTags = ['typescript', 'javascript', 'react', 'node', 'api', 'database', 'testing'];
        return commonTags.filter(tag => content.includes(tag));
    }
    generateSummary(assetData, category, qualities) {
        return `${assetData.name} is classified as a ${category} with ${qualities.length} quality attributes: ${qualities.join(', ')}`;
    }
}
//# sourceMappingURL=assetClassifier.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImplementationCompletenessAnalyzer = void 0;
const SpecificationAlignmentChecker_1 = require("./SpecificationAlignmentChecker");
const CodeQualityAnalyzer_1 = require("./CodeQualityAnalyzer");
const PerformanceBottleneckDetector_1 = require("./PerformanceBottleneckDetector");
class ImplementationCompletenessAnalyzer {
    constructor(packages, rootPath = process.cwd()) {
        this.packages = packages;
        this.rootPath = rootPath;
    }
    async analyzeImplementationCompleteness() {
        console.log('Starting implementation completeness analysis...');
        // 1. Check specification alignment
        console.log('1. Analyzing specification alignment...');
        const specChecker = new SpecificationAlignmentChecker_1.SpecificationAlignmentChecker(this.rootPath);
        const specificationAlignment = await specChecker.checkSpecificationAlignment();
        // 2. Analyze code quality
        console.log('2. Analyzing code quality...');
        const qualityAnalyzer = new CodeQualityAnalyzer_1.CodeQualityAnalyzer(this.packages);
        const codeQuality = await qualityAnalyzer.analyzeCodeQuality();
        // 3. Detect performance bottlenecks
        console.log('3. Detecting performance bottlenecks...');
        const performanceDetector = new PerformanceBottleneckDetector_1.PerformanceBottleneckDetector(this.packages);
        const performanceBottlenecks = await performanceDetector.detectPerformanceBottlenecks();
        // 4. Identify implementation gaps
        console.log('4. Identifying implementation gaps...');
        const implementationGaps = this.identifyImplementationGaps(specificationAlignment);
        // 5. Calculate completeness metrics
        console.log('5. Calculating completeness metrics...');
        const completenessMetrics = this.calculateCompletenessMetrics(specificationAlignment, codeQuality, performanceBottlenecks);
        // 6. Generate prioritized recommendations
        console.log('6. Generating prioritized recommendations...');
        const prioritizedRecommendations = this.generatePrioritizedRecommendations(specificationAlignment, codeQuality, performanceBottlenecks, implementationGaps);
        console.log('Implementation completeness analysis complete!');
        return {
            specificationAlignment,
            codeQuality,
            performanceBottlenecks,
            implementationGaps,
            completenessMetrics,
            prioritizedRecommendations
        };
    }
    identifyImplementationGaps(alignment) {
        const gaps = [];
        // Process missing implementations
        for (const missing of alignment.specifiedButNotImplemented) {
            const priority = this.determinePriority(missing.feature);
            const estimatedEffort = this.estimateImplementationEffort(missing.feature);
            const blockers = this.identifyBlockers(missing.feature);
            const dependencies = this.identifyDependencies(missing.feature);
            gaps.push({
                feature: missing.feature.title,
                specificationExists: true,
                implementationExists: false,
                implementationComplete: false,
                priority,
                estimatedEffort,
                blockers,
                dependencies
            });
        }
        // Process partial implementations
        for (const aligned of alignment.alignedFeatures) {
            if (aligned.implementationStatus === 'partial') {
                const priority = this.determinePriority(aligned.feature);
                const estimatedEffort = this.estimateCompletionEffort(aligned);
                const blockers = aligned.gaps;
                const dependencies = this.identifyDependencies(aligned.feature);
                gaps.push({
                    feature: aligned.feature.title,
                    specificationExists: true,
                    implementationExists: true,
                    implementationComplete: false,
                    priority,
                    estimatedEffort,
                    blockers,
                    dependencies
                });
            }
        }
        // Process unspecified implementations
        for (const unspecified of alignment.implementedButNotSpecified) {
            gaps.push({
                feature: unspecified.functionality,
                specificationExists: false,
                implementationExists: true,
                implementationComplete: true,
                priority: 'low',
                estimatedEffort: '1-2 days (documentation)',
                blockers: ['Missing specification'],
                dependencies: []
            });
        }
        return gaps.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    determinePriority(feature) {
        const title = feature.title.toLowerCase();
        const category = feature.category;
        // Critical: Core system functionality
        if (title.includes('core') || title.includes('database') || title.includes('authentication') ||
            title.includes('security') || category === 'requirement') {
            return 'critical';
        }
        // High: Important features for user experience
        if (title.includes('api') || title.includes('frontend') || title.includes('workflow') ||
            title.includes('mcp') || category === 'design') {
            return 'high';
        }
        // Medium: Enhancement features
        if (title.includes('testing') || title.includes('documentation') || title.includes('optimization')) {
            return 'medium';
        }
        // Low: Nice-to-have features
        return 'low';
    }
    estimateImplementationEffort(feature) {
        const requirements = feature.requirements.length;
        const complexity = feature.description.length;
        if (requirements > 5 || complexity > 500) {
            return '2-3 weeks';
        }
        else if (requirements > 3 || complexity > 200) {
            return '1-2 weeks';
        }
        else if (requirements > 1 || complexity > 100) {
            return '3-5 days';
        }
        else {
            return '1-2 days';
        }
    }
    estimateCompletionEffort(mapping) {
        const gapCount = mapping.gaps.length;
        const implementationScore = mapping.implementationScore;
        if (implementationScore < 30) {
            return '1-2 weeks';
        }
        else if (implementationScore < 60) {
            return '3-5 days';
        }
        else {
            return '1-2 days';
        }
    }
    identifyBlockers(feature) {
        const blockers = [];
        const title = feature.title.toLowerCase();
        if (title.includes('database') && !title.includes('schema')) {
            blockers.push('Database schema needs to be defined');
        }
        if (title.includes('api') && !title.includes('endpoint')) {
            blockers.push('API endpoints need to be designed');
        }
        if (title.includes('frontend') && !title.includes('component')) {
            blockers.push('UI components need to be created');
        }
        if (title.includes('testing') && !title.includes('framework')) {
            blockers.push('Testing framework needs to be set up');
        }
        return blockers;
    }
    identifyDependencies(feature) {
        const dependencies = [];
        const title = feature.title.toLowerCase();
        const description = feature.description.toLowerCase();
        if (title.includes('frontend') || description.includes('ui')) {
            dependencies.push('UI component library');
        }
        if (title.includes('api') || description.includes('endpoint')) {
            dependencies.push('Backend services');
        }
        if (title.includes('database') || description.includes('data')) {
            dependencies.push('Database schema');
        }
        if (title.includes('authentication') || description.includes('auth')) {
            dependencies.push('Authentication system');
        }
        if (title.includes('testing') || description.includes('test')) {
            dependencies.push('Testing infrastructure');
        }
        return dependencies;
    }
    calculateCompletenessMetrics(alignment, quality, performance) {
        const totalFeatures = alignment.specifiedButNotImplemented.length +
            alignment.alignedFeatures.length;
        const implementedFeatures = alignment.alignedFeatures.filter(f => f.implementationStatus === 'implemented').length;
        const partiallyImplementedFeatures = alignment.alignedFeatures.filter(f => f.implementationStatus === 'partial').length;
        const missingFeatures = alignment.specifiedButNotImplemented.length;
        const unspecifiedImplementations = alignment.implementedButNotSpecified.length;
        const overallCompletenessScore = totalFeatures > 0 ?
            Math.round((implementedFeatures / totalFeatures) * 100) : 0;
        const qualityScore = quality.qualityMetrics.overallScore;
        const performanceScore = performance.performanceMetrics.performanceScore;
        const alignmentScore = alignment.overallAlignmentScore;
        return {
            totalFeatures,
            implementedFeatures,
            partiallyImplementedFeatures,
            missingFeatures,
            unspecifiedImplementations,
            overallCompletenessScore,
            qualityScore,
            performanceScore,
            alignmentScore
        };
    }
    generatePrioritizedRecommendations(alignment, quality, performance, gaps) {
        const recommendations = [];
        // Critical implementation gaps
        const criticalGaps = gaps.filter(g => g.priority === 'critical' && !g.implementationExists);
        for (const gap of criticalGaps.slice(0, 3)) { // Top 3 critical gaps
            recommendations.push({
                priority: 'critical',
                category: 'implementation',
                recommendation: `Implement missing critical feature: ${gap.feature}`,
                effort: gap.estimatedEffort,
                impact: 'High - Core system functionality'
            });
        }
        // High-severity performance issues
        const criticalPerformanceIssues = performance.databaseQueryIssues
            .filter(i => i.severity === 'high').slice(0, 2);
        for (const issue of criticalPerformanceIssues) {
            recommendations.push({
                priority: 'critical',
                category: 'performance',
                recommendation: `Fix database performance issue: ${issue.issue}`,
                effort: '1-3 days',
                impact: 'High - System performance and scalability'
            });
        }
        // High-priority quality issues
        if (quality.duplications.length > 5) {
            recommendations.push({
                priority: 'high',
                category: 'quality',
                recommendation: `Refactor ${quality.duplications.length} code duplications`,
                effort: '1-2 weeks',
                impact: 'Medium - Code maintainability'
            });
        }
        // High implementation gaps
        const highGaps = gaps.filter(g => g.priority === 'high' && !g.implementationExists);
        for (const gap of highGaps.slice(0, 2)) { // Top 2 high gaps
            recommendations.push({
                priority: 'high',
                category: 'implementation',
                recommendation: `Implement high-priority feature: ${gap.feature}`,
                effort: gap.estimatedEffort,
                impact: 'Medium - Important functionality'
            });
        }
        // Alignment issues
        if (alignment.implementedButNotSpecified.length > 10) {
            recommendations.push({
                priority: 'medium',
                category: 'alignment',
                recommendation: `Document ${alignment.implementedButNotSpecified.length} unspecified implementations`,
                effort: '1 week',
                impact: 'Medium - Documentation completeness'
            });
        }
        // Complex functions
        const complexFunctions = quality.complexFunctions.filter(f => f.cyclomaticComplexity > 15);
        if (complexFunctions.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'quality',
                recommendation: `Refactor ${complexFunctions.length} overly complex functions`,
                effort: '1-2 weeks',
                impact: 'Medium - Code maintainability'
            });
        }
        // Memory leak risks
        const highMemoryRisks = performance.memoryLeakRisks.filter(r => r.severity === 'high');
        if (highMemoryRisks.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'performance',
                recommendation: `Fix ${highMemoryRisks.length} high-risk memory leak issues`,
                effort: '3-5 days',
                impact: 'Medium - System stability'
            });
        }
        // Partial implementations
        const partialImplementations = gaps.filter(g => g.implementationExists && !g.implementationComplete);
        for (const partial of partialImplementations.slice(0, 3)) { // Top 3 partial implementations
            recommendations.push({
                priority: partial.priority,
                category: 'implementation',
                recommendation: `Complete partial implementation: ${partial.feature}`,
                effort: partial.estimatedEffort,
                impact: 'Low-Medium - Feature completeness'
            });
        }
        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
}
exports.ImplementationCompletenessAnalyzer = ImplementationCompletenessAnalyzer;
//# sourceMappingURL=ImplementationCompletenessAnalyzer.js.map
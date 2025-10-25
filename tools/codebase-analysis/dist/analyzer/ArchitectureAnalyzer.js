"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchitectureAnalyzer = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class ArchitectureAnalyzer {
    constructor(packages, apps) {
        this.packages = packages;
        this.apps = apps;
    }
    async analyzeArchitecture() {
        console.log('Starting architecture analysis...');
        const packageRedundancy = await this.analyzePackageRedundancy();
        const applicationLayer = await this.analyzeApplicationLayer();
        const uiPackages = await this.analyzeUIPackages();
        const databaseLayer = await this.analyzeDatabaseLayer();
        const overallRecommendations = this.generateOverallRecommendations(packageRedundancy, applicationLayer, uiPackages, databaseLayer);
        const consolidationPlan = this.generateConsolidationPlan(packageRedundancy, applicationLayer, uiPackages, databaseLayer);
        return {
            packageRedundancy,
            applicationLayer,
            uiPackages,
            databaseLayer,
            overallRecommendations,
            consolidationPlan
        };
    }
    async analyzePackageRedundancy() {
        console.log('Analyzing package redundancy...');
        const results = [];
        for (const pkg of this.packages) {
            const functionality = await this.extractFunctionalitySignature(pkg);
            const similarPackages = await this.findSimilarPackages(pkg, functionality);
            const redundancyScore = this.calculateRedundancyScore(pkg, similarPackages);
            const consolidationCandidates = this.generateConsolidationCandidates(pkg, similarPackages);
            const recommendedAction = this.determineRecommendedAction(pkg, redundancyScore, consolidationCandidates);
            results.push({
                packageName: pkg.name,
                packagePath: pkg.path,
                functionality,
                redundancyScore,
                consolidationCandidates,
                similarPackages,
                recommendedAction
            });
        }
        return results;
    }
    async extractFunctionalitySignature(pkg) {
        const signature = {
            exportedFunctions: [],
            exportedClasses: [],
            exportedTypes: [],
            exportedConstants: [],
            mainPurpose: '',
            keywords: [],
            dependencies: []
        };
        try {
            // Read package.json for basic info
            const packageJsonPath = path.join(pkg.path, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
            signature.dependencies = Object.keys({
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            });
            signature.mainPurpose = packageJson.description || '';
            signature.keywords = packageJson.keywords || [];
            // Extract keywords from package name
            const nameKeywords = pkg.name.toLowerCase().split(/[-_]/);
            signature.keywords.push(...nameKeywords);
            signature.keywords = [...new Set(signature.keywords.filter(k => k.length > 2))];
        }
        catch (error) {
            console.warn(`Failed to extract functionality signature for ${pkg.name}:`, error);
        }
        return signature;
    }
    async findSimilarPackages(pkg, functionality) {
        const similarPackages = [];
        for (const otherPkg of this.packages) {
            if (otherPkg.name === pkg.name)
                continue;
            const otherFunctionality = await this.extractFunctionalitySignature(otherPkg);
            const similarityScore = this.calculateSimilarityScore(functionality, otherFunctionality);
            if (similarityScore > 30) {
                const commonFunctionality = this.findCommonFunctionality(functionality, otherFunctionality);
                const differences = this.findDifferences(functionality, otherFunctionality);
                similarPackages.push({
                    name: otherPkg.name,
                    similarityScore,
                    commonFunctionality,
                    differences
                });
            }
        }
        return similarPackages.sort((a, b) => b.similarityScore - a.similarityScore);
    }
    calculateSimilarityScore(func1, func2) {
        let score = 0;
        // Compare keywords (main factor)
        const keywordIntersection = func1.keywords.filter(k => func2.keywords.includes(k));
        const keywordUnion = [...new Set([...func1.keywords, ...func2.keywords])];
        if (keywordUnion.length > 0) {
            score += (keywordIntersection.length / keywordUnion.length) * 70;
        }
        // Compare dependencies
        const depIntersection = func1.dependencies.filter(d => func2.dependencies.includes(d));
        const depUnion = [...new Set([...func1.dependencies, ...func2.dependencies])];
        if (depUnion.length > 0) {
            score += (depIntersection.length / depUnion.length) * 30;
        }
        return Math.round(score);
    }
    findCommonFunctionality(func1, func2) {
        const common = [];
        common.push(...func1.keywords.filter(k => func2.keywords.includes(k)));
        return [...new Set(common)];
    }
    findDifferences(func1, func2) {
        const differences = [];
        differences.push(...func1.keywords.filter(k => !func2.keywords.includes(k)));
        return differences;
    }
    calculateRedundancyScore(pkg, similarPackages) {
        if (similarPackages.length === 0)
            return 0;
        const maxSimilarity = Math.max(...similarPackages.map(p => p.similarityScore));
        const countMultiplier = Math.min(similarPackages.length * 10, 30);
        return Math.min(maxSimilarity + countMultiplier, 100);
    }
    generateConsolidationCandidates(pkg, similarPackages) {
        const candidates = [];
        for (const similar of similarPackages.slice(0, 3)) {
            if (similar.similarityScore < 50)
                continue;
            candidates.push({
                targetPackage: similar.name,
                similarityScore: similar.similarityScore,
                reason: `High similarity (${similar.similarityScore}%) with overlapping functionality`,
                effort: similar.similarityScore > 80 ? 'low' : 'medium',
                benefits: ['Reduced code duplication', 'Simplified maintenance'],
                risks: ['Breaking changes for consumers', 'Migration effort required']
            });
        }
        return candidates;
    }
    determineRecommendedAction(pkg, redundancyScore, candidates) {
        if (redundancyScore > 80 && candidates.length > 0) {
            return {
                action: 'merge',
                target: candidates[0].targetPackage,
                priority: 'high',
                estimatedEffort: '1-2 weeks',
                description: `Merge into ${candidates[0].targetPackage} due to high redundancy (${redundancyScore}%)`
            };
        }
        if (redundancyScore > 60) {
            return {
                action: 'absorb',
                target: candidates[0]?.targetPackage,
                priority: 'medium',
                estimatedEffort: '3-7 days',
                description: `Consider absorbing functionality into ${candidates[0]?.targetPackage || 'a related package'}`
            };
        }
        return {
            action: 'keep',
            priority: 'low',
            estimatedEffort: '0 days',
            description: 'Package has unique functionality and should be kept'
        };
    }
    async analyzeApplicationLayer() {
        console.log('Analyzing application layer...');
        const results = [];
        for (const app of this.apps) {
            results.push({
                applicationName: app.name,
                applicationPath: app.path,
                routes: [], // Simplified for now
                middleware: [],
                services: [],
                authMethods: [],
                databaseAccess: [],
                redundancyWithOtherApps: [],
                consolidationRecommendation: {
                    action: 'keep_separate',
                    reasoning: 'Analysis not yet implemented',
                    benefits: [],
                    challenges: [],
                    estimatedEffort: '0 days',
                    priority: 'low'
                }
            });
        }
        return results;
    }
    async analyzeUIPackages() {
        console.log('Analyzing UI packages...');
        const results = [];
        const uiPackages = this.packages.filter(pkg => pkg.name.includes('ui') ||
            pkg.name.includes('component') ||
            pkg.name.includes('frontend'));
        for (const pkg of uiPackages) {
            results.push({
                packageName: pkg.name,
                packagePath: pkg.path,
                components: [], // Simplified for now
                styles: [],
                utilities: [],
                dependencies: [],
                redundancyWithOtherUI: [],
                consolidationRecommendation: {
                    action: 'keep_separate',
                    reasoning: 'Analysis not yet implemented',
                    benefits: [],
                    challenges: [],
                    estimatedEffort: '0 days',
                    priority: 'low'
                }
            });
        }
        return results;
    }
    async analyzeDatabaseLayer() {
        console.log('Analyzing database layer...');
        const results = [];
        const dbPackages = this.packages.filter(pkg => pkg.name.includes('database') ||
            pkg.name.includes('db') ||
            pkg.name.includes('prisma'));
        for (const pkg of dbPackages) {
            results.push({
                packageName: pkg.name,
                packagePath: pkg.path,
                schemas: [], // Simplified for now
                models: [],
                accessPatterns: [],
                migrations: [],
                redundancyWithOtherDB: [],
                consolidationRecommendation: {
                    action: 'keep_separate',
                    reasoning: 'Analysis not yet implemented',
                    benefits: [],
                    challenges: [],
                    estimatedEffort: '0 days',
                    priority: 'low'
                }
            });
        }
        return results;
    }
    generateOverallRecommendations(packageRedundancy, applicationLayer, uiPackages, databaseLayer) {
        const recommendations = [];
        // Package consolidation recommendations
        const highRedundancyPackages = packageRedundancy.filter(p => p.redundancyScore > 70);
        if (highRedundancyPackages.length > 0) {
            recommendations.push({
                category: 'package',
                priority: 'critical',
                title: 'Consolidate highly redundant packages',
                description: `${highRedundancyPackages.length} packages have high redundancy scores and should be consolidated`,
                benefits: ['Reduced codebase complexity', 'Easier maintenance', 'Smaller bundle sizes'],
                estimatedEffort: '2-4 weeks',
                dependencies: ['Package dependency analysis', 'Consumer impact assessment']
            });
        }
        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
    generateConsolidationPlan(packageRedundancy, applicationLayer, uiPackages, databaseLayer) {
        const phases = [];
        // Phase 1: Package consolidation
        const packageTasks = [];
        const mergeCandidates = packageRedundancy.filter(p => p.recommendedAction.action === 'merge');
        for (const candidate of mergeCandidates) {
            packageTasks.push({
                name: `Merge ${candidate.packageName} into ${candidate.recommendedAction.target}`,
                type: 'merge',
                source: candidate.packageName,
                target: candidate.recommendedAction.target,
                description: candidate.recommendedAction.description,
                estimatedEffort: candidate.recommendedAction.estimatedEffort,
                prerequisites: ['Dependency analysis', 'Consumer notification']
            });
        }
        if (packageTasks.length > 0) {
            phases.push({
                name: 'Package Consolidation',
                order: 1,
                tasks: packageTasks,
                estimatedDuration: '2-4 weeks',
                dependencies: []
            });
        }
        const totalEstimatedEffort = phases.length > 0 ? '2-4 weeks' : '0 weeks';
        const expectedBenefits = [
            'Reduced maintenance overhead',
            'Simplified dependency management',
            'Improved code consistency'
        ];
        const risks = phases.length > 0 ? [
            'Breaking changes for package consumers',
            'Temporary development velocity reduction'
        ] : [];
        return {
            phases,
            totalEstimatedEffort,
            expectedBenefits,
            risks
        };
    }
}
exports.ArchitectureAnalyzer = ArchitectureAnalyzer;
//# sourceMappingURL=ArchitectureAnalyzer.js.map
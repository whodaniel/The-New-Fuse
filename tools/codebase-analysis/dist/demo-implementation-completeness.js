#!/usr/bin/env node
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
exports.demoImplementationCompleteness = demoImplementationCompleteness;
const index_1 = require("./index");
const path = __importStar(require("path"));
async function demoImplementationCompleteness() {
    console.log('🔍 Implementation Completeness Analysis Demo');
    console.log('==========================================\n');
    try {
        // Initialize analyzer with project root
        const projectRoot = path.resolve(__dirname, '../../..');
        const analyzer = new index_1.CodebaseAnalyzer(projectRoot);
        // Run comprehensive analysis including implementation completeness
        const result = await analyzer.analyzeCodebase(false, // includeArchitecture
        false, // includeScripts
        false, // includeBuildSystem
        true // includeImplementationCompleteness
        );
        const completenessAnalysis = result.implementationCompletenessAnalysis;
        if (!completenessAnalysis) {
            console.log('❌ Implementation completeness analysis not available');
            return;
        }
        // Display summary metrics
        console.log('📊 IMPLEMENTATION COMPLETENESS METRICS');
        console.log('=====================================');
        console.log(`Overall Completeness Score: ${completenessAnalysis.completenessMetrics.overallCompletenessScore}%`);
        console.log(`Code Quality Score: ${completenessAnalysis.completenessMetrics.qualityScore}%`);
        console.log(`Performance Score: ${completenessAnalysis.completenessMetrics.performanceScore}%`);
        console.log(`Specification Alignment Score: ${completenessAnalysis.completenessMetrics.alignmentScore}%`);
        console.log(`Total Features: ${completenessAnalysis.completenessMetrics.totalFeatures}`);
        console.log(`Implemented Features: ${completenessAnalysis.completenessMetrics.implementedFeatures}`);
        console.log(`Missing Features: ${completenessAnalysis.completenessMetrics.missingFeatures}`);
        console.log(`Unspecified Implementations: ${completenessAnalysis.completenessMetrics.unspecifiedImplementations}\n`);
        // Display specification alignment
        console.log('📋 SPECIFICATION ALIGNMENT');
        console.log('==========================');
        console.log(`Features specified but not implemented: ${completenessAnalysis.specificationAlignment.specifiedButNotImplemented.length}`);
        console.log(`Features implemented but not specified: ${completenessAnalysis.specificationAlignment.implementedButNotSpecified.length}`);
        console.log(`Aligned features: ${completenessAnalysis.specificationAlignment.alignedFeatures.length}\n`);
        // Display top missing implementations
        if (completenessAnalysis.specificationAlignment.specifiedButNotImplemented.length > 0) {
            console.log('🚫 TOP MISSING IMPLEMENTATIONS');
            console.log('==============================');
            completenessAnalysis.specificationAlignment.specifiedButNotImplemented
                .slice(0, 5)
                .forEach((missing, index) => {
                console.log(`${index + 1}. ${missing.feature.title}`);
                console.log(`   Category: ${missing.feature.category}`);
                console.log(`   Implementation Score: ${missing.implementationScore}%`);
                console.log(`   Gaps: ${missing.gaps.join(', ')}\n`);
            });
        }
        // Display code quality issues
        console.log('🔧 CODE QUALITY SUMMARY');
        console.log('=======================');
        console.log(`Code Duplications: ${completenessAnalysis.codeQuality.duplications.length}`);
        console.log(`Complex Functions: ${completenessAnalysis.codeQuality.complexFunctions.length}`);
        console.log(`Pattern Inconsistencies: ${completenessAnalysis.codeQuality.patternInconsistencies.length}`);
        console.log(`Maintainability Index: ${completenessAnalysis.codeQuality.qualityMetrics.maintainabilityIndex}`);
        console.log(`Technical Debt: ${completenessAnalysis.codeQuality.qualityMetrics.technicalDebt}`);
        console.log(`Test Coverage: ${completenessAnalysis.codeQuality.qualityMetrics.testCoverage}%\n`);
        // Display performance bottlenecks
        console.log('⚡ PERFORMANCE BOTTLENECKS');
        console.log('=========================');
        console.log(`Database Query Issues: ${completenessAnalysis.performanceBottlenecks.databaseQueryIssues.length}`);
        console.log(`Memory Leak Risks: ${completenessAnalysis.performanceBottlenecks.memoryLeakRisks.length}`);
        console.log(`Synchronous Operations: ${completenessAnalysis.performanceBottlenecks.synchronousOperations.length}`);
        console.log(`Scalability Issues: ${completenessAnalysis.performanceBottlenecks.scalabilityIssues.length}\n`);
        // Display top implementation gaps
        if (completenessAnalysis.implementationGaps.length > 0) {
            console.log('📝 TOP IMPLEMENTATION GAPS');
            console.log('==========================');
            completenessAnalysis.implementationGaps
                .slice(0, 5)
                .forEach((gap, index) => {
                console.log(`${index + 1}. ${gap.feature}`);
                console.log(`   Priority: ${gap.priority.toUpperCase()}`);
                console.log(`   Estimated Effort: ${gap.estimatedEffort}`);
                console.log(`   Implementation Exists: ${gap.implementationExists ? 'Yes' : 'No'}`);
                console.log(`   Implementation Complete: ${gap.implementationComplete ? 'Yes' : 'No'}`);
                if (gap.blockers.length > 0) {
                    console.log(`   Blockers: ${gap.blockers.join(', ')}`);
                }
                console.log('');
            });
        }
        // Display prioritized recommendations
        console.log('🎯 PRIORITIZED RECOMMENDATIONS');
        console.log('==============================');
        completenessAnalysis.prioritizedRecommendations
            .slice(0, 10)
            .forEach((rec, index) => {
            console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.recommendation}`);
            console.log(`   Category: ${rec.category}`);
            console.log(`   Effort: ${rec.effort}`);
            console.log(`   Impact: ${rec.impact}\n`);
        });
        console.log('✅ Implementation completeness analysis complete!');
    }
    catch (error) {
        console.error('❌ Error during analysis:', error);
        process.exit(1);
    }
}
// Run the demo if this file is executed directly
if (require.main === module) {
    demoImplementationCompleteness();
}
//# sourceMappingURL=demo-implementation-completeness.js.map
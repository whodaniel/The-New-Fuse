#!/usr/bin/env node

import { CodebaseAnalyzer } from './index';
import * as path from 'path';

async function demoImplementationCompleteness() {
  console.log('🔍 Implementation Completeness Analysis Demo');
  console.log('==========================================\n');

  try {
    // Initialize analyzer with project root
    const projectRoot = path.resolve(__dirname, '../../..');
    const analyzer = new CodebaseAnalyzer(projectRoot);

    // Run comprehensive analysis including implementation completeness
    const result = await analyzer.analyzeCodebase(
      false, // includeArchitecture
      false, // includeScripts
      false, // includeBuildSystem
      true   // includeImplementationCompleteness
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
        .forEach((missing: any, index: number) => {
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
        .forEach((gap: any, index: number) => {
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
      .forEach((rec: any, index: number) => {
        console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.recommendation}`);
        console.log(`   Category: ${rec.category}`);
        console.log(`   Effort: ${rec.effort}`);
        console.log(`   Impact: ${rec.impact}\n`);
      });

    console.log('✅ Implementation completeness analysis complete!');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demoImplementationCompleteness();
}

export { demoImplementationCompleteness };
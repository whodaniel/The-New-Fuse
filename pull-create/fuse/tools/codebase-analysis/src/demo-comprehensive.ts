#!/usr/bin/env node

import { CodebaseAnalyzer } from './index';

async function main() {
  console.log('🔍 Comprehensive Codebase Analysis Demo');
  console.log('=======================================\n');

  try {
    const rootPath = process.cwd();
    console.log(`Analyzing codebase at: ${rootPath}\n`);

    // Create analyzer and run comprehensive analysis
    const analyzer = new CodebaseAnalyzer(rootPath);
    const result = await analyzer.analyzeCodebase(
      true,  // includeArchitecture
      true,  // includeScripts
      true,  // includeBuildSystem
      true,  // includeImplementationCompleteness
      true,  // includeTestCoverage
      true   // includeDocumentationAlignment
    );

    // Display comprehensive summary
    console.log('📊 Comprehensive Analysis Summary');
    console.log('=================================');
    console.log(`Total Packages: ${result.summary.totalPackages}`);
    console.log(`Total Files: ${result.summary.totalFiles}`);
    console.log(`Functional Packages: ${result.summary.functionalPackages}`);
    console.log(`Stub Packages: ${result.summary.stubPackages}`);
    console.log(`Broken Packages: ${result.summary.brokenPackages}`);
    console.log(`Overall Completeness: ${result.summary.overallCompleteness}%\n`);

    // Architecture Analysis
    if (result.architectureAnalysis) {
      console.log('🏗️  Architecture Analysis');
      console.log('========================');
      console.log(`Architecture Score: ${result.architectureAnalysis.overallScore || 'N/A'}%`);
      console.log(`Patterns Detected: ${result.architectureAnalysis.patterns?.length || 0}`);
      console.log(`Anti-patterns: ${result.architectureAnalysis.antiPatterns?.length || 0}`);
      console.log(`Recommendations: ${result.architectureAnalysis.recommendations?.length || 0}\n`);
    }

    // Script Analysis
    if (result.scriptAnalysis) {
      console.log('📜 Script Analysis');
      console.log('==================');
      console.log(`Total Scripts: ${result.summary.totalScripts}`);
      console.log(`Redundant Scripts: ${result.summary.redundantScripts}`);
      console.log(`Consolidation Opportunities: ${result.scriptAnalysis.redundantGroups.length}\n`);
    }

    // Build System Analysis
    if (result.buildSystemAnalysis) {
      console.log('🔧 Build System Analysis');
      console.log('========================');
      console.log(`Build System Score: ${result.summary.buildSystemScore || 'N/A'}%`);
      console.log(`Configuration Issues: ${result.buildSystemAnalysis.issues?.length || 0}`);
      console.log(`Optimization Opportunities: ${result.buildSystemAnalysis.optimizations?.length || 0}\n`);
    }

    // Implementation Completeness
    if (result.implementationCompletenessAnalysis) {
      console.log('✅ Implementation Completeness');
      console.log('==============================');
      console.log(`Completeness Score: ${result.summary.implementationCompletenessScore || 'N/A'}%`);
      console.log(`Quality Score: ${result.summary.qualityScore || 'N/A'}%`);
      console.log(`Performance Score: ${result.summary.performanceScore || 'N/A'}%`);
      console.log(`Implementation Gaps: ${result.implementationCompletenessAnalysis.gaps?.length || 0}\n`);
    }

    // Test Coverage Analysis
    if (result.testCoverageAnalysis) {
      console.log('🧪 Test Coverage Analysis');
      console.log('=========================');
      console.log(`Test Coverage: ${result.summary.testCoveragePercentage || 0}%`);
      console.log(`Total Test Files: ${result.summary.totalTestFiles || 0}`);
      console.log(`Tested Components: ${result.testCoverageAnalysis.testedComponents || 0}`);
      console.log(`Untested Components: ${result.testCoverageAnalysis.untestedComponents || 0}`);
      console.log(`Missing Tests: ${result.testCoverageAnalysis.coverageGaps?.missingTests?.length || 0}\n`);
    }

    // Documentation Alignment Analysis
    if (result.documentationAlignmentAnalysis) {
      console.log('📚 Documentation Alignment');
      console.log('==========================');
      console.log(`Documentation Coverage: ${result.summary.documentationCoverage || 0}%`);
      console.log(`Total Documentation Files: ${result.summary.totalDocumentationFiles || 0}`);
      console.log(`Documented Components: ${result.documentationAlignmentAnalysis.documentedComponents || 0}`);
      console.log(`Undocumented Components: ${result.documentationAlignmentAnalysis.undocumentedComponents || 0}`);
      console.log(`Documentation Issues: ${result.documentationAlignmentAnalysis.issues?.length || 0}\n`);
    }

    // Dependency Analysis
    console.log('🔗 Dependency Analysis');
    console.log('======================');
    console.log(`Circular Dependencies: ${result.summary.circularDependencies}`);
    console.log(`Version Conflicts: ${result.summary.versionConflicts}`);
    if (result.dependencyGraph.circularDependencies.length > 0) {
      console.log('Circular Dependencies:');
      result.dependencyGraph.circularDependencies.slice(0, 3).forEach((cycle: any, index: number) => {
        console.log(`  ${index + 1}. ${cycle.join(' → ')}`);
      });
    }
    console.log();

    // Overall Health Score
    const healthMetrics = {
      completeness: result.summary.overallCompleteness || 0,
      testCoverage: result.summary.testCoveragePercentage || 0,
      documentationCoverage: result.summary.documentationCoverage || 0,
      buildSystemScore: result.summary.buildSystemScore || 0,
      qualityScore: result.summary.qualityScore || 0,
      performanceScore: result.summary.performanceScore || 0
    };

    const validScores = Object.values(healthMetrics).filter(score => score > 0 && !isNaN(score));
    const overallHealthScore = validScores.length > 0 ? 
      Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : 0;

    console.log('🎯 Overall Codebase Health');
    console.log('==========================');
    console.log(`Overall Health Score: ${overallHealthScore}%`);
    
    if (overallHealthScore >= 90) {
      console.log('🟢 Excellent - Codebase is in great shape!');
    } else if (overallHealthScore >= 75) {
      console.log('🟡 Good - Some areas for improvement');
    } else if (overallHealthScore >= 50) {
      console.log('🟠 Fair - Significant improvements needed');
    } else {
      console.log('🔴 Poor - Major refactoring required');
    }
    console.log();

    // Top Recommendations
    const allRecommendations: string[] = [];
    
    if (result.architectureAnalysis?.recommendations) {
      allRecommendations.push(...result.architectureAnalysis.recommendations);
    }
    if (result.implementationCompletenessAnalysis?.recommendations) {
      allRecommendations.push(...result.implementationCompletenessAnalysis.recommendations);
    }
    if (result.testCoverageAnalysis?.recommendations) {
      allRecommendations.push(...result.testCoverageAnalysis.recommendations);
    }
    if (result.documentationAlignmentAnalysis?.recommendations) {
      allRecommendations.push(...result.documentationAlignmentAnalysis.recommendations);
    }

    if (allRecommendations.length > 0) {
      console.log('💡 Top Recommendations');
      console.log('======================');
      allRecommendations.slice(0, 10).forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      if (allRecommendations.length > 10) {
        console.log(`... and ${allRecommendations.length - 10} more recommendations`);
      }
      console.log();
    }

    console.log('🎉 Comprehensive Analysis Complete!');
    console.log(`Analyzed ${result.summary.totalPackages} packages with ${result.summary.totalFiles} files`);
    console.log(`Health Score: ${overallHealthScore}% | Completeness: ${result.summary.overallCompleteness}%`);

  } catch (error) {
    console.error('❌ Error during comprehensive analysis:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main };
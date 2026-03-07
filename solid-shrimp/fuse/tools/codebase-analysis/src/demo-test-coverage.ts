#!/usr/bin/env node

import { TestCoverageAnalyzer } from './analyzer/TestCoverageAnalyzer';
import { FileSystemScanner } from './scanner/FileSystemScanner';

async function main() {
  console.log('🧪 Test Coverage Analysis Demo');
  console.log('================================\n');

  try {
    const rootPath = process.cwd();
    console.log(`Analyzing codebase at: ${rootPath}\n`);

    // First scan the file system to get packages
    const scanner = new FileSystemScanner(rootPath);
    const fileSystemMap = await scanner.scanFileSystem();
    const allPackages = [...fileSystemMap.packages, ...fileSystemMap.apps];

    // Create and run the test coverage analyzer
    const analyzer = new TestCoverageAnalyzer(allPackages, rootPath);
    const report = await analyzer.analyzeTestCoverage();

    // Display results
    console.log('📊 Test Coverage Summary');
    console.log('========================');
    console.log(`Total Source Files: ${report.totalSourceFiles}`);
    console.log(`Total Test Files: ${report.totalTestFiles}`);
    console.log(`Tested Components: ${report.testedComponents}`);
    console.log(`Untested Components: ${report.untestedComponents}`);
    console.log(`Coverage Percentage: ${report.coveragePercentage}%\n`);

    console.log('🧪 Test Framework Distribution');
    console.log('==============================');
    console.log(`Jest: ${report.testsByFramework.jest}`);
    console.log(`Vitest: ${report.testsByFramework.vitest}`);
    console.log(`Mocha: ${report.testsByFramework.mocha}`);
    console.log(`Unknown: ${report.testsByFramework.unknown}\n`);

    console.log('📝 Test Type Distribution');
    console.log('=========================');
    console.log(`Unit Tests: ${report.testsByType.unit}`);
    console.log(`Integration Tests: ${report.testsByType.integration}`);
    console.log(`E2E Tests: ${report.testsByType.e2e}`);
    console.log(`Spec Tests: ${report.testsByType.spec}`);
    console.log(`Unknown Type: ${report.testsByType.unknown}\n`);

    console.log('⭐ Test Quality Distribution');
    console.log('============================');
    console.log(`Excellent: ${report.testQualityDistribution.excellent}`);
    console.log(`Good: ${report.testQualityDistribution.good}`);
    console.log(`Fair: ${report.testQualityDistribution.fair}`);
    console.log(`Poor: ${report.testQualityDistribution.poor}`);
    console.log(`None: ${report.testQualityDistribution.none}\n`);

    console.log('🚨 Coverage Gaps');
    console.log('================');
    console.log(`Missing Tests: ${report.coverageGaps.missingTests.length}`);
    console.log(`Inadequate Tests: ${report.coverageGaps.inadequateTests.length}`);
    console.log(`Orphaned Tests: ${report.coverageGaps.orphanedTests.length}\n`);

    if (report.coverageGaps.missingTests.length > 0) {
      console.log('📋 Files Missing Tests (first 10):');
      report.coverageGaps.missingTests.slice(0, 10).forEach(file => {
        console.log(`  - ${file}`);
      });
      if (report.coverageGaps.missingTests.length > 10) {
        console.log(`  ... and ${report.coverageGaps.missingTests.length - 10} more`);
      }
      console.log();
    }

    if (report.coverageGaps.inadequateTests.length > 0) {
      console.log('⚠️  Files with Inadequate Tests (first 10):');
      report.coverageGaps.inadequateTests.slice(0, 10).forEach(file => {
        console.log(`  - ${file}`);
      });
      if (report.coverageGaps.inadequateTests.length > 10) {
        console.log(`  ... and ${report.coverageGaps.inadequateTests.length - 10} more`);
      }
      console.log();
    }

    console.log('💡 Recommendations');
    console.log('==================');
    if (report.recommendations.length === 0) {
      console.log('✅ No specific recommendations - test coverage looks good!');
    } else {
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    console.log();

    // Show some detailed test file examples
    if (report.testFiles.length > 0) {
      console.log('📁 Sample Test Files');
      console.log('====================');
      report.testFiles.slice(0, 5).forEach(test => {
        console.log(`📄 ${test.name}`);
        console.log(`   Path: ${test.path}`);
        console.log(`   Type: ${test.type}`);
        console.log(`   Framework: ${test.framework}`);
        console.log(`   Test Count: ${test.testCount}`);
        console.log(`   Has Describe: ${test.hasDescribe}`);
        console.log(`   Has Mocks: ${test.hasMocks}`);
        if (test.sourceFile) {
          console.log(`   Source File: ${test.sourceFile}`);
        }
        console.log();
      });
    }

    // Show component mappings with good coverage
    const wellTestedComponents = report.componentMappings
      .filter(m => m.testQuality === 'excellent' || m.testQuality === 'good')
      .slice(0, 5);

    if (wellTestedComponents.length > 0) {
      console.log('✅ Well-Tested Components');
      console.log('=========================');
      wellTestedComponents.forEach(mapping => {
        console.log(`📦 ${mapping.sourceFile}`);
        console.log(`   Quality: ${mapping.testQuality}`);
        console.log(`   Coverage Gap: ${mapping.coverageGap}`);
        console.log(`   Test Files: ${mapping.testFiles.length}`);
        mapping.testFiles.forEach(test => {
          console.log(`     - ${test.name} (${test.testCount} tests)`);
        });
        console.log();
      });
    }

    console.log('🎯 Analysis Complete!');
    console.log(`Found ${report.totalTestFiles} test files covering ${report.testedComponents}/${report.totalSourceFiles} source files`);

  } catch (error) {
    console.error('❌ Error during test coverage analysis:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main };
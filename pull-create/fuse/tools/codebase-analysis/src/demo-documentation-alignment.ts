#!/usr/bin/env node

import { DocumentationAlignmentAnalyzer } from './analyzer/DocumentationAlignmentAnalyzer';
import { FileSystemScanner } from './scanner/FileSystemScanner';

async function main() {
  console.log('📚 Documentation Alignment Analysis Demo');
  console.log('========================================\n');

  try {
    const rootPath = process.cwd();
    console.log(`Analyzing codebase at: ${rootPath}\n`);

    // First scan the file system to get packages
    const scanner = new FileSystemScanner(rootPath);
    const fileSystemMap = await scanner.scanFileSystem();
    const allPackages = [...fileSystemMap.packages, ...fileSystemMap.apps];

    // Create and run the documentation alignment analyzer
    const analyzer = new DocumentationAlignmentAnalyzer(allPackages, rootPath);
    const report = await analyzer.analyzeDocumentationAlignment();

    // Display results
    console.log('📊 Documentation Alignment Summary');
    console.log('==================================');
    console.log(`Total Documentation Files: ${report.totalDocumentationFiles}`);
    console.log(`Total Source Files: ${report.totalSourceFiles}`);
    console.log(`Documented Components: ${report.documentedComponents}`);
    console.log(`Undocumented Components: ${report.undocumentedComponents}`);
    console.log(`Documentation Coverage: ${report.documentationCoverage}%\n`);

    console.log('📝 Documentation Type Distribution');
    console.log('==================================');
    console.log(`README Files: ${report.documentationByType.readme}`);
    console.log(`API Documentation: ${report.documentationByType.api}`);
    console.log(`Inline Documentation: ${report.documentationByType.inline}`);
    console.log(`Specifications: ${report.documentationByType.spec}`);
    console.log(`Guides: ${report.documentationByType.guide}`);
    console.log(`Changelogs: ${report.documentationByType.changelog}`);
    console.log(`Unknown Type: ${report.documentationByType.unknown}\n`);

    console.log('⭐ Alignment Quality Distribution');
    console.log('=================================');
    console.log(`Excellent: ${report.alignmentDistribution.excellent}`);
    console.log(`Good: ${report.alignmentDistribution.good}`);
    console.log(`Fair: ${report.alignmentDistribution.fair}`);
    console.log(`Poor: ${report.alignmentDistribution.poor}`);
    console.log(`Missing: ${report.alignmentDistribution.missing}\n`);

    console.log('🚨 Documentation Issues');
    console.log('=======================');
    const issuesBySeverity = {
      critical: report.issues.filter(i => i.severity === 'critical').length,
      high: report.issues.filter(i => i.severity === 'high').length,
      medium: report.issues.filter(i => i.severity === 'medium').length,
      low: report.issues.filter(i => i.severity === 'low').length
    };
    
    console.log(`Critical Issues: ${issuesBySeverity.critical}`);
    console.log(`High Priority Issues: ${issuesBySeverity.high}`);
    console.log(`Medium Priority Issues: ${issuesBySeverity.medium}`);
    console.log(`Low Priority Issues: ${issuesBySeverity.low}`);
    console.log(`Total Issues: ${report.issues.length}\n`);

    console.log('📋 Documentation Gaps');
    console.log('=====================');
    console.log(`Undocumented Files: ${report.gaps.undocumentedFiles.length}`);
    console.log(`Outdated Documentation: ${report.gaps.outdatedDocumentation.length}`);
    console.log(`Orphaned Documentation: ${report.gaps.orphanedDocumentation.length}`);
    console.log(`Broken Code Examples: ${report.gaps.brokenCodeExamples.length}\n`);

    if (report.gaps.undocumentedFiles.length > 0) {
      console.log('📄 Undocumented Files (first 10):');
      report.gaps.undocumentedFiles.slice(0, 10).forEach(file => {
        console.log(`  - ${file}`);
      });
      if (report.gaps.undocumentedFiles.length > 10) {
        console.log(`  ... and ${report.gaps.undocumentedFiles.length - 10} more`);
      }
      console.log();
    }

    if (report.gaps.outdatedDocumentation.length > 0) {
      console.log('⏰ Outdated Documentation (first 10):');
      report.gaps.outdatedDocumentation.slice(0, 10).forEach(file => {
        console.log(`  - ${file}`);
      });
      if (report.gaps.outdatedDocumentation.length > 10) {
        console.log(`  ... and ${report.gaps.outdatedDocumentation.length - 10} more`);
      }
      console.log();
    }

    if (report.gaps.brokenCodeExamples.length > 0) {
      console.log('💥 Files with Broken Code Examples:');
      report.gaps.brokenCodeExamples.forEach(file => {
        console.log(`  - ${file}`);
      });
      console.log();
    }

    console.log('💡 Recommendations');
    console.log('==================');
    if (report.recommendations.length === 0) {
      console.log('✅ No specific recommendations - documentation alignment looks good!');
    } else {
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    console.log();

    // Show some sample documentation files
    if (report.documentationFiles.length > 0) {
      console.log('📁 Sample Documentation Files');
      console.log('=============================');
      report.documentationFiles.slice(0, 5).forEach(doc => {
        console.log(`📄 ${doc.name}`);
        console.log(`   Path: ${doc.path}`);
        console.log(`   Type: ${doc.type}`);
        console.log(`   Format: ${doc.format}`);
        console.log(`   Size: ${doc.size} bytes`);
        console.log(`   Sections: ${doc.sections.length}`);
        console.log(`   Code Examples: ${doc.codeExamples.length}`);
        console.log(`   References: ${doc.references.length}`);
        console.log(`   Last Modified: ${doc.lastModified.toISOString().split('T')[0]}`);
        console.log();
      });
    }

    // Show alignment examples
    const wellAlignedComponents = report.alignments
      .filter(a => a.alignmentStatus === 'excellent' || a.alignmentStatus === 'good')
      .slice(0, 5);

    if (wellAlignedComponents.length > 0) {
      console.log('✅ Well-Documented Components');
      console.log('=============================');
      wellAlignedComponents.forEach(alignment => {
        console.log(`📦 ${alignment.sourceFile}`);
        console.log(`   Documentation: ${alignment.documentationFile}`);
        console.log(`   Alignment Score: ${alignment.alignmentScore}%`);
        console.log(`   Status: ${alignment.alignmentStatus}`);
        console.log(`   Issues: ${alignment.issues.length}`);
        if (alignment.issues.length > 0) {
          alignment.issues.slice(0, 3).forEach(issue => {
            console.log(`     - ${issue.type}: ${issue.description}`);
          });
        }
        console.log();
      });
    }

    // Show critical issues
    const criticalIssues = report.issues.filter(i => i.severity === 'critical' || i.severity === 'high').slice(0, 10);
    if (criticalIssues.length > 0) {
      console.log('🚨 Critical & High Priority Issues');
      console.log('==================================');
      criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
        console.log(`   ${issue.description}`);
        if (issue.location) {
          console.log(`   Location: ${issue.location.file}${issue.location.line ? `:${issue.location.line}` : ''}`);
        }
        if (issue.suggestedFix) {
          console.log(`   Suggested Fix: ${issue.suggestedFix}`);
        }
        console.log();
      });
    }

    console.log('🎯 Analysis Complete!');
    console.log(`Found ${report.totalDocumentationFiles} documentation files with ${report.documentationCoverage}% coverage of ${report.totalSourceFiles} source files`);

  } catch (error) {
    console.error('❌ Error during documentation alignment analysis:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main };
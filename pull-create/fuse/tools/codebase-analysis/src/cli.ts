#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';
import { CodebaseAnalyzer } from './index';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    console.log(`
Codebase Analysis Tool

Usage:
  npm run scan [path]     - Scan and analyze codebase
  npm run analyze [path]  - Full analysis with reports
  
Options:
  path                    - Root path to analyze (default: current directory)
    `);
    return;
  }

  const rootPath = args[1] || process.cwd();
  const analyzer = new CodebaseAnalyzer(rootPath);

  try {
    switch (command) {
      case 'scan':
        await runScan(analyzer, rootPath);
        break;
      case 'analyze':
        await runFullAnalysis(analyzer, rootPath);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

async function runScan(analyzer: CodebaseAnalyzer, rootPath: string) {
  console.log(`Scanning codebase at: ${rootPath}`);
  
  const result = await analyzer.analyzeCodebase();
  
  console.log('\n=== SCAN RESULTS ===');
  console.log(`Total packages: ${result.summary.totalPackages}`);
  console.log(`Total files: ${result.summary.totalFiles}`);
  console.log(`Functional packages: ${result.summary.functionalPackages}`);
  console.log(`Stub packages: ${result.summary.stubPackages}`);
  console.log(`Broken packages: ${result.summary.brokenPackages}`);
  console.log(`Overall completeness: ${result.summary.overallCompleteness}%`);
  console.log(`Circular dependencies: ${result.summary.circularDependencies}`);
  console.log(`Version conflicts: ${result.summary.versionConflicts}`);
}

async function runFullAnalysis(analyzer: CodebaseAnalyzer, rootPath: string) {
  console.log(`Running full analysis of codebase at: ${rootPath}`);
  
  const result = await analyzer.analyzeCodebase();
  
  // Create output directory
  const outputDir = path.join(rootPath, 'codebase-analysis-results');
  await fs.mkdir(outputDir, { recursive: true });
  
  // Write detailed reports
  await fs.writeFile(
    path.join(outputDir, 'file-system-map.json'),
    JSON.stringify(result.fileSystemMap, null, 2)
  );
  
  await fs.writeFile(
    path.join(outputDir, 'dependency-graph.json'),
    JSON.stringify(result.dependencyGraph, null, 2)
  );
  
  await fs.writeFile(
    path.join(outputDir, 'implementation-reports.json'),
    JSON.stringify(result.implementationReports, null, 2)
  );
  
  await fs.writeFile(
    path.join(outputDir, 'summary.json'),
    JSON.stringify(result.summary, null, 2)
  );
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(result);
  await fs.writeFile(
    path.join(outputDir, 'analysis-report.md'),
    markdownReport
  );
  
  console.log('\n=== ANALYSIS COMPLETE ===');
  console.log(`Results saved to: ${outputDir}`);
  console.log(`Summary: ${result.summary.overallCompleteness}% complete, ${result.summary.functionalPackages}/${result.summary.totalPackages} packages functional`);
}

function generateMarkdownReport(result: any): string {
  const { summary, dependencyGraph, implementationReports } = result;
  
  return `# Codebase Analysis Report

Generated: ${new Date().toISOString()}

## Executive Summary

- **Total Packages**: ${summary.totalPackages}
- **Total Files**: ${summary.totalFiles}
- **Overall Completeness**: ${summary.overallCompleteness}%
- **Functional Packages**: ${summary.functionalPackages}
- **Stub Packages**: ${summary.stubPackages}
- **Broken Packages**: ${summary.brokenPackages}

## Dependency Analysis

- **Circular Dependencies**: ${summary.circularDependencies}
- **Version Conflicts**: ${summary.versionConflicts}
- **Unused Dependencies**: ${dependencyGraph.unusedDependencies.length}
- **Missing Dependencies**: ${dependencyGraph.missingDependencies.length}

## Implementation Status

### Functional Packages
${implementationReports
  .filter((r: any) => r.overallStatus === 'functional')
  .map((r: any) => `- ${r.packageName} (${r.completenessScore}%)`)
  .join('\n')}

### Stub Packages (Need Implementation)
${implementationReports
  .filter((r: any) => r.overallStatus === 'stub')
  .map((r: any) => `- ${r.packageName} (${r.completenessScore}%)`)
  .join('\n')}

### Incomplete Packages
${implementationReports
  .filter((r: any) => r.overallStatus === 'incomplete')
  .map((r: any) => `- ${r.packageName} (${r.completenessScore}%)`)
  .join('\n')}

## Recommendations

### High Priority
${implementationReports
  .filter((r: any) => r.overallStatus === 'stub' || r.overallStatus === 'broken')
  .map((r: any) => `- **${r.packageName}**: ${r.recommendations.join(', ')}`)
  .join('\n')}

### Medium Priority
${implementationReports
  .filter((r: any) => r.overallStatus === 'incomplete')
  .map((r: any) => `- **${r.packageName}**: ${r.recommendations.join(', ')}`)
  .join('\n')}

## Circular Dependencies
${dependencyGraph.circularDependencies
  .map((cd: any) => `- ${cd.description} (${cd.severity})`)
  .join('\n')}

## Version Conflicts
${dependencyGraph.conflicts
  .map((conflict: any) => `- **${conflict.packageName}**: ${conflict.versions.map((v: any) => `${v.version} (${v.usedBy.join(', ')})`).join(' vs ')}`)
  .join('\n')}
`;
}

if (require.main === module) {
  main().catch(console.error);
}
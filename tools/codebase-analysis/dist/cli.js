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
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const index_1 = require("./index");
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
    const analyzer = new index_1.CodebaseAnalyzer(rootPath);
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
    }
    catch (error) {
        console.error('Analysis failed:', error);
        process.exit(1);
    }
}
async function runScan(analyzer, rootPath) {
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
async function runFullAnalysis(analyzer, rootPath) {
    console.log(`Running full analysis of codebase at: ${rootPath}`);
    const result = await analyzer.analyzeCodebase();
    // Create output directory
    const outputDir = path.join(rootPath, 'codebase-analysis-results');
    await fs.mkdir(outputDir, { recursive: true });
    // Write detailed reports
    await fs.writeFile(path.join(outputDir, 'file-system-map.json'), JSON.stringify(result.fileSystemMap, null, 2));
    await fs.writeFile(path.join(outputDir, 'dependency-graph.json'), JSON.stringify(result.dependencyGraph, null, 2));
    await fs.writeFile(path.join(outputDir, 'implementation-reports.json'), JSON.stringify(result.implementationReports, null, 2));
    await fs.writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(result.summary, null, 2));
    // Generate markdown report
    const markdownReport = generateMarkdownReport(result);
    await fs.writeFile(path.join(outputDir, 'analysis-report.md'), markdownReport);
    console.log('\n=== ANALYSIS COMPLETE ===');
    console.log(`Results saved to: ${outputDir}`);
    console.log(`Summary: ${result.summary.overallCompleteness}% complete, ${result.summary.functionalPackages}/${result.summary.totalPackages} packages functional`);
}
function generateMarkdownReport(result) {
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
        .filter((r) => r.overallStatus === 'functional')
        .map((r) => `- ${r.packageName} (${r.completenessScore}%)`)
        .join('\n')}

### Stub Packages (Need Implementation)
${implementationReports
        .filter((r) => r.overallStatus === 'stub')
        .map((r) => `- ${r.packageName} (${r.completenessScore}%)`)
        .join('\n')}

### Incomplete Packages
${implementationReports
        .filter((r) => r.overallStatus === 'incomplete')
        .map((r) => `- ${r.packageName} (${r.completenessScore}%)`)
        .join('\n')}

## Recommendations

### High Priority
${implementationReports
        .filter((r) => r.overallStatus === 'stub' || r.overallStatus === 'broken')
        .map((r) => `- **${r.packageName}**: ${r.recommendations.join(', ')}`)
        .join('\n')}

### Medium Priority
${implementationReports
        .filter((r) => r.overallStatus === 'incomplete')
        .map((r) => `- **${r.packageName}**: ${r.recommendations.join(', ')}`)
        .join('\n')}

## Circular Dependencies
${dependencyGraph.circularDependencies
        .map((cd) => `- ${cd.description} (${cd.severity})`)
        .join('\n')}

## Version Conflicts
${dependencyGraph.conflicts
        .map((conflict) => `- **${conflict.packageName}**: ${conflict.versions.map((v) => `${v.version} (${v.usedBy.join(', ')})`).join(' vs ')}`)
        .join('\n')}
`;
}
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=cli.js.map
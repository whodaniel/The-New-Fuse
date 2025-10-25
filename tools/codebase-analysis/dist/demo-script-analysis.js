#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScriptAnalysisDemo = runScriptAnalysisDemo;
const index_1 = require("./index");
async function runScriptAnalysisDemo() {
    console.log('🔍 Script Analysis Demo');
    console.log('='.repeat(50));
    try {
        const scriptAnalyzer = new index_1.ScriptAnalyzer();
        const buildSystemAnalyzer = new index_1.BuildSystemAnalyzer();
        console.log('\n📜 Analyzing shell scripts...');
        const scriptReport = await scriptAnalyzer.analyzeAllScripts();
        console.log('\n📊 Script Analysis Results:');
        console.log(`Total scripts found: ${scriptReport.totalScripts}`);
        console.log(`Scripts by purpose:`);
        for (const [purpose, scripts] of Object.entries(scriptReport.scriptsByPurpose)) {
            if (scripts.length > 0) {
                console.log(`  ${purpose}: ${scripts.length} scripts`);
                scripts.forEach((script) => {
                    console.log(`    - ${script.name} (${script.functionality.join(', ')})`);
                });
            }
        }
        console.log(`\n🔄 Redundant script groups: ${scriptReport.redundantGroups.length}`);
        scriptReport.redundantGroups.forEach((group, index) => {
            console.log(`  Group ${index + 1}: ${group.purpose} (${group.overlapScore}% overlap)`);
            console.log(`    Scripts: ${group.scripts.map((s) => s.name).join(', ')}`);
            console.log(`    Recommendation: ${group.recommendedAction}`);
        });
        console.log(`\n⚠️  Obsolete scripts: ${scriptReport.obsoleteScripts.length}`);
        scriptReport.obsoleteScripts.forEach((script) => {
            console.log(`  - ${script.name}: ${script.issues.map((i) => i.message).join(', ')}`);
        });
        console.log(`\n💡 Consolidation recommendations: ${scriptReport.recommendations.length}`);
        scriptReport.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec.description} (${rec.priority} priority)`);
            console.log(`     Impact: ${rec.impact}`);
            console.log(`     Effort: ${rec.effort}`);
        });
        console.log('\n🏗️  Analyzing build system...');
        const buildReport = await buildSystemAnalyzer.analyzeBuildSystem();
        console.log('\n📊 Build System Analysis Results:');
        console.log(`Monorepo tool: ${buildReport.monorepoConfig.tool}`);
        console.log(`Effectiveness score: ${buildReport.monorepoConfig.effectiveness.score}/100`);
        if (buildReport.monorepoConfig.effectiveness.issues.length > 0) {
            console.log('Issues:');
            buildReport.monorepoConfig.effectiveness.issues.forEach((issue) => {
                console.log(`  - ${issue}`);
            });
        }
        if (buildReport.monorepoConfig.effectiveness.strengths.length > 0) {
            console.log('Strengths:');
            buildReport.monorepoConfig.effectiveness.strengths.forEach((strength) => {
                console.log(`  - ${strength}`);
            });
        }
        console.log(`\nPackage scripts analyzed: ${buildReport.packageScripts.length}`);
        console.log(`Build configurations found: ${buildReport.buildConfigurations.length}`);
        console.log(`Redundant configurations: ${buildReport.redundantConfigurations.length}`);
        console.log(`Performance issues: ${buildReport.performanceIssues.length}`);
        console.log(`Optimization opportunities: ${buildReport.optimizationOpportunities.length}`);
        if (buildReport.recommendations.length > 0) {
            console.log('\n💡 Build System Recommendations:');
            buildReport.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
                console.log(`     Implementation: ${rec.implementation}`);
                console.log(`     Effort: ${rec.effort}`);
            });
        }
        // Enhanced redundancy detection
        console.log('\n🔍 Running enhanced redundancy detection...');
        const redundancyReport = await scriptAnalyzer.detectScriptRedundancy();
        console.log(`\nCommand pattern analysis: ${redundancyReport.commandPatternAnalysis.length} patterns found`);
        redundancyReport.commandPatternAnalysis.slice(0, 5).forEach((pattern, index) => {
            console.log(`  ${index + 1}. Pattern used in ${pattern.frequency} scripts (${Math.round(pattern.similarity * 100)}% similarity)`);
            console.log(`     Scripts: ${pattern.scripts.join(', ')}`);
        });
        console.log(`\nConsolidation opportunities: ${redundancyReport.consolidationOpportunities.length}`);
        redundancyReport.consolidationOpportunities.forEach((opp, index) => {
            console.log(`  ${index + 1}. ${opp.description}`);
            console.log(`     Potential savings: ${opp.potentialSavings.linesOfCode} lines of code`);
            console.log(`     Recommendation: ${opp.recommendation}`);
        });
    }
    catch (error) {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    }
}
// Run the demo
if (require.main === module) {
    runScriptAnalysisDemo().catch(console.error);
}
//# sourceMappingURL=demo-script-analysis.js.map
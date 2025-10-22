#!/usr/bin/env bun
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
async function main() {
    console.log('🔍 Starting Architecture Analysis Demo...\n');
    try {
        const analyzer = new index_1.CodebaseAnalyzer();
        // Run analysis with architecture analysis enabled
        const result = await analyzer.analyzeCodebase(true);
        if (result.architectureAnalysis) {
            console.log('📊 Architecture Analysis Results:');
            console.log('================================\n');
            // Package redundancy summary
            console.log('📦 Package Redundancy Analysis:');
            console.log(`- Total packages analyzed: ${result.architectureAnalysis.packageRedundancy.length}`);
            const highRedundancy = result.architectureAnalysis.packageRedundancy.filter((p) => p.redundancyScore > 70);
            const mediumRedundancy = result.architectureAnalysis.packageRedundancy.filter((p) => p.redundancyScore > 40 && p.redundancyScore <= 70);
            console.log(`- High redundancy packages (>70%): ${highRedundancy.length}`);
            console.log(`- Medium redundancy packages (40-70%): ${mediumRedundancy.length}`);
            if (highRedundancy.length > 0) {
                console.log('\n🚨 High Redundancy Packages:');
                for (const pkg of highRedundancy.slice(0, 5)) {
                    console.log(`  - ${pkg.packageName}: ${pkg.redundancyScore}% redundancy`);
                    console.log(`    Action: ${pkg.recommendedAction.action} (${pkg.recommendedAction.priority} priority)`);
                    if (pkg.consolidationCandidates.length > 0) {
                        console.log(`    Merge candidate: ${pkg.consolidationCandidates[0].targetPackage}`);
                    }
                }
            }
            // Application layer summary
            console.log(`\n🏗️ Application Layer Analysis:`);
            console.log(`- Applications analyzed: ${result.architectureAnalysis.applicationLayer.length}`);
            const appsToMerge = result.architectureAnalysis.applicationLayer.filter((app) => app.consolidationRecommendation.action === 'merge_into');
            if (appsToMerge.length > 0) {
                console.log(`- Applications recommended for merging: ${appsToMerge.length}`);
            }
            // UI packages summary
            console.log(`\n🎨 UI Package Analysis:`);
            console.log(`- UI packages analyzed: ${result.architectureAnalysis.uiPackages.length}`);
            // Database layer summary
            console.log(`\n🗄️ Database Layer Analysis:`);
            console.log(`- Database packages analyzed: ${result.architectureAnalysis.databaseLayer.length}`);
            // Overall recommendations
            console.log(`\n💡 Overall Recommendations:`);
            if (result.architectureAnalysis.overallRecommendations.length > 0) {
                for (const rec of result.architectureAnalysis.overallRecommendations.slice(0, 3)) {
                    console.log(`\n${rec.priority.toUpperCase()} PRIORITY: ${rec.title}`);
                    console.log(`Category: ${rec.category}`);
                    console.log(`Description: ${rec.description}`);
                    console.log(`Estimated effort: ${rec.estimatedEffort}`);
                    if (rec.benefits.length > 0) {
                        console.log(`Benefits: ${rec.benefits.slice(0, 2).join(', ')}`);
                    }
                }
            }
            else {
                console.log('- No critical recommendations found');
            }
            // Consolidation plan
            console.log(`\n📋 Consolidation Plan:`);
            if (result.architectureAnalysis.consolidationPlan.phases.length > 0) {
                console.log(`- Total phases: ${result.architectureAnalysis.consolidationPlan.phases.length}`);
                console.log(`- Total estimated effort: ${result.architectureAnalysis.consolidationPlan.totalEstimatedEffort}`);
                console.log(`- Expected benefits: ${result.architectureAnalysis.consolidationPlan.expectedBenefits.slice(0, 3).join(', ')}`);
                console.log('\nPhases:');
                for (const phase of result.architectureAnalysis.consolidationPlan.phases) {
                    console.log(`  ${phase.order}. ${phase.name} (${phase.estimatedDuration})`);
                    console.log(`     Tasks: ${phase.tasks.length}`);
                }
            }
            else {
                console.log('- No consolidation phases needed');
            }
        }
        else {
            console.log('❌ Architecture analysis was not performed');
        }
        console.log('\n✅ Architecture analysis complete!');
    }
    catch (error) {
        console.error('❌ Error during analysis:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=demo-architecture.js.map
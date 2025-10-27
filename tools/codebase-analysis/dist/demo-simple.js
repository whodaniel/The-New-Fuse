#!/usr/bin/env bun
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ArchitectureAnalyzer_1 = require("./analyzer/ArchitectureAnalyzer");
const FileSystemScanner_1 = require("./scanner/FileSystemScanner");
async function main() {
    console.log('🔍 Starting Simple Architecture Analysis Demo...\n');
    try {
        // First scan the file system
        const scanner = new FileSystemScanner_1.FileSystemScanner();
        const fileSystemMap = await scanner.scanFileSystem();
        console.log(`📁 Found ${fileSystemMap.packages.length} packages and ${fileSystemMap.apps.length} apps\n`);
        // Create architecture analyzer
        const architectureAnalyzer = new ArchitectureAnalyzer_1.ArchitectureAnalyzer(fileSystemMap.packages, fileSystemMap.apps);
        // Run architecture analysis
        const architectureResult = await architectureAnalyzer.analyzeArchitecture();
        console.log('📊 Architecture Analysis Results:');
        console.log('================================\n');
        // Package redundancy summary
        console.log('📦 Package Redundancy Analysis:');
        console.log(`- Total packages analyzed: ${architectureResult.packageRedundancy.length}`);
        const highRedundancy = architectureResult.packageRedundancy.filter(p => p.redundancyScore > 70);
        const mediumRedundancy = architectureResult.packageRedundancy.filter(p => p.redundancyScore > 40 && p.redundancyScore <= 70);
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
        console.log(`- Applications analyzed: ${architectureResult.applicationLayer.length}`);
        // UI packages summary
        console.log(`\n🎨 UI Package Analysis:`);
        console.log(`- UI packages analyzed: ${architectureResult.uiPackages.length}`);
        // Database layer summary
        console.log(`\n🗄️ Database Layer Analysis:`);
        console.log(`- Database packages analyzed: ${architectureResult.databaseLayer.length}`);
        // Overall recommendations
        console.log(`\n💡 Overall Recommendations:`);
        if (architectureResult.overallRecommendations.length > 0) {
            for (const rec of architectureResult.overallRecommendations.slice(0, 3)) {
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
        if (architectureResult.consolidationPlan.phases.length > 0) {
            console.log(`- Total phases: ${architectureResult.consolidationPlan.phases.length}`);
            console.log(`- Total estimated effort: ${architectureResult.consolidationPlan.totalEstimatedEffort}`);
            console.log(`- Expected benefits: ${architectureResult.consolidationPlan.expectedBenefits.slice(0, 3).join(', ')}`);
            console.log('\nPhases:');
            for (const phase of architectureResult.consolidationPlan.phases) {
                console.log(`  ${phase.order}. ${phase.name} (${phase.estimatedDuration})`);
                console.log(`     Tasks: ${phase.tasks.length}`);
            }
        }
        else {
            console.log('- No consolidation phases needed');
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
//# sourceMappingURL=demo-simple.js.map
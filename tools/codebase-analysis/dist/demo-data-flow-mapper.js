#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDataFlowMapperDemo = runDataFlowMapperDemo;
const FileSystemScanner_1 = require("./scanner/FileSystemScanner");
const DataFlowMapper_1 = require("./analyzer/DataFlowMapper");
async function runDataFlowMapperDemo() {
    console.log('🔄 Data Flow Mapping Demo');
    console.log('=========================\n');
    try {
        const rootPath = process.cwd();
        console.log(`Analyzing codebase at: ${rootPath}\n`);
        // Step 1: Scan the file system to get packages
        console.log('📁 Scanning file system...');
        const scanner = new FileSystemScanner_1.FileSystemScanner(rootPath);
        const fileSystemMap = await scanner.scanFileSystem();
        const allPackages = [...fileSystemMap.packages, ...fileSystemMap.apps];
        console.log(`Found ${allPackages.length} packages/apps\n`);
        // Step 2: Map data flow
        console.log('🔄 Mapping data flow...');
        const mapper = new DataFlowMapper_1.DataFlowMapper(allPackages, rootPath);
        const report = await mapper.mapDataFlow();
        // Step 3: Display results
        console.log('\n📊 Data Flow Mapping Results');
        console.log('=============================\n');
        // Summary
        console.log('📈 Summary:');
        console.log(`  Total Nodes: ${report.summary.totalNodes}`);
        console.log(`  Total Paths: ${report.summary.totalPaths}`);
        console.log(`  Total Transformations: ${report.summary.totalTransformations}`);
        console.log(`  Inefficiency Count: ${report.summary.inefficiencyCount}`);
        console.log(`  Validation Coverage: ${report.summary.validationCoverage}%`);
        console.log(`  Serialization Efficiency: ${report.summary.serializationEfficiency}%`);
        console.log(`  Overall Data Flow Score: ${report.summary.overallDataFlowScore}/100\n`);
        // Nodes by layer
        console.log('🏗️  Data Flow Nodes by Layer:');
        const nodesByLayer = report.nodes.reduce((acc, node) => {
            if (!acc[node.layer])
                acc[node.layer] = [];
            acc[node.layer].push(node);
            return acc;
        }, {});
        Object.entries(nodesByLayer).forEach(([layer, nodes]) => {
            console.log(`  📋 ${layer.charAt(0).toUpperCase() + layer.slice(1)} Layer (${nodes.length} nodes):`);
            nodes.slice(0, 5).forEach(node => {
                console.log(`     - ${node.name} (${node.type}) - ${node.methods.length} methods`);
            });
            if (nodes.length > 5) {
                console.log(`     ... and ${nodes.length - 5} more`);
            }
            console.log();
        });
        // Data flow paths
        console.log('🛤️  Data Flow Paths:');
        if (report.paths.length === 0) {
            console.log('  No data flow paths identified\n');
        }
        else {
            report.paths.slice(0, 10).forEach(path => {
                const performanceIcon = path.performance === 'efficient' ? '✅' :
                    path.performance === 'moderate' ? '⚠️' : '❌';
                console.log(`  ${performanceIcon} ${path.name}:`);
                console.log(`     Performance: ${path.performance}`);
                console.log(`     Transformations: ${path.transformations.length}`);
                if (path.bottlenecks.length > 0) {
                    console.log(`     Bottlenecks: ${path.bottlenecks.slice(0, 2).join(', ')}`);
                }
                if (path.recommendations.length > 0) {
                    console.log(`     💡 Recommendations: ${path.recommendations[0]}`);
                }
                console.log();
            });
        }
        // Inefficiencies
        console.log('⚠️  Data Flow Inefficiencies:');
        if (report.inefficiencies.length === 0) {
            console.log('  No inefficiencies detected! 🎉\n');
        }
        else {
            const inefficienciesByType = report.inefficiencies.reduce((acc, inefficiency) => {
                if (!acc[inefficiency.type])
                    acc[inefficiency.type] = [];
                acc[inefficiency.type].push(inefficiency);
                return acc;
            }, {});
            Object.entries(inefficienciesByType).forEach(([type, inefficiencies]) => {
                const impactIcon = inefficiencies[0].impact === 'high' ? '🔴' :
                    inefficiencies[0].impact === 'medium' ? '🟡' : '🟢';
                console.log(`  ${impactIcon} ${type.replace(/_/g, ' ').toUpperCase()} (${inefficiencies.length}):`);
                inefficiencies.slice(0, 3).forEach(inefficiency => {
                    console.log(`     - ${inefficiency.description}`);
                    console.log(`       💡 ${inefficiency.recommendation}`);
                });
                if (inefficiencies.length > 3) {
                    console.log(`     ... and ${inefficiencies.length - 3} more`);
                }
                console.log();
            });
        }
        // Validation patterns
        console.log('✅ Validation Patterns:');
        const { frontend, api, database, duplicates } = report.validationPatterns;
        console.log(`  Frontend Validations: ${frontend.length}`);
        console.log(`  API Validations: ${api.length}`);
        console.log(`  Database Validations: ${database.length}`);
        console.log(`  Duplicate Validations: ${duplicates.length}`);
        if (duplicates.length > 0) {
            console.log('  🔄 Duplicate validation rules found:');
            duplicates.slice(0, 5).forEach(dup => {
                console.log(`     - ${dup.type}: ${dup.rule} (${dup.location})`);
            });
            if (duplicates.length > 5) {
                console.log(`     ... and ${duplicates.length - 5} more`);
            }
        }
        console.log();
        // Serialization patterns
        console.log('🔄 Serialization Patterns:');
        const { apiToFrontend, databaseToApi, inefficiencies: serializationInefficiencies } = report.serializationPatterns;
        console.log(`  API to Frontend: ${apiToFrontend.length} serializations`);
        console.log(`  Database to API: ${databaseToApi.length} serializations`);
        console.log(`  Inefficient Serializations: ${serializationInefficiencies.length}`);
        if (serializationInefficiencies.length > 0) {
            console.log('  ⚠️  Inefficient serialization patterns:');
            serializationInefficiencies.slice(0, 3).forEach(inefficiency => {
                console.log(`     - ${inefficiency.type} at ${inefficiency.location}`);
            });
        }
        console.log();
        // Key recommendations
        console.log('💡 Key Recommendations:');
        if (report.summary.overallDataFlowScore < 70) {
            console.log('  - Overall data flow score is low - focus on optimization');
        }
        if (report.summary.validationCoverage < 80) {
            console.log('  - Improve validation coverage across application layers');
        }
        if (report.summary.serializationEfficiency < 90) {
            console.log('  - Optimize serialization patterns to reduce redundancy');
        }
        if (report.inefficiencies.filter(i => i.impact === 'high').length > 0) {
            console.log('  - Address high-impact inefficiencies first');
        }
        if (report.paths.filter(p => p.performance === 'inefficient').length > 0) {
            console.log('  - Optimize inefficient data flow paths');
        }
        if (report.validationPatterns.duplicates.length > 5) {
            console.log('  - Consolidate duplicate validation rules');
        }
        console.log('\n✅ Data flow mapping complete!');
    }
    catch (error) {
        console.error('❌ Error during analysis:', error);
        process.exit(1);
    }
}
// Run the demo if this file is executed directly
if (require.main === module) {
    runDataFlowMapperDemo();
}
//# sourceMappingURL=demo-data-flow-mapper.js.map
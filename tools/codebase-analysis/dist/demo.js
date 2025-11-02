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
const index_1 = require("./index");
const path = __importStar(require("path"));
async function runDemo() {
    console.log('Running codebase analysis demo...');
    // Analyze just the tools/codebase-analysis directory to test functionality
    const analyzer = new index_1.CodebaseAnalyzer(path.join(__dirname, '..'));
    try {
        const result = await analyzer.analyzeCodebase();
        console.log('\n=== DEMO RESULTS ===');
        console.log(`Total packages: ${result.summary.totalPackages}`);
        console.log(`Total files: ${result.summary.totalFiles}`);
        console.log(`Functional packages: ${result.summary.functionalPackages}`);
        console.log(`Stub packages: ${result.summary.stubPackages}`);
        console.log(`Overall completeness: ${result.summary.overallCompleteness}%`);
        console.log('\n=== FILE SYSTEM MAP ===');
        console.log(`Root files: ${result.fileSystemMap.rootFiles.length}`);
        console.log(`Packages found: ${result.fileSystemMap.packages.length}`);
        console.log(`Apps found: ${result.fileSystemMap.apps.length}`);
        console.log('\n=== DEPENDENCY ANALYSIS ===');
        console.log(`Dependency nodes: ${result.dependencyGraph.nodes.length}`);
        console.log(`Dependency edges: ${result.dependencyGraph.edges.length}`);
        console.log(`Circular dependencies: ${result.dependencyGraph.circularDependencies.length}`);
        console.log(`Version conflicts: ${result.dependencyGraph.conflicts.length}`);
        console.log('\n=== IMPLEMENTATION ANALYSIS ===');
        result.implementationReports.forEach((report) => {
            console.log(`${report.packageName}: ${report.completenessScore}% complete (${report.overallStatus})`);
            if (report.recommendations.length > 0) {
                console.log(`  Recommendations: ${report.recommendations.join(', ')}`);
            }
        });
        console.log('\nDemo completed successfully!');
    }
    catch (error) {
        console.error('Demo failed:', error);
    }
}
runDemo();
//# sourceMappingURL=demo.js.map
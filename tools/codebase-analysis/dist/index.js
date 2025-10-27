"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodebaseAnalyzer = exports.DataFlowMapper = exports.DatabaseModelUsageAnalyzer = exports.DocumentationAlignmentAnalyzer = exports.TestCoverageAnalyzer = exports.PerformanceBottleneckDetector = exports.CodeQualityAnalyzer = exports.SpecificationAlignmentChecker = exports.ImplementationCompletenessAnalyzer = exports.BuildSystemAnalyzer = exports.ScriptAnalyzer = exports.ArchitectureAnalyzer = exports.ImplementationAnalyzer = exports.DependencyAnalyzer = exports.FileSystemScanner = void 0;
var FileSystemScanner_1 = require("./scanner/FileSystemScanner");
Object.defineProperty(exports, "FileSystemScanner", { enumerable: true, get: function () { return FileSystemScanner_1.FileSystemScanner; } });
var DependencyAnalyzer_1 = require("./analyzer/DependencyAnalyzer");
Object.defineProperty(exports, "DependencyAnalyzer", { enumerable: true, get: function () { return DependencyAnalyzer_1.DependencyAnalyzer; } });
var ImplementationAnalyzer_1 = require("./analyzer/ImplementationAnalyzer");
Object.defineProperty(exports, "ImplementationAnalyzer", { enumerable: true, get: function () { return ImplementationAnalyzer_1.ImplementationAnalyzer; } });
var ArchitectureAnalyzer_1 = require("./analyzer/ArchitectureAnalyzer");
Object.defineProperty(exports, "ArchitectureAnalyzer", { enumerable: true, get: function () { return ArchitectureAnalyzer_1.ArchitectureAnalyzer; } });
var ScriptAnalyzer_1 = require("./analyzer/ScriptAnalyzer");
Object.defineProperty(exports, "ScriptAnalyzer", { enumerable: true, get: function () { return ScriptAnalyzer_1.ScriptAnalyzer; } });
var BuildSystemAnalyzer_1 = require("./analyzer/BuildSystemAnalyzer");
Object.defineProperty(exports, "BuildSystemAnalyzer", { enumerable: true, get: function () { return BuildSystemAnalyzer_1.BuildSystemAnalyzer; } });
var ImplementationCompletenessAnalyzer_1 = require("./analyzer/ImplementationCompletenessAnalyzer");
Object.defineProperty(exports, "ImplementationCompletenessAnalyzer", { enumerable: true, get: function () { return ImplementationCompletenessAnalyzer_1.ImplementationCompletenessAnalyzer; } });
var SpecificationAlignmentChecker_1 = require("./analyzer/SpecificationAlignmentChecker");
Object.defineProperty(exports, "SpecificationAlignmentChecker", { enumerable: true, get: function () { return SpecificationAlignmentChecker_1.SpecificationAlignmentChecker; } });
var CodeQualityAnalyzer_1 = require("./analyzer/CodeQualityAnalyzer");
Object.defineProperty(exports, "CodeQualityAnalyzer", { enumerable: true, get: function () { return CodeQualityAnalyzer_1.CodeQualityAnalyzer; } });
var PerformanceBottleneckDetector_1 = require("./analyzer/PerformanceBottleneckDetector");
Object.defineProperty(exports, "PerformanceBottleneckDetector", { enumerable: true, get: function () { return PerformanceBottleneckDetector_1.PerformanceBottleneckDetector; } });
var TestCoverageAnalyzer_1 = require("./analyzer/TestCoverageAnalyzer");
Object.defineProperty(exports, "TestCoverageAnalyzer", { enumerable: true, get: function () { return TestCoverageAnalyzer_1.TestCoverageAnalyzer; } });
var DocumentationAlignmentAnalyzer_1 = require("./analyzer/DocumentationAlignmentAnalyzer");
Object.defineProperty(exports, "DocumentationAlignmentAnalyzer", { enumerable: true, get: function () { return DocumentationAlignmentAnalyzer_1.DocumentationAlignmentAnalyzer; } });
var DatabaseModelUsageAnalyzer_1 = require("./analyzer/DatabaseModelUsageAnalyzer");
Object.defineProperty(exports, "DatabaseModelUsageAnalyzer", { enumerable: true, get: function () { return DatabaseModelUsageAnalyzer_1.DatabaseModelUsageAnalyzer; } });
var DataFlowMapper_1 = require("./analyzer/DataFlowMapper");
Object.defineProperty(exports, "DataFlowMapper", { enumerable: true, get: function () { return DataFlowMapper_1.DataFlowMapper; } });
const FileSystemScanner_2 = require("./scanner/FileSystemScanner");
const DependencyAnalyzer_2 = require("./analyzer/DependencyAnalyzer");
const ImplementationAnalyzer_2 = require("./analyzer/ImplementationAnalyzer");
const ArchitectureAnalyzer_2 = require("./analyzer/ArchitectureAnalyzer");
const ScriptAnalyzer_2 = require("./analyzer/ScriptAnalyzer");
const BuildSystemAnalyzer_2 = require("./analyzer/BuildSystemAnalyzer");
const ImplementationCompletenessAnalyzer_2 = require("./analyzer/ImplementationCompletenessAnalyzer");
const TestCoverageAnalyzer_2 = require("./analyzer/TestCoverageAnalyzer");
const DocumentationAlignmentAnalyzer_2 = require("./analyzer/DocumentationAlignmentAnalyzer");
const DatabaseModelUsageAnalyzer_2 = require("./analyzer/DatabaseModelUsageAnalyzer");
const DataFlowMapper_2 = require("./analyzer/DataFlowMapper");
class CodebaseAnalyzer {
    constructor(rootPath) {
        this.rootPath = rootPath || process.cwd();
        this.scanner = new FileSystemScanner_2.FileSystemScanner(this.rootPath);
        this.implementationAnalyzer = new ImplementationAnalyzer_2.ImplementationAnalyzer();
        this.scriptAnalyzer = new ScriptAnalyzer_2.ScriptAnalyzer(this.rootPath);
        this.buildSystemAnalyzer = new BuildSystemAnalyzer_2.BuildSystemAnalyzer(this.rootPath);
    }
    async analyzeCodebase(includeArchitecture = false, includeScripts = false, includeBuildSystem = false, includeImplementationCompleteness = false, includeTestCoverage = false, includeDocumentationAlignment = false, includeDatabaseModelUsage = false, includeDataFlow = false) {
        console.log('Starting comprehensive codebase analysis...');
        // Step 1: Scan file system
        console.log('1. Scanning file system...');
        const fileSystemMap = await this.scanner.scanFileSystem();
        // Step 2: Analyze dependencies
        console.log('2. Analyzing dependencies...');
        const allPackages = [...fileSystemMap.packages, ...fileSystemMap.apps];
        this.dependencyAnalyzer = new DependencyAnalyzer_2.DependencyAnalyzer(allPackages);
        const dependencyGraph = await this.dependencyAnalyzer.analyzeDependencies();
        // Step 3: Analyze implementations
        console.log('3. Analyzing implementations...');
        const implementationReports = [];
        for (const pkg of allPackages) {
            const report = await this.implementationAnalyzer.analyzePackageImplementation(pkg);
            implementationReports.push(report);
        }
        // Step 4: Architecture analysis (optional)
        let architectureAnalysis;
        if (includeArchitecture) {
            console.log('4. Analyzing architecture...');
            this.architectureAnalyzer = new ArchitectureAnalyzer_2.ArchitectureAnalyzer(fileSystemMap.packages, fileSystemMap.apps);
            architectureAnalysis = await this.architectureAnalyzer.analyzeArchitecture();
        }
        // Step 5: Script analysis (optional)
        let scriptAnalysis;
        if (includeScripts && this.scriptAnalyzer) {
            console.log('5. Analyzing scripts...');
            scriptAnalysis = await this.scriptAnalyzer.analyzeAllScripts();
        }
        // Step 6: Build system analysis (optional)
        let buildSystemAnalysis;
        if (includeBuildSystem && this.buildSystemAnalyzer) {
            console.log('6. Analyzing build system...');
            buildSystemAnalysis = await this.buildSystemAnalyzer.analyzeBuildSystem();
        }
        // Step 7: Implementation completeness analysis (optional)
        let implementationCompletenessAnalysis;
        if (includeImplementationCompleteness) {
            console.log('7. Analyzing implementation completeness...');
            this.implementationCompletenessAnalyzer = new ImplementationCompletenessAnalyzer_2.ImplementationCompletenessAnalyzer(allPackages, this.rootPath);
            implementationCompletenessAnalysis = await this.implementationCompletenessAnalyzer.analyzeImplementationCompleteness();
        }
        // Step 8: Test coverage analysis (optional)
        let testCoverageAnalysis;
        if (includeTestCoverage) {
            const stepNum = 7 + (includeImplementationCompleteness ? 1 : 0);
            console.log(`${stepNum}. Analyzing test coverage...`);
            this.testCoverageAnalyzer = new TestCoverageAnalyzer_2.TestCoverageAnalyzer(allPackages, this.rootPath);
            testCoverageAnalysis = await this.testCoverageAnalyzer.analyzeTestCoverage();
        }
        // Step 9: Documentation alignment analysis (optional)
        let documentationAlignmentAnalysis;
        if (includeDocumentationAlignment) {
            const stepNum = 7 + (includeImplementationCompleteness ? 1 : 0) + (includeTestCoverage ? 1 : 0);
            console.log(`${stepNum}. Analyzing documentation alignment...`);
            this.documentationAlignmentAnalyzer = new DocumentationAlignmentAnalyzer_2.DocumentationAlignmentAnalyzer(allPackages, this.rootPath);
            documentationAlignmentAnalysis = await this.documentationAlignmentAnalyzer.analyzeDocumentationAlignment();
        }
        // Step 10: Database model usage analysis (optional)
        let databaseModelUsageAnalysis;
        if (includeDatabaseModelUsage) {
            const stepNum = 7 + (includeImplementationCompleteness ? 1 : 0) + (includeTestCoverage ? 1 : 0) + (includeDocumentationAlignment ? 1 : 0);
            console.log(`${stepNum}. Analyzing database model usage...`);
            this.databaseModelUsageAnalyzer = new DatabaseModelUsageAnalyzer_2.DatabaseModelUsageAnalyzer(allPackages, this.rootPath);
            databaseModelUsageAnalysis = await this.databaseModelUsageAnalyzer.analyzeDatabaseModelUsage();
        }
        // Step 11: Data flow analysis (optional)
        let dataFlowAnalysis;
        if (includeDataFlow) {
            const stepNum = 7 + (includeImplementationCompleteness ? 1 : 0) + (includeTestCoverage ? 1 : 0) + (includeDocumentationAlignment ? 1 : 0) + (includeDatabaseModelUsage ? 1 : 0);
            console.log(`${stepNum}. Analyzing data flow...`);
            this.dataFlowMapper = new DataFlowMapper_2.DataFlowMapper(allPackages, this.rootPath);
            dataFlowAnalysis = await this.dataFlowMapper.mapDataFlow();
        }
        // Final step: Generate summary
        const stepNum = 4 + (includeArchitecture ? 1 : 0) + (includeScripts ? 1 : 0) + (includeBuildSystem ? 1 : 0) + (includeImplementationCompleteness ? 1 : 0) + (includeTestCoverage ? 1 : 0) + (includeDocumentationAlignment ? 1 : 0) + (includeDatabaseModelUsage ? 1 : 0) + (includeDataFlow ? 1 : 0);
        console.log(`${stepNum}. Generating summary...`);
        const summary = this.generateSummary(fileSystemMap, dependencyGraph, implementationReports, scriptAnalysis, buildSystemAnalysis, implementationCompletenessAnalysis, testCoverageAnalysis, documentationAlignmentAnalysis, databaseModelUsageAnalysis, dataFlowAnalysis);
        console.log('Analysis complete!');
        return {
            fileSystemMap,
            dependencyGraph,
            implementationReports,
            architectureAnalysis,
            scriptAnalysis,
            buildSystemAnalysis,
            implementationCompletenessAnalysis,
            testCoverageAnalysis,
            documentationAlignmentAnalysis,
            databaseModelUsageAnalysis,
            dataFlowAnalysis,
            summary
        };
    }
    generateSummary(fileSystemMap, dependencyGraph, implementationReports, scriptAnalysis, buildSystemAnalysis, implementationCompletenessAnalysis, testCoverageAnalysis, documentationAlignmentAnalysis, databaseModelUsageAnalysis, dataFlowAnalysis) {
        const totalPackages = fileSystemMap.packages.length + fileSystemMap.apps.length;
        const totalFiles = fileSystemMap.totalFiles;
        const functionalPackages = implementationReports.filter(r => r.overallStatus === 'functional').length;
        const stubPackages = implementationReports.filter(r => r.overallStatus === 'stub').length;
        const brokenPackages = implementationReports.filter(r => r.overallStatus === 'broken').length;
        const circularDependencies = dependencyGraph.circularDependencies.length;
        const versionConflicts = dependencyGraph.conflicts.length;
        const overallCompleteness = Math.round(implementationReports.reduce((sum, r) => sum + r.completenessScore, 0) / implementationReports.length);
        const summary = {
            totalPackages,
            totalFiles,
            functionalPackages,
            stubPackages,
            brokenPackages,
            circularDependencies,
            versionConflicts,
            overallCompleteness
        };
        if (scriptAnalysis) {
            summary.totalScripts = scriptAnalysis.totalScripts;
            summary.redundantScripts = scriptAnalysis.redundantGroups.reduce((sum, group) => sum + group.scripts.length - 1, 0);
        }
        if (buildSystemAnalysis) {
            summary.buildSystemScore = buildSystemAnalysis.monorepoConfig.effectiveness.score;
        }
        if (implementationCompletenessAnalysis) {
            summary.implementationCompletenessScore = implementationCompletenessAnalysis.completenessMetrics.overallCompletenessScore;
            summary.qualityScore = implementationCompletenessAnalysis.completenessMetrics.qualityScore;
            summary.performanceScore = implementationCompletenessAnalysis.completenessMetrics.performanceScore;
        }
        if (testCoverageAnalysis) {
            summary.testCoveragePercentage = testCoverageAnalysis.coveragePercentage;
            summary.totalTestFiles = testCoverageAnalysis.totalTestFiles;
        }
        if (documentationAlignmentAnalysis) {
            summary.documentationCoverage = documentationAlignmentAnalysis.documentationCoverage;
            summary.totalDocumentationFiles = documentationAlignmentAnalysis.totalDocumentationFiles;
        }
        if (databaseModelUsageAnalysis) {
            summary.databaseUsageEfficiency = databaseModelUsageAnalysis.summary.usageEfficiency;
            summary.totalDatabaseModels = databaseModelUsageAnalysis.summary.totalModels;
            summary.unusedDatabaseElements = databaseModelUsageAnalysis.unusedElements.length;
        }
        if (dataFlowAnalysis) {
            summary.dataFlowScore = dataFlowAnalysis.summary.overallDataFlowScore;
            summary.totalDataFlowNodes = dataFlowAnalysis.summary.totalNodes;
            summary.dataFlowInefficiencies = dataFlowAnalysis.summary.inefficiencyCount;
        }
        return summary;
    }
}
exports.CodebaseAnalyzer = CodebaseAnalyzer;
//# sourceMappingURL=index.js.map
export { FileSystemScanner } from './scanner/FileSystemScanner';
export type { FileSystemMap, PackageInfo, FileInfo, FileType, PackageType } from './scanner/FileSystemScanner';
export { DependencyAnalyzer } from './analyzer/DependencyAnalyzer';
export { ImplementationAnalyzer } from './analyzer/ImplementationAnalyzer';
export { ArchitectureAnalyzer } from './analyzer/ArchitectureAnalyzer';
export { ScriptAnalyzer } from './analyzer/ScriptAnalyzer';
export type { ScriptAnalysis, ScriptConsolidationReport } from './analyzer/ScriptAnalyzer';
export { BuildSystemAnalyzer } from './analyzer/BuildSystemAnalyzer';
export type { BuildSystemAnalysis } from './analyzer/BuildSystemAnalyzer';
export { ImplementationCompletenessAnalyzer } from './analyzer/ImplementationCompletenessAnalyzer';
export type { ImplementationCompletenessReport, ImplementationGap } from './analyzer/ImplementationCompletenessAnalyzer';
export { SpecificationAlignmentChecker } from './analyzer/SpecificationAlignmentChecker';
export type { SpecificationAlignment, ImplementationMapping } from './analyzer/SpecificationAlignmentChecker';
export { CodeQualityAnalyzer } from './analyzer/CodeQualityAnalyzer';
export type { CodeQualityReport, QualityMetrics } from './analyzer/CodeQualityAnalyzer';
export { PerformanceBottleneckDetector } from './analyzer/PerformanceBottleneckDetector';
export type { PerformanceBottleneckReport, PerformanceMetrics } from './analyzer/PerformanceBottleneckDetector';
export { TestCoverageAnalyzer } from './analyzer/TestCoverageAnalyzer';
export type { TestCoverageReport, TestFile, ComponentTestMapping } from './analyzer/TestCoverageAnalyzer';
export { DocumentationAlignmentAnalyzer } from './analyzer/DocumentationAlignmentAnalyzer';
export type { DocumentationAlignmentReport, DocumentationFile, DocumentationAlignment } from './analyzer/DocumentationAlignmentAnalyzer';
export { DatabaseModelUsageAnalyzer } from './analyzer/DatabaseModelUsageAnalyzer';
export type { DatabaseModelUsageReport, PrismaModel, ModelUsage, DatabaseAccessPattern, UnusedDatabaseElement } from './analyzer/DatabaseModelUsageAnalyzer';
export { DataFlowMapper } from './analyzer/DataFlowMapper';
export type { DataFlowReport, DataFlowNode, DataFlowPath, DataFlowInefficiency, DataTransformation } from './analyzer/DataFlowMapper';

import { FileSystemScanner } from './scanner/FileSystemScanner';
import { DependencyAnalyzer } from './analyzer/DependencyAnalyzer';
import { ImplementationAnalyzer } from './analyzer/ImplementationAnalyzer';
import { ArchitectureAnalyzer } from './analyzer/ArchitectureAnalyzer';
import { ScriptAnalyzer } from './analyzer/ScriptAnalyzer';
import { BuildSystemAnalyzer } from './analyzer/BuildSystemAnalyzer';
import { ImplementationCompletenessAnalyzer } from './analyzer/ImplementationCompletenessAnalyzer';
import { TestCoverageAnalyzer } from './analyzer/TestCoverageAnalyzer';
import { DocumentationAlignmentAnalyzer } from './analyzer/DocumentationAlignmentAnalyzer';
import { DatabaseModelUsageAnalyzer } from './analyzer/DatabaseModelUsageAnalyzer';
import { DataFlowMapper } from './analyzer/DataFlowMapper';

export interface CodebaseAnalysisResult {
  fileSystemMap: any;
  dependencyGraph: any;
  implementationReports: any[];
  architectureAnalysis?: any;
  scriptAnalysis?: any;
  buildSystemAnalysis?: any;
  implementationCompletenessAnalysis?: any;
  testCoverageAnalysis?: any;
  documentationAlignmentAnalysis?: any;
  databaseModelUsageAnalysis?: any;
  dataFlowAnalysis?: any;
  summary: {
    totalPackages: number;
    totalFiles: number;
    functionalPackages: number;
    stubPackages: number;
    brokenPackages: number;
    circularDependencies: number;
    versionConflicts: number;
    overallCompleteness: number;
    totalScripts?: number;
    redundantScripts?: number;
    buildSystemScore?: number;
    implementationCompletenessScore?: number;
    qualityScore?: number;
    performanceScore?: number;
    testCoveragePercentage?: number;
    totalTestFiles?: number;
    documentationCoverage?: number;
    totalDocumentationFiles?: number;
    databaseUsageEfficiency?: number;
    totalDatabaseModels?: number;
    unusedDatabaseElements?: number;
    dataFlowScore?: number;
    totalDataFlowNodes?: number;
    dataFlowInefficiencies?: number;
  };
}

export class CodebaseAnalyzer {
  private scanner: FileSystemScanner;
  private dependencyAnalyzer?: DependencyAnalyzer;
  private implementationAnalyzer: ImplementationAnalyzer;
  private architectureAnalyzer?: ArchitectureAnalyzer;
  private scriptAnalyzer?: ScriptAnalyzer;
  private buildSystemAnalyzer?: BuildSystemAnalyzer;
  private implementationCompletenessAnalyzer?: ImplementationCompletenessAnalyzer;
  private testCoverageAnalyzer?: TestCoverageAnalyzer;
  private documentationAlignmentAnalyzer?: DocumentationAlignmentAnalyzer;
  private databaseModelUsageAnalyzer?: DatabaseModelUsageAnalyzer;
  private dataFlowMapper?: DataFlowMapper;
  private rootPath: string;

  constructor(rootPath?: string) {
    this.rootPath = rootPath || process.cwd();
    this.scanner = new FileSystemScanner(this.rootPath);
    this.implementationAnalyzer = new ImplementationAnalyzer();
    this.scriptAnalyzer = new ScriptAnalyzer(this.rootPath);
    this.buildSystemAnalyzer = new BuildSystemAnalyzer(this.rootPath);
  }

  async analyzeCodebase(includeArchitecture: boolean = false, includeScripts: boolean = false, includeBuildSystem: boolean = false, includeImplementationCompleteness: boolean = false, includeTestCoverage: boolean = false, includeDocumentationAlignment: boolean = false, includeDatabaseModelUsage: boolean = false, includeDataFlow: boolean = false): Promise<CodebaseAnalysisResult> {
    console.log('Starting comprehensive codebase analysis...');
    
    // Step 1: Scan file system
    console.log('1. Scanning file system...');
    const fileSystemMap = await this.scanner.scanFileSystem();
    
    // Step 2: Analyze dependencies
    console.log('2. Analyzing dependencies...');
    const allPackages = [...fileSystemMap.packages, ...fileSystemMap.apps];
    this.dependencyAnalyzer = new DependencyAnalyzer(allPackages);
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
      this.architectureAnalyzer = new ArchitectureAnalyzer(fileSystemMap.packages, fileSystemMap.apps);
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
      this.implementationCompletenessAnalyzer = new ImplementationCompletenessAnalyzer(allPackages, this.rootPath);
      implementationCompletenessAnalysis = await this.implementationCompletenessAnalyzer.analyzeImplementationCompleteness();
    }
    
    // Step 8: Test coverage analysis (optional)
    let testCoverageAnalysis;
    if (includeTestCoverage) {
      const stepNum = 7 + (includeImplementationCompleteness ? 1 : 0);
      console.log(`${stepNum}. Analyzing test coverage...`);
      this.testCoverageAnalyzer = new TestCoverageAnalyzer(allPackages, this.rootPath);
      testCoverageAnalysis = await this.testCoverageAnalyzer.analyzeTestCoverage();
    }
    
    // Step 9: Documentation alignment analysis (optional)
    let documentationAlignmentAnalysis;
    if (includeDocumentationAlignment) {
      const stepNum = 7 + (includeImplementationCompleteness ? 1 : 0) + (includeTestCoverage ? 1 : 0);
      console.log(`${stepNum}. Analyzing documentation alignment...`);
      this.documentationAlignmentAnalyzer = new DocumentationAlignmentAnalyzer(allPackages, this.rootPath);
      documentationAlignmentAnalysis = await this.documentationAlignmentAnalyzer.analyzeDocumentationAlignment();
    }
    
    // Step 10: Database model usage analysis (optional)
    let databaseModelUsageAnalysis;
    if (includeDatabaseModelUsage) {
      const stepNum = 7 + (includeImplementationCompleteness ? 1 : 0) + (includeTestCoverage ? 1 : 0) + (includeDocumentationAlignment ? 1 : 0);
      console.log(`${stepNum}. Analyzing database model usage...`);
      this.databaseModelUsageAnalyzer = new DatabaseModelUsageAnalyzer(allPackages, this.rootPath);
      databaseModelUsageAnalysis = await this.databaseModelUsageAnalyzer.analyzeDatabaseModelUsage();
    }
    
    // Step 11: Data flow analysis (optional)
    let dataFlowAnalysis;
    if (includeDataFlow) {
      const stepNum = 7 + (includeImplementationCompleteness ? 1 : 0) + (includeTestCoverage ? 1 : 0) + (includeDocumentationAlignment ? 1 : 0) + (includeDatabaseModelUsage ? 1 : 0);
      console.log(`${stepNum}. Analyzing data flow...`);
      this.dataFlowMapper = new DataFlowMapper(allPackages, this.rootPath);
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

  private generateSummary(fileSystemMap: any, dependencyGraph: any, implementationReports: any[], scriptAnalysis?: any, buildSystemAnalysis?: any, implementationCompletenessAnalysis?: any, testCoverageAnalysis?: any, documentationAlignmentAnalysis?: any, databaseModelUsageAnalysis?: any, dataFlowAnalysis?: any) {
    const totalPackages = fileSystemMap.packages.length + fileSystemMap.apps.length;
    const totalFiles = fileSystemMap.totalFiles;
    
    const functionalPackages = implementationReports.filter(r => r.overallStatus === 'functional').length;
    const stubPackages = implementationReports.filter(r => r.overallStatus === 'stub').length;
    const brokenPackages = implementationReports.filter(r => r.overallStatus === 'broken').length;
    
    const circularDependencies = dependencyGraph.circularDependencies.length;
    const versionConflicts = dependencyGraph.conflicts.length;
    
    const overallCompleteness = Math.round(
      implementationReports.reduce((sum, r) => sum + r.completenessScore, 0) / implementationReports.length
    );

    const summary: any = {
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
      summary.redundantScripts = scriptAnalysis.redundantGroups.reduce((sum: number, group: any) => sum + group.scripts.length - 1, 0);
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
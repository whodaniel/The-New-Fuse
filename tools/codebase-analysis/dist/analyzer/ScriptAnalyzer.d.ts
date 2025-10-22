export interface ScriptAnalysis {
    name: string;
    path: string;
    purpose: ScriptPurpose;
    functionality: string[];
    commands: CommandAnalysis[];
    dependencies: ScriptDependency[];
    executionPattern: ExecutionPattern;
    obsolete: boolean;
    redundantWith: string[];
    consolidationRecommendation: ConsolidationAction;
    complexity: ScriptComplexity;
    issues: ScriptIssue[];
}
export interface CommandAnalysis {
    command: string;
    frequency: number;
    category: CommandCategory;
    parameters: string[];
    isConditional: boolean;
    lineNumber: number;
}
export interface ScriptDependency {
    type: 'script' | 'binary' | 'file' | 'environment';
    name: string;
    required: boolean;
    found: boolean;
}
export interface ScriptIssue {
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    lineNumber?: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export type ScriptPurpose = 'build' | 'dev' | 'test' | 'deployment' | 'cleanup' | 'setup' | 'utility' | 'monitoring' | 'unknown';
export type CommandCategory = 'build' | 'package_manager' | 'file_operations' | 'process_control' | 'network' | 'docker' | 'git' | 'system' | 'custom';
export type ExecutionPattern = 'standalone' | 'chained' | 'conditional' | 'loop' | 'parallel';
export type ConsolidationAction = 'keep' | 'merge' | 'remove' | 'refactor' | 'replace';
export interface ScriptComplexity {
    lineCount: number;
    functionCount: number;
    conditionalCount: number;
    loopCount: number;
    complexityScore: number;
}
export interface ScriptConsolidationReport {
    totalScripts: number;
    scriptsByPurpose: Record<ScriptPurpose, ScriptAnalysis[]>;
    redundantGroups: RedundantScriptGroup[];
    obsoleteScripts: ScriptAnalysis[];
    consolidationPlan: ConsolidationPlan;
    recommendations: ConsolidationRecommendation[];
}
export interface RedundantScriptGroup {
    purpose: ScriptPurpose;
    scripts: ScriptAnalysis[];
    overlapScore: number;
    recommendedAction: ConsolidationAction;
    primaryScript?: string;
}
export interface ConsolidationPlan {
    targetScriptCount: number;
    consolidatedScripts: ConsolidatedScript[];
    scriptsToRemove: string[];
    migrationSteps: MigrationStep[];
}
export interface ConsolidatedScript {
    name: string;
    purpose: ScriptPurpose;
    sourceScripts: string[];
    functionality: string[];
    estimatedEffort: 'low' | 'medium' | 'high';
}
export interface MigrationStep {
    step: number;
    description: string;
    scriptsAffected: string[];
    riskLevel: 'low' | 'medium' | 'high';
    estimatedTime: string;
}
export interface ConsolidationRecommendation {
    type: 'merge' | 'remove' | 'refactor' | 'standardize';
    description: string;
    scripts: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    effort: 'low' | 'medium' | 'high';
    impact: string;
}
export interface ScriptRedundancyReport {
    totalScripts: number;
    redundancyGroups: RedundantScriptGroup[];
    commandPatternAnalysis: CommandPatternAnalysis[];
    executionFlowAnalysis: ExecutionFlowAnalysis[];
    consolidationOpportunities: ConsolidationOpportunity[];
}
export interface DetailedRedundancyAnalysis {
    groups: RedundantScriptGroup[];
    commandPatterns: CommandPatternAnalysis[];
    executionFlows: ExecutionFlowAnalysis[];
    opportunities: ConsolidationOpportunity[];
}
export interface CommandPatternAnalysis {
    pattern: string;
    scripts: string[];
    frequency: number;
    similarity: number;
}
export interface ExecutionFlowAnalysis {
    scriptName: string;
    flowType: ExecutionPattern;
    steps: ExecutionStep[];
    complexity: number;
}
export interface ExecutionStep {
    stepNumber: number;
    command: string;
    category: CommandCategory;
    isConditional: boolean;
    dependencies: string[];
}
export interface ConsolidationOpportunity {
    type: 'identical_patterns' | 'similar_flows' | 'duplicate_functionality';
    description: string;
    scripts: string[];
    potentialSavings: PotentialSavings;
    effort: 'low' | 'medium' | 'high';
    recommendation: string;
}
export interface PotentialSavings {
    linesOfCode: number;
    maintenanceEffort: number;
    complexityReduction: number;
}
export declare class ScriptAnalyzer {
    private rootPath;
    private scriptExtensions;
    constructor(rootPath?: string);
    analyzeAllScripts(): Promise<ScriptConsolidationReport>;
    analyzeScript(scriptPath: string): Promise<ScriptAnalysis>;
    private findAllScripts;
    private parseCommands;
    private categorizeCommand;
    private extractParameters;
    private isConditionalCommand;
    private extractFunctionality;
    private identifyDependencies;
    private determinePurpose;
    private analyzeExecutionPattern;
    private calculateComplexity;
    private identifyIssues;
    private isObsolete;
    private groupScriptsByPurpose;
    private identifyRedundantGroups;
    private calculateOverlapScore;
    private selectPrimaryScript;
    private generateConsolidationPlan;
    private generateRecommendations;
    detectScriptRedundancy(): Promise<ScriptRedundancyReport>;
    private performDetailedRedundancyAnalysis;
    private analyzeCommandPatterns;
    private analyzeExecutionFlows;
    private extractExecutionFlow;
    private getCommandDependencies;
    private calculateFlowComplexity;
    private findConsolidationOpportunities;
    private calculatePatternSimilarity;
    private groupSimilarFlows;
    private areFlowsSimilar;
    private calculatePotentialSavings;
}
//# sourceMappingURL=ScriptAnalyzer.d.ts.map
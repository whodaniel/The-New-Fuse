export interface BuildSystemAnalysis {
    monorepoConfig: MonorepoConfig;
    packageScripts: PackageScriptAnalysis[];
    buildConfigurations: BuildConfiguration[];
    redundantConfigurations: RedundantConfiguration[];
    performanceIssues: PerformanceIssue[];
    optimizationOpportunities: OptimizationOpportunity[];
    recommendations: BuildSystemRecommendation[];
}
export interface MonorepoConfig {
    tool: 'turbo' | 'lerna' | 'nx' | 'rush' | 'none';
    configPath?: string;
    pipelines: Pipeline[];
    caching: CachingConfig;
    dependencies: DependencyConfig[];
    effectiveness: MonorepoEffectiveness;
}
export interface Pipeline {
    name: string;
    dependsOn: string[];
    outputs: string[];
    inputs: string[];
    cache: boolean;
    persistent: boolean;
    env: string[];
}
export interface CachingConfig {
    enabled: boolean;
    globalDependencies: string[];
    outputMode: 'full' | 'hash-only' | 'new-only';
    remoteCache?: {
        enabled: boolean;
        provider: string;
    };
}
export interface DependencyConfig {
    package: string;
    dependsOn: string[];
    type: 'workspace' | 'external';
}
export interface MonorepoEffectiveness {
    score: number;
    issues: string[];
    strengths: string[];
    utilizationRate: number;
}
export interface PackageScriptAnalysis {
    packageName: string;
    packagePath: string;
    scripts: ScriptDefinition[];
    redundantScripts: string[];
    missingStandardScripts: string[];
    complexScripts: string[];
    scriptPatterns: ScriptPattern[];
}
export interface ScriptDefinition {
    name: string;
    command: string;
    category: ScriptCategory;
    complexity: number;
    dependencies: string[];
    isStandard: boolean;
    hasAlternatives: boolean;
}
export interface ScriptPattern {
    pattern: string;
    packages: string[];
    frequency: number;
    shouldBeStandardized: boolean;
}
export type ScriptCategory = 'build' | 'dev' | 'test' | 'lint' | 'format' | 'deploy' | 'clean' | 'start' | 'custom';
export interface BuildConfiguration {
    type: 'webpack' | 'vite' | 'rollup' | 'esbuild' | 'tsc' | 'babel' | 'other';
    configPath: string;
    packageName: string;
    targets: BuildTarget[];
    plugins: Plugin[];
    optimization: OptimizationConfig;
    performance: PerformanceConfig;
    conflicts: ConfigConflict[];
}
export interface BuildTarget {
    name: string;
    format: 'esm' | 'cjs' | 'umd' | 'iife';
    platform: 'browser' | 'node' | 'neutral';
    outputPath: string;
    minify: boolean;
    sourcemap: boolean;
}
export interface Plugin {
    name: string;
    version?: string;
    config: any;
    purpose: string;
}
export interface OptimizationConfig {
    minification: boolean;
    treeshaking: boolean;
    codesplitting: boolean;
    bundleAnalysis: boolean;
    compressionEnabled: boolean;
}
export interface PerformanceConfig {
    parallelBuilds: boolean;
    incrementalBuilds: boolean;
    watchMode: boolean;
    hotReload: boolean;
    buildCache: boolean;
}
export interface ConfigConflict {
    type: 'duplicate_plugin' | 'conflicting_target' | 'incompatible_settings';
    description: string;
    severity: 'low' | 'medium' | 'high';
    affectedConfigs: string[];
}
export interface RedundantConfiguration {
    type: 'duplicate_build_config' | 'redundant_script' | 'unused_dependency';
    description: string;
    affectedFiles: string[];
    consolidationSuggestion: string;
    estimatedSavings: string;
}
export interface PerformanceIssue {
    type: 'slow_build' | 'large_bundle' | 'inefficient_caching' | 'redundant_processing';
    description: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    affectedPackages: string[];
    suggestedFix: string;
    estimatedImprovement: string;
}
export interface OptimizationOpportunity {
    category: 'caching' | 'parallelization' | 'bundling' | 'dependencies' | 'tooling';
    description: string;
    implementation: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    estimatedTimeReduction: string;
}
export interface BuildSystemRecommendation {
    type: 'consolidation' | 'optimization' | 'standardization' | 'tooling_upgrade';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    implementation: string;
    benefits: string[];
    risks: string[];
    effort: 'low' | 'medium' | 'high';
}
export declare class BuildSystemAnalyzer {
    private rootPath;
    constructor(rootPath?: string);
    analyzeBuildSystem(): Promise<BuildSystemAnalysis>;
    private analyzeMonorepoConfig;
    private analyzeTurboConfig;
    private analyzeLernaConfig;
    private analyzeNxConfig;
    private assessTurboEffectiveness;
    private getDefaultMonorepoConfig;
    private analyzePackageScripts;
    private analyzePackageJson;
    private categorizeScript;
    private calculateScriptComplexity;
    private extractScriptDependencies;
    private isStandardScript;
    private findRedundantScripts;
    private findMissingStandardScripts;
    private identifyScriptPatterns;
    private normalizeScriptCommand;
    private analyzeBuildConfigurations;
    private findBuildConfigFiles;
    private analyzeBuildConfigFile;
    private analyzeWebpackConfig;
    private analyzeViteConfig;
    private analyzeTsConfig;
    private getPackageNameFromPath;
    private identifyRedundantConfigurations;
    private identifyPerformanceIssues;
    private findOptimizationOpportunities;
    private generateBuildSystemRecommendations;
    private fileExists;
    private findPackageJsonFiles;
}
//# sourceMappingURL=BuildSystemAnalyzer.d.ts.map
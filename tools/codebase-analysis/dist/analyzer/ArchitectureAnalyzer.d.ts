import { PackageInfo } from '../scanner/FileSystemScanner';
export interface PackageRedundancyAnalysis {
    packageName: string;
    packagePath: string;
    functionality: FunctionalitySignature;
    redundancyScore: number;
    consolidationCandidates: ConsolidationCandidate[];
    similarPackages: SimilarPackage[];
    recommendedAction: ConsolidationAction;
}
export interface FunctionalitySignature {
    exportedFunctions: string[];
    exportedClasses: string[];
    exportedTypes: string[];
    exportedConstants: string[];
    mainPurpose: string;
    keywords: string[];
    dependencies: string[];
}
export interface ConsolidationCandidate {
    targetPackage: string;
    similarityScore: number;
    reason: string;
    effort: 'low' | 'medium' | 'high';
    benefits: string[];
    risks: string[];
}
export interface SimilarPackage {
    name: string;
    similarityScore: number;
    commonFunctionality: string[];
    differences: string[];
}
export interface ConsolidationAction {
    action: 'merge' | 'absorb' | 'split' | 'keep' | 'remove';
    target?: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedEffort: string;
    description: string;
}
export interface ApplicationLayerAnalysis {
    applicationName: string;
    applicationPath: string;
    routes: RouteInfo[];
    middleware: MiddlewareInfo[];
    services: ServiceInfo[];
    authMethods: AuthMethodInfo[];
    databaseAccess: DatabaseAccessInfo[];
    redundancyWithOtherApps: ApplicationRedundancy[];
    consolidationRecommendation: ApplicationConsolidationRecommendation;
}
export interface RouteInfo {
    method: string;
    path: string;
    handler: string;
    middleware: string[];
    filePath: string;
    lineNumber: number;
}
export interface MiddlewareInfo {
    name: string;
    purpose: string;
    filePath: string;
    usedInRoutes: string[];
}
export interface ServiceInfo {
    name: string;
    methods: string[];
    dependencies: string[];
    filePath: string;
    purpose: string;
}
export interface AuthMethodInfo {
    type: 'jwt' | 'session' | 'oauth' | 'basic' | 'custom';
    implementation: string;
    filePath: string;
    usedInRoutes: string[];
}
export interface DatabaseAccessInfo {
    model: string;
    operations: string[];
    filePath: string;
    queryPatterns: string[];
}
export interface ApplicationRedundancy {
    otherApp: string;
    duplicatedRoutes: RouteInfo[];
    duplicatedServices: ServiceInfo[];
    duplicatedMiddleware: MiddlewareInfo[];
    overlapScore: number;
}
export interface ApplicationConsolidationRecommendation {
    action: 'merge_into' | 'absorb' | 'keep_separate' | 'split_functionality';
    target?: string;
    reasoning: string;
    benefits: string[];
    challenges: string[];
    estimatedEffort: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
}
export interface UIPackageAnalysis {
    packageName: string;
    packagePath: string;
    components: ComponentInfo[];
    styles: StyleInfo[];
    utilities: UtilityInfo[];
    dependencies: string[];
    redundancyWithOtherUI: UIRedundancy[];
    consolidationRecommendation: UIConsolidationRecommendation;
}
export interface ComponentInfo {
    name: string;
    type: 'functional' | 'class' | 'hook' | 'hoc';
    props: string[];
    filePath: string;
    dependencies: string[];
    complexity: 'simple' | 'medium' | 'complex';
    reusability: 'high' | 'medium' | 'low';
}
export interface StyleInfo {
    type: 'css' | 'scss' | 'styled-components' | 'emotion' | 'tailwind';
    filePath: string;
    classes: string[];
    variables: string[];
    mixins: string[];
}
export interface UtilityInfo {
    name: string;
    purpose: string;
    filePath: string;
    dependencies: string[];
    usageCount: number;
}
export interface UIRedundancy {
    otherPackage: string;
    duplicatedComponents: ComponentInfo[];
    duplicatedStyles: StyleInfo[];
    duplicatedUtilities: UtilityInfo[];
    overlapScore: number;
}
export interface UIConsolidationRecommendation {
    action: 'merge_into' | 'create_shared_library' | 'keep_separate' | 'extract_common';
    target?: string;
    reasoning: string;
    benefits: string[];
    challenges: string[];
    estimatedEffort: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
}
export interface DatabaseLayerAnalysis {
    packageName: string;
    packagePath: string;
    schemas: SchemaInfo[];
    models: ModelInfo[];
    accessPatterns: AccessPatternInfo[];
    migrations: MigrationInfo[];
    redundancyWithOtherDB: DatabaseRedundancy[];
    consolidationRecommendation: DatabaseConsolidationRecommendation;
}
export interface SchemaInfo {
    name: string;
    filePath: string;
    tables: string[];
    relationships: RelationshipInfo[];
    indexes: string[];
}
export interface ModelInfo {
    name: string;
    filePath: string;
    fields: FieldInfo[];
    relationships: string[];
    usageCount: number;
    isUsed: boolean;
}
export interface FieldInfo {
    name: string;
    type: string;
    isOptional: boolean;
    isUnique: boolean;
    hasDefault: boolean;
}
export interface RelationshipInfo {
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    targetModel: string;
    foreignKey?: string;
}
export interface AccessPatternInfo {
    model: string;
    operation: 'create' | 'read' | 'update' | 'delete' | 'query';
    frequency: 'high' | 'medium' | 'low';
    filePath: string;
    queryComplexity: 'simple' | 'medium' | 'complex';
}
export interface MigrationInfo {
    name: string;
    filePath: string;
    operations: string[];
    isApplied: boolean;
}
export interface DatabaseRedundancy {
    otherPackage: string;
    duplicatedModels: ModelInfo[];
    duplicatedSchemas: SchemaInfo[];
    overlapScore: number;
}
export interface DatabaseConsolidationRecommendation {
    action: 'merge_schemas' | 'consolidate_models' | 'keep_separate' | 'extract_shared';
    target?: string;
    reasoning: string;
    benefits: string[];
    challenges: string[];
    estimatedEffort: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
}
export interface ArchitectureAnalysisResult {
    packageRedundancy: PackageRedundancyAnalysis[];
    applicationLayer: ApplicationLayerAnalysis[];
    uiPackages: UIPackageAnalysis[];
    databaseLayer: DatabaseLayerAnalysis[];
    overallRecommendations: OverallRecommendation[];
    consolidationPlan: ConsolidationPlan;
}
export interface OverallRecommendation {
    category: 'package' | 'application' | 'ui' | 'database' | 'build' | 'architecture';
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    benefits: string[];
    estimatedEffort: string;
    dependencies: string[];
}
export interface ConsolidationPlan {
    phases: ConsolidationPhase[];
    totalEstimatedEffort: string;
    expectedBenefits: string[];
    risks: string[];
}
export interface ConsolidationPhase {
    name: string;
    order: number;
    tasks: ConsolidationTask[];
    estimatedDuration: string;
    dependencies: string[];
}
export interface ConsolidationTask {
    name: string;
    type: 'merge' | 'move' | 'refactor' | 'remove' | 'create';
    source?: string;
    target?: string;
    description: string;
    estimatedEffort: string;
    prerequisites: string[];
}
export declare class ArchitectureAnalyzer {
    private packages;
    private apps;
    constructor(packages: PackageInfo[], apps: PackageInfo[]);
    analyzeArchitecture(): Promise<ArchitectureAnalysisResult>;
    analyzePackageRedundancy(): Promise<PackageRedundancyAnalysis[]>;
    private extractFunctionalitySignature;
    private findSimilarPackages;
    private calculateSimilarityScore;
    private findCommonFunctionality;
    private findDifferences;
    private calculateRedundancyScore;
    private generateConsolidationCandidates;
    private determineRecommendedAction;
    analyzeApplicationLayer(): Promise<ApplicationLayerAnalysis[]>;
    analyzeUIPackages(): Promise<UIPackageAnalysis[]>;
    analyzeDatabaseLayer(): Promise<DatabaseLayerAnalysis[]>;
    private generateOverallRecommendations;
    private generateConsolidationPlan;
}
//# sourceMappingURL=ArchitectureAnalyzer.d.ts.map
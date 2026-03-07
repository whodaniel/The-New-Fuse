import * as fs from 'fs/promises';
import * as path from 'path';
import { FileInfo, PackageInfo } from '../scanner/FileSystemScanner';

// Core interfaces for architecture analysis
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

export class ArchitectureAnalyzer {
  private packages: PackageInfo[];
  private apps: PackageInfo[];

  constructor(packages: PackageInfo[], apps: PackageInfo[]) {
    this.packages = packages;
    this.apps = apps;
  }

  async analyzeArchitecture(): Promise<ArchitectureAnalysisResult> {
    console.log('Starting architecture analysis...');

    const packageRedundancy = await this.analyzePackageRedundancy();
    const applicationLayer = await this.analyzeApplicationLayer();
    const uiPackages = await this.analyzeUIPackages();
    const databaseLayer = await this.analyzeDatabaseLayer();
    
    const overallRecommendations = this.generateOverallRecommendations(
      packageRedundancy, applicationLayer, uiPackages, databaseLayer
    );
    
    const consolidationPlan = this.generateConsolidationPlan(
      packageRedundancy, applicationLayer, uiPackages, databaseLayer
    );

    return {
      packageRedundancy,
      applicationLayer,
      uiPackages,
      databaseLayer,
      overallRecommendations,
      consolidationPlan
    };
  }

  async analyzePackageRedundancy(): Promise<PackageRedundancyAnalysis[]> {
    console.log('Analyzing package redundancy...');
    const results: PackageRedundancyAnalysis[] = [];

    for (const pkg of this.packages) {
      const functionality = await this.extractFunctionalitySignature(pkg);
      const similarPackages = await this.findSimilarPackages(pkg, functionality);
      const redundancyScore = this.calculateRedundancyScore(pkg, similarPackages);
      const consolidationCandidates = this.generateConsolidationCandidates(pkg, similarPackages);
      const recommendedAction = this.determineRecommendedAction(pkg, redundancyScore, consolidationCandidates);

      results.push({
        packageName: pkg.name,
        packagePath: pkg.path,
        functionality,
        redundancyScore,
        consolidationCandidates,
        similarPackages,
        recommendedAction
      });
    }

    return results;
  }

  private async extractFunctionalitySignature(pkg: PackageInfo): Promise<FunctionalitySignature> {
    const signature: FunctionalitySignature = {
      exportedFunctions: [],
      exportedClasses: [],
      exportedTypes: [],
      exportedConstants: [],
      mainPurpose: '',
      keywords: [],
      dependencies: []
    };

    try {
      // Read package.json for basic info
      const packageJsonPath = path.join(pkg.path, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      signature.dependencies = Object.keys({
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      });
      
      signature.mainPurpose = packageJson.description || '';
      signature.keywords = packageJson.keywords || [];

      // Extract keywords from package name
      const nameKeywords = pkg.name.toLowerCase().split(/[-_]/);
      signature.keywords.push(...nameKeywords);
      signature.keywords = [...new Set(signature.keywords.filter(k => k.length > 2))];

    } catch (error) {
      console.warn(`Failed to extract functionality signature for ${pkg.name}:`, error);
    }

    return signature;
  }

  private async findSimilarPackages(pkg: PackageInfo, functionality: FunctionalitySignature): Promise<SimilarPackage[]> {
    const similarPackages: SimilarPackage[] = [];

    for (const otherPkg of this.packages) {
      if (otherPkg.name === pkg.name) continue;

      const otherFunctionality = await this.extractFunctionalitySignature(otherPkg);
      const similarityScore = this.calculateSimilarityScore(functionality, otherFunctionality);

      if (similarityScore > 30) {
        const commonFunctionality = this.findCommonFunctionality(functionality, otherFunctionality);
        const differences = this.findDifferences(functionality, otherFunctionality);

        similarPackages.push({
          name: otherPkg.name,
          similarityScore,
          commonFunctionality,
          differences
        });
      }
    }

    return similarPackages.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  private calculateSimilarityScore(func1: FunctionalitySignature, func2: FunctionalitySignature): number {
    let score = 0;

    // Compare keywords (main factor)
    const keywordIntersection = func1.keywords.filter(k => func2.keywords.includes(k));
    const keywordUnion = [...new Set([...func1.keywords, ...func2.keywords])];
    if (keywordUnion.length > 0) {
      score += (keywordIntersection.length / keywordUnion.length) * 70;
    }

    // Compare dependencies
    const depIntersection = func1.dependencies.filter(d => func2.dependencies.includes(d));
    const depUnion = [...new Set([...func1.dependencies, ...func2.dependencies])];
    if (depUnion.length > 0) {
      score += (depIntersection.length / depUnion.length) * 30;
    }

    return Math.round(score);
  }

  private findCommonFunctionality(func1: FunctionalitySignature, func2: FunctionalitySignature): string[] {
    const common: string[] = [];
    common.push(...func1.keywords.filter(k => func2.keywords.includes(k)));
    return [...new Set(common)];
  }

  private findDifferences(func1: FunctionalitySignature, func2: FunctionalitySignature): string[] {
    const differences: string[] = [];
    differences.push(...func1.keywords.filter(k => !func2.keywords.includes(k)));
    return differences;
  }

  private calculateRedundancyScore(pkg: PackageInfo, similarPackages: SimilarPackage[]): number {
    if (similarPackages.length === 0) return 0;
    const maxSimilarity = Math.max(...similarPackages.map(p => p.similarityScore));
    const countMultiplier = Math.min(similarPackages.length * 10, 30);
    return Math.min(maxSimilarity + countMultiplier, 100);
  }

  private generateConsolidationCandidates(pkg: PackageInfo, similarPackages: SimilarPackage[]): ConsolidationCandidate[] {
    const candidates: ConsolidationCandidate[] = [];

    for (const similar of similarPackages.slice(0, 3)) {
      if (similar.similarityScore < 50) continue;

      candidates.push({
        targetPackage: similar.name,
        similarityScore: similar.similarityScore,
        reason: `High similarity (${similar.similarityScore}%) with overlapping functionality`,
        effort: similar.similarityScore > 80 ? 'low' : 'medium',
        benefits: ['Reduced code duplication', 'Simplified maintenance'],
        risks: ['Breaking changes for consumers', 'Migration effort required']
      });
    }

    return candidates;
  }

  private determineRecommendedAction(pkg: PackageInfo, redundancyScore: number, candidates: ConsolidationCandidate[]): ConsolidationAction {
    if (redundancyScore > 80 && candidates.length > 0) {
      return {
        action: 'merge',
        target: candidates[0].targetPackage,
        priority: 'high',
        estimatedEffort: '1-2 weeks',
        description: `Merge into ${candidates[0].targetPackage} due to high redundancy (${redundancyScore}%)`
      };
    }

    if (redundancyScore > 60) {
      return {
        action: 'absorb',
        target: candidates[0]?.targetPackage,
        priority: 'medium',
        estimatedEffort: '3-7 days',
        description: `Consider absorbing functionality into ${candidates[0]?.targetPackage || 'a related package'}`
      };
    }

    return {
      action: 'keep',
      priority: 'low',
      estimatedEffort: '0 days',
      description: 'Package has unique functionality and should be kept'
    };
  } 
 async analyzeApplicationLayer(): Promise<ApplicationLayerAnalysis[]> {
    console.log('Analyzing application layer...');
    const results: ApplicationLayerAnalysis[] = [];

    for (const app of this.apps) {
      results.push({
        applicationName: app.name,
        applicationPath: app.path,
        routes: [], // Simplified for now
        middleware: [],
        services: [],
        authMethods: [],
        databaseAccess: [],
        redundancyWithOtherApps: [],
        consolidationRecommendation: {
          action: 'keep_separate',
          reasoning: 'Analysis not yet implemented',
          benefits: [],
          challenges: [],
          estimatedEffort: '0 days',
          priority: 'low'
        }
      });
    }

    return results;
  }

  async analyzeUIPackages(): Promise<UIPackageAnalysis[]> {
    console.log('Analyzing UI packages...');
    const results: UIPackageAnalysis[] = [];
    
    const uiPackages = this.packages.filter(pkg => 
      pkg.name.includes('ui') || 
      pkg.name.includes('component') || 
      pkg.name.includes('frontend')
    );

    for (const pkg of uiPackages) {
      results.push({
        packageName: pkg.name,
        packagePath: pkg.path,
        components: [], // Simplified for now
        styles: [],
        utilities: [],
        dependencies: [],
        redundancyWithOtherUI: [],
        consolidationRecommendation: {
          action: 'keep_separate',
          reasoning: 'Analysis not yet implemented',
          benefits: [],
          challenges: [],
          estimatedEffort: '0 days',
          priority: 'low'
        }
      });
    }

    return results;
  }

  async analyzeDatabaseLayer(): Promise<DatabaseLayerAnalysis[]> {
    console.log('Analyzing database layer...');
    const results: DatabaseLayerAnalysis[] = [];
    
    const dbPackages = this.packages.filter(pkg => 
      pkg.name.includes('database') || 
      pkg.name.includes('db') || 
      pkg.name.includes('drizzle')
    );

    for (const pkg of dbPackages) {
      results.push({
        packageName: pkg.name,
        packagePath: pkg.path,
        schemas: [], // Simplified for now
        models: [],
        accessPatterns: [],
        migrations: [],
        redundancyWithOtherDB: [],
        consolidationRecommendation: {
          action: 'keep_separate',
          reasoning: 'Analysis not yet implemented',
          benefits: [],
          challenges: [],
          estimatedEffort: '0 days',
          priority: 'low'
        }
      });
    }

    return results;
  }

  private generateOverallRecommendations(
    packageRedundancy: PackageRedundancyAnalysis[],
    applicationLayer: ApplicationLayerAnalysis[],
    uiPackages: UIPackageAnalysis[],
    databaseLayer: DatabaseLayerAnalysis[]
  ): OverallRecommendation[] {
    const recommendations: OverallRecommendation[] = [];

    // Package consolidation recommendations
    const highRedundancyPackages = packageRedundancy.filter(p => p.redundancyScore > 70);
    if (highRedundancyPackages.length > 0) {
      recommendations.push({
        category: 'package',
        priority: 'critical',
        title: 'Consolidate highly redundant packages',
        description: `${highRedundancyPackages.length} packages have high redundancy scores and should be consolidated`,
        benefits: ['Reduced codebase complexity', 'Easier maintenance', 'Smaller bundle sizes'],
        estimatedEffort: '2-4 weeks',
        dependencies: ['Package dependency analysis', 'Consumer impact assessment']
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private generateConsolidationPlan(
    packageRedundancy: PackageRedundancyAnalysis[],
    applicationLayer: ApplicationLayerAnalysis[],
    uiPackages: UIPackageAnalysis[],
    databaseLayer: DatabaseLayerAnalysis[]
  ): ConsolidationPlan {
    const phases: ConsolidationPhase[] = [];

    // Phase 1: Package consolidation
    const packageTasks: ConsolidationTask[] = [];
    const mergeCandidates = packageRedundancy.filter(p => p.recommendedAction.action === 'merge');
    
    for (const candidate of mergeCandidates) {
      packageTasks.push({
        name: `Merge ${candidate.packageName} into ${candidate.recommendedAction.target}`,
        type: 'merge',
        source: candidate.packageName,
        target: candidate.recommendedAction.target,
        description: candidate.recommendedAction.description,
        estimatedEffort: candidate.recommendedAction.estimatedEffort,
        prerequisites: ['Dependency analysis', 'Consumer notification']
      });
    }

    if (packageTasks.length > 0) {
      phases.push({
        name: 'Package Consolidation',
        order: 1,
        tasks: packageTasks,
        estimatedDuration: '2-4 weeks',
        dependencies: []
      });
    }

    const totalEstimatedEffort = phases.length > 0 ? '2-4 weeks' : '0 weeks';
    const expectedBenefits = [
      'Reduced maintenance overhead',
      'Simplified dependency management',
      'Improved code consistency'
    ];
    const risks = phases.length > 0 ? [
      'Breaking changes for package consumers',
      'Temporary development velocity reduction'
    ] : [];

    return {
      phases,
      totalEstimatedEffort,
      expectedBenefits,
      risks
    };
  }
}
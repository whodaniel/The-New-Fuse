import * as fs from 'fs/promises';
import * as path from 'path';

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
  score: number; // 0-100
  issues: string[];
  strengths: string[];
  utilizationRate: number; // How well the monorepo tools are being used
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

export type ScriptCategory = 
  | 'build' 
  | 'dev' 
  | 'test' 
  | 'lint' 
  | 'format' 
  | 'deploy' 
  | 'clean' 
  | 'start'
  | 'custom';

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

export class BuildSystemAnalyzer {
  private rootPath: string;
  
  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
  }

  async analyzeBuildSystem(): Promise<BuildSystemAnalysis> {
    console.log('Starting build system analysis...');
    
    // Analyze monorepo configuration
    const monorepoConfig = await this.analyzeMonorepoConfig();
    
    // Analyze package scripts
    const packageScripts = await this.analyzePackageScripts();
    
    // Analyze build configurations
    const buildConfigurations = await this.analyzeBuildConfigurations();
    
    // Identify redundant configurations
    const redundantConfigurations = this.identifyRedundantConfigurations(
      packageScripts, 
      buildConfigurations
    );
    
    // Identify performance issues
    const performanceIssues = this.identifyPerformanceIssues(
      monorepoConfig, 
      buildConfigurations
    );
    
    // Find optimization opportunities
    const optimizationOpportunities = this.findOptimizationOpportunities(
      monorepoConfig, 
      packageScripts, 
      buildConfigurations
    );
    
    // Generate recommendations
    const recommendations = this.generateBuildSystemRecommendations(
      monorepoConfig,
      redundantConfigurations,
      performanceIssues,
      optimizationOpportunities
    );
    
    return {
      monorepoConfig,
      packageScripts,
      buildConfigurations,
      redundantConfigurations,
      performanceIssues,
      optimizationOpportunities,
      recommendations
    };
  }

  private async analyzeMonorepoConfig(): Promise<MonorepoConfig> {
    // Check for Turbo config
    const turboConfigPath = path.join(this.rootPath, 'turbo.json');
    if (await this.fileExists(turboConfigPath)) {
      return await this.analyzeTurboConfig(turboConfigPath);
    }
    
    // Check for Lerna config
    const lernaConfigPath = path.join(this.rootPath, 'lerna.json');
    if (await this.fileExists(lernaConfigPath)) {
      return await this.analyzeLernaConfig(lernaConfigPath);
    }
    
    // Check for NX config
    const nxConfigPath = path.join(this.rootPath, 'nx.json');
    if (await this.fileExists(nxConfigPath)) {
      return await this.analyzeNxConfig(nxConfigPath);
    }
    
    // No monorepo tool detected
    return {
      tool: 'none',
      pipelines: [],
      caching: { enabled: false, globalDependencies: [], outputMode: 'full' },
      dependencies: [],
      effectiveness: {
        score: 0,
        issues: ['No monorepo tool configured'],
        strengths: [],
        utilizationRate: 0
      }
    };
  }

  private async analyzeTurboConfig(configPath: string): Promise<MonorepoConfig> {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      
      const pipelines: Pipeline[] = [];
      if (config.pipeline) {
        for (const [name, pipelineConfig] of Object.entries(config.pipeline)) {
          pipelines.push({
            name,
            dependsOn: (pipelineConfig as any).dependsOn || [],
            outputs: (pipelineConfig as any).outputs || [],
            inputs: (pipelineConfig as any).inputs || [],
            cache: (pipelineConfig as any).cache !== false,
            persistent: (pipelineConfig as any).persistent || false,
            env: (pipelineConfig as any).env || []
          });
        }
      }
      
      const caching: CachingConfig = {
        enabled: true,
        globalDependencies: config.globalDependencies || [],
        outputMode: config.outputMode || 'full',
        remoteCache: config.remoteCache ? {
          enabled: true,
          provider: 'turbo'
        } : undefined
      };
      
      const effectiveness = this.assessTurboEffectiveness(config, pipelines);
      
      return {
        tool: 'turbo',
        configPath,
        pipelines,
        caching,
        dependencies: [],
        effectiveness
      };
    } catch (error) {
      console.warn('Failed to parse turbo.json:', error);
      return this.getDefaultMonorepoConfig();
    }
  }

  private async analyzeLernaConfig(configPath: string): Promise<MonorepoConfig> {
    // Simplified Lerna analysis
    return {
      tool: 'lerna',
      configPath,
      pipelines: [],
      caching: { enabled: false, globalDependencies: [], outputMode: 'full' },
      dependencies: [],
      effectiveness: {
        score: 40,
        issues: ['Lerna is less efficient than modern tools like Turbo'],
        strengths: ['Established tool with good ecosystem support'],
        utilizationRate: 60
      }
    };
  }

  private async analyzeNxConfig(configPath: string): Promise<MonorepoConfig> {
    // Simplified NX analysis
    return {
      tool: 'nx',
      configPath,
      pipelines: [],
      caching: { enabled: true, globalDependencies: [], outputMode: 'full' },
      dependencies: [],
      effectiveness: {
        score: 85,
        issues: [],
        strengths: ['Advanced caching', 'Dependency graph analysis', 'Code generation'],
        utilizationRate: 80
      }
    };
  }

  private assessTurboEffectiveness(config: any, pipelines: Pipeline[]): MonorepoEffectiveness {
    let score = 50; // Base score
    const issues: string[] = [];
    const strengths: string[] = [];
    
    // Check pipeline configuration
    if (pipelines.length === 0) {
      issues.push('No pipelines configured');
      score -= 20;
    } else {
      strengths.push(`${pipelines.length} pipelines configured`);
      score += Math.min(pipelines.length * 5, 20);
    }
    
    // Check caching
    const cachingPipelines = pipelines.filter(p => p.cache);
    if (cachingPipelines.length === 0) {
      issues.push('No caching configured');
      score -= 15;
    } else {
      strengths.push('Build caching enabled');
      score += 15;
    }
    
    // Check remote caching
    if (config.remoteCache) {
      strengths.push('Remote caching configured');
      score += 10;
    }
    
    // Check dependency optimization
    const pipelinesWithDeps = pipelines.filter(p => p.dependsOn.length > 0);
    if (pipelinesWithDeps.length > 0) {
      strengths.push('Pipeline dependencies configured');
      score += 10;
    }
    
    const utilizationRate = Math.min(score, 100);
    
    return {
      score: Math.max(0, Math.min(score, 100)),
      issues,
      strengths,
      utilizationRate
    };
  }

  private getDefaultMonorepoConfig(): MonorepoConfig {
    return {
      tool: 'none',
      pipelines: [],
      caching: { enabled: false, globalDependencies: [], outputMode: 'full' },
      dependencies: [],
      effectiveness: {
        score: 0,
        issues: ['No monorepo configuration found'],
        strengths: [],
        utilizationRate: 0
      }
    };
  }

  private async analyzePackageScripts(): Promise<PackageScriptAnalysis[]> {
    const packagePaths = await this.findPackageJsonFiles();
    const analyses: PackageScriptAnalysis[] = [];
    
    for (const packagePath of packagePaths) {
      try {
        const analysis = await this.analyzePackageJson(packagePath);
        analyses.push(analysis);
      } catch (error) {
        console.warn(`Failed to analyze package.json at ${packagePath}:`, error);
      }
    }
    
    // Identify script patterns across packages
    this.identifyScriptPatterns(analyses);
    
    return analyses;
  }

  private async analyzePackageJson(packagePath: string): Promise<PackageScriptAnalysis> {
    const content = await fs.readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(content);
    const packageName = packageJson.name || path.dirname(packagePath);
    
    const scripts: ScriptDefinition[] = [];
    if (packageJson.scripts) {
      for (const [name, command] of Object.entries(packageJson.scripts)) {
        scripts.push({
          name,
          command: command as string,
          category: this.categorizeScript(name, command as string),
          complexity: this.calculateScriptComplexity(command as string),
          dependencies: this.extractScriptDependencies(command as string),
          isStandard: this.isStandardScript(name),
          hasAlternatives: false // Will be set later
        });
      }
    }
    
    const redundantScripts = this.findRedundantScripts(scripts);
    const missingStandardScripts = this.findMissingStandardScripts(scripts);
    const complexScripts = scripts.filter(s => s.complexity > 5).map(s => s.name);
    
    return {
      packageName,
      packagePath,
      scripts,
      redundantScripts,
      missingStandardScripts,
      complexScripts,
      scriptPatterns: [] // Will be populated later
    };
  }

  private categorizeScript(name: string, command: string): ScriptCategory {
    const nameLower = name.toLowerCase();
    const commandLower = command.toLowerCase();
    
    if (nameLower.includes('build') || commandLower.includes('build')) return 'build';
    if (nameLower.includes('dev') || commandLower.includes('dev')) return 'dev';
    if (nameLower.includes('test') || commandLower.includes('test')) return 'test';
    if (nameLower.includes('lint') || commandLower.includes('lint')) return 'lint';
    if (nameLower.includes('format') || commandLower.includes('prettier')) return 'format';
    if (nameLower.includes('deploy') || commandLower.includes('deploy')) return 'deploy';
    if (nameLower.includes('clean') || commandLower.includes('clean')) return 'clean';
    if (nameLower.includes('start') || commandLower.includes('start')) return 'start';
    
    return 'custom';
  }

  private calculateScriptComplexity(command: string): number {
    let complexity = 1;
    
    // Count command chaining
    complexity += (command.match(/&&/g) || []).length;
    complexity += (command.match(/\|\|/g) || []).length;
    complexity += (command.match(/;/g) || []).length;
    
    // Count pipes
    complexity += (command.match(/\|/g) || []).length;
    
    // Count conditionals
    complexity += (command.match(/if\s/g) || []).length;
    
    return Math.min(complexity, 10);
  }

  private extractScriptDependencies(command: string): string[] {
    const dependencies: string[] = [];
    
    // Extract npm/yarn/pnpm commands
    const packageManagers = command.match(/(npm|yarn|pnpm)\s+\w+/g);
    if (packageManagers) {
      dependencies.push(...packageManagers);
    }
    
    // Extract binary dependencies
    const binaries = command.match(/\b([a-z\-]+)\s/g);
    if (binaries) {
      dependencies.push(...binaries.map(b => b.trim()));
    }
    
    return [...new Set(dependencies)];
  }

  private isStandardScript(name: string): boolean {
    const standardScripts = [
      'build', 'dev', 'start', 'test', 'lint', 'format', 
      'clean', 'install', 'prepare', 'prepublish'
    ];
    return standardScripts.includes(name);
  }

  private findRedundantScripts(scripts: ScriptDefinition[]): string[] {
    const redundant: string[] = [];
    const commandMap = new Map<string, string[]>();
    
    for (const script of scripts) {
      const normalizedCommand = script.command.trim().toLowerCase();
      if (!commandMap.has(normalizedCommand)) {
        commandMap.set(normalizedCommand, []);
      }
      commandMap.get(normalizedCommand)!.push(script.name);
    }
    
    for (const [command, scriptNames] of commandMap) {
      if (scriptNames.length > 1) {
        redundant.push(...scriptNames.slice(1)); // Keep first, mark others as redundant
      }
    }
    
    return redundant;
  }

  private findMissingStandardScripts(scripts: ScriptDefinition[]): string[] {
    const standardScripts = ['build', 'dev', 'test', 'lint'];
    const existingScripts = new Set(scripts.map(s => s.name));
    
    return standardScripts.filter(script => !existingScripts.has(script));
  }

  private identifyScriptPatterns(analyses: PackageScriptAnalysis[]): void {
    const patternMap = new Map<string, string[]>();
    
    for (const analysis of analyses) {
      for (const script of analysis.scripts) {
        const pattern = this.normalizeScriptCommand(script.command);
        if (!patternMap.has(pattern)) {
          patternMap.set(pattern, []);
        }
        patternMap.get(pattern)!.push(analysis.packageName);
      }
    }
    
    // Update analyses with patterns
    for (const analysis of analyses) {
      const patterns: ScriptPattern[] = [];
      
      for (const script of analysis.scripts) {
        const pattern = this.normalizeScriptCommand(script.command);
        const packages = patternMap.get(pattern) || [];
        
        if (packages.length > 1) {
          patterns.push({
            pattern,
            packages,
            frequency: packages.length,
            shouldBeStandardized: packages.length > 3
          });
        }
      }
      
      analysis.scriptPatterns = patterns;
    }
  }

  private normalizeScriptCommand(command: string): string {
    // Normalize command for pattern matching
    return command
      .replace(/\s+/g, ' ')
      .replace(/--\w+=[^\s]+/g, '--flag') // Normalize flags
      .replace(/"[^"]*"/g, '"string"') // Normalize strings
      .trim();
  }

  private async analyzeBuildConfigurations(): Promise<BuildConfiguration[]> {
    const configurations: BuildConfiguration[] = [];
    
    // Find build configuration files
    const configFiles = await this.findBuildConfigFiles();
    
    for (const configFile of configFiles) {
      try {
        const config = await this.analyzeBuildConfigFile(configFile);
        if (config) {
          configurations.push(config);
        }
      } catch (error) {
        console.warn(`Failed to analyze build config ${configFile}:`, error);
      }
    }
    
    return configurations;
  }

  private async findBuildConfigFiles(): Promise<string[]> {
    const configFiles: string[] = [];
    const configPatterns = [
      'webpack.config.js', 'webpack.config.ts',
      'vite.config.js', 'vite.config.ts',
      'rollup.config.js', 'rollup.config.ts',
      'tsconfig.json', 'tsconfig.build.json',
      'babel.config.js', '.babelrc'
    ];
    
    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !['node_modules', '.git', 'dist'].includes(entry.name)) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && configPatterns.includes(entry.name)) {
            configFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    await scanDirectory(this.rootPath);
    return configFiles;
  }

  private async analyzeBuildConfigFile(configPath: string): Promise<BuildConfiguration | null> {
    const fileName = path.basename(configPath);
    const packageName = this.getPackageNameFromPath(configPath);
    
    if (fileName.startsWith('webpack')) {
      return this.analyzeWebpackConfig(configPath, packageName);
    } else if (fileName.startsWith('vite')) {
      return this.analyzeViteConfig(configPath, packageName);
    } else if (fileName.startsWith('tsconfig')) {
      return this.analyzeTsConfig(configPath, packageName);
    }
    
    return null;
  }

  private async analyzeWebpackConfig(configPath: string, packageName: string): Promise<BuildConfiguration> {
    // Simplified webpack config analysis
    return {
      type: 'webpack',
      configPath,
      packageName,
      targets: [{ name: 'main', format: 'cjs', platform: 'browser', outputPath: 'dist', minify: true, sourcemap: true }],
      plugins: [],
      optimization: {
        minification: true,
        treeshaking: true,
        codesplitting: false,
        bundleAnalysis: false,
        compressionEnabled: false
      },
      performance: {
        parallelBuilds: false,
        incrementalBuilds: false,
        watchMode: true,
        hotReload: true,
        buildCache: false
      },
      conflicts: []
    };
  }

  private async analyzeViteConfig(configPath: string, packageName: string): Promise<BuildConfiguration> {
    // Simplified vite config analysis
    return {
      type: 'vite',
      configPath,
      packageName,
      targets: [{ name: 'main', format: 'esm', platform: 'browser', outputPath: 'dist', minify: true, sourcemap: true }],
      plugins: [],
      optimization: {
        minification: true,
        treeshaking: true,
        codesplitting: true,
        bundleAnalysis: false,
        compressionEnabled: false
      },
      performance: {
        parallelBuilds: true,
        incrementalBuilds: true,
        watchMode: true,
        hotReload: true,
        buildCache: true
      },
      conflicts: []
    };
  }

  private async analyzeTsConfig(configPath: string, packageName: string): Promise<BuildConfiguration> {
    // Simplified TypeScript config analysis
    return {
      type: 'tsc',
      configPath,
      packageName,
      targets: [{ name: 'main', format: 'cjs', platform: 'node', outputPath: 'dist', minify: false, sourcemap: true }],
      plugins: [],
      optimization: {
        minification: false,
        treeshaking: false,
        codesplitting: false,
        bundleAnalysis: false,
        compressionEnabled: false
      },
      performance: {
        parallelBuilds: false,
        incrementalBuilds: true,
        watchMode: true,
        hotReload: false,
        buildCache: true
      },
      conflicts: []
    };
  }

  private getPackageNameFromPath(configPath: string): string {
    const relativePath = path.relative(this.rootPath, configPath);
    const parts = relativePath.split(path.sep);
    
    // Try to find package name from path
    if (parts.includes('packages') || parts.includes('apps')) {
      const index = parts.findIndex(p => p === 'packages' || p === 'apps');
      if (index >= 0 && index < parts.length - 1) {
        return parts[index + 1];
      }
    }
    
    return path.dirname(relativePath);
  }

  private identifyRedundantConfigurations(
    packageScripts: PackageScriptAnalysis[], 
    buildConfigurations: BuildConfiguration[]
  ): RedundantConfiguration[] {
    const redundant: RedundantConfiguration[] = [];
    
    // Find duplicate build configurations
    const configGroups = new Map<string, BuildConfiguration[]>();
    for (const config of buildConfigurations) {
      const key = `${config.type}-${JSON.stringify(config.targets)}`;
      if (!configGroups.has(key)) {
        configGroups.set(key, []);
      }
      configGroups.get(key)!.push(config);
    }
    
    for (const [key, configs] of configGroups) {
      if (configs.length > 1) {
        redundant.push({
          type: 'duplicate_build_config',
          description: `${configs.length} packages have identical ${configs[0].type} configurations`,
          affectedFiles: configs.map(c => c.configPath),
          consolidationSuggestion: 'Create shared build configuration',
          estimatedSavings: `${configs.length - 1} configuration files`
        });
      }
    }
    
    // Find redundant scripts across packages
    const scriptPatterns = new Map<string, string[]>();
    for (const analysis of packageScripts) {
      for (const pattern of analysis.scriptPatterns) {
        if (pattern.frequency > 2) {
          scriptPatterns.set(pattern.pattern, pattern.packages);
        }
      }
    }
    
    for (const [pattern, packages] of scriptPatterns) {
      redundant.push({
        type: 'redundant_script',
        description: `Script pattern repeated across ${packages.length} packages`,
        affectedFiles: packages.map(p => `${p}/package.json`),
        consolidationSuggestion: 'Move to root package.json or create shared script',
        estimatedSavings: `${packages.length - 1} script definitions`
      });
    }
    
    return redundant;
  }

  private identifyPerformanceIssues(
    monorepoConfig: MonorepoConfig, 
    buildConfigurations: BuildConfiguration[]
  ): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    
    // Check for missing caching
    if (!monorepoConfig.caching.enabled) {
      issues.push({
        type: 'inefficient_caching',
        description: 'Build caching is not enabled',
        impact: 'high',
        affectedPackages: ['all'],
        suggestedFix: 'Enable Turbo or NX caching',
        estimatedImprovement: '50-80% build time reduction'
      });
    }
    
    // Check for non-parallel builds
    const nonParallelConfigs = buildConfigurations.filter(c => !c.performance.parallelBuilds);
    if (nonParallelConfigs.length > 0) {
      issues.push({
        type: 'slow_build',
        description: `${nonParallelConfigs.length} packages not using parallel builds`,
        impact: 'medium',
        affectedPackages: nonParallelConfigs.map(c => c.packageName),
        suggestedFix: 'Enable parallel processing in build tools',
        estimatedImprovement: '20-40% build time reduction'
      });
    }
    
    // Check for missing incremental builds
    const nonIncrementalConfigs = buildConfigurations.filter(c => !c.performance.incrementalBuilds);
    if (nonIncrementalConfigs.length > 0) {
      issues.push({
        type: 'slow_build',
        description: `${nonIncrementalConfigs.length} packages not using incremental builds`,
        impact: 'medium',
        affectedPackages: nonIncrementalConfigs.map(c => c.packageName),
        suggestedFix: 'Enable incremental compilation',
        estimatedImprovement: '30-60% rebuild time reduction'
      });
    }
    
    return issues;
  }

  private findOptimizationOpportunities(
    monorepoConfig: MonorepoConfig,
    packageScripts: PackageScriptAnalysis[],
    buildConfigurations: BuildConfiguration[]
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];
    
    // Caching opportunities
    if (monorepoConfig.tool === 'none') {
      opportunities.push({
        category: 'caching',
        description: 'Implement monorepo build caching with Turbo',
        implementation: 'Add turbo.json configuration and update package scripts',
        effort: 'medium',
        impact: 'high',
        estimatedTimeReduction: '50-80% on subsequent builds'
      });
    }
    
    // Parallelization opportunities
    const sequentialBuilds = packageScripts.filter(p => 
      p.scripts.some(s => s.name === 'build' && s.command.includes('&&'))
    );
    if (sequentialBuilds.length > 0) {
      opportunities.push({
        category: 'parallelization',
        description: 'Convert sequential builds to parallel execution',
        implementation: 'Use build tools that support parallel processing',
        effort: 'low',
        impact: 'medium',
        estimatedTimeReduction: '20-40%'
      });
    }
    
    // Bundle optimization
    const unoptimizedConfigs = buildConfigurations.filter(c => 
      !c.optimization.treeshaking || !c.optimization.minification
    );
    if (unoptimizedConfigs.length > 0) {
      opportunities.push({
        category: 'bundling',
        description: 'Enable advanced bundling optimizations',
        implementation: 'Configure tree-shaking, minification, and code splitting',
        effort: 'low',
        impact: 'medium',
        estimatedTimeReduction: '10-30% bundle size reduction'
      });
    }
    
    return opportunities;
  }

  private generateBuildSystemRecommendations(
    monorepoConfig: MonorepoConfig,
    redundantConfigurations: RedundantConfiguration[],
    performanceIssues: PerformanceIssue[],
    optimizationOpportunities: OptimizationOpportunity[]
  ): BuildSystemRecommendation[] {
    const recommendations: BuildSystemRecommendation[] = [];
    
    // High priority: Fix critical performance issues
    const criticalIssues = performanceIssues.filter(i => i.impact === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'critical',
        description: 'Address critical build performance issues',
        implementation: criticalIssues.map(i => i.suggestedFix).join('; '),
        benefits: ['Significantly faster builds', 'Improved developer experience'],
        risks: ['Requires configuration changes'],
        effort: 'high'
      });
    }
    
    // Medium priority: Consolidate redundant configurations
    if (redundantConfigurations.length > 0) {
      recommendations.push({
        type: 'consolidation',
        priority: 'medium',
        description: 'Consolidate redundant build configurations and scripts',
        implementation: 'Create shared configurations and standardize scripts',
        benefits: ['Reduced maintenance overhead', 'Consistent build process'],
        risks: ['May require package restructuring'],
        effort: 'medium'
      });
    }
    
    // Low priority: Implement optimizations
    if (optimizationOpportunities.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'low',
        description: 'Implement build system optimizations',
        implementation: optimizationOpportunities.map(o => o.implementation).join('; '),
        benefits: ['Faster builds', 'Better resource utilization'],
        risks: ['Minimal'],
        effort: 'low'
      });
    }
    
    return recommendations;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async findPackageJsonFiles(): Promise<string[]> {
    const packageFiles: string[] = [];
    
    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !['node_modules', '.git', 'dist'].includes(entry.name)) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && entry.name === 'package.json') {
            packageFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    await scanDirectory(this.rootPath);
    return packageFiles;
  }
}
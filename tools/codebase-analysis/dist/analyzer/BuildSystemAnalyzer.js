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
exports.BuildSystemAnalyzer = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class BuildSystemAnalyzer {
    constructor(rootPath = process.cwd()) {
        this.rootPath = rootPath;
    }
    async analyzeBuildSystem() {
        console.log('Starting build system analysis...');
        // Analyze monorepo configuration
        const monorepoConfig = await this.analyzeMonorepoConfig();
        // Analyze package scripts
        const packageScripts = await this.analyzePackageScripts();
        // Analyze build configurations
        const buildConfigurations = await this.analyzeBuildConfigurations();
        // Identify redundant configurations
        const redundantConfigurations = this.identifyRedundantConfigurations(packageScripts, buildConfigurations);
        // Identify performance issues
        const performanceIssues = this.identifyPerformanceIssues(monorepoConfig, buildConfigurations);
        // Find optimization opportunities
        const optimizationOpportunities = this.findOptimizationOpportunities(monorepoConfig, packageScripts, buildConfigurations);
        // Generate recommendations
        const recommendations = this.generateBuildSystemRecommendations(monorepoConfig, redundantConfigurations, performanceIssues, optimizationOpportunities);
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
    async analyzeMonorepoConfig() {
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
    async analyzeTurboConfig(configPath) {
        try {
            const content = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(content);
            const pipelines = [];
            if (config.pipeline) {
                for (const [name, pipelineConfig] of Object.entries(config.pipeline)) {
                    pipelines.push({
                        name,
                        dependsOn: pipelineConfig.dependsOn || [],
                        outputs: pipelineConfig.outputs || [],
                        inputs: pipelineConfig.inputs || [],
                        cache: pipelineConfig.cache !== false,
                        persistent: pipelineConfig.persistent || false,
                        env: pipelineConfig.env || []
                    });
                }
            }
            const caching = {
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
        }
        catch (error) {
            console.warn('Failed to parse turbo.json:', error);
            return this.getDefaultMonorepoConfig();
        }
    }
    async analyzeLernaConfig(configPath) {
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
    async analyzeNxConfig(configPath) {
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
    assessTurboEffectiveness(config, pipelines) {
        let score = 50; // Base score
        const issues = [];
        const strengths = [];
        // Check pipeline configuration
        if (pipelines.length === 0) {
            issues.push('No pipelines configured');
            score -= 20;
        }
        else {
            strengths.push(`${pipelines.length} pipelines configured`);
            score += Math.min(pipelines.length * 5, 20);
        }
        // Check caching
        const cachingPipelines = pipelines.filter(p => p.cache);
        if (cachingPipelines.length === 0) {
            issues.push('No caching configured');
            score -= 15;
        }
        else {
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
    getDefaultMonorepoConfig() {
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
    async analyzePackageScripts() {
        const packagePaths = await this.findPackageJsonFiles();
        const analyses = [];
        for (const packagePath of packagePaths) {
            try {
                const analysis = await this.analyzePackageJson(packagePath);
                analyses.push(analysis);
            }
            catch (error) {
                console.warn(`Failed to analyze package.json at ${packagePath}:`, error);
            }
        }
        // Identify script patterns across packages
        this.identifyScriptPatterns(analyses);
        return analyses;
    }
    async analyzePackageJson(packagePath) {
        const content = await fs.readFile(packagePath, 'utf-8');
        const packageJson = JSON.parse(content);
        const packageName = packageJson.name || path.dirname(packagePath);
        const scripts = [];
        if (packageJson.scripts) {
            for (const [name, command] of Object.entries(packageJson.scripts)) {
                scripts.push({
                    name,
                    command: command,
                    category: this.categorizeScript(name, command),
                    complexity: this.calculateScriptComplexity(command),
                    dependencies: this.extractScriptDependencies(command),
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
    categorizeScript(name, command) {
        const nameLower = name.toLowerCase();
        const commandLower = command.toLowerCase();
        if (nameLower.includes('build') || commandLower.includes('build'))
            return 'build';
        if (nameLower.includes('dev') || commandLower.includes('dev'))
            return 'dev';
        if (nameLower.includes('test') || commandLower.includes('test'))
            return 'test';
        if (nameLower.includes('lint') || commandLower.includes('lint'))
            return 'lint';
        if (nameLower.includes('format') || commandLower.includes('prettier'))
            return 'format';
        if (nameLower.includes('deploy') || commandLower.includes('deploy'))
            return 'deploy';
        if (nameLower.includes('clean') || commandLower.includes('clean'))
            return 'clean';
        if (nameLower.includes('start') || commandLower.includes('start'))
            return 'start';
        return 'custom';
    }
    calculateScriptComplexity(command) {
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
    extractScriptDependencies(command) {
        const dependencies = [];
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
    isStandardScript(name) {
        const standardScripts = [
            'build', 'dev', 'start', 'test', 'lint', 'format',
            'clean', 'install', 'prepare', 'prepublish'
        ];
        return standardScripts.includes(name);
    }
    findRedundantScripts(scripts) {
        const redundant = [];
        const commandMap = new Map();
        for (const script of scripts) {
            const normalizedCommand = script.command.trim().toLowerCase();
            if (!commandMap.has(normalizedCommand)) {
                commandMap.set(normalizedCommand, []);
            }
            commandMap.get(normalizedCommand).push(script.name);
        }
        for (const [command, scriptNames] of commandMap) {
            if (scriptNames.length > 1) {
                redundant.push(...scriptNames.slice(1)); // Keep first, mark others as redundant
            }
        }
        return redundant;
    }
    findMissingStandardScripts(scripts) {
        const standardScripts = ['build', 'dev', 'test', 'lint'];
        const existingScripts = new Set(scripts.map(s => s.name));
        return standardScripts.filter(script => !existingScripts.has(script));
    }
    identifyScriptPatterns(analyses) {
        const patternMap = new Map();
        for (const analysis of analyses) {
            for (const script of analysis.scripts) {
                const pattern = this.normalizeScriptCommand(script.command);
                if (!patternMap.has(pattern)) {
                    patternMap.set(pattern, []);
                }
                patternMap.get(pattern).push(analysis.packageName);
            }
        }
        // Update analyses with patterns
        for (const analysis of analyses) {
            const patterns = [];
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
    normalizeScriptCommand(command) {
        // Normalize command for pattern matching
        return command
            .replace(/\s+/g, ' ')
            .replace(/--\w+=[^\s]+/g, '--flag') // Normalize flags
            .replace(/"[^"]*"/g, '"string"') // Normalize strings
            .trim();
    }
    async analyzeBuildConfigurations() {
        const configurations = [];
        // Find build configuration files
        const configFiles = await this.findBuildConfigFiles();
        for (const configFile of configFiles) {
            try {
                const config = await this.analyzeBuildConfigFile(configFile);
                if (config) {
                    configurations.push(config);
                }
            }
            catch (error) {
                console.warn(`Failed to analyze build config ${configFile}:`, error);
            }
        }
        return configurations;
    }
    async findBuildConfigFiles() {
        const configFiles = [];
        const configPatterns = [
            'webpack.config.js', 'webpack.config.ts',
            'vite.config.js', 'vite.config.ts',
            'rollup.config.js', 'rollup.config.ts',
            'tsconfig.json', 'tsconfig.build.json',
            'babel.config.js', '.babelrc'
        ];
        const scanDirectory = async (dir) => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory() && !['node_modules', '.git', 'dist'].includes(entry.name)) {
                        await scanDirectory(fullPath);
                    }
                    else if (entry.isFile() && configPatterns.includes(entry.name)) {
                        configFiles.push(fullPath);
                    }
                }
            }
            catch (error) {
                // Skip directories we can't read
            }
        };
        await scanDirectory(this.rootPath);
        return configFiles;
    }
    async analyzeBuildConfigFile(configPath) {
        const fileName = path.basename(configPath);
        const packageName = this.getPackageNameFromPath(configPath);
        if (fileName.startsWith('webpack')) {
            return this.analyzeWebpackConfig(configPath, packageName);
        }
        else if (fileName.startsWith('vite')) {
            return this.analyzeViteConfig(configPath, packageName);
        }
        else if (fileName.startsWith('tsconfig')) {
            return this.analyzeTsConfig(configPath, packageName);
        }
        return null;
    }
    async analyzeWebpackConfig(configPath, packageName) {
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
    async analyzeViteConfig(configPath, packageName) {
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
    async analyzeTsConfig(configPath, packageName) {
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
    getPackageNameFromPath(configPath) {
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
    identifyRedundantConfigurations(packageScripts, buildConfigurations) {
        const redundant = [];
        // Find duplicate build configurations
        const configGroups = new Map();
        for (const config of buildConfigurations) {
            const key = `${config.type}-${JSON.stringify(config.targets)}`;
            if (!configGroups.has(key)) {
                configGroups.set(key, []);
            }
            configGroups.get(key).push(config);
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
        const scriptPatterns = new Map();
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
    identifyPerformanceIssues(monorepoConfig, buildConfigurations) {
        const issues = [];
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
    findOptimizationOpportunities(monorepoConfig, packageScripts, buildConfigurations) {
        const opportunities = [];
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
        const sequentialBuilds = packageScripts.filter(p => p.scripts.some(s => s.name === 'build' && s.command.includes('&&')));
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
        const unoptimizedConfigs = buildConfigurations.filter(c => !c.optimization.treeshaking || !c.optimization.minification);
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
    generateBuildSystemRecommendations(monorepoConfig, redundantConfigurations, performanceIssues, optimizationOpportunities) {
        const recommendations = [];
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
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async findPackageJsonFiles() {
        const packageFiles = [];
        const scanDirectory = async (dir) => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory() && !['node_modules', '.git', 'dist'].includes(entry.name)) {
                        await scanDirectory(fullPath);
                    }
                    else if (entry.isFile() && entry.name === 'package.json') {
                        packageFiles.push(fullPath);
                    }
                }
            }
            catch (error) {
                // Skip directories we can't read
            }
        };
        await scanDirectory(this.rootPath);
        return packageFiles;
    }
}
exports.BuildSystemAnalyzer = BuildSystemAnalyzer;
//# sourceMappingURL=BuildSystemAnalyzer.js.map
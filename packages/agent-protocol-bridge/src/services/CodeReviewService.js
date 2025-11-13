"use strict";
/**
 * CodeReviewService.ts
 *
 * Traycer-style code review and analysis capabilities.
 * Provides automatic/manual analysis, security scanning, and best practices checking.
 */
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
exports.CodeReviewService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class CodeReviewService extends events_1.EventEmitter {
    analysisRequests = new Map();
    analysisResults = new Map();
    comments = new Map();
    configuration;
    constructor(config) {
        super();
        this.configuration = {
            autoAnalysis: false,
            triggerEvents: ['file_save'],
            categories: ['code_quality', 'security', 'best_practices'],
            depth: 'comprehensive',
            commentIndicator: 'both',
            highlightComments: false,
            highlightColor: 'rgba(160, 32, 240, 0.2)',
            excludePatterns: ['node_modules/**', 'dist/**', '*.min.js'],
            ...config
        };
    }
    /**
     * Analyze a single file
     */
    async analyzeFile(filePath, options = {}) {
        const requestId = (0, uuid_1.v4)();
        const request = {
            id: requestId,
            type: 'file',
            trigger: 'manual',
            scope: {
                files: [filePath],
                workspace: path.dirname(filePath)
            },
            options: {
                depth: 'comprehensive',
                categories: this.configuration.categories,
                ...options
            },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return await this.executeAnalysis(request);
    }
    /**
     * Analyze changes in files
     */
    async analyzeChanges(changedFiles, workspace, options = {}) {
        const requestId = (0, uuid_1.v4)();
        const request = {
            id: requestId,
            type: 'changes',
            trigger: 'manual',
            scope: {
                workspace,
                files: changedFiles,
                changedFiles
            },
            options: {
                depth: 'comprehensive',
                categories: this.configuration.categories,
                ...options
            },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return await this.executeAnalysis(request);
    }
    /**
     * Analyze entire workspace
     */
    async analyzeWorkspace(workspace, options = {}) {
        const requestId = (0, uuid_1.v4)();
        // Discover files in workspace
        const files = await this.discoverFiles(workspace, options.includePatterns, options.excludePatterns);
        const request = {
            id: requestId,
            type: 'workspace',
            trigger: 'manual',
            scope: {
                workspace,
                files
            },
            options: {
                depth: 'basic', // Default to basic for workspace analysis
                categories: this.configuration.categories,
                ...options
            },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return await this.executeAnalysis(request);
    }
    /**
     * Analyze for plan verification
     */
    async analyzePlanVerification(planId, stepId, files, workspace, verificationCriteria, options = {}) {
        const requestId = (0, uuid_1.v4)();
        const request = {
            id: requestId,
            type: 'plan_verification',
            trigger: 'plan_step',
            scope: {
                workspace,
                files,
                planId,
                stepId
            },
            options: {
                depth: 'detailed',
                categories: ['code_quality', 'security', 'testing'],
                ...options,
                languageSpecific: {
                    ...options.languageSpecific,
                    verificationCriteria
                }
            },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return await this.executeAnalysis(request);
    }
    /**
     * Enable automatic analysis
     */
    enableAutoAnalysis(events = ['file_save']) {
        this.configuration.autoAnalysis = true;
        this.configuration.triggerEvents = events;
        this.emit('autoAnalysisEnabled', { events });
    }
    /**
     * Disable automatic analysis
     */
    disableAutoAnalysis() {
        this.configuration.autoAnalysis = false;
        this.emit('autoAnalysisDisabled');
    }
    /**
     * Enable comment highlighting
     */
    enableCommentsHighlighting(color) {
        this.configuration.highlightComments = true;
        if (color) {
            this.configuration.highlightColor = color;
        }
        this.emit('commentsHighlightingEnabled', { color: this.configuration.highlightColor });
    }
    /**
     * Disable comment highlighting
     */
    disableCommentsHighlighting() {
        this.configuration.highlightComments = false;
        this.emit('commentsHighlightingDisabled');
    }
    /**
     * Trigger automatic analysis based on events
     */
    async triggerAutoAnalysis(event, context) {
        if (!this.configuration.autoAnalysis || !this.configuration.triggerEvents.includes(event)) {
            return null;
        }
        const { files = [], workspace = process.cwd(), planId, stepId } = context;
        if (files.length === 0) {
            return null;
        }
        let analysisResult;
        switch (event) {
            case 'file_save':
                analysisResult = await this.analyzeChanges(files, workspace);
                break;
            case 'git_commit':
                analysisResult = await this.analyzeChanges(files, workspace, {
                    categories: ['security', 'code_quality', 'best_practices']
                });
                break;
            case 'plan_step':
                if (!planId)
                    return null;
                analysisResult = await this.analyzePlanVerification(planId, stepId, files, workspace, ['implementation_correctness', 'code_quality', 'security']);
                break;
            default:
                return null;
        }
        this.emit('autoAnalysisCompleted', { event, result: analysisResult });
        return analysisResult;
    }
    /**
     * Execute analysis request
     */
    async executeAnalysis(request) {
        this.analysisRequests.set(request.id, request);
        try {
            request.status = 'in_progress';
            request.updatedAt = new Date();
            this.emit('analysisStarted', request);
            const startTime = Date.now();
            // Perform actual analysis
            const findings = await this.performAnalysis(request);
            const metrics = await this.calculateMetrics(request.scope.files);
            const recommendations = this.generateRecommendations(findings);
            const fixableIssues = this.identifyFixableIssues(findings);
            const executionTime = Date.now() - startTime;
            const result = {
                requestId: request.id,
                status: 'success',
                summary: this.createSummary(findings, metrics),
                findings,
                metrics,
                recommendations,
                fixableIssues,
                executionTime,
                timestamp: new Date()
            };
            request.status = 'completed';
            request.completedAt = new Date();
            request.updatedAt = new Date();
            this.analysisResults.set(request.id, result);
            this.comments.set(request.id, []);
            this.emit('analysisCompleted', { request, result });
            return result;
        }
        catch (error) {
            request.status = 'failed';
            request.updatedAt = new Date();
            const result = {
                requestId: request.id,
                status: 'error',
                summary: {
                    totalFiles: request.scope.files.length,
                    analyzedFiles: 0,
                    totalFindings: 0,
                    criticalIssues: 0,
                    warningIssues: 0,
                    infoIssues: 0,
                    overallScore: 0,
                    categoryScores: {
                        code_quality: 0,
                        security: 0,
                        performance: 0,
                        maintainability: 0,
                        testing: 0,
                        documentation: 0,
                        best_practices: 0,
                        architecture: 0,
                        dependencies: 0,
                    }
                },
                findings: [],
                metrics: this.getEmptyMetrics(),
                recommendations: [],
                fixableIssues: [],
                executionTime: Date.now() - Date.now(),
                timestamp: new Date(),
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
            this.emit('analysisFailed', { request, error, result });
            throw error;
        }
    }
    /**
     * Perform the actual analysis
     */
    async performAnalysis(request) {
        const findings = [];
        for (const file of request.scope.files) {
            try {
                const fileContent = await fs.readFile(file, 'utf-8');
                const fileFindings = await this.analyzeFileContent(file, fileContent, request.options);
                findings.push(...fileFindings);
            }
            catch (error) {
                console.warn(`Failed to analyze file ${file}:, error);
      }
    }

    return findings;
  }

  /**
   * Analyze file content
   */
  private async analyzeFileContent(
    filePath: string,
    content: string,
    options: AnalysisOptions
  ): Promise<AnalysisFinding[]> {
    const findings: AnalysisFinding[] = [];
    const lines = content.split('\n');

    for (const category of options.categories) {
      const categoryFindings = await this.analyzeCategoryInFile(
        filePath,
        content,
        lines,
        category,
        options
      );
      findings.push(...categoryFindings);
    }

    return findings;
  }

  /**
   * Analyze specific category in file
   */
  private async analyzeCategoryInFile(
    filePath: string,
    content: string,
    lines: string[],
    category: AnalysisCategory,
    options: AnalysisOptions
  ): Promise<AnalysisFinding[]> {
    const findings: AnalysisFinding[] = [];

    switch (category) {
      case 'code_quality':
        findings.push(...this.analyzeCodeQuality(filePath, lines));
        break;

      case 'security':
        findings.push(...this.analyzeSecurity(filePath, content, lines));
        break;

      case 'performance':
        findings.push(...this.analyzePerformance(filePath, lines));
        break;

      case 'maintainability':
        findings.push(...this.analyzeMaintainability(filePath, lines));
        break;

      case 'testing':
        findings.push(...this.analyzeTesting(filePath, lines));
        break;

      case 'documentation':
        findings.push(...this.analyzeDocumentation(filePath, lines));
        break;

      case 'best_practices':
        findings.push(...this.analyzeBestPractices(filePath, lines));
        break;

      case 'architecture':
        findings.push(...this.analyzeArchitecture(filePath, content));
        break;

      case 'dependencies':
        findings.push(...this.analyzeDependencies(filePath, content));
        break;
    }

    return findings;
  }

  /**
   * Category-specific analysis methods
   */
  private analyzeCodeQuality(filePath: string, lines: string[]): AnalysisFinding[] {
    const findings: AnalysisFinding[] = [];

    // Check for long functions
    let functionStart = -1;
    let braceCount = 0;

    lines.forEach((line, index) => {
      if (line.includes('function ') || line.includes('const ') && line.includes('=>')) {
        functionStart = index;
        braceCount = 0;
      }

      if (line.includes('{')) braceCount++;
      if (line.includes('}')) braceCount--;

      if (functionStart >= 0 && braceCount === 0 && index - functionStart > 50) {
        findings.push({
          id: uuidv4(),
          category: 'code_quality',
          severity: 'major',
          title: 'Function too long',`, description, `Function spans ${index - functionStart}`, lines, consider, breaking, it, down, location, {
                    file: filePath,
                    startLine: functionStart + 1,
                    endLine: index + 1,
                    code: lines.slice(functionStart, Math.min(functionStart + 3, lines.length)).join('\n')
                }, rule, 'max-function-length', suggestion, 'Break this function into smaller, more focused functions', fixable, false);
            }
            ;
            functionStart = -1;
        }
    }
    ;
    // Check for deeply nested code
    lines;
    forEach() { }
}
exports.CodeReviewService = CodeReviewService;
(line, index) => {
    const indentLevel = line.length - line.trimStart().length;
    if (indentLevel > 24) { // More than 6 levels of nesting (assuming 4-space indents)
        findings.push({
            id: (0, uuid_1.v4)(),
            category: 'code_quality',
            severity: 'minor',
            title: 'Deeply nested code',
            description: 'Consider reducing nesting levels for better readability',
            location: {
                file: filePath,
                startLine: index + 1,
                endLine: index + 1,
                code: line.trim()
            },
            rule: 'max-nesting-depth',
            suggestion: 'Use early returns or extract nested logic into separate functions',
            fixable: false
        });
    }
};
;
return findings;
analyzeSecurity(filePath, string, content, string, lines, string[]);
AnalysisFinding[];
{
    const findings = [];
    // Check for potential security issues
    const securityPatterns = [
        { pattern: /eval\s*\(/, rule: 'no-eval', severity: 'critical', title: 'Use of eval()' },
        { pattern: /innerHTML\s*=/, rule: 'no-inner-html', severity: 'major', title: 'Direct innerHTML assignment' },
        { pattern: /document\.write\s*\(/, rule: 'no-document-write', severity: 'major', title: 'Use of document.write()' },
        { pattern: /console\.log\s*\([^)]*password/i, rule: 'no-console-secrets', severity: 'critical', title: 'Potential secret in console.log' }
    ];
    lines.forEach((line, index) => {
        securityPatterns.forEach(({ pattern, rule, severity, title }) => {
            if (pattern.test(line)) {
                findings.push({
                    id: (0, uuid_1.v4)(),
                    category: 'security',
                    severity,
                    title,
                    description: Potential, security, vulnerability, detected: $
                }, { title }, location, {
                    file: filePath,
                    startLine: index + 1,
                    endLine: index + 1,
                    code: line.trim()
                }, rule, suggestion, 'Review this code for security implications', fixable, false);
            }
        });
    });
}
;
;
return findings;
analyzePerformance(filePath, string, lines, string[]);
AnalysisFinding[];
{
    const findings = [];
    lines.forEach((line, index) => {
        // Check for inefficient loops
        if (line.includes('for') && line.includes('.length')) {
            const match = line.match(/for\s*\([^;]*;\s*[^<>=]*<\s*([^.]+)\.length/);
            if (match) {
                findings.push({
                    id: (0, uuid_1.v4)(),
                    category: 'performance',
                    severity: 'minor',
                    title: 'Inefficient loop condition',
                    description: 'Array length is calculated on each iteration',
                    location: {
                        file: filePath,
                        startLine: index + 1,
                        endLine: index + 1,
                        code: line.trim()
                    },
                    rule: 'cache-array-length',
                    suggestion: 'Cache array length in a variable before the loop',
                    fixable: true,
                    fix: {
                        description: 'Cache array length',
                        changes: [{
                                file: filePath,
                                operation: 'replace',
                                startLine: index + 1,
                                endLine: index + 1,
                                newContent: line.replace(/for\s*\(([^;]*;\s*)([^<>=]*)<\s*([^.]+)\.length/, 'for ($1 len = $3.length, $2 < len')
                            }],
                        confidence: 80,
                        riskLevel: 'low'
                    }
                });
            }
        }
    });
    return findings;
}
analyzeMaintainability(filePath, string, lines, string[]);
AnalysisFinding[];
{
    const findings = [];
    // Check for magic numbers
    lines.forEach((line, index) => {
        const magicNumbers = line.match(/\b(?!0|1|100)\d{2,}\b/g);
        if (magicNumbers) {
            findings.push({
                id: (0, uuid_1.v4)(),
                category: 'maintainability',
                severity: 'minor',
                title: 'Magic number detected',
                description: 'Consider extracting this number into a named constant',
                location: {
                    file: filePath,
                    startLine: index + 1,
                    endLine: index + 1,
                    code: line.trim()
                },
                rule: 'no-magic-numbers',
                suggestion: 'Replace magic numbers with named constants',
                fixable: false
            });
        }
    });
    return findings;
}
analyzeTesting(filePath, string, lines, string[]);
AnalysisFinding[];
{
    const findings = [];
    // Check for test file presence
    if (!filePath.includes('.test.') && !filePath.includes('.spec.')) {
        const hasCorrespondingTest = false; // This would check for actual test files
        if (!hasCorrespondingTest) {
            findings.push({
                id: (0, uuid_1.v4)(),
                category: 'testing',
                severity: 'minor',
                title: 'Missing test file',
                description: 'This file might benefit from having corresponding tests',
                location: {
                    file: filePath,
                    startLine: 1,
                    endLine: 1,
                    code: ''
                },
                rule: 'require-tests',
                suggestion: 'Consider adding unit tests for this file',
                fixable: false
            });
        }
    }
    return findings;
}
analyzeDocumentation(filePath, string, lines, string[]);
AnalysisFinding[];
{
    const findings = [];
    // Check for function documentation
    let inFunction = false;
    let functionLine = -1;
    lines.forEach((line, index) => {
        if (line.includes('function ') || (line.includes('const ') && line.includes('=>'))) {
            const prevLine = index > 0 ? lines[index - 1] : '';
            const hasDocs = prevLine.includes('/**') || prevLine.includes('//');
            if (!hasDocs && !line.includes('()')) { // Skip simple getters
                findings.push({
                    id: (0, uuid_1.v4)(),
                    category: 'documentation',
                    severity: 'minor',
                    title: 'Missing function documentation',
                    description: 'Function lacks documentation comments',
                    location: {
                        file: filePath,
                        startLine: index + 1,
                        endLine: index + 1,
                        code: line.trim()
                    },
                    rule: 'require-function-docs',
                    suggestion: 'Add JSDoc or inline comments to explain the function purpose',
                    fixable: false
                });
            }
        }
    });
    return findings;
}
analyzeBestPractices(filePath, string, lines, string[]);
AnalysisFinding[];
{
    const findings = [];
    lines.forEach((line, index) => {
        // Check for var usage (prefer let/const)
        if (line.includes('var ') && !line.includes('//')) {
            findings.push({
                id: (0, uuid_1.v4)(),
                category: 'best_practices',
                severity: 'minor',
                title: 'Use of var instead of let/const',
                description: 'Prefer let or const over var for better scoping',
                location: {
                    file: filePath,
                    startLine: index + 1,
                    endLine: index + 1,
                    code: line.trim()
                },
                rule: 'prefer-const-let',
                suggestion: 'Replace var with let or const',
                fixable: true,
                fix: {
                    description: 'Replace var with const/let',
                    changes: [{
                            file: filePath,
                            operation: 'replace',
                            startLine: index + 1,
                            endLine: index + 1,
                            newContent: line.replace(/\bvar\b/, 'const')
                        }],
                    confidence: 90,
                    riskLevel: 'low'
                }
            });
        }
    });
    return findings;
}
analyzeArchitecture(filePath, string, content, string);
AnalysisFinding[];
{
    const findings = [];
    // Check for circular dependencies (simplified)
    const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
    const hasRelativeImports = imports.some(imp => imp.includes('./') || imp.includes('../'));
    if (hasRelativeImports && imports.length > 10) {
        findings.push({
            id: (0, uuid_1.v4)(),
            category: 'architecture',
            severity: 'minor',
            title: 'High number of relative imports',
            description: 'Consider using absolute imports or restructuring modules',
            location: {
                file: filePath,
                startLine: 1,
                endLine: 1,
                code: ''
            },
            rule: 'prefer-absolute-imports',
            suggestion: 'Use absolute imports or consider module restructuring',
            fixable: false
        });
    }
    return findings;
}
analyzeDependencies(filePath, string, content, string);
AnalysisFinding[];
{
    const findings = [];
    // Check for unused imports
    const imports = content.match(/import\s+{([^}]+)}\s+from/g) || [];
    imports.forEach((importStatement, index) => {
        const imported = importStatement.match(/{([^}]+)}/)?.[1]?.split(',').map(s => s.trim()) || [];
        imported.forEach(name => {
            `
        const usage = new RegExp(\b${name}`;
            b, 'g';
        });
        const usageCount = (content.match(usage) || []).length;
        if (usageCount <= 1) { // Only appears in import
            findings.push({
                id: (0, uuid_1.v4)(),
                category: 'dependencies',
                severity: 'minor',
                title: 'Unused import',
                description: Import, '${name}': appears, to, be, unused,
                location: {
                    file: filePath,
                    startLine: index + 1,
                    endLine: index + 1,
                    code: importStatement `
            },`,
                    rule: 'no-unused-imports',
                    suggestion: Remove, unused, import: '${name}`',
                    fixable: true,
                    fix: {
                        description: 'Remove unused import',
                        changes: [{
                                file: filePath,
                                operation: 'replace',
                                startLine: index + 1,
                                endLine: index + 1,
                                newContent: importStatement.replace(new RegExp(b$, { name }, b, s * ), '')
                            }],
                        confidence: 85,
                        riskLevel: 'low'
                    }
                }
            });
        }
    });
}
;
return findings;
async;
calculateMetrics(files, string[]);
Promise < CodeMetrics > {
    let, totalLoc = 0,
    const: fileComplexity
};
{ }
;
const fileScores = {};
for (const file of files) {
    try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        totalLoc += lines.length;
        // Simple complexity calculation
        const complexity = this.calculateFileComplexity(content);
        fileComplexity[file] = complexity;
        `
        fileScores[file] = Math.max(0, 100 - complexity * 2);`;
    }
    catch (error) {
        console.warn(Failed, to, calculate, metrics);
        for ($; { file }; )
            : `, error);
      }
    }

    const avgComplexity = Object.values(fileComplexity).reduce((a, b) => a + b, 0) / files.length || 0;

    return {
      linesOfCode: totalLoc,
      complexity: {
        cyclomatic: avgComplexity,
        cognitive: avgComplexity * 1.2,
        halstead: {
          vocabulary: 50,
          length: totalLoc,
          difficulty: avgComplexity,
          effort: avgComplexity * totalLoc,
          bugs: avgComplexity * totalLoc / 3000
        },
        fileComplexity
      },
      maintainability: {
        index: Math.max(0, 100 - avgComplexity * 3),
        techDebt: avgComplexity * files.length * 5,
        codeSmells: Math.floor(avgComplexity),
        fileScores
      },
      dependencies: {
        totalDependencies: 0,
        directDependencies: 0,
        outdatedDependencies: 0,
        vulnerableDependencies: 0,
        licenses: {}
      },
      duplication: {
        duplicatedLines: 0,
        duplicatedBlocks: 0,
        duplicationPercentage: 0,
        duplicatedFiles: []
      }
    };
  }

  private calculateFileComplexity(content: string): number {
    const conditions = (content.match(/if|else|while|for|switch|case|\?|&&|\|\|/g) || []).length;
    const functions = (content.match(/function|=>/g) || []).length;
    const classes = (content.match(/class\s+\w+/g) || []).length;

    return conditions + functions + classes;
  }

  /**
   * Create analysis summary
   */
  private createSummary(findings: AnalysisFinding[], metrics: CodeMetrics): AnalysisSummary {
    const criticalIssues = findings.filter(f => f.severity === 'critical').length;
    const warningIssues = findings.filter(f => f.severity === 'major').length;
    const infoIssues = findings.filter(f => f.severity === 'minor' || f.severity === 'info').length;

    const categoryScores: Record<AnalysisCategory, number> = {} as any;
    const categories: AnalysisCategory[] = [
      'code_quality', 'security', 'performance', 'maintainability',
      'testing', 'documentation', 'best_practices', 'architecture', 'dependencies'
    ];

    categories.forEach(category => {
      const categoryFindings = findings.filter(f => f.category === category);
      const penalty = categoryFindings.reduce((acc, f) => {
        switch (f.severity) {
          case 'critical': return acc + 20;
          case 'major': return acc + 10;
          case 'minor': return acc + 5;
          case 'info': return acc + 1;
          default: return acc;
        }
      }, 0);
      categoryScores[category] = Math.max(0, 100 - penalty);
    });

    const overallScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) / categories.length;

    return {
      totalFiles: metrics.linesOfCode > 0 ? 1 : 0, // Simplified
      analyzedFiles: metrics.linesOfCode > 0 ? 1 : 0,
      totalFindings: findings.length,
      criticalIssues,
      warningIssues,
      infoIssues,
      overallScore: Math.round(overallScore),
      categoryScores
    };
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(findings: AnalysisFinding[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Group findings by category
    const categoryGroups = findings.reduce((acc, finding) => {
      if (!acc[finding.category]) acc[finding.category] = [];
      acc[finding.category].push(finding);
      return acc;
    }, {} as Record<AnalysisCategory, AnalysisFinding[]>);

    // Generate category-specific recommendations
    Object.entries(categoryGroups).forEach(([category, categoryFindings]) => {
      if (categoryFindings.length > 3) {
        recommendations.push({
          id: uuidv4(),
          category: category as AnalysisCategory,
          priority: categoryFindings.some(f => f.severity === 'critical') ? 'critical' : 'medium',
          title: Address ${category.replace('_', ' ')} issues,`;
        description: Found;
        $;
        {
            categoryFindings.length;
        }
        $;
        {
            category.replace('_', ' ');
        }
        issues;
        that;
        need;
        attention, `
          impact: Improving ${category.replace('_', ' ')}`;
        will;
        enhance;
        code;
        quality;
        and;
        maintainability,
            effort;
        categoryFindings.length > 10 ? 'high' : 'medium',
            implementationSteps;
        [
            Review, all, $, { categoryFindings, : .length }, $, { category, : .replace('_', ' ') }, findings,
            'Prioritize critical and major severity issues',
            'Apply suggested fixes where possible',
            'Review and test changes'
        ];
    }
    ;
}
;
return recommendations;
identifyFixableIssues(findings, AnalysisFinding[]);
FixableIssue[];
{
    return findings
        .filter(finding => finding.fixable && finding.fix)
        .map(finding => ({
        findingId: finding.id,
        fix: finding.fix,
        autoApplyable: finding.fix.confidence > 85 && finding.fix.riskLevel === 'low',
        requiresReview: finding.fix.confidence < 90 || finding.fix.riskLevel !== 'low'
    }));
}
async;
discoverFiles(workspace, string, includePatterns ?  : string[], excludePatterns ?  : string[]);
Promise < string[] > {
    const: files, string, []:  = [],
    // Simple file discovery - in a real implementation, use glob patterns
    function: walkDir(dir, string)
};
{
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                // Skip common exclude patterns
                if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
                    await walkDir(fullPath);
                }
            }
            else if (entry.isFile()) {
                // Include common code file extensions
                if (/\.(js|ts|jsx|tsx|py|java|cpp|c|h)$/.test(entry.name)) {
                    files.push(fullPath);
                }
            }
        }
    }
    catch (error) {
        `
        console.warn(Failed to read directory ${dir}:`, error;
        ;
    }
}
await walkDir(workspace);
return files;
getEmptyMetrics();
CodeMetrics;
{
    return {
        linesOfCode: 0,
        complexity: {
            cyclomatic: 0,
            cognitive: 0,
            halstead: {
                vocabulary: 0,
                length: 0,
                difficulty: 0,
                effort: 0,
                bugs: 0
            },
            fileComplexity: {}
        },
        maintainability: {
            index: 0,
            techDebt: 0,
            codeSmells: 0,
            fileScores: {}
        },
        dependencies: {
            totalDependencies: 0,
            directDependencies: 0,
            outdatedDependencies: 0,
            vulnerableDependencies: 0,
            licenses: {}
        },
        duplication: {
            duplicatedLines: 0,
            duplicatedBlocks: 0,
            duplicationPercentage: 0,
            duplicatedFiles: []
        }
    };
}
/**
 * Public getters and utilities
 */
getAnalysisResult(requestId, string);
AnalysisResult | undefined;
{
    return this.analysisResults.get(requestId);
}
getAllAnalysisResults();
AnalysisResult[];
{
    return Array.from(this.analysisResults.values());
}
getConfiguration();
AnalysisConfiguration;
{
    return { ...this.configuration };
}
updateConfiguration(updates, (Partial));
void {
    Object, : .assign(this.configuration, updates),
    this: .emit('configurationUpdated', this.configuration)
};
getAnalysisHistory();
AnalysisRequest[];
{
    return Array.from(this.analysisRequests.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
async;
deleteAnalysisResult(requestId, string);
Promise < void  > {
    this: .analysisRequests.delete(requestId),
    this: .analysisResults.delete(requestId),
    this: .comments.delete(requestId),
    this: .emit('analysisDeleted', requestId)
};
//# sourceMappingURL=CodeReviewService.js.map
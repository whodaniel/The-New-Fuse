import * as fs from 'fs/promises';
import * as path from 'path';

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

export type ScriptPurpose = 
  | 'build' 
  | 'dev' 
  | 'test' 
  | 'deployment' 
  | 'cleanup' 
  | 'setup' 
  | 'utility' 
  | 'monitoring'
  | 'unknown';

export type CommandCategory = 
  | 'build' 
  | 'package_manager' 
  | 'file_operations' 
  | 'process_control' 
  | 'network' 
  | 'docker' 
  | 'git' 
  | 'system'
  | 'custom';

export type ExecutionPattern = 
  | 'standalone' 
  | 'chained' 
  | 'conditional' 
  | 'loop' 
  | 'parallel';

export type ConsolidationAction = 
  | 'keep' 
  | 'merge' 
  | 'remove' 
  | 'refactor' 
  | 'replace';

export interface ScriptComplexity {
  lineCount: number;
  functionCount: number;
  conditionalCount: number;
  loopCount: number;
  complexityScore: number; // 1-10
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
  overlapScore: number; // 0-100
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

export class ScriptAnalyzer {
  private rootPath: string;
  private scriptExtensions = ['.sh', '.bash', '.zsh'];
  
  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
  }

  async analyzeAllScripts(): Promise<ScriptConsolidationReport> {
    console.log('Starting comprehensive script analysis...');
    
    // Find all shell scripts
    const scriptPaths = await this.findAllScripts();
    console.log(`Found ${scriptPaths.length} shell scripts`);
    
    // Analyze each script
    const scriptAnalyses: ScriptAnalysis[] = [];
    for (const scriptPath of scriptPaths) {
      try {
        const analysis = await this.analyzeScript(scriptPath);
        scriptAnalyses.push(analysis);
      } catch (error) {
        console.warn(`Failed to analyze script ${scriptPath}:`, error);
      }
    }
    
    // Group scripts by purpose
    const scriptsByPurpose = this.groupScriptsByPurpose(scriptAnalyses);
    
    // Identify redundant groups
    const redundantGroups = this.identifyRedundantGroups(scriptAnalyses);
    
    // Identify obsolete scripts
    const obsoleteScripts = scriptAnalyses.filter(s => s.obsolete);
    
    // Generate consolidation plan
    const consolidationPlan = this.generateConsolidationPlan(scriptAnalyses, redundantGroups);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(scriptAnalyses, redundantGroups);
    
    return {
      totalScripts: scriptAnalyses.length,
      scriptsByPurpose,
      redundantGroups,
      obsoleteScripts,
      consolidationPlan,
      recommendations
    };
  }

  async analyzeScript(scriptPath: string): Promise<ScriptAnalysis> {
    const content = await fs.readFile(scriptPath, 'utf-8');
    const lines = content.split('\n');
    const name = path.basename(scriptPath);
    
    // Parse script content
    const commands = this.parseCommands(content);
    const functionality = this.extractFunctionality(content, commands);
    const dependencies = this.identifyDependencies(content, commands);
    const purpose = this.determinePurpose(name, content, functionality);
    const executionPattern = this.analyzeExecutionPattern(content);
    const complexity = this.calculateComplexity(content, lines);
    const issues = this.identifyIssues(content, lines, commands);
    
    // Determine if script is obsolete
    const obsolete = this.isObsolete(content, commands, dependencies);
    
    return {
      name,
      path: scriptPath,
      purpose,
      functionality,
      commands,
      dependencies,
      executionPattern,
      obsolete,
      redundantWith: [], // Will be populated later
      consolidationRecommendation: 'keep', // Will be determined later
      complexity,
      issues
    };
  }

  private async findAllScripts(): Promise<string[]> {
    const scripts: string[] = [];
    
    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Skip node_modules and other irrelevant directories
            if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
              await scanDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (this.scriptExtensions.includes(ext)) {
              scripts.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    await scanDirectory(this.rootPath);
    return scripts;
  }

  private parseCommands(content: string): CommandAnalysis[] {
    const lines = content.split('\n');
    const commands: CommandAnalysis[] = [];
    const commandCounts = new Map<string, number>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip comments and empty lines
      if (line.startsWith('#') || line === '') continue;
      
      // Extract commands (simplified parsing)
      const commandMatch = line.match(/^([a-zA-Z0-9_\-\.\/]+)/);
      if (commandMatch) {
        const command = commandMatch[1];
        const count = commandCounts.get(command) || 0;
        commandCounts.set(command, count + 1);
        
        commands.push({
          command,
          frequency: count + 1,
          category: this.categorizeCommand(command),
          parameters: this.extractParameters(line),
          isConditional: this.isConditionalCommand(line, lines, i),
          lineNumber: i + 1
        });
      }
    }
    
    return commands;
  }

  private categorizeCommand(command: string): CommandCategory {
    const buildCommands = ['npm', 'yarn', 'pnpm', 'make', 'cmake', 'gradle', 'mvn'];
    const fileCommands = ['cp', 'mv', 'rm', 'mkdir', 'chmod', 'chown', 'find', 'ls'];
    const processCommands = ['ps', 'kill', 'killall', 'nohup', 'screen', 'tmux'];
    const networkCommands = ['curl', 'wget', 'ping', 'netstat', 'ss'];
    const dockerCommands = ['docker', 'docker-compose', 'kubectl'];
    const gitCommands = ['git'];
    const systemCommands = ['echo', 'cat', 'grep', 'sed', 'awk', 'sort', 'uniq'];
    
    if (buildCommands.includes(command)) return 'build';
    if (fileCommands.includes(command)) return 'file_operations';
    if (processCommands.includes(command)) return 'process_control';
    if (networkCommands.includes(command)) return 'network';
    if (dockerCommands.includes(command)) return 'docker';
    if (gitCommands.includes(command)) return 'git';
    if (systemCommands.includes(command)) return 'system';
    
    return 'custom';
  }

  private extractParameters(line: string): string[] {
    // Simple parameter extraction
    const parts = line.split(/\s+/);
    return parts.slice(1).filter(p => p.length > 0);
  }

  private isConditionalCommand(line: string, lines: string[], index: number): boolean {
    // Check if command is inside if/while/for block
    for (let i = index - 1; i >= 0; i--) {
      const prevLine = lines[i].trim();
      if (prevLine.match(/^(if|while|for)\s/)) return true;
      if (prevLine.match(/^(fi|done)\s*$/)) break;
    }
    return line.includes('&&') || line.includes('||');
  }

  private extractFunctionality(content: string, commands: CommandAnalysis[]): string[] {
    const functionality: string[] = [];
    
    // Analyze based on commands
    const commandCategories = new Set(commands.map(c => c.category));
    
    if (commandCategories.has('build')) functionality.push('Build automation');
    if (commandCategories.has('docker')) functionality.push('Container management');
    if (commandCategories.has('git')) functionality.push('Version control');
    if (commandCategories.has('package_manager')) functionality.push('Dependency management');
    if (commandCategories.has('file_operations')) functionality.push('File system operations');
    if (commandCategories.has('process_control')) functionality.push('Process management');
    
    // Analyze based on content patterns
    if (content.includes('test') || content.includes('spec')) functionality.push('Testing');
    if (content.includes('deploy') || content.includes('production')) functionality.push('Deployment');
    if (content.includes('dev') || content.includes('development')) functionality.push('Development setup');
    if (content.includes('clean') || content.includes('remove')) functionality.push('Cleanup');
    if (content.includes('setup') || content.includes('install')) functionality.push('Setup/Installation');
    if (content.includes('monitor') || content.includes('health')) functionality.push('Monitoring');
    
    return functionality.length > 0 ? functionality : ['General utility'];
  }

  private identifyDependencies(content: string, commands: CommandAnalysis[]): ScriptDependency[] {
    const dependencies: ScriptDependency[] = [];
    
    // Binary dependencies
    const binaries = new Set(commands.map(c => c.command));
    for (const binary of binaries) {
      dependencies.push({
        type: 'binary',
        name: binary,
        required: true,
        found: true // We'll assume found for now, could check with 'which'
      });
    }
    
    // Script dependencies (other scripts called)
    const scriptCalls = content.match(/\.\/([\w\-\.]+\.sh)/g);
    if (scriptCalls) {
      for (const call of scriptCalls) {
        const scriptName = call.replace('./', '');
        dependencies.push({
          type: 'script',
          name: scriptName,
          required: true,
          found: true // Would need to check if file exists
        });
      }
    }
    
    // Environment variable dependencies
    const envVars = content.match(/\$\{?([A-Z_][A-Z0-9_]*)\}?/g);
    if (envVars) {
      for (const envVar of new Set(envVars)) {
        const varName = envVar.replace(/[\$\{\}]/g, '');
        dependencies.push({
          type: 'environment',
          name: varName,
          required: true,
          found: process.env[varName] !== undefined
        });
      }
    }
    
    return dependencies;
  }

  private determinePurpose(name: string, content: string, functionality: string[]): ScriptPurpose {
    const nameLower = name.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (nameLower.includes('build') || contentLower.includes('build')) return 'build';
    if (nameLower.includes('test') || contentLower.includes('test')) return 'test';
    if (nameLower.includes('dev') || contentLower.includes('development')) return 'dev';
    if (nameLower.includes('deploy') || contentLower.includes('deploy')) return 'deployment';
    if (nameLower.includes('clean') || contentLower.includes('cleanup')) return 'cleanup';
    if (nameLower.includes('setup') || contentLower.includes('setup')) return 'setup';
    if (nameLower.includes('monitor') || contentLower.includes('monitor')) return 'monitoring';
    
    // Analyze functionality
    if (functionality.includes('Build automation')) return 'build';
    if (functionality.includes('Testing')) return 'test';
    if (functionality.includes('Development setup')) return 'dev';
    if (functionality.includes('Deployment')) return 'deployment';
    if (functionality.includes('Cleanup')) return 'cleanup';
    if (functionality.includes('Setup/Installation')) return 'setup';
    if (functionality.includes('Monitoring')) return 'monitoring';
    
    return 'utility';
  }

  private analyzeExecutionPattern(content: string): ExecutionPattern {
    if (content.includes('&') && content.includes('wait')) return 'parallel';
    if (content.includes('for ') || content.includes('while ')) return 'loop';
    if (content.includes('if ') || content.includes('case ')) return 'conditional';
    if (content.includes('&&') || content.includes('||')) return 'chained';
    return 'standalone';
  }

  private calculateComplexity(content: string, lines: string[]): ScriptComplexity {
    const lineCount = lines.length;
    const functionCount = (content.match(/function\s+\w+|^\w+\(\)/gm) || []).length;
    const conditionalCount = (content.match(/\b(if|case|while|for)\b/g) || []).length;
    const loopCount = (content.match(/\b(while|for)\b/g) || []).length;
    
    // Simple complexity score calculation
    let complexityScore = 1;
    if (lineCount > 50) complexityScore += 2;
    if (lineCount > 100) complexityScore += 2;
    if (functionCount > 3) complexityScore += 2;
    if (conditionalCount > 5) complexityScore += 2;
    if (loopCount > 2) complexityScore += 1;
    
    return {
      lineCount,
      functionCount,
      conditionalCount,
      loopCount,
      complexityScore: Math.min(complexityScore, 10)
    };
  }

  private identifyIssues(content: string, lines: string[], commands: CommandAnalysis[]): ScriptIssue[] {
    const issues: ScriptIssue[] = [];
    
    // Check for common issues
    if (!content.includes('#!/bin/bash') && !content.includes('#!/bin/sh')) {
      issues.push({
        type: 'warning',
        message: 'Missing shebang line',
        lineNumber: 1,
        severity: 'medium'
      });
    }
    
    if (!content.includes('set -e') && !content.includes('set -euo pipefail')) {
      issues.push({
        type: 'suggestion',
        message: 'Consider adding error handling (set -e)',
        severity: 'low'
      });
    }
    
    // Check for hardcoded paths
    const hardcodedPaths = content.match(/\/[a-zA-Z0-9_\-\/]+/g);
    if (hardcodedPaths && hardcodedPaths.length > 3) {
      issues.push({
        type: 'warning',
        message: 'Multiple hardcoded paths detected',
        severity: 'medium'
      });
    }
    
    return issues;
  }

  private isObsolete(content: string, commands: CommandAnalysis[], dependencies: ScriptDependency[]): boolean {
    // Check for TODO/FIXME comments indicating incomplete work
    if (content.includes('TODO') || content.includes('FIXME')) return false;
    
    // Check if script has very few commands
    if (commands.length < 3) return true;
    
    // Check for missing dependencies
    const missingDeps = dependencies.filter(d => !d.found && d.required);
    if (missingDeps.length > 0) return true;
    
    return false;
  }

  private groupScriptsByPurpose(scripts: ScriptAnalysis[]): Record<ScriptPurpose, ScriptAnalysis[]> {
    const grouped: Record<ScriptPurpose, ScriptAnalysis[]> = {
      build: [],
      dev: [],
      test: [],
      deployment: [],
      cleanup: [],
      setup: [],
      utility: [],
      monitoring: [],
      unknown: []
    };
    
    for (const script of scripts) {
      grouped[script.purpose].push(script);
    }
    
    return grouped;
  }

  private identifyRedundantGroups(scripts: ScriptAnalysis[]): RedundantScriptGroup[] {
    const groups: RedundantScriptGroup[] = [];
    const scriptsByPurpose = this.groupScriptsByPurpose(scripts);
    
    for (const [purpose, purposeScripts] of Object.entries(scriptsByPurpose)) {
      if (purposeScripts.length > 1) {
        const overlapScore = this.calculateOverlapScore(purposeScripts);
        if (overlapScore > 50) { // 50% overlap threshold
          groups.push({
            purpose: purpose as ScriptPurpose,
            scripts: purposeScripts,
            overlapScore,
            recommendedAction: overlapScore > 80 ? 'merge' : 'refactor',
            primaryScript: this.selectPrimaryScript(purposeScripts)
          });
        }
      }
    }
    
    return groups;
  }

  private calculateOverlapScore(scripts: ScriptAnalysis[]): number {
    if (scripts.length < 2) return 0;
    
    // Calculate functionality overlap
    const allFunctionality = scripts.flatMap(s => s.functionality);
    const uniqueFunctionality = new Set(allFunctionality);
    const overlapRatio = (allFunctionality.length - uniqueFunctionality.size) / allFunctionality.length;
    
    return Math.round(overlapRatio * 100);
  }

  private selectPrimaryScript(scripts: ScriptAnalysis[]): string {
    // Select the most comprehensive script as primary
    return scripts.reduce((primary, current) => 
      current.functionality.length > primary.functionality.length ? current : primary
    ).name;
  }

  private generateConsolidationPlan(scripts: ScriptAnalysis[], redundantGroups: RedundantScriptGroup[]): ConsolidationPlan {
    const consolidatedScripts: ConsolidatedScript[] = [];
    const scriptsToRemove: string[] = [];
    const migrationSteps: MigrationStep[] = [];
    
    let stepCounter = 1;
    
    for (const group of redundantGroups) {
      if (group.recommendedAction === 'merge') {
        const primaryScript = group.scripts.find(s => s.name === group.primaryScript);
        if (primaryScript) {
          consolidatedScripts.push({
            name: `consolidated-${group.purpose}.sh`,
            purpose: group.purpose,
            sourceScripts: group.scripts.map(s => s.name),
            functionality: [...new Set(group.scripts.flatMap(s => s.functionality))],
            estimatedEffort: group.scripts.length > 3 ? 'high' : 'medium'
          });
          
          scriptsToRemove.push(...group.scripts.filter(s => s.name !== group.primaryScript).map(s => s.name));
          
          migrationSteps.push({
            step: stepCounter++,
            description: `Consolidate ${group.purpose} scripts into single script`,
            scriptsAffected: group.scripts.map(s => s.name),
            riskLevel: 'medium',
            estimatedTime: '2-4 hours'
          });
        }
      }
    }
    
    return {
      targetScriptCount: scripts.length - scriptsToRemove.length + consolidatedScripts.length,
      consolidatedScripts,
      scriptsToRemove,
      migrationSteps
    };
  }

  private generateRecommendations(scripts: ScriptAnalysis[], redundantGroups: RedundantScriptGroup[]): ConsolidationRecommendation[] {
    const recommendations: ConsolidationRecommendation[] = [];
    
    // Merge recommendations
    for (const group of redundantGroups) {
      if (group.overlapScore > 70) {
        recommendations.push({
          type: 'merge',
          description: `Merge ${group.scripts.length} ${group.purpose} scripts with ${group.overlapScore}% overlap`,
          scripts: group.scripts.map(s => s.name),
          priority: 'high',
          effort: 'medium',
          impact: 'Reduces maintenance overhead and confusion'
        });
      }
    }
    
    // Remove obsolete scripts
    const obsoleteScripts = scripts.filter(s => s.obsolete);
    if (obsoleteScripts.length > 0) {
      recommendations.push({
        type: 'remove',
        description: `Remove ${obsoleteScripts.length} obsolete scripts`,
        scripts: obsoleteScripts.map(s => s.name),
        priority: 'medium',
        effort: 'low',
        impact: 'Cleans up codebase and reduces confusion'
      });
    }
    
    // Standardization recommendations
    const scriptsWithIssues = scripts.filter(s => s.issues.length > 0);
    if (scriptsWithIssues.length > 0) {
      recommendations.push({
        type: 'standardize',
        description: `Standardize ${scriptsWithIssues.length} scripts with quality issues`,
        scripts: scriptsWithIssues.map(s => s.name),
        priority: 'low',
        effort: 'low',
        impact: 'Improves code quality and maintainability'
      });
    }
    
    return recommendations;
  }

  // Enhanced redundancy detection methods
  async detectScriptRedundancy(): Promise<ScriptRedundancyReport> {
    const scripts = await this.analyzeAllScripts();
    const redundancyAnalysis = this.performDetailedRedundancyAnalysis(scripts);
    
    return {
      totalScripts: scripts.totalScripts,
      redundancyGroups: redundancyAnalysis.groups,
      commandPatternAnalysis: redundancyAnalysis.commandPatterns,
      executionFlowAnalysis: redundancyAnalysis.executionFlows,
      consolidationOpportunities: redundancyAnalysis.opportunities
    };
  }

  private performDetailedRedundancyAnalysis(report: ScriptConsolidationReport): DetailedRedundancyAnalysis {
    const allScripts = Object.values(report.scriptsByPurpose).flat();
    
    // Analyze command patterns
    const commandPatterns = this.analyzeCommandPatterns(allScripts);
    
    // Analyze execution flows
    const executionFlows = this.analyzeExecutionFlows(allScripts);
    
    // Find consolidation opportunities
    const opportunities = this.findConsolidationOpportunities(allScripts, commandPatterns, executionFlows);
    
    return {
      groups: report.redundantGroups,
      commandPatterns,
      executionFlows,
      opportunities
    };
  }

  private analyzeCommandPatterns(scripts: ScriptAnalysis[]): CommandPatternAnalysis[] {
    const patterns: CommandPatternAnalysis[] = [];
    const commandSequences = new Map<string, ScriptAnalysis[]>();
    
    for (const script of scripts) {
      // Create command sequence signature
      const sequence = script.commands
        .filter(c => c.category !== 'system') // Filter out common system commands
        .map(c => c.command)
        .join('->');
      
      if (sequence.length > 0) {
        if (!commandSequences.has(sequence)) {
          commandSequences.set(sequence, []);
        }
        commandSequences.get(sequence)!.push(script);
      }
    }
    
    // Find patterns with multiple scripts
    for (const [sequence, scriptsWithPattern] of commandSequences) {
      if (scriptsWithPattern.length > 1) {
        patterns.push({
          pattern: sequence,
          scripts: scriptsWithPattern.map(s => s.name),
          frequency: scriptsWithPattern.length,
          similarity: this.calculatePatternSimilarity(scriptsWithPattern)
        });
      }
    }
    
    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private analyzeExecutionFlows(scripts: ScriptAnalysis[]): ExecutionFlowAnalysis[] {
    const flows: ExecutionFlowAnalysis[] = [];
    
    for (const script of scripts) {
      const flow = this.extractExecutionFlow(script);
      if (flow.steps.length > 0) {
        flows.push(flow);
      }
    }
    
    return flows;
  }

  private extractExecutionFlow(script: ScriptAnalysis): ExecutionFlowAnalysis {
    const steps: ExecutionStep[] = [];
    
    // Analyze the script's execution pattern
    for (const command of script.commands) {
      steps.push({
        stepNumber: steps.length + 1,
        command: command.command,
        category: command.category,
        isConditional: command.isConditional,
        dependencies: this.getCommandDependencies(command, script)
      });
    }
    
    return {
      scriptName: script.name,
      flowType: script.executionPattern,
      steps,
      complexity: this.calculateFlowComplexity(steps)
    };
  }

  private getCommandDependencies(command: CommandAnalysis, script: ScriptAnalysis): string[] {
    // Find dependencies for this specific command
    return script.dependencies
      .filter(d => d.type === 'binary' && d.name === command.command)
      .map(d => d.name);
  }

  private calculateFlowComplexity(steps: ExecutionStep[]): number {
    let complexity = steps.length;
    complexity += steps.filter(s => s.isConditional).length * 2;
    return Math.min(complexity, 10);
  }

  private findConsolidationOpportunities(
    scripts: ScriptAnalysis[], 
    patterns: CommandPatternAnalysis[], 
    flows: ExecutionFlowAnalysis[]
  ): ConsolidationOpportunity[] {
    const opportunities: ConsolidationOpportunity[] = [];
    
    // Find scripts with identical command patterns
    for (const pattern of patterns) {
      if (pattern.frequency > 1 && pattern.similarity > 0.8) {
        opportunities.push({
          type: 'identical_patterns',
          description: `${pattern.scripts.length} scripts share identical command patterns`,
          scripts: pattern.scripts,
          potentialSavings: this.calculatePotentialSavings(pattern.scripts, scripts),
          effort: pattern.scripts.length > 3 ? 'high' : 'medium',
          recommendation: 'Create a single parameterized script'
        });
      }
    }
    
    // Find scripts with similar execution flows
    const flowGroups = this.groupSimilarFlows(flows);
    for (const group of flowGroups) {
      if (group.length > 1) {
        opportunities.push({
          type: 'similar_flows',
          description: `${group.length} scripts have similar execution flows`,
          scripts: group.map(f => f.scriptName),
          potentialSavings: this.calculatePotentialSavings(group.map(f => f.scriptName), scripts),
          effort: 'medium',
          recommendation: 'Refactor into modular functions'
        });
      }
    }
    
    return opportunities;
  }

  private calculatePatternSimilarity(scripts: ScriptAnalysis[]): number {
    if (scripts.length < 2) return 0;
    
    const [first, ...rest] = scripts;
    const firstCommands = new Set(first.commands.map(c => c.command));
    
    let totalSimilarity = 0;
    for (const script of rest) {
      const scriptCommands = new Set(script.commands.map(c => c.command));
      const intersection = new Set([...firstCommands].filter(c => scriptCommands.has(c)));
      const union = new Set([...firstCommands, ...scriptCommands]);
      const similarity = intersection.size / union.size;
      totalSimilarity += similarity;
    }
    
    return totalSimilarity / rest.length;
  }

  private groupSimilarFlows(flows: ExecutionFlowAnalysis[]): ExecutionFlowAnalysis[][] {
    const groups: ExecutionFlowAnalysis[][] = [];
    const processed = new Set<string>();
    
    for (const flow of flows) {
      if (processed.has(flow.scriptName)) continue;
      
      const similarFlows = flows.filter(f => 
        !processed.has(f.scriptName) && 
        this.areFlowsSimilar(flow, f)
      );
      
      if (similarFlows.length > 1) {
        groups.push(similarFlows);
        similarFlows.forEach(f => processed.add(f.scriptName));
      }
    }
    
    return groups;
  }

  private areFlowsSimilar(flow1: ExecutionFlowAnalysis, flow2: ExecutionFlowAnalysis): boolean {
    if (flow1.flowType !== flow2.flowType) return false;
    
    const commands1 = flow1.steps.map(s => s.command);
    const commands2 = flow2.steps.map(s => s.command);
    
    const intersection = commands1.filter(c => commands2.includes(c));
    const similarity = intersection.length / Math.max(commands1.length, commands2.length);
    
    return similarity > 0.6;
  }

  private calculatePotentialSavings(scriptNames: string[], allScripts: ScriptAnalysis[]): PotentialSavings {
    const scripts = allScripts.filter(s => scriptNames.includes(s.name));
    const totalLines = scripts.reduce((sum, s) => sum + s.complexity.lineCount, 0);
    const avgComplexity = scripts.reduce((sum, s) => sum + s.complexity.complexityScore, 0) / scripts.length;
    
    return {
      linesOfCode: Math.round(totalLines * 0.6), // Estimate 60% reduction
      maintenanceEffort: scripts.length - 1, // Number of scripts that can be removed
      complexityReduction: Math.round(avgComplexity * 0.4) // Estimate 40% complexity reduction
    };
  }
}
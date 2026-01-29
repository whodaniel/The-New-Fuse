/**
 * Parallel Code Review with 100 KIMI k2.5 Agents
 *
 * This example demonstrates how to review an entire codebase using 100 parallel
 * KIMI k2.5 agents. Each agent reviews a subset of files, and results are
 * aggregated into a comprehensive report.
 *
 * Usage:
 *   tsx examples/kimi-orchestration/parallel-code-review.ts --path ./src
 *
 * Features:
 *   - Automatic file discovery and distribution
 *   - Multi-dimensional code analysis (security, performance, style)
 *   - Priority-based review assignment
 *   - Aggregated reporting with actionable insights
 *   - Support for custom review rules
 */

import { KimiCapability, KimiOrchestrator } from '@the-new-fuse/kimi-orchestrator';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { relative } from 'path';

// Configuration
interface ReviewConfig {
  /** Source directory to review */
  sourcePath: string;
  /** Output report path */
  outputPath: string;
  /** File patterns to include */
  includePatterns: string[];
  /** File patterns to exclude */
  excludePatterns: string[];
  /** Review dimensions to analyze */
  reviewDimensions: ReviewDimension[];
  /** Number of agents to use (max 100) */
  agentCount: number;
  /** Minimum priority for critical files */
  criticalPriorityThreshold: number;
}

type ReviewDimension = 'security' | 'performance' | 'style' | 'architecture' | 'documentation';

interface ReviewResult {
  file: string;
  agentId: string;
  dimensions: ReviewDimension[];
  issues: CodeIssue[];
  suggestions: Suggestion[];
  score: number;
  durationMs: number;
  timestamp: string;
}

interface CodeIssue {
  line: number;
  column: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  code?: string;
}

interface Suggestion {
  category: string;
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
}

interface ReviewReport {
  summary: {
    totalFiles: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    averageScore: number;
    durationMs: number;
  };
  byDimension: Record<
    ReviewDimension,
    {
      issueCount: number;
      suggestionCount: number;
      averageScore: number;
    }
  >;
  byFile: ReviewResult[];
  topIssues: CodeIssue[];
  recommendations: string[];
}

// Default configuration
const DEFAULT_CONFIG: ReviewConfig = {
  sourcePath: './src',
  outputPath: './review-report.json',
  includePatterns: ['**/*.{ts,tsx,js,jsx}'],
  excludePatterns: ['**/node_modules/**', '**/*.d.ts', '**/dist/**', '**/build/**'],
  reviewDimensions: ['security', 'performance', 'style', 'architecture'],
  agentCount: 100,
  criticalPriorityThreshold: 8,
};

/**
 * Determine the priority of a file based on its path and content
 */
function determineFilePriority(filePath: string, content: string): number {
  let priority = 5; // Default medium priority

  // Critical files get higher priority
  const criticalPatterns = [
    /auth/i,
    /security/i,
    /password/i,
    /token/i,
    /crypt/i,
    /payment/i,
    /billing/i,
  ];

  for (const pattern of criticalPatterns) {
    if (pattern.test(filePath) || pattern.test(content)) {
      priority = 10; // Critical
      break;
    }
  }

  // Core business logic files
  if (/service|controller|repository/i.test(filePath)) {
    priority = Math.max(priority, 8);
  }

  // Configuration files
  if (/config|settings|env/i.test(filePath)) {
    priority = Math.max(priority, 9);
  }

  return priority;
}

/**
 * Get required capabilities based on file type and review dimensions
 */
function getRequiredCapabilities(
  filePath: string,
  dimensions: ReviewDimension[]
): KimiCapability[] {
  const capabilities: KimiCapability[] = ['code-review'];

  // Language-specific capabilities
  if (/\.(ts|tsx)$/.test(filePath)) {
    capabilities.push('typescript');
  } else if (/\.(js|jsx)$/.test(filePath)) {
    capabilities.push('javascript');
  }

  // Framework-specific
  if (/react/i.test(filePath)) {
    capabilities.push('react');
  }

  // Dimension-specific
  if (dimensions.includes('security')) {
    capabilities.push('security-audit');
  }

  if (dimensions.includes('performance')) {
    capabilities.push('performance-optimization');
  }

  if (dimensions.includes('architecture')) {
    capabilities.push('architecture-design');
  }

  return capabilities;
}

/**
 * Main code review orchestrator
 */
async function runParallelCodeReview(config: ReviewConfig = DEFAULT_CONFIG): Promise<ReviewReport> {
  const startTime = Date.now();

  console.log('🔍 Starting Parallel Code Review');
  console.log(`📁 Source: ${config.sourcePath}`);
  console.log(`🤖 Agents: ${config.agentCount}`);
  console.log(`📊 Dimensions: ${config.reviewDimensions.join(', ')}`);

  // Initialize orchestrator
  const orchestrator = new KimiOrchestrator({
    maxAgents: config.agentCount,
    distributionStrategy: 'capability-based',
    heartbeatIntervalMs: 30000,
    agentTimeoutMs: 300000, // 5 minutes for code review
    enableAutoRecovery: true,
    maxRetries: 2,
    logLevel: 'info',
  });

  try {
    await orchestrator.start();
    console.log('✅ Orchestrator started');

    // Discover files
    console.log('🔎 Discovering files...');
    const files = await discoverFiles(config);
    console.log(`📄 Found ${files.length} files to review`);

    if (files.length === 0) {
      throw new Error('No files found matching the specified patterns');
    }

    // Register agents with different capabilities
    console.log('👥 Registering agents...');
    await registerAgents(orchestrator, config);

    // Distribute review tasks
    console.log('📋 Distributing review tasks...');
    const results = await distributeReviews(orchestrator, files, config);

    // Generate report
    console.log('📊 Generating report...');
    const report = generateReport(results, Date.now() - startTime);

    // Save report
    writeFileSync(config.outputPath, JSON.stringify(report, null, 2));
    console.log(`💾 Report saved to ${config.outputPath}`);

    // Print summary
    printSummary(report);

    return report;
  } finally {
    await orchestrator.stop();
    console.log('👋 Orchestrator stopped');
  }
}

/**
 * Discover files to review
 */
async function discoverFiles(config: ReviewConfig): Promise<string[]> {
  const files: string[] = [];

  for (const pattern of config.includePatterns) {
    const matches = await glob(pattern, {
      cwd: config.sourcePath,
      absolute: true,
      ignore: config.excludePatterns,
    });
    files.push(...matches);
  }

  // Remove duplicates and sort
  return [...new Set(files)].sort();
}

/**
 * Register agents with different capability profiles
 */
async function registerAgents(orchestrator: KimiOrchestrator, config: ReviewConfig): Promise<void> {
  // Define agent capability profiles
  const profiles: KimiCapability[][] = [
    ['code-review', 'typescript', 'security-audit'],
    ['code-review', 'typescript', 'performance-optimization'],
    ['code-review', 'typescript', 'architecture-design'],
    ['code-review', 'javascript', 'security-audit'],
    ['code-review', 'javascript', 'performance-optimization'],
    ['code-review', 'react', 'typescript'],
    ['code-review', 'nodejs', 'security-audit'],
    ['code-review', 'database', 'performance-optimization'],
  ];

  // Register agents
  for (let i = 0; i < config.agentCount; i++) {
    const profile = profiles[i % profiles.length];
    await orchestrator.registerAgent(`reviewer-${i.toString().padStart(3, '0')}`, profile);
  }

  console.log(`✅ Registered ${config.agentCount} agents`);
}

/**
 * Distribute review tasks across agents
 */
async function distributeReviews(
  orchestrator: KimiOrchestrator,
  files: string[],
  config: ReviewConfig
): Promise<ReviewResult[]> {
  const results: ReviewResult[] = [];
  const batchSize = 10; // Process in batches to avoid overwhelming

  // Sort files by priority (critical first)
  const filesWithPriority = files
    .map((file) => {
      const content = readFileSync(file, 'utf-8');
      return {
        path: file,
        priority: determineFilePriority(file, content),
        content: content.slice(0, 10000), // First 10KB for priority calculation
      };
    })
    .sort((a, b) => b.priority - a.priority);

  console.log(`🎯 Processing ${files.length} files in batches of ${batchSize}`);

  // Process files in batches
  for (let i = 0; i < filesWithPriority.length; i += batchSize) {
    const batch = filesWithPriority.slice(i, i + batchSize);
    console.log(`⏳ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);

    const batchPromises = batch.map(async (fileInfo) => {
      const relativePath = relative(config.sourcePath, fileInfo.path);
      const capabilities = getRequiredCapabilities(fileInfo.path, config.reviewDimensions);

      const taskStartTime = Date.now();

      try {
        const result = await orchestrator.submitTask(
          'code-review',
          {
            file: relativePath,
            content: readFileSync(fileInfo.path, 'utf-8'),
            dimensions: config.reviewDimensions,
          },
          {
            requiredCapabilities: capabilities,
            priority: fileInfo.priority,
            timeoutMs: 300000,
          }
        );

        if (result.success && result.data) {
          const reviewResult: ReviewResult = {
            file: relativePath,
            agentId: result.data.agentId,
            dimensions: config.reviewDimensions,
            issues: result.data.payload?.issues || [],
            suggestions: result.data.payload?.suggestions || [],
            score: result.data.payload?.score || 0,
            durationMs: Date.now() - taskStartTime,
            timestamp: new Date().toISOString(),
          };

          const issueCount = reviewResult.issues.length;
          const emoji = issueCount === 0 ? '✅' : issueCount > 5 ? '⚠️' : '⚡';
          console.log(
            `  ${emoji} ${relativePath} (${issueCount} issues, score: ${reviewResult.score})`
          );

          return reviewResult;
        } else {
          throw new Error(result.error || 'Task failed');
        }
      } catch (error) {
        console.error(
          `  ❌ ${relativePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return {
          file: relativePath,
          agentId: 'failed',
          dimensions: config.reviewDimensions,
          issues: [
            {
              line: 0,
              column: 0,
              severity: 'high',
              category: 'system',
              message: `Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          suggestions: [],
          score: 0,
          durationMs: Date.now() - taskStartTime,
          timestamp: new Date().toISOString(),
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Progress update
    const progress = (((i + batch.length) / files.length) * 100).toFixed(1);
    console.log(`📈 Progress: ${progress}% (${i + batch.length}/${files.length})`);
  }

  return results;
}

/**
 * Generate comprehensive review report
 */
function generateReport(results: ReviewResult[], durationMs: number): ReviewReport {
  const allIssues = results.flatMap((r) => r.issues);
  const allSuggestions = results.flatMap((r) => r.suggestions);

  // Calculate summary statistics
  const summary = {
    totalFiles: results.length,
    totalIssues: allIssues.length,
    criticalIssues: allIssues.filter((i) => i.severity === 'critical').length,
    highIssues: allIssues.filter((i) => i.severity === 'high').length,
    averageScore: results.reduce((acc, r) => acc + r.score, 0) / results.length || 0,
    durationMs,
  };

  // Calculate by dimension
  const byDimension: ReviewReport['byDimension'] = {
    security: { issueCount: 0, suggestionCount: 0, averageScore: 0 },
    performance: { issueCount: 0, suggestionCount: 0, averageScore: 0 },
    style: { issueCount: 0, suggestionCount: 0, averageScore: 0 },
    architecture: { issueCount: 0, suggestionCount: 0, averageScore: 0 },
    documentation: { issueCount: 0, suggestionCount: 0, averageScore: 0 },
  };

  // Count issues by dimension (using category as proxy)
  for (const issue of allIssues) {
    const dim = Object.keys(byDimension).find((d) => issue.category.toLowerCase().includes(d)) as
      | ReviewDimension
      | undefined;

    if (dim) {
      byDimension[dim].issueCount++;
    }
  }

  // Get top issues
  const topIssues = allIssues
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 20);

  // Generate recommendations
  const recommendations = generateRecommendations(results, summary);

  return {
    summary,
    byDimension,
    byFile: results,
    topIssues,
    recommendations,
  };
}

/**
 * Generate actionable recommendations based on review results
 */
function generateRecommendations(
  results: ReviewResult[],
  summary: ReviewReport['summary']
): string[] {
  const recommendations: string[] = [];

  if (summary.criticalIssues > 0) {
    recommendations.push(
      `🚨 Address ${summary.criticalIssues} critical security issues immediately`
    );
  }

  if (summary.averageScore < 70) {
    recommendations.push('📉 Overall code quality is below target. Consider a refactoring sprint.');
  }

  // Find files with most issues
  const problematicFiles = results
    .filter((r) => r.issues.length > 10)
    .sort((a, b) => b.issues.length - a.issues.length)
    .slice(0, 5);

  if (problematicFiles.length > 0) {
    recommendations.push(
      `🔧 Focus on refactoring these high-issue files: ${problematicFiles.map((f) => f.file).join(', ')}`
    );
  }

  // Security recommendations
  const securityIssues = results
    .flatMap((r) => r.issues)
    .filter((i) => i.category.toLowerCase().includes('security'));
  if (securityIssues.length > 5) {
    recommendations.push('🔒 Schedule a security audit. Multiple security concerns detected.');
  }

  // Performance recommendations
  const perfIssues = results
    .flatMap((r) => r.issues)
    .filter((i) => i.category.toLowerCase().includes('performance'));
  if (perfIssues.length > 10) {
    recommendations.push(
      '⚡ Performance optimization recommended. Consider profiling critical paths.'
    );
  }

  return recommendations;
}

/**
 * Print summary to console
 */
function printSummary(report: ReviewReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 CODE REVIEW SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files Reviewed:     ${report.summary.totalFiles}`);
  console.log(`Total Issues:       ${report.summary.totalIssues}`);
  console.log(`Critical Issues:    ${report.summary.criticalIssues} 🚨`);
  console.log(`High Issues:        ${report.summary.highIssues} ⚠️`);
  console.log(`Average Score:      ${report.summary.averageScore.toFixed(1)}/100`);
  console.log(`Duration:           ${(report.summary.durationMs / 1000).toFixed(1)}s`);
  console.log('='.repeat(60));

  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec) => console.log(`   ${rec}`));
  }

  console.log('\n✅ Review complete!');
}

// CLI Entry Point
async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const config: ReviewConfig = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--path':
      case '-p':
        config.sourcePath = value;
        break;
      case '--output':
      case '-o':
        config.outputPath = value;
        break;
      case '--agents':
      case '-a':
        config.agentCount = Math.min(parseInt(value), 100);
        break;
      case '--dimensions':
      case '-d':
        config.reviewDimensions = value.split(',') as ReviewDimension[];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  try {
    await runParallelCodeReview(config);
    process.exit(0);
  } catch (error) {
    console.error('❌ Code review failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
Parallel Code Review with KIMI k2.5 Agents

Usage: tsx parallel-code-review.ts [options]

Options:
  -p, --path <path>        Source directory to review (default: ./src)
  -o, --output <path>      Output report path (default: ./review-report.json)
  -a, --agents <count>     Number of agents to use 1-100 (default: 100)
  -d, --dimensions <list>  Comma-separated dimensions (default: security,performance,style,architecture)
  -h, --help              Show this help message

Examples:
  tsx parallel-code-review.ts
  tsx parallel-code-review.ts --path ./packages --agents 50
  tsx parallel-code-review.ts --dimensions security,performance --output security-report.json
  `);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { ReviewConfig, ReviewReport, ReviewResult, runParallelCodeReview };

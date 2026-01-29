/**
 * Distributed Testing Across 100 Parallel KIMI k2.5 Agents
 *
 * This example demonstrates how to distribute a test suite across 100 parallel
 * agents for ultra-fast test execution. Includes test result aggregation,
 * coverage merging, and intelligent failure analysis.
 *
 * Usage: tsx distributed-testing.ts --pattern 'PATTERN'
 *
 * Features:
 *   - Automatic test file discovery and chunking
 *   - Parallel execution across 100 agents
 *   - Real-time progress tracking
 *   - Coverage report merging
 *   - Intelligent test failure analysis
 *   - Retry mechanism for flaky tests
 */

import { KimiCapability, KimiOrchestrator } from '@the-new-fuse/kimi-orchestrator';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { resolve } from 'path';

// Configuration
interface TestConfig {
  /** Test file pattern(s) */
  testPattern: string | string[];
  /** Source directory */
  rootDir: string;
  /** Output directory for results */
  outputDir: string;
  /** Number of agents to use */
  agentCount: number;
  /** Enable coverage collection */
  collectCoverage: boolean;
  /** Coverage thresholds */
  coverageThresholds: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  /** Retry attempts for failed tests */
  maxRetries: number;
  /** Test timeout in milliseconds */
  testTimeoutMs: number;
  /** Fail fast on first failure */
  bail: boolean;
  /** Run tests in isolation */
  isolate: boolean;
}

interface TestChunk {
  id: string;
  files: string[];
  estimatedDuration: number;
  dependencies: string[];
}

interface TestResult {
  chunkId: string;
  agentId: string;
  success: boolean;
  testFiles: string[];
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  failures: TestFailure[];
  coverage?: CoverageReport;
  logs: string;
  timestamp: string;
}

interface TestFailure {
  file: string;
  testName: string;
  error: string;
  stack?: string;
  duration: number;
}

interface CoverageReport {
  statements: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  lines: { total: number; covered: number; pct: number };
}

interface DistributedTestReport {
  summary: {
    totalFiles: number;
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    durationMs: number;
    success: boolean;
  };
  coverage: CoverageReport | null;
  chunks: TestResult[];
  slowTests: Array<{ file: string; testName: string; duration: number }>;
  flakyTests: Array<{ file: string; testName: string; failures: number }>;
  failureAnalysis: FailureAnalysis;
}

interface FailureAnalysis {
  totalFailures: number;
  byFile: Record<string, number>;
  byError: Record<string, number>;
  commonPatterns: string[];
  recommendations: string[];
}

// Default configuration
const DEFAULT_CONFIG: TestConfig = {
  testPattern: '**/*.test.{ts,tsx,js,jsx}',
  rootDir: '.',
  outputDir: './test-results',
  agentCount: 100,
  collectCoverage: true,
  coverageThresholds: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
  maxRetries: 2,
  testTimeoutMs: 300000, // 5 minutes
  bail: false,
  isolate: true,
};

/**
 * Main distributed testing function
 */
async function runDistributedTests(
  config: TestConfig = DEFAULT_CONFIG
): Promise<DistributedTestReport> {
  const startTime = Date.now();

  console.log('🧪 Starting Distributed Testing');
  console.log(`📁 Root: ${config.rootDir}`);
  console.log(`🤖 Agents: ${config.agentCount}`);
  console.log(`📊 Coverage: ${config.collectCoverage ? 'Enabled' : 'Disabled'}`);

  // Ensure output directory exists
  if (!existsSync(config.outputDir)) {
    mkdirSync(config.outputDir, { recursive: true });
  }

  // Initialize orchestrator
  const orchestrator = new KimiOrchestrator({
    maxAgents: config.agentCount,
    distributionStrategy: 'load-balanced',
    heartbeatIntervalMs: 30000,
    agentTimeoutMs: config.testTimeoutMs + 60000, // Add buffer
    enableAutoRecovery: true,
    maxRetries: config.maxRetries,
    logLevel: 'info',
  });

  try {
    await orchestrator.start();
    console.log('✅ Orchestrator started');

    // Discover test files
    console.log('🔎 Discovering test files...');
    const testFiles = await discoverTestFiles(config);
    console.log(`📄 Found ${testFiles.length} test files`);

    if (testFiles.length === 0) {
      throw new Error('No test files found matching the specified patterns');
    }

    // Analyze test file dependencies and estimate durations
    console.log('📊 Analyzing test files...');
    const analyzedFiles = await analyzeTestFiles(testFiles, config);

    // Create optimized chunks
    console.log('🎯 Creating test chunks...');
    const chunks = createOptimizedChunks(analyzedFiles, config);
    console.log(`📦 Created ${chunks.length} chunks`);

    // Register test agents
    console.log('👥 Registering test agents...');
    await registerTestAgents(orchestrator, config);

    // Execute tests in parallel
    console.log('🚀 Executing tests...');
    const results = await executeTestChunks(orchestrator, chunks, config);

    // Process results
    console.log('📈 Processing results...');
    const report = generateTestReport(results, config, Date.now() - startTime);

    // Save results
    saveTestResults(report, config);

    // Print summary
    printTestSummary(report);

    return report;
  } finally {
    await orchestrator.stop();
    console.log('👋 Orchestrator stopped');
  }
}

/**
 * Discover test files matching the configured patterns
 */
async function discoverTestFiles(config: TestConfig): Promise<string[]> {
  const patterns = Array.isArray(config.testPattern) ? config.testPattern : [config.testPattern];

  const files: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: config.rootDir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
    });
    files.push(...matches);
  }

  return [...new Set(files)].sort();
}

/**
 * Analyze test files for dependencies and estimated duration
 */
async function analyzeTestFiles(
  files: string[],
  config: TestConfig
): Promise<Array<{ path: string; dependencies: string[]; estimatedDuration: number }>> {
  return files.map((file) => {
    const content = readFileSync(file, 'utf-8');

    // Extract imports to determine dependencies
    const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || [];
    const dependencies = importMatches
      .map((m) => m.match(/from\s+['"]([^'"]+)['"]/)?.[1])
      .filter((d): d is string => Boolean(d) && !d.startsWith('.'));

    // Estimate duration based on test count and complexity
    const testCount = (content.match(/\b(it|test|describe)\s*\(/g) || []).length;
    const hasAsync = /async|await|Promise/.test(content);
    const estimatedDuration = testCount * (hasAsync ? 500 : 200); // ms per test

    return {
      path: file,
      dependencies,
      estimatedDuration,
    };
  });
}

/**
 * Create optimized test chunks for parallel execution
 */
function createOptimizedChunks(
  files: Array<{ path: string; dependencies: string[]; estimatedDuration: number }>,
  config: TestConfig
): TestChunk[] {
  const targetChunkDuration =
    files.reduce((sum, f) => sum + f.estimatedDuration, 0) / config.agentCount;
  const chunks: TestChunk[] = [];
  let currentChunk: TestChunk = {
    id: `chunk-${chunks.length}`,
    files: [],
    estimatedDuration: 0,
    dependencies: [],
  };

  // Sort files by estimated duration (longest first for better balancing)
  const sortedFiles = [...files].sort((a, b) => b.estimatedDuration - a.estimatedDuration);

  for (const file of sortedFiles) {
    // Start new chunk if current would exceed target duration significantly
    if (currentChunk.estimatedDuration > targetChunkDuration && currentChunk.files.length > 0) {
      chunks.push(currentChunk);
      currentChunk = {
        id: `chunk-${chunks.length}`,
        files: [],
        estimatedDuration: 0,
        dependencies: [],
      };
    }

    currentChunk.files.push(file.path);
    currentChunk.estimatedDuration += file.estimatedDuration;
    currentChunk.dependencies.push(...file.dependencies);
  }

  // Add remaining files
  if (currentChunk.files.length > 0) {
    chunks.push(currentChunk);
  }

  // Deduplicate dependencies
  for (const chunk of chunks) {
    chunk.dependencies = [...new Set(chunk.dependencies)];
  }

  return chunks;
}

/**
 * Register test agents with appropriate capabilities
 */
async function registerTestAgents(
  orchestrator: KimiOrchestrator,
  config: TestConfig
): Promise<void> {
  const capabilityProfiles: KimiCapability[][] = [
    ['testing', 'typescript'],
    ['testing', 'javascript'],
    ['testing', 'typescript', 'react'],
    ['testing', 'nodejs'],
    ['testing', 'database'],
    ['testing', 'api-design'],
  ];

  for (let i = 0; i < config.agentCount; i++) {
    const profile = capabilityProfiles[i % capabilityProfiles.length];
    await orchestrator.registerAgent(`test-agent-${i.toString().padStart(3, '0')}`, profile);
  }

  console.log(`✅ Registered ${config.agentCount} test agents`);
}

/**
 * Execute test chunks across agents
 */
async function executeTestChunks(
  orchestrator: KimiOrchestrator,
  chunks: TestChunk[],
  config: TestConfig
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const failedChunks: TestChunk[] = [];

  console.log(`🚀 Distributing ${chunks.length} chunks across agents`);

  // Execute chunks in parallel with progress tracking
  const executeChunk = async (chunk: TestChunk, attempt: number = 1): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      const result = await orchestrator.submitTask(
        'run-tests',
        {
          files: chunk.files,
          collectCoverage: config.collectCoverage,
          timeout: config.testTimeoutMs,
          isolate: config.isolate,
        },
        {
          requiredCapabilities: ['testing'],
          priority: 10,
          timeoutMs: config.testTimeoutMs + 30000,
        }
      );

      const durationMs = Date.now() - startTime;

      if (result.success && result.data) {
        const testResult: TestResult = {
          chunkId: chunk.id,
          agentId: result.data.agentId,
          success: result.data.payload?.success ?? false,
          testFiles: chunk.files,
          passed: result.data.payload?.passed || 0,
          failed: result.data.payload?.failed || 0,
          skipped: result.data.payload?.skipped || 0,
          durationMs,
          failures: result.data.payload?.failures || [],
          coverage: result.data.payload?.coverage,
          logs: result.data.payload?.logs || '',
          timestamp: new Date().toISOString(),
        };

        const status = testResult.success ? '✅' : '❌';
        const coverage = testResult.coverage
          ? `(${testResult.coverage.lines.pct.toFixed(0)}% cov)`
          : '';
        console.log(
          `  ${status} ${chunk.id}: ${testResult.passed} passed, ${testResult.failed} failed ${coverage}`
        );

        // Retry if failed and attempts remain
        if (!testResult.success && attempt < config.maxRetries) {
          console.log(`  🔄 Retrying ${chunk.id} (attempt ${attempt + 1}/${config.maxRetries})`);
          return executeChunk(chunk, attempt + 1);
        }

        return testResult;
      } else {
        throw new Error(result.error || 'Task failed');
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error(
        `  ❌ ${chunk.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      // Retry on error
      if (attempt < config.maxRetries) {
        console.log(`  🔄 Retrying ${chunk.id} (attempt ${attempt + 1}/${config.maxRetries})`);
        return executeChunk(chunk, attempt + 1);
      }

      return {
        chunkId: chunk.id,
        agentId: 'failed',
        success: false,
        testFiles: chunk.files,
        passed: 0,
        failed: chunk.files.length,
        skipped: 0,
        durationMs,
        failures: chunk.files.map((f) => ({
          file: f,
          testName: 'chunk-execution',
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0,
        })),
        logs: '',
        timestamp: new Date().toISOString(),
      };
    }
  };

  // Process chunks with concurrency control
  const batchSize = Math.min(20, config.agentCount);
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchPromises = batch.map((chunk) => executeChunk(chunk));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Progress update
    const progress = (((i + batch.length) / chunks.length) * 100).toFixed(1);
    console.log(`📈 Progress: ${progress}% (${i + batch.length}/${chunks.length} chunks)`);
  }

  return results;
}

/**
 * Generate comprehensive test report
 */
function generateTestReport(
  results: TestResult[],
  config: TestConfig,
  totalDurationMs: number
): DistributedTestReport {
  // Calculate summary statistics
  const passed = results.reduce((sum, r) => sum + r.passed, 0);
  const failed = results.reduce((sum, r) => sum + r.failed, 0);
  const skipped = results.reduce((sum, r) => sum + r.skipped, 0);
  const totalTests = passed + failed + skipped;

  // Merge coverage reports
  const coverage = config.collectCoverage ? mergeCoverageReports(results) : null;

  // Find slow tests
  const slowTests = results
    .flatMap((r) => r.failures.map((f) => ({ ...f, file: f.file })))
    .filter((f) => f.duration > 5000)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10)
    .map((f) => ({ file: f.file, testName: f.testName, duration: f.duration }));

  // Find flaky tests (would need multiple runs for true detection)
  const flakyTests: DistributedTestReport['flakyTests'] = [];

  // Analyze failures
  const failureAnalysis = analyzeFailures(results);

  return {
    summary: {
      totalFiles: results.reduce((sum, r) => sum + r.testFiles.length, 0),
      totalTests,
      passed,
      failed,
      skipped,
      durationMs: totalDurationMs,
      success: failed === 0,
    },
    coverage,
    chunks: results,
    slowTests,
    flakyTests,
    failureAnalysis,
  };
}

/**
 * Merge coverage reports from all chunks
 */
function mergeCoverageReports(results: TestResult[]): CoverageReport {
  const merged = {
    statements: { total: 0, covered: 0, pct: 0 },
    branches: { total: 0, covered: 0, pct: 0 },
    functions: { total: 0, covered: 0, pct: 0 },
    lines: { total: 0, covered: 0, pct: 0 },
  };

  for (const result of results) {
    if (result.coverage) {
      merged.statements.total += result.coverage.statements.total;
      merged.statements.covered += result.coverage.statements.covered;
      merged.branches.total += result.coverage.branches.total;
      merged.branches.covered += result.coverage.branches.covered;
      merged.functions.total += result.coverage.functions.total;
      merged.functions.covered += result.coverage.functions.covered;
      merged.lines.total += result.coverage.lines.total;
      merged.lines.covered += result.coverage.lines.covered;
    }
  }

  // Calculate percentages
  merged.statements.pct =
    merged.statements.total > 0
      ? Math.round((merged.statements.covered / merged.statements.total) * 1000) / 10
      : 0;
  merged.branches.pct =
    merged.branches.total > 0
      ? Math.round((merged.branches.covered / merged.branches.total) * 1000) / 10
      : 0;
  merged.functions.pct =
    merged.functions.total > 0
      ? Math.round((merged.functions.covered / merged.functions.total) * 1000) / 10
      : 0;
  merged.lines.pct =
    merged.lines.total > 0
      ? Math.round((merged.lines.covered / merged.lines.total) * 1000) / 10
      : 0;

  return merged;
}

/**
 * Analyze test failures for patterns
 */
function analyzeFailures(results: TestResult[]): FailureAnalysis {
  const allFailures = results.flatMap((r) => r.failures);

  // Count by file
  const byFile: Record<string, number> = {};
  for (const failure of allFailures) {
    byFile[failure.file] = (byFile[failure.file] || 0) + 1;
  }

  // Count by error type
  const byError: Record<string, number> = {};
  for (const failure of allFailures) {
    const errorType = failure.error.split(':')[0] || 'Unknown';
    byError[errorType] = (byError[errorType] || 0) + 1;
  }

  // Find common patterns
  const commonPatterns = Object.entries(byError)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([error, count]) => `${error}: ${count} occurrences`);

  // Generate recommendations
  const recommendations: string[] = [];

  if (allFailures.length > 0) {
    const topError = Object.entries(byError).sort((a, b) => b[1] - a[1])[0];
    if (topError) {
      recommendations.push(`Focus on fixing ${topError[0]} errors (${topError[1]} occurrences)`);
    }

    const problematicFiles = Object.entries(byFile)
      .filter(([, count]) => count > 3)
      .sort((a, b) => b[1] - a[1]);

    if (problematicFiles.length > 0) {
      recommendations.push(
        `Review these high-failure files: ${problematicFiles
          .slice(0, 3)
          .map((f) => f[0])
          .join(', ')}`
      );
    }
  }

  return {
    totalFailures: allFailures.length,
    byFile,
    byError,
    commonPatterns,
    recommendations,
  };
}

/**
 * Save test results to output directory
 */
function saveTestResults(report: DistributedTestReport, config: TestConfig): void {
  // Save full report
  writeFileSync(resolve(config.outputDir, 'test-report.json'), JSON.stringify(report, null, 2));

  // Save JUnit-style XML report
  const junitReport = generateJUnitReport(report);
  writeFileSync(resolve(config.outputDir, 'junit-report.xml'), junitReport);

  // Save coverage report if available
  if (report.coverage) {
    writeFileSync(
      resolve(config.outputDir, 'coverage-report.json'),
      JSON.stringify(report.coverage, null, 2)
    );
  }

  console.log(`💾 Results saved to ${config.outputDir}`);
}

/**
 * Generate JUnit-style XML report
 */
function generateJUnitReport(report: DistributedTestReport): string {
  const { summary } = report;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<testsuites tests="${summary.totalTests}" failures="${summary.failed}" skipped="${summary.skipped}" time="${summary.durationMs / 1000}">\n`;

  for (const chunk of report.chunks) {
    for (const testFile of chunk.testFiles) {
      const fileFailures = chunk.failures.filter((f) => f.file === testFile);

      xml += `  <testsuite name="${testFile}" tests="${fileFailures.length + 1}" failures="${fileFailures.length}" time="${chunk.durationMs / 1000}">\n`;

      if (fileFailures.length === 0) {
        xml += `    <testcase name="test" time="${chunk.durationMs / 1000}"/>\n`;
      } else {
        for (const failure of fileFailures) {
          xml += `    <testcase name="${failure.testName}" time="${failure.duration / 1000}">\n`;
          xml += `      <failure message="${escapeXml(failure.error)}">${escapeXml(failure.stack || '')}</failure>\n`;
          xml += `    </testcase>\n`;
        }
      }

      xml += '  </testsuite>\n';
    }
  }

  xml += '</testsuites>';
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Print test summary to console
 */
function printTestSummary(report: DistributedTestReport): void {
  const { summary, coverage } = report;

  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Test Files:        ${summary.totalFiles}`);
  console.log(`Total Tests:       ${summary.totalTests}`);
  console.log(`Passed:            ${summary.passed} ✅`);
  console.log(`Failed:            ${summary.failed} ${summary.failed > 0 ? '❌' : ''}`);
  console.log(`Skipped:           ${summary.skipped}`);
  console.log(`Duration:          ${(summary.durationMs / 1000).toFixed(1)}s`);
  console.log(`Status:            ${summary.success ? '✅ PASSED' : '❌ FAILED'}`);

  if (coverage) {
    console.log('\n📊 COVERAGE:');
    console.log(`   Statements:  ${coverage.statements.pct.toFixed(1)}%`);
    console.log(`   Branches:    ${coverage.branches.pct.toFixed(1)}%`);
    console.log(`   Functions:   ${coverage.functions.pct.toFixed(1)}%`);
    console.log(`   Lines:       ${coverage.lines.pct.toFixed(1)}%`);
  }

  if (report.failureAnalysis.totalFailures > 0) {
    console.log('\n🔍 FAILURE ANALYSIS:');
    report.failureAnalysis.commonPatterns.forEach((pattern) => {
      console.log(`   • ${pattern}`);
    });

    if (report.failureAnalysis.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.failureAnalysis.recommendations.forEach((rec) => {
        console.log(`   • ${rec}`);
      });
    }
  }

  console.log('='.repeat(60));
}

// CLI Entry Point
async function main() {
  const args = process.argv.slice(2);
  const config: TestConfig = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--pattern':
        config.testPattern = value;
        break;
      case '--root':
      case '-r':
        config.rootDir = value;
        break;
      case '--output':
      case '-o':
        config.outputDir = value;
        break;
      case '--agents':
      case '-a':
        config.agentCount = Math.min(parseInt(value), 100);
        break;
      case '--coverage':
        config.collectCoverage = value !== 'false';
        break;
      case '--bail':
        config.bail = true;
        i--; // No value for this flag
        break;
      case '--timeout':
      case '-t':
        config.testTimeoutMs = parseInt(value) * 1000;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  try {
    const report = await runDistributedTests(config);
    process.exit(report.summary.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
Distributed Testing with KIMI k2.5 Agents

Usage: tsx distributed-testing.ts [options]

Options:
  --pattern <glob>        Test file pattern (default: **/*.test.{ts,tsx,js,jsx})
  -r, --root <path>       Root directory (default: .)
  -o, --output <path>     Output directory (default: ./test-results)
  -a, --agents <count>    Number of agents 1-100 (default: 100)
  --coverage <bool>       Enable coverage (default: true)
  --bail                  Stop on first failure
  -t, --timeout <seconds> Test timeout (default: 300)
  -h, --help             Show this help message

Examples:
  tsx distributed-testing.ts
  tsx distributed-testing.ts --pattern "**/*.spec.ts" --agents 50
  tsx distributed-testing.ts --coverage false --bail
  `);
}

if (require.main === module) {
  main();
}

export { DistributedTestReport, runDistributedTests, TestConfig };

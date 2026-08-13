/**
 * TypeScript Compilation Manager
 *
 * Optimizes TypeScript compilation for memory efficiency through:
 * - Incremental compilation using project references
 * - Memory-efficient compiler options
 * - Build info file management
 * - Memory cleanup between compilation stages
 */

import { ChildProcess, spawn } from 'child_process';
import { promises as fs } from 'fs';
import { dirname, join, resolve } from 'path';
import { ITypeScriptCompilationManager } from '../interfaces/index.js';
import { MemoryCleanupConfig, MemoryCleanupUtility } from './MemoryCleanupUtility.js';

/**
 * TypeScript project configuration
 */
export interface TypeScriptProject {
  /** Project name */
  name: string;
  /** Path to tsconfig.json */
  configPath: string;
  /** Project dependencies */
  dependencies: string[];
  /** Estimated memory usage in MB */
  estimatedMemoryUsage: number;
}

/**
 * TypeScript compilation options
 */
export interface TypeScriptCompilationOptions {
  /** Enable incremental compilation */
  incremental?: boolean;
  /** Build info file path */
  tsBuildInfoFile?: string;
  /** Preserve watch output */
  preserveWatchOutput?: boolean;
  /** Skip lib check for faster compilation */
  skipLibCheck?: boolean;
  /** Skip type checking for faster compilation */
  noCheck?: boolean;
  /** Maximum memory usage in MB */
  maxMemoryUsage?: number;
}

/**
 * Compilation metrics
 */
export interface CompilationMetrics {
  /** Total compilation time in milliseconds */
  totalTime: number;
  /** Peak memory usage in MB */
  peakMemoryUsage: number;
  /** Number of projects compiled */
  projectsCompiled: number;
  /** Number of successful compilations */
  successfulCompilations: number;
  /** Number of failed compilations */
  failedCompilations: number;
  /** Compilation errors */
  errors: string[];
}

/**
 * TypeScript Compilation Manager implementation
 */
export class TypeScriptCompilationManager implements ITypeScriptCompilationManager {
  private incrementalEnabled: boolean = true;
  private compilationOptions: TypeScriptCompilationOptions = {};
  private memoryCleanupUtility: MemoryCleanupUtility;
  private metrics: CompilationMetrics = {
    totalTime: 0,
    peakMemoryUsage: 0,
    projectsCompiled: 0,
    successfulCompilations: 0,
    failedCompilations: 0,
    errors: [],
  };
  private activeProcesses: Map<string, ChildProcess> = new Map();

  constructor(options: TypeScriptCompilationOptions = {}, cleanupConfig?: MemoryCleanupConfig) {
    this.compilationOptions = {
      incremental: true,
      preserveWatchOutput: true,
      skipLibCheck: true,
      maxMemoryUsage: 2048, // 2GB default
      ...options,
    };

    // Initialize memory cleanup utility
    this.memoryCleanupUtility = new MemoryCleanupUtility({
      aggressiveGC: true,
      clearModuleCache: true,
      clearTypeScriptCache: true,
      cleanupDelay: 100,
      memoryThreshold: 50, // 50MB threshold
      ...cleanupConfig,
    });
  }

  /**
   * Compile TypeScript projects with optimization
   */
  async compileProjects(
    projects: string[],
    options?: TypeScriptCompilationOptions
  ): Promise<boolean> {
    const startTime = Date.now();
    const compilationOptions = { ...this.compilationOptions, ...options };

    try {
      // Reset metrics for this compilation run
      this.resetMetrics();

      // Discover and analyze TypeScript projects
      const tsProjects = await this.discoverTypeScriptProjects(projects);

      // Sort projects by dependencies for optimal build order
      const sortedProjects = this.sortProjectsByDependencies(tsProjects);

      // Compile projects in dependency order
      let allSuccessful = true;
      for (const project of sortedProjects) {
        const success = await this.compileProject(project, compilationOptions);
        if (!success) {
          allSuccessful = false;
        }

        // Clean up memory between projects if enabled
        if (compilationOptions.incremental) {
          await this.cleanupCompilerMemory();
        }
      }

      this.metrics.totalTime = Date.now() - startTime;
      return allSuccessful;
    } catch (error) {
      this.metrics.errors.push(
        `Compilation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      this.metrics.totalTime = Date.now() - startTime;
      return false;
    }
  }

  /**
   * Enable or disable incremental compilation
   */
  enableIncrementalCompilation(enabled: boolean): void {
    this.incrementalEnabled = enabled;
    this.compilationOptions.incremental = enabled;
  }

  /**
   * Clean up TypeScript compiler memory
   */
  async cleanupCompilerMemory(): Promise<void> {
    try {
      // Terminate any active TypeScript processes first
      await this.terminateActiveProcesses();

      // Use the comprehensive memory cleanup utility
      const cleanupResult = await this.memoryCleanupUtility.performCleanup();

      // Log cleanup results for monitoring
      if (cleanupResult.success) {
        console.debug(
          `Memory cleanup successful: freed ${cleanupResult.memoryFreed}MB in ${cleanupResult.duration}ms`
        );
      } else {
        console.warn(
          `Memory cleanup partially successful: freed ${cleanupResult.memoryFreed}MB, errors:`,
          cleanupResult.errors
        );
      }

      // Update metrics with cleanup information
      if (cleanupResult.memoryFreed > 0) {
        this.metrics.peakMemoryUsage = Math.max(
          this.metrics.peakMemoryUsage,
          cleanupResult.memoryBefore.current
        );
      }
    } catch (error) {
      console.warn(
        'Memory cleanup warning:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Get compilation metrics
   */
  getCompilationMetrics(): CompilationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get memory cleanup statistics
   */
  getMemoryCleanupStatistics() {
    return this.memoryCleanupUtility.getCleanupStatistics();
  }

  /**
   * Get memory cleanup history
   */
  getMemoryCleanupHistory() {
    return this.memoryCleanupUtility.getCleanupHistory();
  }

  /**
   * Discover TypeScript projects from given paths
   */
  private async discoverTypeScriptProjects(projectPaths: string[]): Promise<TypeScriptProject[]> {
    const projects: TypeScriptProject[] = [];

    for (const projectPath of projectPaths) {
      try {
        const configPath = await this.findTsConfig(projectPath);
        if (configPath) {
          const project = await this.analyzeTypeScriptProject(configPath);
          projects.push(project);
        }
      } catch (error) {
        console.warn(
          `Failed to analyze project ${projectPath}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return projects;
  }

  /**
   * Find tsconfig.json file in project directory
   */
  private async findTsConfig(projectPath: string): Promise<string | null> {
    const possiblePaths = [
      join(projectPath, 'tsconfig.json'),
      join(projectPath, 'tsconfig.build.json'),
      join(projectPath, 'src', 'tsconfig.json'),
    ];

    for (const configPath of possiblePaths) {
      try {
        await fs.access(configPath);
        return configPath;
      } catch {
        // Continue to next path
      }
    }

    return null;
  }

  /**
   * Analyze TypeScript project configuration
   */
  private async analyzeTypeScriptProject(configPath: string): Promise<TypeScriptProject> {
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    const projectName = this.extractProjectName(configPath);
    const dependencies = this.extractProjectReferences(config);
    const estimatedMemoryUsage = this.estimateMemoryUsage(config, configPath);

    return {
      name: projectName,
      configPath,
      dependencies,
      estimatedMemoryUsage,
    };
  }

  /**
   * Extract project name from config path
   */
  private extractProjectName(configPath: string): string {
    const projectDir = dirname(configPath);
    return projectDir.split('/').pop() || 'unknown';
  }

  /**
   * Extract project references from TypeScript config
   */
  private extractProjectReferences(config: any): string[] {
    const references = config.references || [];
    return references.map((ref: any) => ref.path || '');
  }

  /**
   * Estimate memory usage for TypeScript project
   */
  private estimateMemoryUsage(config: any, configPath: string): number {
    // Base memory usage
    let estimatedUsage = 256; // 256MB base

    // Adjust based on compiler options
    const compilerOptions = config.compilerOptions || {};

    if (compilerOptions.strict) estimatedUsage += 128;
    if (compilerOptions.declaration) estimatedUsage += 64;
    if (compilerOptions.sourceMap) estimatedUsage += 32;

    // Adjust based on project size (rough estimate)
    const projectDir = dirname(configPath);
    // This is a simplified estimation - in practice, you'd analyze file count/size
    estimatedUsage += 128; // Additional 128MB for average project

    return estimatedUsage;
  }

  /**
   * Sort projects by dependencies for optimal build order
   */
  private sortProjectsByDependencies(projects: TypeScriptProject[]): TypeScriptProject[] {
    const sorted: TypeScriptProject[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (project: TypeScriptProject) => {
      if (visiting.has(project.name)) {
        throw new Error(`Circular dependency detected involving ${project.name}`);
      }

      if (visited.has(project.name)) {
        return;
      }

      visiting.add(project.name);

      // Visit dependencies first
      for (const depName of project.dependencies) {
        const depProject = projects.find((p) => p.name === depName);
        if (depProject) {
          visit(depProject);
        }
      }

      visiting.delete(project.name);
      visited.add(project.name);
      sorted.push(project);
    };

    for (const project of projects) {
      if (!visited.has(project.name)) {
        visit(project);
      }
    }

    return sorted;
  }

  /**
   * Compile a single TypeScript project
   */
  private async compileProject(
    project: TypeScriptProject,
    options: TypeScriptCompilationOptions
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Prepare compiler arguments
      const args = this.buildCompilerArguments(project, options);

      // Execute TypeScript compiler
      const success = await this.executeTypeScriptCompiler(project.name, args);

      // Update metrics
      this.metrics.projectsCompiled++;
      if (success) {
        this.metrics.successfulCompilations++;
      } else {
        this.metrics.failedCompilations++;
      }

      // Track memory usage
      const memoryUsage = this.getCurrentMemoryUsage();
      if (memoryUsage > this.metrics.peakMemoryUsage) {
        this.metrics.peakMemoryUsage = memoryUsage;
      }

      return success;
    } catch (error) {
      this.metrics.errors.push(
        `Project ${project.name}: ${error instanceof Error ? error.message : String(error)}`
      );
      this.metrics.failedCompilations++;
      return false;
    }
  }

  /**
   * Build TypeScript compiler arguments
   */
  private buildCompilerArguments(
    project: TypeScriptProject,
    options: TypeScriptCompilationOptions
  ): string[] {
    const args = ['--project', project.configPath];

    if (options.incremental) {
      args.push('--incremental');
    }

    if (options.tsBuildInfoFile) {
      args.push('--tsBuildInfoFile', options.tsBuildInfoFile);
    }

    if (options.preserveWatchOutput) {
      args.push('--preserveWatchOutput');
    }

    if (options.skipLibCheck) {
      args.push('--skipLibCheck');
    }

    if (options.noCheck) {
      args.push('--noCheck');
    }

    return args;
  }

  /**
   * Execute TypeScript compiler as child process
   */
  private async executeTypeScriptCompiler(projectName: string, args: string[]): Promise<boolean> {
    return new Promise((resolve) => {
      const tscPath = this.findTypeScriptCompiler();
      const childProcess = spawn(tscPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_OPTIONS: `--max-old-space-size=${this.compilationOptions.maxMemoryUsage}`,
        },
      });

      this.activeProcesses.set(projectName, childProcess);

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code: number | null) => {
        this.activeProcesses.delete(projectName);

        if (code === 0) {
          resolve(true);
        } else {
          this.metrics.errors.push(`${projectName}: ${stderr || stdout}`);
          resolve(false);
        }
      });

      childProcess.on('error', (error: Error) => {
        this.activeProcesses.delete(projectName);
        this.metrics.errors.push(`${projectName}: ${error.message}`);
        resolve(false);
      });
    });
  }

  /**
   * Find TypeScript compiler executable
   */
  private findTypeScriptCompiler(): string {
    // Try to find tsc in node_modules
    const possiblePaths = [
      resolve(process.cwd(), 'node_modules/.bin/tsc'),
      resolve(process.cwd(), 'node_modules/typescript/bin/tsc'),
      'tsc', // Fallback to global tsc
    ];

    return possiblePaths[0]; // Use first option for now
  }

  /**
   * Get current memory usage in MB
   */
  private getCurrentMemoryUsage(): number {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024);
  }

  /**
   * Terminate all active TypeScript processes
   */
  private async terminateActiveProcesses(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [projectName, process] of this.activeProcesses) {
      promises.push(
        new Promise((resolve) => {
          process.on('close', () => resolve());
          process.kill('SIGTERM');

          // Force kill after 5 seconds
          setTimeout(() => {
            if (!process.killed) {
              process.kill('SIGKILL');
            }
            resolve();
          }, 5000);
        })
      );
    }

    await Promise.all(promises);
    this.activeProcesses.clear();
  }

  /**
   * Reset compilation metrics
   */
  private resetMetrics(): void {
    this.metrics = {
      totalTime: 0,
      peakMemoryUsage: 0,
      projectsCompiled: 0,
      successfulCompilations: 0,
      failedCompilations: 0,
      errors: [],
    };
  }
}

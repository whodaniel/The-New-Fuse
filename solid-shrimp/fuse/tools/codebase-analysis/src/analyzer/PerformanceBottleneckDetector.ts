import * as fs from 'fs/promises';
import * as path from 'path';
import { PackageInfo } from '../scanner/FileSystemScanner';

export interface DatabaseQueryIssue {
  file: string;
  line: number;
  query: string;
  issue: 'n+1' | 'missing-index' | 'inefficient-join' | 'large-result-set' | 'synchronous-query';
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface MemoryLeakRisk {
  file: string;
  line: number;
  code: string;
  riskType: 'event-listener' | 'timer' | 'closure' | 'circular-reference' | 'large-object';
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface SynchronousOperation {
  file: string;
  line: number;
  operation: string;
  operationType: 'file-io' | 'network' | 'database' | 'computation' | 'blocking-call';
  severity: 'high' | 'medium' | 'low';
  asyncAlternative: string;
}

export interface ScalabilityIssue {
  pattern: string;
  files: string[];
  issue: 'global-state' | 'singleton-abuse' | 'tight-coupling' | 'resource-contention' | 'inefficient-algorithm';
  severity: 'high' | 'medium' | 'low';
  scalabilityImpact: string;
  recommendation: string;
}

export interface PerformanceMetrics {
  totalIssues: number;
  highSeverityIssues: number;
  databaseIssues: number;
  memoryRisks: number;
  synchronousOperations: number;
  scalabilityIssues: number;
  performanceScore: number;
}

export interface PerformanceBottleneckReport {
  databaseQueryIssues: DatabaseQueryIssue[];
  memoryLeakRisks: MemoryLeakRisk[];
  synchronousOperations: SynchronousOperation[];
  scalabilityIssues: ScalabilityIssue[];
  performanceMetrics: PerformanceMetrics;
  recommendations: string[];
}

export class PerformanceBottleneckDetector {
  private packages: PackageInfo[];

  constructor(packages: PackageInfo[]) {
    this.packages = packages;
  }

  async detectPerformanceBottlenecks(): Promise<PerformanceBottleneckReport> {
    console.log('Detecting performance bottlenecks...');
    
    // Analyze database query patterns
    const databaseQueryIssues = await this.analyzeDatabaseQueryPatterns();
    
    // Identify memory leak risks
    const memoryLeakRisks = await this.identifyMemoryLeakRisks();
    
    // Detect synchronous operations
    const synchronousOperations = await this.detectSynchronousOperations();
    
    // Assess scalability issues
    const scalabilityIssues = await this.assessScalabilityIssues();
    
    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(
      databaseQueryIssues,
      memoryLeakRisks,
      synchronousOperations,
      scalabilityIssues
    );
    
    // Generate recommendations
    const recommendations = this.generatePerformanceRecommendations(
      databaseQueryIssues,
      memoryLeakRisks,
      synchronousOperations,
      scalabilityIssues,
      performanceMetrics
    );
    
    return {
      databaseQueryIssues,
      memoryLeakRisks,
      synchronousOperations,
      scalabilityIssues,
      performanceMetrics,
      recommendations
    };
  }

  private async analyzeDatabaseQueryPatterns(): Promise<DatabaseQueryIssue[]> {
    const issues: DatabaseQueryIssue[] = [];
    
    for (const pkg of this.packages) {
      for (const file of pkg.files) {
        if (file.type === 'source' && !file.path.includes('.test.') && !file.path.includes('.spec.')) {
          try {
            const content = await fs.readFile(file.path, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
              const lineNumber = index + 1;
              
              // Check for N+1 query patterns
              if (this.detectN1QueryPattern(line)) {
                issues.push({
                  file: file.path,
                  line: lineNumber,
                  query: line.trim(),
                  issue: 'n+1',
                  severity: 'high',
                  recommendation: 'Use eager loading or batch queries to avoid N+1 problem'
                });
              }
              
              // Check for missing index hints
              if (this.detectMissingIndexPattern(line)) {
                issues.push({
                  file: file.path,
                  line: lineNumber,
                  query: line.trim(),
                  issue: 'missing-index',
                  severity: 'medium',
                  recommendation: 'Add database indexes for frequently queried columns'
                });
              }
              
              // Check for inefficient joins
              if (this.detectInefficientJoinPattern(line)) {
                issues.push({
                  file: file.path,
                  line: lineNumber,
                  query: line.trim(),
                  issue: 'inefficient-join',
                  severity: 'medium',
                  recommendation: 'Optimize join conditions and consider query restructuring'
                });
              }
              
              // Check for large result sets
              if (this.detectLargeResultSetPattern(line)) {
                issues.push({
                  file: file.path,
                  line: lineNumber,
                  query: line.trim(),
                  issue: 'large-result-set',
                  severity: 'high',
                  recommendation: 'Add pagination or limit clauses to prevent large result sets'
                });
              }
              
              // Check for synchronous database queries
              if (this.detectSynchronousDatabaseQuery(line)) {
                issues.push({
                  file: file.path,
                  line: lineNumber,
                  query: line.trim(),
                  issue: 'synchronous-query',
                  severity: 'high',
                  recommendation: 'Use async/await or promises for database operations'
                });
              }
            });
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }
    
    return issues;
  }

  private detectN1QueryPattern(line: string): boolean {
    // Look for patterns like loops with database queries
    return (line.includes('for') || line.includes('forEach') || line.includes('map')) &&
           (line.includes('findOne') || line.includes('findById') || line.includes('query') || line.includes('select'));
  }

  private detectMissingIndexPattern(line: string): boolean {
    // Look for queries without obvious indexing
    return (line.includes('WHERE') || line.includes('where')) &&
           !line.includes('id') &&
           (line.includes('LIKE') || line.includes('like') || line.includes('%'));
  }

  private detectInefficientJoinPattern(line: string): boolean {
    // Look for complex joins or multiple joins
    const joinCount = (line.match(/JOIN|join/g) || []).length;
    return joinCount > 2 || (line.includes('JOIN') && line.includes('WHERE') && line.length > 100);
  }

  private detectLargeResultSetPattern(line: string): boolean {
    // Look for queries without limits
    return (line.includes('SELECT') || line.includes('select') || line.includes('findMany')) &&
           !line.includes('LIMIT') && !line.includes('limit') && !line.includes('take') &&
           !line.includes('first') && !line.includes('top');
  }

  private detectSynchronousDatabaseQuery(line: string): boolean {
    // Look for synchronous database operations
    return (line.includes('query') || line.includes('find') || line.includes('create') || line.includes('update')) &&
           !line.includes('await') && !line.includes('.then') && !line.includes('async');
  }

  private async identifyMemoryLeakRisks(): Promise<MemoryLeakRisk[]> {
    const risks: MemoryLeakRisk[] = [];
    
    for (const pkg of this.packages) {
      for (const file of pkg.files) {
        if (file.type === 'source' && !file.path.includes('.test.') && !file.path.includes('.spec.')) {
          try {
            const content = await fs.readFile(file.path, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
              const lineNumber = index + 1;
              
              // Check for event listener leaks
              if (this.detectEventListenerLeak(line)) {
                risks.push({
                  file: file.path,
                  line: lineNumber,
                  code: line.trim(),
                  riskType: 'event-listener',
                  severity: 'high',
                  recommendation: 'Remove event listeners in cleanup/unmount methods'
                });
              }
              
              // Check for timer leaks
              if (this.detectTimerLeak(line)) {
                risks.push({
                  file: file.path,
                  line: lineNumber,
                  code: line.trim(),
                  riskType: 'timer',
                  severity: 'medium',
                  recommendation: 'Clear timers and intervals in cleanup methods'
                });
              }
              
              // Check for closure memory leaks
              if (this.detectClosureLeak(line)) {
                risks.push({
                  file: file.path,
                  line: lineNumber,
                  code: line.trim(),
                  riskType: 'closure',
                  severity: 'medium',
                  recommendation: 'Avoid capturing large objects in closures'
                });
              }
              
              // Check for circular references
              if (this.detectCircularReference(line)) {
                risks.push({
                  file: file.path,
                  line: lineNumber,
                  code: line.trim(),
                  riskType: 'circular-reference',
                  severity: 'high',
                  recommendation: 'Break circular references or use WeakMap/WeakSet'
                });
              }
              
              // Check for large object allocations
              if (this.detectLargeObjectAllocation(line)) {
                risks.push({
                  file: file.path,
                  line: lineNumber,
                  code: line.trim(),
                  riskType: 'large-object',
                  severity: 'medium',
                  recommendation: 'Consider streaming or chunking large data operations'
                });
              }
            });
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }
    
    return risks;
  }

  private detectEventListenerLeak(line: string): boolean {
    return line.includes('addEventListener') && !line.includes('removeEventListener');
  }

  private detectTimerLeak(line: string): boolean {
    return (line.includes('setInterval') || line.includes('setTimeout')) &&
           !line.includes('clearInterval') && !line.includes('clearTimeout');
  }

  private detectClosureLeak(line: string): boolean {
    return line.includes('=>') && (line.includes('data') || line.includes('cache') || line.includes('store')) &&
           line.length > 50;
  }

  private detectCircularReference(line: string): boolean {
    return line.includes('.parent') && line.includes('.child') ||
           line.includes('this.') && line.includes('= this');
  }

  private detectLargeObjectAllocation(line: string): boolean {
    return line.includes('new Array') && line.includes('1000') ||
           line.includes('Buffer.alloc') ||
           line.includes('new Map') && line.includes('size');
  }

  private async detectSynchronousOperations(): Promise<SynchronousOperation[]> {
    const operations: SynchronousOperation[] = [];
    
    for (const pkg of this.packages) {
      for (const file of pkg.files) {
        if (file.type === 'source' && !file.path.includes('.test.') && !file.path.includes('.spec.')) {
          try {
            const content = await fs.readFile(file.path, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
              const lineNumber = index + 1;
              
              // Check for synchronous file I/O
              if (this.detectSynchronousFileIO(line)) {
                operations.push({
                  file: file.path,
                  line: lineNumber,
                  operation: line.trim(),
                  operationType: 'file-io',
                  severity: 'high',
                  asyncAlternative: 'Use fs.promises or async/await with fs operations'
                });
              }
              
              // Check for synchronous network calls
              if (this.detectSynchronousNetworkCall(line)) {
                operations.push({
                  file: file.path,
                  line: lineNumber,
                  operation: line.trim(),
                  operationType: 'network',
                  severity: 'high',
                  asyncAlternative: 'Use fetch, axios, or other async HTTP clients'
                });
              }
              
              // Check for blocking computations
              if (this.detectBlockingComputation(line)) {
                operations.push({
                  file: file.path,
                  line: lineNumber,
                  operation: line.trim(),
                  operationType: 'computation',
                  severity: 'medium',
                  asyncAlternative: 'Use worker threads or break into smaller chunks'
                });
              }
              
              // Check for blocking calls
              if (this.detectBlockingCall(line)) {
                operations.push({
                  file: file.path,
                  line: lineNumber,
                  operation: line.trim(),
                  operationType: 'blocking-call',
                  severity: 'medium',
                  asyncAlternative: 'Use async alternatives or Promise-based APIs'
                });
              }
            });
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }
    
    return operations;
  }

  private detectSynchronousFileIO(line: string): boolean {
    return line.includes('fs.readFileSync') || line.includes('fs.writeFileSync') ||
           line.includes('fs.existsSync') || line.includes('fs.statSync');
  }

  private detectSynchronousNetworkCall(line: string): boolean {
    return line.includes('XMLHttpRequest') && line.includes('false') ||
           line.includes('sync: true') ||
           line.includes('request.sync');
  }

  private detectBlockingComputation(line: string): boolean {
    return line.includes('for') && line.includes('1000000') ||
           line.includes('while') && line.includes('true') ||
           line.includes('sort') && line.length > 50;
  }

  private detectBlockingCall(line: string): boolean {
    return line.includes('sleep') || line.includes('wait') || line.includes('block') ||
           (line.includes('sync') && !line.includes('async'));
  }

  private async assessScalabilityIssues(): Promise<ScalabilityIssue[]> {
    const issues: ScalabilityIssue[] = [];
    const globalStateFiles: string[] = [];
    const singletonFiles: string[] = [];
    const tightCouplingFiles: string[] = [];
    
    for (const pkg of this.packages) {
      for (const file of pkg.files) {
        if (file.type === 'source' && !file.path.includes('.test.') && !file.path.includes('.spec.')) {
          try {
            const content = await fs.readFile(file.path, 'utf-8');
            
            // Check for global state
            if (this.detectGlobalState(content)) {
              globalStateFiles.push(file.path);
            }
            
            // Check for singleton abuse
            if (this.detectSingletonAbuse(content)) {
              singletonFiles.push(file.path);
            }
            
            // Check for tight coupling
            if (this.detectTightCoupling(content)) {
              tightCouplingFiles.push(file.path);
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }
    
    if (globalStateFiles.length > 0) {
      issues.push({
        pattern: 'Global state usage',
        files: globalStateFiles,
        issue: 'global-state',
        severity: 'high',
        scalabilityImpact: 'Prevents horizontal scaling and causes race conditions',
        recommendation: 'Use dependency injection and stateless design patterns'
      });
    }
    
    if (singletonFiles.length > 0) {
      issues.push({
        pattern: 'Singleton pattern abuse',
        files: singletonFiles,
        issue: 'singleton-abuse',
        severity: 'medium',
        scalabilityImpact: 'Creates bottlenecks and testing difficulties',
        recommendation: 'Use dependency injection instead of singletons'
      });
    }
    
    if (tightCouplingFiles.length > 0) {
      issues.push({
        pattern: 'Tight coupling between components',
        files: tightCouplingFiles,
        issue: 'tight-coupling',
        severity: 'medium',
        scalabilityImpact: 'Reduces modularity and makes scaling individual components difficult',
        recommendation: 'Implement loose coupling with interfaces and dependency injection'
      });
    }
    
    return issues;
  }

  private detectGlobalState(content: string): boolean {
    return content.includes('global.') || content.includes('window.') ||
           content.includes('process.env') && content.includes('=') ||
           content.match(/let\s+\w+\s*=.*(?:outside|global)/i) !== null;
  }

  private detectSingletonAbuse(content: string): boolean {
    return content.includes('getInstance') || content.includes('singleton') ||
           content.match(/class\s+\w+\s*{[\s\S]*private\s+static\s+instance/i) !== null;
  }

  private detectTightCoupling(content: string): boolean {
    const importCount = (content.match(/import.*from/g) || []).length;
    const directInstantiations = (content.match(/new\s+\w+/g) || []).length;
    
    return importCount > 10 || directInstantiations > 5 ||
           content.includes('require(') && content.includes('./') && importCount > 5;
  }

  private calculatePerformanceMetrics(
    databaseQueryIssues: DatabaseQueryIssue[],
    memoryLeakRisks: MemoryLeakRisk[],
    synchronousOperations: SynchronousOperation[],
    scalabilityIssues: ScalabilityIssue[]
  ): PerformanceMetrics {
    const totalIssues = databaseQueryIssues.length + memoryLeakRisks.length + 
                       synchronousOperations.length + scalabilityIssues.length;
    
    const highSeverityIssues = [
      ...databaseQueryIssues.filter(i => i.severity === 'high'),
      ...memoryLeakRisks.filter(i => i.severity === 'high'),
      ...synchronousOperations.filter(i => i.severity === 'high'),
      ...scalabilityIssues.filter(i => i.severity === 'high')
    ].length;
    
    // Calculate performance score (0-100, higher is better)
    const performanceScore = Math.max(0, 100 - (highSeverityIssues * 10) - (totalIssues * 2));
    
    return {
      totalIssues,
      highSeverityIssues,
      databaseIssues: databaseQueryIssues.length,
      memoryRisks: memoryLeakRisks.length,
      synchronousOperations: synchronousOperations.length,
      scalabilityIssues: scalabilityIssues.length,
      performanceScore: Math.round(performanceScore)
    };
  }

  private generatePerformanceRecommendations(
    databaseQueryIssues: DatabaseQueryIssue[],
    memoryLeakRisks: MemoryLeakRisk[],
    synchronousOperations: SynchronousOperation[],
    scalabilityIssues: ScalabilityIssue[],
    performanceMetrics: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = [];
    
    if (databaseQueryIssues.length > 0) {
      const n1Issues = databaseQueryIssues.filter(i => i.issue === 'n+1').length;
      if (n1Issues > 0) {
        recommendations.push(`Fix ${n1Issues} N+1 query problems with eager loading`);
      }
      
      const syncQueries = databaseQueryIssues.filter(i => i.issue === 'synchronous-query').length;
      if (syncQueries > 0) {
        recommendations.push(`Convert ${syncQueries} synchronous database queries to async`);
      }
    }
    
    if (memoryLeakRisks.length > 0) {
      const eventLeaks = memoryLeakRisks.filter(r => r.riskType === 'event-listener').length;
      if (eventLeaks > 0) {
        recommendations.push(`Fix ${eventLeaks} potential event listener memory leaks`);
      }
    }
    
    if (synchronousOperations.length > 0) {
      const fileIOOps = synchronousOperations.filter(o => o.operationType === 'file-io').length;
      if (fileIOOps > 0) {
        recommendations.push(`Convert ${fileIOOps} synchronous file operations to async`);
      }
    }
    
    if (scalabilityIssues.length > 0) {
      const globalStateIssues = scalabilityIssues.filter(i => i.issue === 'global-state').length;
      if (globalStateIssues > 0) {
        recommendations.push('Eliminate global state to improve scalability');
      }
    }
    
    if (performanceMetrics.performanceScore < 70) {
      recommendations.push('Focus on high-severity performance issues to improve overall score');
    }
    
    if (performanceMetrics.highSeverityIssues > 5) {
      recommendations.push(`Address ${performanceMetrics.highSeverityIssues} high-severity performance issues immediately`);
    }
    
    return recommendations;
  }
}
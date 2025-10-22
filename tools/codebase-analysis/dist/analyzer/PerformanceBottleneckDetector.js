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
exports.PerformanceBottleneckDetector = void 0;
const fs = __importStar(require("fs/promises"));
class PerformanceBottleneckDetector {
    constructor(packages) {
        this.packages = packages;
    }
    async detectPerformanceBottlenecks() {
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
        const performanceMetrics = this.calculatePerformanceMetrics(databaseQueryIssues, memoryLeakRisks, synchronousOperations, scalabilityIssues);
        // Generate recommendations
        const recommendations = this.generatePerformanceRecommendations(databaseQueryIssues, memoryLeakRisks, synchronousOperations, scalabilityIssues, performanceMetrics);
        return {
            databaseQueryIssues,
            memoryLeakRisks,
            synchronousOperations,
            scalabilityIssues,
            performanceMetrics,
            recommendations
        };
    }
    async analyzeDatabaseQueryPatterns() {
        const issues = [];
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
                    }
                    catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
        }
        return issues;
    }
    detectN1QueryPattern(line) {
        // Look for patterns like loops with database queries
        return (line.includes('for') || line.includes('forEach') || line.includes('map')) &&
            (line.includes('findOne') || line.includes('findById') || line.includes('query') || line.includes('select'));
    }
    detectMissingIndexPattern(line) {
        // Look for queries without obvious indexing
        return (line.includes('WHERE') || line.includes('where')) &&
            !line.includes('id') &&
            (line.includes('LIKE') || line.includes('like') || line.includes('%'));
    }
    detectInefficientJoinPattern(line) {
        // Look for complex joins or multiple joins
        const joinCount = (line.match(/JOIN|join/g) || []).length;
        return joinCount > 2 || (line.includes('JOIN') && line.includes('WHERE') && line.length > 100);
    }
    detectLargeResultSetPattern(line) {
        // Look for queries without limits
        return (line.includes('SELECT') || line.includes('select') || line.includes('findMany')) &&
            !line.includes('LIMIT') && !line.includes('limit') && !line.includes('take') &&
            !line.includes('first') && !line.includes('top');
    }
    detectSynchronousDatabaseQuery(line) {
        // Look for synchronous database operations
        return (line.includes('query') || line.includes('find') || line.includes('create') || line.includes('update')) &&
            !line.includes('await') && !line.includes('.then') && !line.includes('async');
    }
    async identifyMemoryLeakRisks() {
        const risks = [];
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
                    }
                    catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
        }
        return risks;
    }
    detectEventListenerLeak(line) {
        return line.includes('addEventListener') && !line.includes('removeEventListener');
    }
    detectTimerLeak(line) {
        return (line.includes('setInterval') || line.includes('setTimeout')) &&
            !line.includes('clearInterval') && !line.includes('clearTimeout');
    }
    detectClosureLeak(line) {
        return line.includes('=>') && (line.includes('data') || line.includes('cache') || line.includes('store')) &&
            line.length > 50;
    }
    detectCircularReference(line) {
        return line.includes('.parent') && line.includes('.child') ||
            line.includes('this.') && line.includes('= this');
    }
    detectLargeObjectAllocation(line) {
        return line.includes('new Array') && line.includes('1000') ||
            line.includes('Buffer.alloc') ||
            line.includes('new Map') && line.includes('size');
    }
    async detectSynchronousOperations() {
        const operations = [];
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
                    }
                    catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
        }
        return operations;
    }
    detectSynchronousFileIO(line) {
        return line.includes('fs.readFileSync') || line.includes('fs.writeFileSync') ||
            line.includes('fs.existsSync') || line.includes('fs.statSync');
    }
    detectSynchronousNetworkCall(line) {
        return line.includes('XMLHttpRequest') && line.includes('false') ||
            line.includes('sync: true') ||
            line.includes('request.sync');
    }
    detectBlockingComputation(line) {
        return line.includes('for') && line.includes('1000000') ||
            line.includes('while') && line.includes('true') ||
            line.includes('sort') && line.length > 50;
    }
    detectBlockingCall(line) {
        return line.includes('sleep') || line.includes('wait') || line.includes('block') ||
            (line.includes('sync') && !line.includes('async'));
    }
    async assessScalabilityIssues() {
        const issues = [];
        const globalStateFiles = [];
        const singletonFiles = [];
        const tightCouplingFiles = [];
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
                    }
                    catch (error) {
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
    detectGlobalState(content) {
        return content.includes('global.') || content.includes('window.') ||
            content.includes('process.env') && content.includes('=') ||
            content.match(/let\s+\w+\s*=.*(?:outside|global)/i) !== null;
    }
    detectSingletonAbuse(content) {
        return content.includes('getInstance') || content.includes('singleton') ||
            content.match(/class\s+\w+\s*{[\s\S]*private\s+static\s+instance/i) !== null;
    }
    detectTightCoupling(content) {
        const importCount = (content.match(/import.*from/g) || []).length;
        const directInstantiations = (content.match(/new\s+\w+/g) || []).length;
        return importCount > 10 || directInstantiations > 5 ||
            content.includes('require(') && content.includes('./') && importCount > 5;
    }
    calculatePerformanceMetrics(databaseQueryIssues, memoryLeakRisks, synchronousOperations, scalabilityIssues) {
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
    generatePerformanceRecommendations(databaseQueryIssues, memoryLeakRisks, synchronousOperations, scalabilityIssues, performanceMetrics) {
        const recommendations = [];
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
exports.PerformanceBottleneckDetector = PerformanceBottleneckDetector;
//# sourceMappingURL=PerformanceBottleneckDetector.js.map
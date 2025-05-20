import { DependencyMapper } from './dependency/dependency.mapper.js';
import { CodeQualityAnalyzer } from './quality/(code as any).quality.analyzer.js';
import { SecurityScanner } from './security/security.scanner.js';
export declare class AnalysisManager {
    private readonly dependencyMapper;
    private readonly codeQualityAnalyzer;
    private readonly securityScanner;
    constructor(dependencyMapper: DependencyMapper, codeQualityAnalyzer: CodeQualityAnalyzer, securityScanner: SecurityScanner);
    analyzeProject(): Promise<void>;
}

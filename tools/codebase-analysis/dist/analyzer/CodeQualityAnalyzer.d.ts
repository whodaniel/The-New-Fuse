import { PackageInfo } from '../scanner/FileSystemScanner';
export interface CodeDuplication {
    duplicatedCode: string;
    files: string[];
    lines: number[];
    similarity: number;
}
export interface ComplexFunction {
    name: string;
    file: string;
    startLine: number;
    endLine: number;
    cyclomaticComplexity: number;
    linesOfCode: number;
    parameters: number;
    nestingDepth: number;
    refactoringRecommendation: string;
}
export interface CodingPatternInconsistency {
    pattern: string;
    inconsistentFiles: string[];
    recommendedPattern: string;
    examples: {
        file: string;
        line: number;
        code: string;
    }[];
}
export interface QualityMetrics {
    overallScore: number;
    maintainabilityIndex: number;
    technicalDebt: number;
    codeSmells: number;
    duplicatedLinesPercentage: number;
    averageComplexity: number;
    testCoverage: number;
}
export interface CodeQualityReport {
    duplications: CodeDuplication[];
    complexFunctions: ComplexFunction[];
    patternInconsistencies: CodingPatternInconsistency[];
    qualityMetrics: QualityMetrics;
    recommendations: string[];
}
export declare class CodeQualityAnalyzer {
    private packages;
    constructor(packages: PackageInfo[]);
    analyzeCodeQuality(): Promise<CodeQualityReport>;
    private detectCodeDuplication;
    private extractCodeBlocks;
    private normalizeCode;
    private calculateSimilarity;
    private identifyComplexFunctions;
    private extractFunctions;
    private calculateCyclomaticComplexity;
    private countParameters;
    private calculateNestingDepth;
    private generateRefactoringRecommendation;
    private detectPatternInconsistencies;
    private checkNamingConventions;
    private checkImportPatterns;
    private checkErrorHandlingPatterns;
    private calculateQualityMetrics;
    private generateQualityRecommendations;
}
//# sourceMappingURL=CodeQualityAnalyzer.d.ts.map
import type { PackageInfo } from '../scanner/FileSystemScanner';
export interface DocumentationFile {
    path: string;
    name: string;
    type: 'readme' | 'api' | 'inline' | 'spec' | 'guide' | 'changelog' | 'unknown';
    format: 'markdown' | 'text' | 'jsdoc' | 'typescript' | 'unknown';
    lastModified: Date;
    size: number;
    content: string;
    sections: DocumentationSection[];
    references: string[];
    codeExamples: CodeExample[];
}
export interface DocumentationSection {
    title: string;
    level: number;
    content: string;
    lineStart: number;
    lineEnd: number;
}
export interface CodeExample {
    language: string;
    code: string;
    lineStart: number;
    lineEnd: number;
    isValid: boolean;
    errors: string[];
}
export interface ImplementationReference {
    sourceFile: string;
    functions: string[];
    classes: string[];
    interfaces: string[];
    exports: string[];
    imports: string[];
}
export interface DocumentationAlignment {
    documentationFile: string;
    sourceFile: string;
    alignmentScore: number;
    alignmentStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
    issues: DocumentationIssue[];
    recommendations: string[];
}
export interface DocumentationIssue {
    type: 'outdated' | 'missing' | 'inaccurate' | 'broken_link' | 'invalid_code' | 'incomplete';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    location?: {
        file: string;
        line?: number;
        section?: string;
    };
    suggestedFix?: string;
}
export interface DocumentationAlignmentReport {
    totalDocumentationFiles: number;
    totalSourceFiles: number;
    documentedComponents: number;
    undocumentedComponents: number;
    documentationCoverage: number;
    alignmentDistribution: {
        excellent: number;
        good: number;
        fair: number;
        poor: number;
        missing: number;
    };
    documentationByType: {
        readme: number;
        api: number;
        inline: number;
        spec: number;
        guide: number;
        changelog: number;
        unknown: number;
    };
    documentationFiles: DocumentationFile[];
    alignments: DocumentationAlignment[];
    issues: DocumentationIssue[];
    gaps: {
        undocumentedFiles: string[];
        outdatedDocumentation: string[];
        orphanedDocumentation: string[];
        brokenCodeExamples: string[];
    };
    recommendations: string[];
}
export declare class DocumentationAlignmentAnalyzer {
    private rootPath;
    private packages;
    constructor(packages: PackageInfo[], rootPath?: string);
    analyzeDocumentationAlignment(): Promise<DocumentationAlignmentReport>;
    private discoverDocumentationFiles;
    private analyzeDocumentationFile;
    private determineDocumentationType;
    private determineDocumentationFormat;
    private extractDocumentationSections;
    private extractCodeReferences;
    private extractCodeExamples;
    private validateCodeExample;
    private isValidTypeScript;
    private isValidJavaScript;
    private discoverSourceFiles;
    private extractImplementationReferences;
    private extractFunctions;
    private extractClasses;
    private extractInterfaces;
    private extractExports;
    private extractImports;
    private analyzeAlignments;
    private findRelatedDocumentation;
    private calculateAlignment;
    private extractDocumentedFunctions;
    private getFileStats;
    private determineAlignmentStatus;
    private identifyDocumentationIssues;
    private identifyDocumentationGaps;
    private generateRecommendations;
    private generateReport;
}
//# sourceMappingURL=DocumentationAlignmentAnalyzer.d.ts.map
import { PackageInfo } from '../scanner/FileSystemScanner';
export interface ImplementationAnalysis {
    filePath: string;
    functions: FunctionAnalysis[];
    classes: ClassAnalysis[];
    interfaces: InterfaceAnalysis[];
    types: TypeAnalysis[];
    overallStatus: ImplementationStatus;
    completenessScore: number;
    issues: ImplementationIssue[];
}
export interface FunctionAnalysis {
    name: string;
    lineNumber: number;
    status: ImplementationStatus;
    bodyLines: number;
    hasImplementation: boolean;
    isAsync: boolean;
    parameters: string[];
    returnType?: string;
    issues: string[];
}
export interface ClassAnalysis {
    name: string;
    lineNumber: number;
    status: ImplementationStatus;
    methods: MethodAnalysis[];
    properties: PropertyAnalysis[];
    isAbstract: boolean;
    extendsClass?: string;
    implementsInterfaces: string[];
    completenessScore: number;
}
export interface MethodAnalysis {
    name: string;
    lineNumber: number;
    status: ImplementationStatus;
    bodyLines: number;
    hasImplementation: boolean;
    isAsync: boolean;
    isAbstract: boolean;
    visibility: 'public' | 'private' | 'protected';
    parameters: string[];
    returnType?: string;
}
export interface PropertyAnalysis {
    name: string;
    lineNumber: number;
    hasInitializer: boolean;
    isReadonly: boolean;
    visibility: 'public' | 'private' | 'protected';
    type?: string;
}
export interface InterfaceAnalysis {
    name: string;
    lineNumber: number;
    methods: string[];
    properties: string[];
    extendsInterfaces: string[];
}
export interface TypeAnalysis {
    name: string;
    lineNumber: number;
    kind: 'type' | 'enum' | 'union' | 'intersection';
    isExported: boolean;
}
export interface ImplementationIssue {
    type: IssueType;
    severity: 'error' | 'warning' | 'info';
    message: string;
    lineNumber?: number;
    suggestion?: string;
}
export declare enum ImplementationStatus {
    FUNCTIONAL = "functional",
    STUB = "stub",
    BROKEN = "broken",
    UNUSED = "unused",
    INCOMPLETE = "incomplete",
    TODO = "todo"
}
export declare enum IssueType {
    EMPTY_FUNCTION = "empty_function",
    TODO_COMMENT = "todo_comment",
    THROW_NOT_IMPLEMENTED = "throw_not_implemented",
    MISSING_IMPLEMENTATION = "missing_implementation",
    UNUSED_IMPORT = "unused_import",
    UNUSED_FUNCTION = "unused_function",
    COMPLEX_FUNCTION = "complex_function",
    MISSING_RETURN = "missing_return",
    INCONSISTENT_NAMING = "inconsistent_naming"
}
export interface PackageImplementationReport {
    packageName: string;
    packagePath: string;
    files: ImplementationAnalysis[];
    overallStatus: ImplementationStatus;
    completenessScore: number;
    totalFunctions: number;
    functionalFunctions: number;
    stubFunctions: number;
    brokenFunctions: number;
    totalClasses: number;
    functionalClasses: number;
    stubClasses: number;
    issues: ImplementationIssue[];
    recommendations: string[];
}
export declare class ImplementationAnalyzer {
    private stubPatterns;
    private emptyFunctionPatterns;
    analyzePackageImplementation(pkg: PackageInfo): Promise<PackageImplementationReport>;
    private analyzeFile;
    private analyzeFunctions;
    private analyzeClasses;
    private analyzeInterfaces;
    private analyzeTypes;
    private extractFunctionBody;
    private extractClassBody;
    private extractInterfaceBody;
    private hasRealImplementation;
    private determineFunctionStatus;
    private analyzeClassMethods;
    private analyzeClassProperties;
    private extractInterfaceMethods;
    private extractInterfaceProperties;
    private analyzeFunctionIssues;
    private findIssues;
    private calculateFileCompleteness;
    private calculateClassCompleteness;
    private calculatePackageCompleteness;
    private determineFileStatus;
    private determineClassStatus;
    private determineOverallStatus;
    private generateRecommendations;
}
//# sourceMappingURL=ImplementationAnalyzer.d.ts.map
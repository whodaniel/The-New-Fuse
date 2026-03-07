import * as fs from 'fs/promises';
import { FileInfo, PackageInfo } from '../scanner/FileSystemScanner';

export interface ImplementationAnalysis {
  filePath: string;
  functions: FunctionAnalysis[];
  classes: ClassAnalysis[];
  interfaces: InterfaceAnalysis[];
  types: TypeAnalysis[];
  overallStatus: ImplementationStatus;
  completenessScore: number; // 0-100
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

export enum ImplementationStatus {
  FUNCTIONAL = 'functional',
  STUB = 'stub',
  BROKEN = 'broken',
  UNUSED = 'unused',
  INCOMPLETE = 'incomplete',
  TODO = 'todo'
}

export enum IssueType {
  EMPTY_FUNCTION = 'empty_function',
  TODO_COMMENT = 'todo_comment',
  THROW_NOT_IMPLEMENTED = 'throw_not_implemented',
  MISSING_IMPLEMENTATION = 'missing_implementation',
  UNUSED_IMPORT = 'unused_import',
  UNUSED_FUNCTION = 'unused_function',
  COMPLEX_FUNCTION = 'complex_function',
  MISSING_RETURN = 'missing_return',
  INCONSISTENT_NAMING = 'inconsistent_naming'
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

export class ImplementationAnalyzer {
  private stubPatterns = [
    /throw new Error\(['"`]Not implemented['"`]\)/i,
    /throw new Error\(['"`]TODO['"`]\)/i,
    /console\.log\(['"`]TODO['"`]\)/i,
    /\/\/ TODO/i,
    /\/\* TODO/i,
    /FIXME/i,
    /HACK/i,
    /XXX/i
  ];

  private emptyFunctionPatterns = [
    /{\s*}/,
    /{\s*\/\/.*\s*}/,
    /{\s*\/\*.*\*\/\s*}/,
    /{\s*return\s*;\s*}/,
    /{\s*return\s+undefined\s*;\s*}/,
    /{\s*return\s+null\s*;\s*}/
  ];

  async analyzePackageImplementation(pkg: PackageInfo): Promise<PackageImplementationReport> {
    console.log(`Analyzing implementation for package: ${pkg.name}`);
    
    const files: ImplementationAnalysis[] = [];
    let totalFunctions = 0;
    let functionalFunctions = 0;
    let stubFunctions = 0;
    let brokenFunctions = 0;
    let totalClasses = 0;
    let functionalClasses = 0;
    let stubClasses = 0;
    const allIssues: ImplementationIssue[] = [];

    for (const file of pkg.sourceFiles) {
      const analysis = await this.analyzeFile(file);
      files.push(analysis);

      // Aggregate statistics
      totalFunctions += analysis.functions.length;
      totalClasses += analysis.classes.length;
      allIssues.push(...analysis.issues);

      for (const func of analysis.functions) {
        switch (func.status) {
          case ImplementationStatus.FUNCTIONAL:
            functionalFunctions++;
            break;
          case ImplementationStatus.STUB:
          case ImplementationStatus.TODO:
            stubFunctions++;
            break;
          case ImplementationStatus.BROKEN:
            brokenFunctions++;
            break;
        }
      }

      for (const cls of analysis.classes) {
        if (cls.status === ImplementationStatus.FUNCTIONAL) {
          functionalClasses++;
        } else {
          stubClasses++;
        }
      }
    }

    const completenessScore = this.calculatePackageCompleteness(files);
    const overallStatus = this.determineOverallStatus(completenessScore, allIssues);
    const recommendations = this.generateRecommendations(files, allIssues);

    return {
      packageName: pkg.name,
      packagePath: pkg.path,
      files,
      overallStatus,
      completenessScore,
      totalFunctions,
      functionalFunctions,
      stubFunctions,
      brokenFunctions,
      totalClasses,
      functionalClasses,
      stubClasses,
      issues: allIssues,
      recommendations
    };
  }

  private async analyzeFile(file: FileInfo): Promise<ImplementationAnalysis> {
    try {
      const content = await fs.readFile(file.path, 'utf-8');
      const lines = content.split('\n');

      const functions = this.analyzeFunctions(content, lines);
      const classes = this.analyzeClasses(content, lines);
      const interfaces = this.analyzeInterfaces(content, lines);
      const types = this.analyzeTypes(content, lines);
      const issues = this.findIssues(content, lines, file.path);

      const completenessScore = this.calculateFileCompleteness(functions, classes);
      const overallStatus = this.determineFileStatus(functions, classes, issues);

      return {
        filePath: file.path,
        functions,
        classes,
        interfaces,
        types,
        overallStatus,
        completenessScore,
        issues
      };
    } catch (error) {
      console.warn(`Failed to analyze file ${file.path}:`, error);
      return {
        filePath: file.path,
        functions: [],
        classes: [],
        interfaces: [],
        types: [],
        overallStatus: ImplementationStatus.BROKEN,
        completenessScore: 0,
        issues: [{
          type: IssueType.MISSING_IMPLEMENTATION,
          severity: 'error',
          message: `Failed to analyze file: ${error}`,
          suggestion: 'Check file syntax and accessibility'
        }]
      };
    }
  }

  private analyzeFunctions(content: string, lines: string[]): FunctionAnalysis[] {
    const functions: FunctionAnalysis[] = [];
    
    // Match function declarations
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*{/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const [fullMatch, name, params, returnType] = match;
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      const functionBody = this.extractFunctionBody(content, match.index + fullMatch.length - 1);
      const bodyLines = functionBody.split('\n').length;
      const hasImplementation = this.hasRealImplementation(functionBody);
      const isAsync = fullMatch.includes('async');
      const parameters = params.split(',').map(p => p.trim()).filter(p => p);
      const issues = this.analyzeFunctionIssues(functionBody, name);

      functions.push({
        name,
        lineNumber,
        status: this.determineFunctionStatus(functionBody, hasImplementation, issues),
        bodyLines,
        hasImplementation,
        isAsync,
        parameters,
        returnType: returnType?.trim(),
        issues
      });
    }

    // Match arrow functions
    const arrowFunctionRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^=]+))?\s*=>\s*{/g;
    
    while ((match = arrowFunctionRegex.exec(content)) !== null) {
      const [fullMatch, name, params, returnType] = match;
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      const functionBody = this.extractFunctionBody(content, match.index + fullMatch.length - 1);
      const bodyLines = functionBody.split('\n').length;
      const hasImplementation = this.hasRealImplementation(functionBody);
      const isAsync = fullMatch.includes('async');
      const parameters = params.split(',').map(p => p.trim()).filter(p => p);
      const issues = this.analyzeFunctionIssues(functionBody, name);

      functions.push({
        name,
        lineNumber,
        status: this.determineFunctionStatus(functionBody, hasImplementation, issues),
        bodyLines,
        hasImplementation,
        isAsync,
        parameters,
        returnType: returnType?.trim(),
        issues
      });
    }

    return functions;
  }

  private analyzeClasses(content: string, lines: string[]): ClassAnalysis[] {
    const classes: ClassAnalysis[] = [];
    
    const classRegex = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*{/g;
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      const [fullMatch, name, extendsClass, implementsList] = match;
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const isAbstract = fullMatch.includes('abstract');
      const implementsInterfaces = implementsList ? 
        implementsList.split(',').map(i => i.trim()) : [];

      const classBody = this.extractClassBody(content, match.index + fullMatch.length - 1);
      const methods = this.analyzeClassMethods(classBody);
      const properties = this.analyzeClassProperties(classBody);
      
      const completenessScore = this.calculateClassCompleteness(methods);
      const status = this.determineClassStatus(methods, properties);

      classes.push({
        name,
        lineNumber,
        status,
        methods,
        properties,
        isAbstract,
        extendsClass,
        implementsInterfaces,
        completenessScore
      });
    }

    return classes;
  }

  private analyzeInterfaces(content: string, lines: string[]): InterfaceAnalysis[] {
    const interfaces: InterfaceAnalysis[] = [];
    
    const interfaceRegex = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*{/g;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
      const [fullMatch, name, extendsList] = match;
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const extendsInterfaces = extendsList ? 
        extendsList.split(',').map(i => i.trim()) : [];

      const interfaceBody = this.extractInterfaceBody(content, match.index + fullMatch.length - 1);
      const methods = this.extractInterfaceMethods(interfaceBody);
      const properties = this.extractInterfaceProperties(interfaceBody);

      interfaces.push({
        name,
        lineNumber,
        methods,
        properties,
        extendsInterfaces
      });
    }

    return interfaces;
  }

  private analyzeTypes(content: string, lines: string[]): TypeAnalysis[] {
    const types: TypeAnalysis[] = [];
    
    const typeRegex = /(?:export\s+)?type\s+(\w+)\s*=/g;
    const enumRegex = /(?:export\s+)?enum\s+(\w+)\s*{/g;
    
    let match;
    
    while ((match = typeRegex.exec(content)) !== null) {
      const [fullMatch, name] = match;
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const isExported = fullMatch.includes('export');

      types.push({
        name,
        lineNumber,
        kind: 'type',
        isExported
      });
    }

    while ((match = enumRegex.exec(content)) !== null) {
      const [fullMatch, name] = match;
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const isExported = fullMatch.includes('export');

      types.push({
        name,
        lineNumber,
        kind: 'enum',
        isExported
      });
    }

    return types;
  }

  private extractFunctionBody(content: string, startIndex: number): string {
    let braceCount = 1;
    let i = startIndex + 1;
    
    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    
    return content.substring(startIndex + 1, i - 1);
  }

  private extractClassBody(content: string, startIndex: number): string {
    return this.extractFunctionBody(content, startIndex);
  }

  private extractInterfaceBody(content: string, startIndex: number): string {
    return this.extractFunctionBody(content, startIndex);
  }

  private hasRealImplementation(body: string): boolean {
    const trimmedBody = body.trim();
    
    // Check for empty or minimal implementations
    if (this.emptyFunctionPatterns.some(pattern => pattern.test(trimmedBody))) {
      return false;
    }

    // Check for stub patterns
    if (this.stubPatterns.some(pattern => pattern.test(trimmedBody))) {
      return false;
    }

    // Must have some meaningful content
    const meaningfulLines = trimmedBody
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && 
               !trimmed.startsWith('//') && 
               !trimmed.startsWith('/*') && 
               !trimmed.startsWith('*') &&
               trimmed !== '{' &&
               trimmed !== '}';
      });

    return meaningfulLines.length > 0;
  }

  private determineFunctionStatus(body: string, hasImplementation: boolean, issues: string[]): ImplementationStatus {
    if (this.stubPatterns.some(pattern => pattern.test(body))) {
      return ImplementationStatus.TODO;
    }
    
    if (!hasImplementation) {
      return ImplementationStatus.STUB;
    }
    
    if (issues.length > 0) {
      return ImplementationStatus.INCOMPLETE;
    }
    
    return ImplementationStatus.FUNCTIONAL;
  }

  private analyzeClassMethods(classBody: string): MethodAnalysis[] {
    const methods: MethodAnalysis[] = [];
    
    const methodRegex = /(?:(public|private|protected)\s+)?(?:(abstract)\s+)?(?:(async)\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*{/g;
    let match;

    while ((match = methodRegex.exec(classBody)) !== null) {
      const [fullMatch, visibility, isAbstract, isAsync, name, params, returnType] = match;
      const lineNumber = classBody.substring(0, match.index).split('\n').length;
      
      const methodBody = this.extractFunctionBody(classBody, match.index + fullMatch.length - 1);
      const bodyLines = methodBody.split('\n').length;
      const hasImplementation = this.hasRealImplementation(methodBody);
      const parameters = params.split(',').map(p => p.trim()).filter(p => p);

      methods.push({
        name,
        lineNumber,
        status: this.determineFunctionStatus(methodBody, hasImplementation, []),
        bodyLines,
        hasImplementation,
        isAsync: !!isAsync,
        isAbstract: !!isAbstract,
        visibility: (visibility as any) || 'public',
        parameters,
        returnType: returnType?.trim()
      });
    }

    return methods;
  }

  private analyzeClassProperties(classBody: string): PropertyAnalysis[] {
    const properties: PropertyAnalysis[] = [];
    
    const propertyRegex = /(?:(public|private|protected)\s+)?(?:(readonly)\s+)?(\w+)(?:\s*:\s*([^=;]+))?(?:\s*=\s*([^;]+))?;/g;
    let match;

    while ((match = propertyRegex.exec(classBody)) !== null) {
      const [, visibility, readonly, name, type, initializer] = match;
      const lineNumber = classBody.substring(0, match.index).split('\n').length;

      properties.push({
        name,
        lineNumber,
        hasInitializer: !!initializer,
        isReadonly: !!readonly,
        visibility: (visibility as any) || 'public',
        type: type?.trim()
      });
    }

    return properties;
  }

  private extractInterfaceMethods(interfaceBody: string): string[] {
    const methods: string[] = [];
    const methodRegex = /(\w+)\s*\([^)]*\)(?:\s*:\s*[^;]+)?;/g;
    let match;

    while ((match = methodRegex.exec(interfaceBody)) !== null) {
      methods.push(match[1]);
    }

    return methods;
  }

  private extractInterfaceProperties(interfaceBody: string): string[] {
    const properties: string[] = [];
    const propertyRegex = /(\w+)(?:\?)?:\s*[^;]+;/g;
    let match;

    while ((match = propertyRegex.exec(interfaceBody)) !== null) {
      // Skip if it looks like a method (has parentheses)
      if (!match[0].includes('(')) {
        properties.push(match[1]);
      }
    }

    return properties;
  }

  private analyzeFunctionIssues(body: string, functionName: string): string[] {
    const issues: string[] = [];
    
    if (this.stubPatterns.some(pattern => pattern.test(body))) {
      issues.push('Contains TODO or stub implementation');
    }
    
    if (body.trim().length === 0) {
      issues.push('Empty function body');
    }
    
    if (body.split('\n').length > 50) {
      issues.push('Function is too long (>50 lines)');
    }
    
    return issues;
  }

  private findIssues(content: string, lines: string[], filePath: string): ImplementationIssue[] {
    const issues: ImplementationIssue[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check for TODO comments
      if (/\/\/\s*TODO|\/\*\s*TODO|\*\s*TODO/i.test(trimmedLine)) {
        issues.push({
          type: IssueType.TODO_COMMENT,
          severity: 'info',
          message: 'TODO comment found',
          lineNumber: index + 1,
          suggestion: 'Implement the TODO item or remove the comment'
        });
      }
      
      // Check for not implemented errors
      if (/throw new Error\(['"`]Not implemented['"`]\)/i.test(trimmedLine)) {
        issues.push({
          type: IssueType.THROW_NOT_IMPLEMENTED,
          severity: 'warning',
          message: 'Function throws "Not implemented" error',
          lineNumber: index + 1,
          suggestion: 'Implement the function or remove it if not needed'
        });
      }
    });
    
    return issues;
  }

  private calculateFileCompleteness(functions: FunctionAnalysis[], classes: ClassAnalysis[]): number {
    const totalItems = functions.length + classes.length;
    if (totalItems === 0) return 100;
    
    const functionalItems = functions.filter(f => f.status === ImplementationStatus.FUNCTIONAL).length +
                           classes.filter(c => c.status === ImplementationStatus.FUNCTIONAL).length;
    
    return Math.round((functionalItems / totalItems) * 100);
  }

  private calculateClassCompleteness(methods: MethodAnalysis[]): number {
    if (methods.length === 0) return 100;
    
    const functionalMethods = methods.filter(m => m.status === ImplementationStatus.FUNCTIONAL).length;
    return Math.round((functionalMethods / methods.length) * 100);
  }

  private calculatePackageCompleteness(files: ImplementationAnalysis[]): number {
    if (files.length === 0) return 0;
    
    const totalScore = files.reduce((sum, file) => sum + file.completenessScore, 0);
    return Math.round(totalScore / files.length);
  }

  private determineFileStatus(functions: FunctionAnalysis[], classes: ClassAnalysis[], issues: ImplementationIssue[]): ImplementationStatus {
    const totalItems = functions.length + classes.length;
    if (totalItems === 0) return ImplementationStatus.UNUSED;
    
    const functionalItems = functions.filter(f => f.status === ImplementationStatus.FUNCTIONAL).length +
                           classes.filter(c => c.status === ImplementationStatus.FUNCTIONAL).length;
    
    const completenessRatio = functionalItems / totalItems;
    
    if (completenessRatio === 0) return ImplementationStatus.STUB;
    if (completenessRatio < 0.5) return ImplementationStatus.INCOMPLETE;
    if (issues.some(i => i.severity === 'error')) return ImplementationStatus.BROKEN;
    if (completenessRatio < 1) return ImplementationStatus.INCOMPLETE;
    
    return ImplementationStatus.FUNCTIONAL;
  }

  private determineClassStatus(methods: MethodAnalysis[], properties: PropertyAnalysis[]): ImplementationStatus {
    if (methods.length === 0) return ImplementationStatus.STUB;
    
    const functionalMethods = methods.filter(m => m.status === ImplementationStatus.FUNCTIONAL).length;
    const completenessRatio = functionalMethods / methods.length;
    
    if (completenessRatio === 0) return ImplementationStatus.STUB;
    if (completenessRatio < 1) return ImplementationStatus.INCOMPLETE;
    
    return ImplementationStatus.FUNCTIONAL;
  }

  private determineOverallStatus(completenessScore: number, issues: ImplementationIssue[]): ImplementationStatus {
    if (issues.some(i => i.severity === 'error')) return ImplementationStatus.BROKEN;
    if (completenessScore === 0) return ImplementationStatus.STUB;
    if (completenessScore < 50) return ImplementationStatus.INCOMPLETE;
    if (completenessScore < 100) return ImplementationStatus.INCOMPLETE;
    
    return ImplementationStatus.FUNCTIONAL;
  }

  private generateRecommendations(files: ImplementationAnalysis[], issues: ImplementationIssue[]): string[] {
    const recommendations: string[] = [];
    
    const stubFiles = files.filter(f => f.overallStatus === ImplementationStatus.STUB);
    if (stubFiles.length > 0) {
      recommendations.push(`Implement ${stubFiles.length} stub files with actual functionality`);
    }
    
    const incompleteFiles = files.filter(f => f.overallStatus === ImplementationStatus.INCOMPLETE);
    if (incompleteFiles.length > 0) {
      recommendations.push(`Complete implementation of ${incompleteFiles.length} partially implemented files`);
    }
    
    const todoCount = issues.filter(i => i.type === IssueType.TODO_COMMENT).length;
    if (todoCount > 0) {
      recommendations.push(`Address ${todoCount} TODO comments`);
    }
    
    const notImplementedCount = issues.filter(i => i.type === IssueType.THROW_NOT_IMPLEMENTED).length;
    if (notImplementedCount > 0) {
      recommendations.push(`Implement ${notImplementedCount} functions that throw "Not implemented" errors`);
    }
    
    return recommendations;
  }
}
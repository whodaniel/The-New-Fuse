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
exports.ImplementationAnalyzer = exports.IssueType = exports.ImplementationStatus = void 0;
const fs = __importStar(require("fs/promises"));
var ImplementationStatus;
(function (ImplementationStatus) {
    ImplementationStatus["FUNCTIONAL"] = "functional";
    ImplementationStatus["STUB"] = "stub";
    ImplementationStatus["BROKEN"] = "broken";
    ImplementationStatus["UNUSED"] = "unused";
    ImplementationStatus["INCOMPLETE"] = "incomplete";
    ImplementationStatus["TODO"] = "todo";
})(ImplementationStatus || (exports.ImplementationStatus = ImplementationStatus = {}));
var IssueType;
(function (IssueType) {
    IssueType["EMPTY_FUNCTION"] = "empty_function";
    IssueType["TODO_COMMENT"] = "todo_comment";
    IssueType["THROW_NOT_IMPLEMENTED"] = "throw_not_implemented";
    IssueType["MISSING_IMPLEMENTATION"] = "missing_implementation";
    IssueType["UNUSED_IMPORT"] = "unused_import";
    IssueType["UNUSED_FUNCTION"] = "unused_function";
    IssueType["COMPLEX_FUNCTION"] = "complex_function";
    IssueType["MISSING_RETURN"] = "missing_return";
    IssueType["INCONSISTENT_NAMING"] = "inconsistent_naming";
})(IssueType || (exports.IssueType = IssueType = {}));
class ImplementationAnalyzer {
    constructor() {
        this.stubPatterns = [
            /throw new Error\(['"`]Not implemented['"`]\)/i,
            /throw new Error\(['"`]TODO['"`]\)/i,
            /console\.log\(['"`]TODO['"`]\)/i,
            /\/\/ TODO/i,
            /\/\* TODO/i,
            /FIXME/i,
            /HACK/i,
            /XXX/i
        ];
        this.emptyFunctionPatterns = [
            /{\s*}/,
            /{\s*\/\/.*\s*}/,
            /{\s*\/\*.*\*\/\s*}/,
            /{\s*return\s*;\s*}/,
            /{\s*return\s+undefined\s*;\s*}/,
            /{\s*return\s+null\s*;\s*}/
        ];
    }
    async analyzePackageImplementation(pkg) {
        console.log(`Analyzing implementation for package: ${pkg.name}`);
        const files = [];
        let totalFunctions = 0;
        let functionalFunctions = 0;
        let stubFunctions = 0;
        let brokenFunctions = 0;
        let totalClasses = 0;
        let functionalClasses = 0;
        let stubClasses = 0;
        const allIssues = [];
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
                }
                else {
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
    async analyzeFile(file) {
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
        }
        catch (error) {
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
    analyzeFunctions(content, lines) {
        const functions = [];
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
    analyzeClasses(content, lines) {
        const classes = [];
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
    analyzeInterfaces(content, lines) {
        const interfaces = [];
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
    analyzeTypes(content, lines) {
        const types = [];
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
    extractFunctionBody(content, startIndex) {
        let braceCount = 1;
        let i = startIndex + 1;
        while (i < content.length && braceCount > 0) {
            if (content[i] === '{')
                braceCount++;
            if (content[i] === '}')
                braceCount--;
            i++;
        }
        return content.substring(startIndex + 1, i - 1);
    }
    extractClassBody(content, startIndex) {
        return this.extractFunctionBody(content, startIndex);
    }
    extractInterfaceBody(content, startIndex) {
        return this.extractFunctionBody(content, startIndex);
    }
    hasRealImplementation(body) {
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
    determineFunctionStatus(body, hasImplementation, issues) {
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
    analyzeClassMethods(classBody) {
        const methods = [];
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
                visibility: visibility || 'public',
                parameters,
                returnType: returnType?.trim()
            });
        }
        return methods;
    }
    analyzeClassProperties(classBody) {
        const properties = [];
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
                visibility: visibility || 'public',
                type: type?.trim()
            });
        }
        return properties;
    }
    extractInterfaceMethods(interfaceBody) {
        const methods = [];
        const methodRegex = /(\w+)\s*\([^)]*\)(?:\s*:\s*[^;]+)?;/g;
        let match;
        while ((match = methodRegex.exec(interfaceBody)) !== null) {
            methods.push(match[1]);
        }
        return methods;
    }
    extractInterfaceProperties(interfaceBody) {
        const properties = [];
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
    analyzeFunctionIssues(body, functionName) {
        const issues = [];
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
    findIssues(content, lines, filePath) {
        const issues = [];
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
    calculateFileCompleteness(functions, classes) {
        const totalItems = functions.length + classes.length;
        if (totalItems === 0)
            return 100;
        const functionalItems = functions.filter(f => f.status === ImplementationStatus.FUNCTIONAL).length +
            classes.filter(c => c.status === ImplementationStatus.FUNCTIONAL).length;
        return Math.round((functionalItems / totalItems) * 100);
    }
    calculateClassCompleteness(methods) {
        if (methods.length === 0)
            return 100;
        const functionalMethods = methods.filter(m => m.status === ImplementationStatus.FUNCTIONAL).length;
        return Math.round((functionalMethods / methods.length) * 100);
    }
    calculatePackageCompleteness(files) {
        if (files.length === 0)
            return 0;
        const totalScore = files.reduce((sum, file) => sum + file.completenessScore, 0);
        return Math.round(totalScore / files.length);
    }
    determineFileStatus(functions, classes, issues) {
        const totalItems = functions.length + classes.length;
        if (totalItems === 0)
            return ImplementationStatus.UNUSED;
        const functionalItems = functions.filter(f => f.status === ImplementationStatus.FUNCTIONAL).length +
            classes.filter(c => c.status === ImplementationStatus.FUNCTIONAL).length;
        const completenessRatio = functionalItems / totalItems;
        if (completenessRatio === 0)
            return ImplementationStatus.STUB;
        if (completenessRatio < 0.5)
            return ImplementationStatus.INCOMPLETE;
        if (issues.some(i => i.severity === 'error'))
            return ImplementationStatus.BROKEN;
        if (completenessRatio < 1)
            return ImplementationStatus.INCOMPLETE;
        return ImplementationStatus.FUNCTIONAL;
    }
    determineClassStatus(methods, properties) {
        if (methods.length === 0)
            return ImplementationStatus.STUB;
        const functionalMethods = methods.filter(m => m.status === ImplementationStatus.FUNCTIONAL).length;
        const completenessRatio = functionalMethods / methods.length;
        if (completenessRatio === 0)
            return ImplementationStatus.STUB;
        if (completenessRatio < 1)
            return ImplementationStatus.INCOMPLETE;
        return ImplementationStatus.FUNCTIONAL;
    }
    determineOverallStatus(completenessScore, issues) {
        if (issues.some(i => i.severity === 'error'))
            return ImplementationStatus.BROKEN;
        if (completenessScore === 0)
            return ImplementationStatus.STUB;
        if (completenessScore < 50)
            return ImplementationStatus.INCOMPLETE;
        if (completenessScore < 100)
            return ImplementationStatus.INCOMPLETE;
        return ImplementationStatus.FUNCTIONAL;
    }
    generateRecommendations(files, issues) {
        const recommendations = [];
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
exports.ImplementationAnalyzer = ImplementationAnalyzer;
//# sourceMappingURL=ImplementationAnalyzer.js.map
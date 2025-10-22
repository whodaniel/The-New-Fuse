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
exports.CodeQualityAnalyzer = void 0;
const fs = __importStar(require("fs/promises"));
class CodeQualityAnalyzer {
    constructor(packages) {
        this.packages = packages;
    }
    async analyzeCodeQuality() {
        console.log('Analyzing code quality...');
        // Analyze code duplications
        const duplications = await this.detectCodeDuplication();
        // Identify complex functions
        const complexFunctions = await this.identifyComplexFunctions();
        // Detect pattern inconsistencies
        const patternInconsistencies = await this.detectPatternInconsistencies();
        // Calculate quality metrics
        const qualityMetrics = await this.calculateQualityMetrics(duplications, complexFunctions);
        // Generate recommendations
        const recommendations = this.generateQualityRecommendations(duplications, complexFunctions, patternInconsistencies, qualityMetrics);
        return {
            duplications,
            complexFunctions,
            patternInconsistencies,
            qualityMetrics,
            recommendations
        };
    }
    async detectCodeDuplication() {
        const duplications = [];
        const codeBlocks = new Map();
        // Extract code blocks from all source files
        for (const pkg of this.packages) {
            for (const file of pkg.files) {
                if (file.type === 'source' && !file.path.includes('.test.') && !file.path.includes('.spec.')) {
                    try {
                        const content = await fs.readFile(file.path, 'utf-8');
                        const blocks = this.extractCodeBlocks(content, file.path);
                        for (const block of blocks) {
                            const normalizedBlock = this.normalizeCode(block.code);
                            if (normalizedBlock.length > 50) { // Only consider substantial blocks
                                if (!codeBlocks.has(normalizedBlock)) {
                                    codeBlocks.set(normalizedBlock, []);
                                }
                                codeBlocks.get(normalizedBlock).push({
                                    file: file.path,
                                    line: block.line
                                });
                            }
                        }
                    }
                    catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
        }
        // Find duplicated blocks
        for (const [code, locations] of codeBlocks) {
            if (locations.length > 1) {
                const similarity = this.calculateSimilarity(code);
                duplications.push({
                    duplicatedCode: code.substring(0, 200) + '...',
                    files: locations.map(loc => loc.file),
                    lines: locations.map(loc => loc.line),
                    similarity
                });
            }
        }
        return duplications.sort((a, b) => b.similarity - a.similarity);
    }
    extractCodeBlocks(content, filePath) {
        const blocks = [];
        const lines = content.split('\n');
        let currentBlock = '';
        let blockStartLine = 0;
        let braceCount = 0;
        let inFunction = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Skip empty lines and comments
            if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
                continue;
            }
            // Detect function/method start
            if (line.includes('function') || line.includes('=>') || line.match(/^\w+\s*\(/)) {
                if (currentBlock && braceCount === 0) {
                    blocks.push({ code: currentBlock, line: blockStartLine });
                }
                currentBlock = line;
                blockStartLine = i + 1;
                inFunction = true;
                braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            }
            else if (inFunction) {
                currentBlock += '\n' + line;
                braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
                if (braceCount <= 0) {
                    blocks.push({ code: currentBlock, line: blockStartLine });
                    currentBlock = '';
                    inFunction = false;
                }
            }
        }
        return blocks;
    }
    normalizeCode(code) {
        return code
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\/\/.*$/gm, '') // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\b\w+\b/g, match => {
            // Normalize variable names but keep keywords
            const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'interface'];
            return keywords.includes(match) ? match : 'VAR';
        })
            .trim();
    }
    calculateSimilarity(code) {
        // Simple similarity metric based on code structure
        const structuralElements = (code.match(/[{}();]/g) || []).length;
        const totalLength = code.length;
        return Math.min(100, (structuralElements / totalLength) * 1000);
    }
    async identifyComplexFunctions() {
        const complexFunctions = [];
        for (const pkg of this.packages) {
            for (const file of pkg.files) {
                if (file.type === 'source' && !file.path.includes('.test.') && !file.path.includes('.spec.')) {
                    try {
                        const content = await fs.readFile(file.path, 'utf-8');
                        const functions = this.extractFunctions(content, file.path);
                        for (const func of functions) {
                            const complexity = this.calculateCyclomaticComplexity(func.body);
                            const linesOfCode = func.body.split('\n').length;
                            const parameters = this.countParameters(func.signature);
                            const nestingDepth = this.calculateNestingDepth(func.body);
                            if (complexity > 10 || linesOfCode > 50 || parameters > 5 || nestingDepth > 4) {
                                complexFunctions.push({
                                    name: func.name,
                                    file: file.path,
                                    startLine: func.startLine,
                                    endLine: func.endLine,
                                    cyclomaticComplexity: complexity,
                                    linesOfCode,
                                    parameters,
                                    nestingDepth,
                                    refactoringRecommendation: this.generateRefactoringRecommendation(complexity, linesOfCode, parameters, nestingDepth)
                                });
                            }
                        }
                    }
                    catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
        }
        return complexFunctions.sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity);
    }
    extractFunctions(content, filePath) {
        const functions = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Match function declarations
            const functionMatch = line.match(/(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))/);
            if (functionMatch) {
                const functionName = functionMatch[1] || functionMatch[2];
                const startLine = i + 1;
                // Find function body
                let braceCount = 0;
                let bodyStart = i;
                let bodyEnd = i;
                let signature = line;
                // Find opening brace
                for (let j = i; j < lines.length; j++) {
                    const currentLine = lines[j];
                    braceCount += (currentLine.match(/{/g) || []).length - (currentLine.match(/}/g) || []).length;
                    if (j === i) {
                        signature = currentLine;
                    }
                    if (braceCount > 0 && bodyStart === i) {
                        bodyStart = j;
                    }
                    if (braceCount === 0 && bodyStart !== i) {
                        bodyEnd = j;
                        break;
                    }
                }
                if (bodyEnd > bodyStart) {
                    const body = lines.slice(bodyStart, bodyEnd + 1).join('\n');
                    functions.push({
                        name: functionName,
                        signature,
                        body,
                        startLine,
                        endLine: bodyEnd + 1
                    });
                }
            }
        }
        return functions;
    }
    calculateCyclomaticComplexity(code) {
        // Count decision points
        const decisionPoints = [
            /\bif\b/g,
            /\belse\s+if\b/g,
            /\bwhile\b/g,
            /\bfor\b/g,
            /\bswitch\b/g,
            /\bcase\b/g,
            /\bcatch\b/g,
            /\b\?\s*:/g, // Ternary operator
            /&&/g,
            /\|\|/g
        ];
        let complexity = 1; // Base complexity
        for (const pattern of decisionPoints) {
            const matches = code.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        }
        return complexity;
    }
    countParameters(signature) {
        const paramMatch = signature.match(/\(([^)]*)\)/);
        if (!paramMatch || !paramMatch[1].trim()) {
            return 0;
        }
        return paramMatch[1].split(',').filter(param => param.trim()).length;
    }
    calculateNestingDepth(code) {
        let maxDepth = 0;
        let currentDepth = 0;
        for (const char of code) {
            if (char === '{') {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            }
            else if (char === '}') {
                currentDepth--;
            }
        }
        return maxDepth;
    }
    generateRefactoringRecommendation(complexity, linesOfCode, parameters, nestingDepth) {
        const recommendations = [];
        if (complexity > 15) {
            recommendations.push('Break down into smaller functions');
        }
        if (linesOfCode > 100) {
            recommendations.push('Split into multiple functions');
        }
        if (parameters > 7) {
            recommendations.push('Use parameter objects or reduce parameters');
        }
        if (nestingDepth > 5) {
            recommendations.push('Reduce nesting with early returns or guard clauses');
        }
        return recommendations.join('; ') || 'Consider refactoring for better maintainability';
    }
    async detectPatternInconsistencies() {
        const inconsistencies = [];
        // Check naming conventions
        const namingInconsistency = await this.checkNamingConventions();
        if (namingInconsistency) {
            inconsistencies.push(namingInconsistency);
        }
        // Check import patterns
        const importInconsistency = await this.checkImportPatterns();
        if (importInconsistency) {
            inconsistencies.push(importInconsistency);
        }
        // Check error handling patterns
        const errorHandlingInconsistency = await this.checkErrorHandlingPatterns();
        if (errorHandlingInconsistency) {
            inconsistencies.push(errorHandlingInconsistency);
        }
        return inconsistencies;
    }
    async checkNamingConventions() {
        const patterns = {
            camelCase: 0,
            PascalCase: 0,
            snake_case: 0,
            'kebab-case': 0
        };
        const examples = [];
        for (const pkg of this.packages) {
            for (const file of pkg.files) {
                if (file.type === 'source') {
                    try {
                        const content = await fs.readFile(file.path, 'utf-8');
                        const lines = content.split('\n');
                        lines.forEach((line, index) => {
                            const variableMatch = line.match(/(?:const|let|var)\s+(\w+)/);
                            if (variableMatch) {
                                const varName = variableMatch[1];
                                if (/^[a-z][a-zA-Z0-9]*$/.test(varName)) {
                                    patterns.camelCase++;
                                }
                                else if (/^[A-Z][a-zA-Z0-9]*$/.test(varName)) {
                                    patterns.PascalCase++;
                                }
                                else if (/^[a-z][a-z0-9_]*$/.test(varName)) {
                                    patterns.snake_case++;
                                }
                                else if (/^[a-z][a-z0-9-]*$/.test(varName)) {
                                    patterns['kebab-case']++;
                                }
                                if (examples.length < 5) {
                                    examples.push({
                                        file: file.path,
                                        line: index + 1,
                                        code: line.trim()
                                    });
                                }
                            }
                        });
                    }
                    catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
        }
        const totalPatterns = Object.values(patterns).reduce((sum, count) => sum + count, 0);
        if (totalPatterns === 0)
            return null;
        const dominantPattern = Object.entries(patterns).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        const inconsistentCount = totalPatterns - patterns[dominantPattern];
        if (inconsistentCount > totalPatterns * 0.2) { // More than 20% inconsistent
            return {
                pattern: 'Variable naming convention',
                inconsistentFiles: examples.map(ex => ex.file),
                recommendedPattern: `Use ${dominantPattern} consistently`,
                examples
            };
        }
        return null;
    }
    async checkImportPatterns() {
        const patterns = {
            relative: 0,
            absolute: 0,
            mixed: 0
        };
        const examples = [];
        for (const pkg of this.packages) {
            for (const file of pkg.files) {
                if (file.type === 'source') {
                    try {
                        const content = await fs.readFile(file.path, 'utf-8');
                        const lines = content.split('\n');
                        let fileRelativeCount = 0;
                        let fileAbsoluteCount = 0;
                        lines.forEach((line, index) => {
                            const importMatch = line.match(/import.*from\s+['"]([^'"]+)['"]/);
                            if (importMatch) {
                                const importPath = importMatch[1];
                                if (importPath.startsWith('.')) {
                                    fileRelativeCount++;
                                    patterns.relative++;
                                }
                                else {
                                    fileAbsoluteCount++;
                                    patterns.absolute++;
                                }
                                if (examples.length < 5) {
                                    examples.push({
                                        file: file.path,
                                        line: index + 1,
                                        code: line.trim()
                                    });
                                }
                            }
                        });
                        if (fileRelativeCount > 0 && fileAbsoluteCount > 0) {
                            patterns.mixed++;
                        }
                    }
                    catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
        }
        if (patterns.mixed > 0) {
            return {
                pattern: 'Import path style',
                inconsistentFiles: examples.map(ex => ex.file),
                recommendedPattern: 'Use consistent import path style (relative or absolute)',
                examples
            };
        }
        return null;
    }
    async checkErrorHandlingPatterns() {
        const patterns = {
            tryCache: 0,
            throwError: 0,
            returnError: 0,
            noHandling: 0
        };
        const examples = [];
        for (const pkg of this.packages) {
            for (const file of pkg.files) {
                if (file.type === 'source') {
                    try {
                        const content = await fs.readFile(file.path, 'utf-8');
                        const lines = content.split('\n');
                        lines.forEach((line, index) => {
                            if (line.includes('try') && line.includes('catch')) {
                                patterns.tryCache++;
                            }
                            else if (line.includes('throw')) {
                                patterns.throwError++;
                            }
                            else if (line.includes('return') && line.includes('error')) {
                                patterns.returnError++;
                            }
                            if ((line.includes('try') || line.includes('throw') || line.includes('error')) && examples.length < 5) {
                                examples.push({
                                    file: file.path,
                                    line: index + 1,
                                    code: line.trim()
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
        const totalPatterns = patterns.tryCache + patterns.throwError + patterns.returnError;
        if (totalPatterns === 0)
            return null;
        const dominantPattern = Object.entries(patterns).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        const inconsistentCount = totalPatterns - patterns[dominantPattern];
        if (inconsistentCount > totalPatterns * 0.3) { // More than 30% inconsistent
            return {
                pattern: 'Error handling style',
                inconsistentFiles: examples.map(ex => ex.file),
                recommendedPattern: `Use ${dominantPattern} consistently for error handling`,
                examples
            };
        }
        return null;
    }
    async calculateQualityMetrics(duplications, complexFunctions) {
        let totalLines = 0;
        let duplicatedLines = 0;
        let totalComplexity = 0;
        let functionCount = 0;
        let testFiles = 0;
        let sourceFiles = 0;
        for (const pkg of this.packages) {
            for (const file of pkg.files) {
                if (file.type === 'source') {
                    try {
                        const content = await fs.readFile(file.path, 'utf-8');
                        const lines = content.split('\n').length;
                        totalLines += lines;
                        if (file.path.includes('.test.') || file.path.includes('.spec.')) {
                            testFiles++;
                        }
                        else {
                            sourceFiles++;
                        }
                    }
                    catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
        }
        // Calculate duplicated lines
        duplicatedLines = duplications.reduce((sum, dup) => sum + (dup.files.length * 10), 0); // Estimate
        // Calculate average complexity
        totalComplexity = complexFunctions.reduce((sum, func) => sum + func.cyclomaticComplexity, 0);
        functionCount = complexFunctions.length;
        const duplicatedLinesPercentage = totalLines > 0 ? (duplicatedLines / totalLines) * 100 : 0;
        const averageComplexity = functionCount > 0 ? totalComplexity / functionCount : 0;
        const testCoverage = sourceFiles > 0 ? (testFiles / sourceFiles) * 100 : 0;
        // Calculate maintainability index (simplified version)
        const maintainabilityIndex = Math.max(0, 171 - 5.2 * Math.log(averageComplexity + 1) - 0.23 * averageComplexity - 16.2 * Math.log(totalLines + 1));
        // Calculate technical debt (based on duplications and complexity)
        const technicalDebt = duplications.length * 2 + complexFunctions.filter(f => f.cyclomaticComplexity > 15).length * 3;
        // Calculate code smells
        const codeSmells = duplications.length + complexFunctions.filter(f => f.linesOfCode > 100).length;
        // Overall score (0-100)
        const overallScore = Math.max(0, 100 - duplicatedLinesPercentage - (averageComplexity * 2) - (technicalDebt * 0.5));
        return {
            overallScore: Math.round(overallScore),
            maintainabilityIndex: Math.round(maintainabilityIndex),
            technicalDebt,
            codeSmells,
            duplicatedLinesPercentage: Math.round(duplicatedLinesPercentage * 100) / 100,
            averageComplexity: Math.round(averageComplexity * 100) / 100,
            testCoverage: Math.round(testCoverage * 100) / 100
        };
    }
    generateQualityRecommendations(duplications, complexFunctions, patternInconsistencies, qualityMetrics) {
        const recommendations = [];
        if (duplications.length > 0) {
            recommendations.push(`Refactor ${duplications.length} code duplications to improve maintainability`);
        }
        if (complexFunctions.length > 0) {
            const highComplexity = complexFunctions.filter(f => f.cyclomaticComplexity > 15).length;
            recommendations.push(`Simplify ${highComplexity} highly complex functions (complexity > 15)`);
        }
        if (patternInconsistencies.length > 0) {
            recommendations.push(`Standardize ${patternInconsistencies.length} inconsistent coding patterns`);
        }
        if (qualityMetrics.testCoverage < 50) {
            recommendations.push(`Improve test coverage from ${qualityMetrics.testCoverage}% to at least 70%`);
        }
        if (qualityMetrics.duplicatedLinesPercentage > 5) {
            recommendations.push(`Reduce code duplication from ${qualityMetrics.duplicatedLinesPercentage}% to under 3%`);
        }
        if (qualityMetrics.overallScore < 70) {
            recommendations.push('Focus on overall code quality improvement to achieve score above 70');
        }
        return recommendations;
    }
}
exports.CodeQualityAnalyzer = CodeQualityAnalyzer;
//# sourceMappingURL=CodeQualityAnalyzer.js.map
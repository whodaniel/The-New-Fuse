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
exports.TestCoverageAnalyzer = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
class TestCoverageAnalyzer {
    constructor(packages, rootPath = process.cwd()) {
        this.packages = packages;
        this.rootPath = rootPath;
    }
    async analyzeTestCoverage() {
        console.log('Analyzing test coverage...');
        // Step 1: Discover all test files
        const testFiles = await this.discoverTestFiles();
        // Step 2: Discover all source files
        const sourceFiles = await this.discoverSourceFiles();
        // Step 3: Map tests to source components
        const componentMappings = await this.mapTestsToComponents(testFiles, sourceFiles);
        // Step 4: Analyze test quality
        const qualityAnalysis = await this.analyzeTestQuality(testFiles);
        // Step 5: Identify coverage gaps
        const coverageGaps = this.identifyCoverageGaps(componentMappings, sourceFiles);
        // Step 6: Generate recommendations
        const recommendations = this.generateRecommendations(componentMappings, coverageGaps);
        return this.generateReport(testFiles, sourceFiles, componentMappings, qualityAnalysis, coverageGaps, recommendations);
    }
    async discoverTestFiles() {
        const testPatterns = [
            '**/*.test.{ts,tsx,js,jsx}',
            '**/*.spec.{ts,tsx,js,jsx}',
            '**/test/**/*.{ts,tsx,js,jsx}',
            '**/tests/**/*.{ts,tsx,js,jsx}',
            '**/__tests__/**/*.{ts,tsx,js,jsx}'
        ];
        const testFiles = [];
        for (const pattern of testPatterns) {
            const files = await (0, glob_1.glob)(pattern, {
                cwd: this.rootPath,
                ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**']
            });
            for (const file of files) {
                const fullPath = path.join(this.rootPath, file);
                try {
                    const testFile = await this.analyzeTestFile(fullPath, file);
                    testFiles.push(testFile);
                }
                catch (error) {
                    console.warn(`Failed to analyze test file ${file}:`, error);
                }
            }
        }
        return testFiles;
    }
    async analyzeTestFile(fullPath, relativePath) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const name = path.basename(relativePath);
        // Determine test type
        const type = this.determineTestType(relativePath, content);
        // Determine framework
        const framework = this.determineTestFramework(content);
        // Find potential source file
        const sourceFile = this.findSourceFile(relativePath);
        // Count tests
        const testCount = this.countTests(content);
        // Check for test patterns
        const hasDescribe = /describe\s*\(/.test(content);
        const hasIt = /(it|test)\s*\(/.test(content);
        const hasMocks = /(mock|jest\.mock|vi\.mock|sinon)/.test(content);
        // Extract imports
        const imports = this.extractImports(content);
        return {
            path: relativePath,
            name,
            type,
            framework,
            sourceFile,
            testCount,
            hasDescribe,
            hasIt,
            hasMocks,
            imports,
            coverage: null // Would need actual coverage data from test runner
        };
    }
    determineTestType(filePath, content) {
        if (filePath.includes('e2e') || filePath.includes('integration') || content.includes('supertest')) {
            return content.includes('e2e') ? 'e2e' : 'integration';
        }
        if (filePath.includes('.spec.')) {
            return 'spec';
        }
        if (filePath.includes('.test.')) {
            return 'unit';
        }
        return 'unknown';
    }
    determineTestFramework(content) {
        if (content.includes('jest') || content.includes('expect(') && content.includes('toBe')) {
            return 'jest';
        }
        if (content.includes('vitest') || content.includes('vi.')) {
            return 'vitest';
        }
        if (content.includes('mocha') || content.includes('chai')) {
            return 'mocha';
        }
        return 'unknown';
    }
    findSourceFile(testPath) {
        // Remove test-specific parts from path to find source file
        let sourcePath = testPath
            .replace(/\.test\./, '.')
            .replace(/\.spec\./, '.')
            .replace(/__tests__\//, '')
            .replace(/\/tests?\//, '/src/')
            .replace(/test\//, 'src/');
        // Handle common test directory structures
        if (sourcePath.includes('__tests__')) {
            sourcePath = sourcePath.replace('__tests__/', '');
        }
        return sourcePath;
    }
    countTests(content) {
        const testMatches = content.match(/(it|test)\s*\(/g);
        return testMatches ? testMatches.length : 0;
    }
    extractImports(content) {
        const importMatches = content.match(/import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g);
        if (!importMatches)
            return [];
        return importMatches.map(match => {
            const moduleMatch = match.match(/from\s+['"`]([^'"`]+)['"`]/);
            return moduleMatch ? moduleMatch[1] : '';
        }).filter(Boolean);
    }
    async discoverSourceFiles() {
        const sourcePatterns = [
            'src/**/*.{ts,tsx,js,jsx}',
            'packages/*/src/**/*.{ts,tsx,js,jsx}',
            'apps/*/src/**/*.{ts,tsx,js,jsx}'
        ];
        const sourceFiles = [];
        for (const pattern of sourcePatterns) {
            const files = await (0, glob_1.glob)(pattern, {
                cwd: this.rootPath,
                ignore: [
                    'node_modules/**',
                    'dist/**',
                    'build/**',
                    '.next/**',
                    '**/*.test.*',
                    '**/*.spec.*',
                    '**/test/**',
                    '**/tests/**',
                    '**/__tests__/**'
                ]
            });
            sourceFiles.push(...files);
        }
        return sourceFiles;
    }
    async mapTestsToComponents(testFiles, sourceFiles) {
        const mappings = [];
        const mappedTests = new Set();
        // Create mappings for source files that have tests
        for (const sourceFile of sourceFiles) {
            const relatedTests = testFiles.filter(test => {
                if (test.sourceFile === sourceFile) {
                    mappedTests.add(test.path);
                    return true;
                }
                // Additional heuristics for mapping
                const sourceBaseName = path.basename(sourceFile, path.extname(sourceFile));
                const testBaseName = path.basename(test.path, path.extname(test.path))
                    .replace(/\.test$/, '')
                    .replace(/\.spec$/, '');
                if (sourceBaseName === testBaseName) {
                    mappedTests.add(test.path);
                    return true;
                }
                // Check if test imports the source file
                const sourceImportPath = sourceFile.replace(/\.(ts|tsx|js|jsx)$/, '');
                if (test.imports.some(imp => imp.includes(sourceBaseName) || imp.includes(sourceImportPath))) {
                    mappedTests.add(test.path);
                    return true;
                }
                return false;
            });
            const hasCoverage = relatedTests.length > 0;
            const coverageGap = this.determineCoverageGap(relatedTests);
            const testQuality = this.determineTestQuality(relatedTests);
            mappings.push({
                sourceFile,
                testFiles: relatedTests,
                hasCoverage,
                coverageGap,
                testQuality
            });
        }
        return mappings;
    }
    determineCoverageGap(testFiles) {
        if (testFiles.length === 0)
            return 'missing';
        const totalTests = testFiles.reduce((sum, test) => sum + test.testCount, 0);
        if (totalTests === 0)
            return 'missing';
        if (totalTests < 3)
            return 'partial';
        return 'none';
    }
    determineTestQuality(testFiles) {
        if (testFiles.length === 0)
            return 'none';
        let qualityScore = 0;
        let maxScore = 0;
        for (const test of testFiles) {
            maxScore += 5;
            if (test.hasDescribe)
                qualityScore += 1;
            if (test.hasIt)
                qualityScore += 1;
            if (test.hasMocks)
                qualityScore += 1;
            if (test.testCount > 3)
                qualityScore += 1;
            if (test.framework !== 'unknown')
                qualityScore += 1;
        }
        const percentage = maxScore > 0 ? (qualityScore / maxScore) * 100 : 0;
        if (percentage >= 80)
            return 'excellent';
        if (percentage >= 60)
            return 'good';
        if (percentage >= 40)
            return 'fair';
        if (percentage > 0)
            return 'poor';
        return 'none';
    }
    async analyzeTestQuality(testFiles) {
        const distribution = {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0,
            none: 0
        };
        for (const test of testFiles) {
            const quality = this.determineTestQuality([test]);
            distribution[quality]++;
        }
        return distribution;
    }
    identifyCoverageGaps(mappings, sourceFiles) {
        const missingTests = mappings
            .filter(m => m.coverageGap === 'missing')
            .map(m => m.sourceFile);
        const inadequateTests = mappings
            .filter(m => m.coverageGap === 'partial')
            .map(m => m.sourceFile);
        // Find orphaned tests (tests without clear source mapping)
        const mappedTestPaths = new Set(mappings.flatMap(m => m.testFiles.map(t => t.path)));
        const orphanedTests = [];
        // This would need to be implemented based on the actual test discovery
        return {
            missingTests,
            inadequateTests,
            orphanedTests
        };
    }
    generateRecommendations(mappings, coverageGaps) {
        const recommendations = [];
        if (coverageGaps.missingTests.length > 0) {
            recommendations.push(`Add unit tests for ${coverageGaps.missingTests.length} components without test coverage`);
        }
        if (coverageGaps.inadequateTests.length > 0) {
            recommendations.push(`Improve test coverage for ${coverageGaps.inadequateTests.length} components with partial coverage`);
        }
        const poorQualityTests = mappings.filter(m => m.testQuality === 'poor').length;
        if (poorQualityTests > 0) {
            recommendations.push(`Improve test quality for ${poorQualityTests} components with poor test quality`);
        }
        const noFrameworkTests = mappings.flatMap(m => m.testFiles).filter(t => t.framework === 'unknown').length;
        if (noFrameworkTests > 0) {
            recommendations.push(`Standardize test framework for ${noFrameworkTests} tests with unknown framework`);
        }
        if (coverageGaps.orphanedTests.length > 0) {
            recommendations.push(`Review and clean up ${coverageGaps.orphanedTests.length} orphaned test files`);
        }
        return recommendations;
    }
    generateReport(testFiles, sourceFiles, componentMappings, qualityAnalysis, coverageGaps, recommendations) {
        const testedComponents = componentMappings.filter(m => m.hasCoverage).length;
        const untestedComponents = componentMappings.filter(m => !m.hasCoverage).length;
        const coveragePercentage = sourceFiles.length > 0 ? Math.round((testedComponents / sourceFiles.length) * 100) : 0;
        const testsByFramework = {
            jest: testFiles.filter(t => t.framework === 'jest').length,
            vitest: testFiles.filter(t => t.framework === 'vitest').length,
            mocha: testFiles.filter(t => t.framework === 'mocha').length,
            unknown: testFiles.filter(t => t.framework === 'unknown').length
        };
        const testsByType = {
            unit: testFiles.filter(t => t.type === 'unit').length,
            integration: testFiles.filter(t => t.type === 'integration').length,
            e2e: testFiles.filter(t => t.type === 'e2e').length,
            spec: testFiles.filter(t => t.type === 'spec').length,
            unknown: testFiles.filter(t => t.type === 'unknown').length
        };
        return {
            totalSourceFiles: sourceFiles.length,
            totalTestFiles: testFiles.length,
            testedComponents,
            untestedComponents,
            coveragePercentage,
            testQualityDistribution: qualityAnalysis,
            testsByFramework,
            testsByType,
            componentMappings,
            testFiles,
            coverageGaps,
            recommendations
        };
    }
}
exports.TestCoverageAnalyzer = TestCoverageAnalyzer;
//# sourceMappingURL=TestCoverageAnalyzer.js.map
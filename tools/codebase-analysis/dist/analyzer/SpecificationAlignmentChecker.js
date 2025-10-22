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
exports.SpecificationAlignmentChecker = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const FileSystemScanner_1 = require("../scanner/FileSystemScanner");
class SpecificationAlignmentChecker {
    constructor(rootPath = process.cwd()) {
        this.rootPath = rootPath;
        this.specsPath = path.join(rootPath, '.kiro', 'specs');
        this.scanner = new FileSystemScanner_1.FileSystemScanner(rootPath);
    }
    async checkSpecificationAlignment() {
        console.log('Analyzing specification alignment...');
        // Parse all specifications
        const specifications = await this.parseAllSpecifications();
        // Scan codebase for implementations
        const fileSystemMap = await this.scanner.scanFileSystem();
        const allPackages = [...fileSystemMap.packages, ...fileSystemMap.apps];
        // Map specifications to implementations
        const mappings = await this.mapSpecificationsToImplementations(specifications, allPackages);
        // Find implemented features without specifications
        const unspecifiedImplementations = await this.findUnspecifiedImplementations(allPackages, specifications);
        // Calculate alignment score and generate recommendations
        const alignment = this.calculateAlignment(mappings, unspecifiedImplementations);
        return alignment;
    }
    async parseAllSpecifications() {
        const features = [];
        try {
            const specDirs = await fs.readdir(this.specsPath);
            for (const specDir of specDirs) {
                const specPath = path.join(this.specsPath, specDir);
                const stat = await fs.stat(specPath);
                if (stat.isDirectory()) {
                    // Parse requirements.md
                    const requirementsPath = path.join(specPath, 'requirements.md');
                    if (await this.fileExists(requirementsPath)) {
                        const reqFeatures = await this.parseRequirementsFile(requirementsPath, specDir);
                        features.push(...reqFeatures);
                    }
                    // Parse design.md
                    const designPath = path.join(specPath, 'design.md');
                    if (await this.fileExists(designPath)) {
                        const designFeatures = await this.parseDesignFile(designPath, specDir);
                        features.push(...designFeatures);
                    }
                    // Parse tasks.md
                    const tasksPath = path.join(specPath, 'tasks.md');
                    if (await this.fileExists(tasksPath)) {
                        const taskFeatures = await this.parseTasksFile(tasksPath, specDir);
                        features.push(...taskFeatures);
                    }
                }
            }
        }
        catch (error) {
            console.warn('Error reading specs directory:', error);
        }
        return features;
    }
    async parseRequirementsFile(filePath, specName) {
        const content = await fs.readFile(filePath, 'utf-8');
        const features = [];
        // Parse requirements using regex patterns
        const requirementPattern = /### Requirement \d+[:\s]*(.*?)\n\n\*\*User Story:\*\*(.*?)\n\n#### Acceptance Criteria\n\n((?:\d+\..*?\n)*)/gs;
        let match;
        while ((match = requirementPattern.exec(content)) !== null) {
            const [, title, userStory, criteria] = match;
            const requirements = criteria.split('\n').filter(line => line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.') || line.trim().startsWith('5.'));
            features.push({
                id: `${specName}-req-${features.length + 1}`,
                title: title.trim(),
                description: userStory.trim(),
                requirements: requirements.map(req => req.trim()),
                specPath: filePath,
                category: 'requirement'
            });
        }
        return features;
    }
    async parseDesignFile(filePath, specName) {
        const content = await fs.readFile(filePath, 'utf-8');
        const features = [];
        // Parse design components and interfaces
        const componentPattern = /### \d+\.\s*(.*?Component|.*?Interface|.*?Service|.*?Manager)\n\n(.*?)(?=\n###|\n##|$)/gs;
        let match;
        while ((match = componentPattern.exec(content)) !== null) {
            const [, title, description] = match;
            features.push({
                id: `${specName}-design-${features.length + 1}`,
                title: title.trim(),
                description: description.trim().substring(0, 200) + '...',
                requirements: [],
                specPath: filePath,
                category: 'design'
            });
        }
        return features;
    }
    async parseTasksFile(filePath, specName) {
        const content = await fs.readFile(filePath, 'utf-8');
        const features = [];
        // Parse tasks using checkbox pattern
        const taskPattern = /- \[.\] (\d+(?:\.\d+)?)\s*(.*?)\n((?:\s*-.*?\n)*)/g;
        let match;
        while ((match = taskPattern.exec(content)) !== null) {
            const [, taskNumber, title, details] = match;
            const requirements = this.extractRequirementsFromTaskDetails(details);
            features.push({
                id: `${specName}-task-${taskNumber}`,
                title: title.trim(),
                description: details.trim(),
                requirements,
                specPath: filePath,
                category: 'task'
            });
        }
        return features;
    }
    extractRequirementsFromTaskDetails(details) {
        const reqPattern = /_Requirements:\s*([\d\.,\s]+)_/g;
        const match = reqPattern.exec(details);
        if (match) {
            return match[1].split(',').map(req => req.trim());
        }
        return [];
    }
    async mapSpecificationsToImplementations(specifications, packages) {
        const mappings = [];
        for (const spec of specifications) {
            const implementationFiles = await this.findImplementationFiles(spec, packages);
            const implementationStatus = this.assessImplementationStatus(spec, implementationFiles);
            const implementationScore = this.calculateImplementationScore(spec, implementationFiles);
            const gaps = await this.identifyImplementationGaps(spec, implementationFiles);
            mappings.push({
                feature: spec,
                implementationFiles,
                implementationStatus,
                implementationScore,
                gaps
            });
        }
        return mappings;
    }
    async findImplementationFiles(spec, packages) {
        const implementationFiles = [];
        const keywords = this.extractKeywordsFromSpec(spec);
        for (const pkg of packages) {
            for (const file of pkg.files) {
                if (file.type === 'source') {
                    try {
                        const content = await fs.readFile(file.path, 'utf-8');
                        const hasImplementation = keywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()) ||
                            file.path.toLowerCase().includes(keyword.toLowerCase()));
                        if (hasImplementation) {
                            implementationFiles.push(file.path);
                        }
                    }
                    catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
        }
        return implementationFiles;
    }
    extractKeywordsFromSpec(spec) {
        const keywords = [];
        const text = `${spec.title} ${spec.description}`.toLowerCase();
        // Extract class/interface names
        const classPattern = /\b([A-Z][a-zA-Z]+(?:Service|Manager|Handler|Controller|Repository|Analyzer|Scanner|Checker))\b/g;
        let match;
        while ((match = classPattern.exec(text)) !== null) {
            keywords.push(match[1]);
        }
        // Extract function names
        const functionPattern = /\b(analyze|scan|check|validate|process|handle|manage|create|build|implement)\w*/gi;
        while ((match = functionPattern.exec(text)) !== null) {
            keywords.push(match[0]);
        }
        // Extract domain-specific terms
        const domainTerms = ['mcp', 'workflow', 'database', 'api', 'frontend', 'backend', 'deployment', 'testing'];
        domainTerms.forEach(term => {
            if (text.includes(term)) {
                keywords.push(term);
            }
        });
        return [...new Set(keywords)]; // Remove duplicates
    }
    assessImplementationStatus(spec, implementationFiles) {
        if (implementationFiles.length === 0) {
            return 'missing';
        }
        // Simple heuristic: if we have multiple implementation files, it's likely implemented
        // If only one file, it might be partial
        if (implementationFiles.length >= 3) {
            return 'implemented';
        }
        else if (implementationFiles.length >= 1) {
            return 'partial';
        }
        return 'missing';
    }
    calculateImplementationScore(spec, implementationFiles) {
        if (implementationFiles.length === 0)
            return 0;
        // Base score on number of implementation files and requirements coverage
        const fileScore = Math.min(implementationFiles.length * 20, 80);
        const requirementScore = spec.requirements.length > 0 ? 20 : 0;
        return Math.min(fileScore + requirementScore, 100);
    }
    async identifyImplementationGaps(spec, implementationFiles) {
        const gaps = [];
        if (implementationFiles.length === 0) {
            gaps.push('No implementation files found');
        }
        if (spec.requirements.length > 0 && implementationFiles.length < spec.requirements.length) {
            gaps.push('Implementation may not cover all requirements');
        }
        // Check for test files
        const hasTests = implementationFiles.some(file => file.includes('.test.') || file.includes('.spec.'));
        if (!hasTests) {
            gaps.push('No test files found for implementation');
        }
        return gaps;
    }
    async findUnspecifiedImplementations(packages, specifications) {
        const unspecified = [];
        const specKeywords = new Set(specifications.flatMap(spec => this.extractKeywordsFromSpec(spec)));
        for (const pkg of packages) {
            for (const file of pkg.files) {
                if (file.type === 'source' && !file.path.includes('.test.') && !file.path.includes('.spec.')) {
                    try {
                        const content = await fs.readFile(file.path, 'utf-8');
                        const functionality = this.extractFunctionalityFromFile(content, file.path);
                        if (functionality && !this.isSpecified(functionality, specKeywords)) {
                            unspecified.push({
                                file: file.path,
                                functionality,
                                suggestedSpecCategory: this.suggestSpecCategory(functionality)
                            });
                        }
                    }
                    catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
        }
        return unspecified;
    }
    extractFunctionalityFromFile(content, filePath) {
        // Extract class names, function names, and key functionality
        const classMatches = content.match(/(?:class|interface)\s+(\w+)/g);
        const functionMatches = content.match(/(?:function|const|let)\s+(\w+)/g);
        const functionality = [];
        if (classMatches) {
            functionality.push(...classMatches.map(match => match.split(/\s+/)[1]));
        }
        if (functionMatches) {
            functionality.push(...functionMatches.map(match => match.split(/\s+/)[1]));
        }
        // Add file name as functionality indicator
        const fileName = path.basename(filePath, path.extname(filePath));
        functionality.push(fileName);
        return functionality.join(', ');
    }
    isSpecified(functionality, specKeywords) {
        const funcWords = functionality.toLowerCase().split(/[,\s]+/);
        return funcWords.some(word => Array.from(specKeywords).some(keyword => keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())));
    }
    suggestSpecCategory(functionality) {
        const func = functionality.toLowerCase();
        if (func.includes('test') || func.includes('spec')) {
            return 'testing';
        }
        else if (func.includes('service') || func.includes('manager') || func.includes('handler')) {
            return 'design';
        }
        else if (func.includes('requirement') || func.includes('criteria')) {
            return 'requirement';
        }
        else {
            return 'task';
        }
    }
    calculateAlignment(mappings, unspecifiedImplementations) {
        const specifiedButNotImplemented = mappings.filter(m => m.implementationStatus === 'missing');
        const implementedButNotSpecified = unspecifiedImplementations;
        const alignedFeatures = mappings.filter(m => m.implementationStatus !== 'missing');
        const totalSpecs = mappings.length;
        const implementedSpecs = alignedFeatures.length;
        const overallAlignmentScore = totalSpecs > 0 ? Math.round((implementedSpecs / totalSpecs) * 100) : 0;
        const recommendations = this.generateAlignmentRecommendations(specifiedButNotImplemented, implementedButNotSpecified, alignedFeatures);
        return {
            specifiedButNotImplemented,
            implementedButNotSpecified,
            alignedFeatures,
            overallAlignmentScore,
            recommendations
        };
    }
    generateAlignmentRecommendations(missing, unspecified, aligned) {
        const recommendations = [];
        if (missing.length > 0) {
            recommendations.push(`Implement ${missing.length} missing features from specifications`);
            const highPriorityMissing = missing.filter(m => m.feature.category === 'requirement');
            if (highPriorityMissing.length > 0) {
                recommendations.push(`Priority: Implement ${highPriorityMissing.length} missing requirement features first`);
            }
        }
        if (unspecified.length > 0) {
            recommendations.push(`Document ${unspecified.length} implemented features that lack specifications`);
        }
        const partialImplementations = aligned.filter(a => a.implementationStatus === 'partial');
        if (partialImplementations.length > 0) {
            recommendations.push(`Complete ${partialImplementations.length} partially implemented features`);
        }
        const lowScoreImplementations = aligned.filter(a => a.implementationScore < 50);
        if (lowScoreImplementations.length > 0) {
            recommendations.push(`Improve ${lowScoreImplementations.length} low-quality implementations`);
        }
        return recommendations;
    }
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.SpecificationAlignmentChecker = SpecificationAlignmentChecker;
//# sourceMappingURL=SpecificationAlignmentChecker.js.map
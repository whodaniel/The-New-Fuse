import * as fs from 'fs/promises';
import * as path from 'path';
import { FileSystemScanner, PackageInfo } from '../scanner/FileSystemScanner';

export interface SpecificationFeature {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  specPath: string;
  category: 'requirement' | 'design' | 'task';
}

export interface ImplementationMapping {
  feature: SpecificationFeature;
  implementationFiles: string[];
  implementationStatus: 'implemented' | 'partial' | 'missing';
  implementationScore: number;
  gaps: string[];
}

export interface SpecificationAlignment {
  specifiedButNotImplemented: ImplementationMapping[];
  implementedButNotSpecified: {
    file: string;
    functionality: string;
    suggestedSpecCategory: string;
  }[];
  alignedFeatures: ImplementationMapping[];
  overallAlignmentScore: number;
  recommendations: string[];
}

export class SpecificationAlignmentChecker {
  private rootPath: string;
  private specsPath: string;
  private scanner: FileSystemScanner;

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
    this.specsPath = path.join(rootPath, '.kiro', 'specs');
    this.scanner = new FileSystemScanner(rootPath);
  }

  async checkSpecificationAlignment(): Promise<SpecificationAlignment> {
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

  private async parseAllSpecifications(): Promise<SpecificationFeature[]> {
    const features: SpecificationFeature[] = [];
    
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
    } catch (error) {
      console.warn('Error reading specs directory:', error);
    }
    
    return features;
  }

  private async parseRequirementsFile(filePath: string, specName: string): Promise<SpecificationFeature[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const features: SpecificationFeature[] = [];
    
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

  private async parseDesignFile(filePath: string, specName: string): Promise<SpecificationFeature[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const features: SpecificationFeature[] = [];
    
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

  private async parseTasksFile(filePath: string, specName: string): Promise<SpecificationFeature[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const features: SpecificationFeature[] = [];
    
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

  private extractRequirementsFromTaskDetails(details: string): string[] {
    const reqPattern = /_Requirements:\s*([\d\.,\s]+)_/g;
    const match = reqPattern.exec(details);
    if (match) {
      return match[1].split(',').map(req => req.trim());
    }
    return [];
  }

  private async mapSpecificationsToImplementations(
    specifications: SpecificationFeature[],
    packages: PackageInfo[]
  ): Promise<ImplementationMapping[]> {
    const mappings: ImplementationMapping[] = [];
    
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

  private async findImplementationFiles(spec: SpecificationFeature, packages: PackageInfo[]): Promise<string[]> {
    const implementationFiles: string[] = [];
    const keywords = this.extractKeywordsFromSpec(spec);
    
    for (const pkg of packages) {
      for (const file of pkg.files) {
        if (file.type === 'source') {
          try {
            const content = await fs.readFile(file.path, 'utf-8');
            const hasImplementation = keywords.some(keyword => 
              content.toLowerCase().includes(keyword.toLowerCase()) ||
              file.path.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (hasImplementation) {
              implementationFiles.push(file.path);
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }
    
    return implementationFiles;
  }

  private extractKeywordsFromSpec(spec: SpecificationFeature): string[] {
    const keywords: string[] = [];
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

  private assessImplementationStatus(spec: SpecificationFeature, implementationFiles: string[]): 'implemented' | 'partial' | 'missing' {
    if (implementationFiles.length === 0) {
      return 'missing';
    }
    
    // Simple heuristic: if we have multiple implementation files, it's likely implemented
    // If only one file, it might be partial
    if (implementationFiles.length >= 3) {
      return 'implemented';
    } else if (implementationFiles.length >= 1) {
      return 'partial';
    }
    
    return 'missing';
  }

  private calculateImplementationScore(spec: SpecificationFeature, implementationFiles: string[]): number {
    if (implementationFiles.length === 0) return 0;
    
    // Base score on number of implementation files and requirements coverage
    const fileScore = Math.min(implementationFiles.length * 20, 80);
    const requirementScore = spec.requirements.length > 0 ? 20 : 0;
    
    return Math.min(fileScore + requirementScore, 100);
  }

  private async identifyImplementationGaps(spec: SpecificationFeature, implementationFiles: string[]): Promise<string[]> {
    const gaps: string[] = [];
    
    if (implementationFiles.length === 0) {
      gaps.push('No implementation files found');
    }
    
    if (spec.requirements.length > 0 && implementationFiles.length < spec.requirements.length) {
      gaps.push('Implementation may not cover all requirements');
    }
    
    // Check for test files
    const hasTests = implementationFiles.some(file => 
      file.includes('.test.') || file.includes('.spec.')
    );
    if (!hasTests) {
      gaps.push('No test files found for implementation');
    }
    
    return gaps;
  }

  private async findUnspecifiedImplementations(
    packages: PackageInfo[],
    specifications: SpecificationFeature[]
  ): Promise<{ file: string; functionality: string; suggestedSpecCategory: string; }[]> {
    const unspecified: { file: string; functionality: string; suggestedSpecCategory: string; }[] = [];
    const specKeywords = new Set(
      specifications.flatMap(spec => this.extractKeywordsFromSpec(spec))
    );
    
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
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }
    
    return unspecified;
  }

  private extractFunctionalityFromFile(content: string, filePath: string): string {
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

  private isSpecified(functionality: string, specKeywords: Set<string>): boolean {
    const funcWords = functionality.toLowerCase().split(/[,\s]+/);
    return funcWords.some(word => 
      Array.from(specKeywords).some(keyword => 
        keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())
      )
    );
  }

  private suggestSpecCategory(functionality: string): string {
    const func = functionality.toLowerCase();
    
    if (func.includes('test') || func.includes('spec')) {
      return 'testing';
    } else if (func.includes('service') || func.includes('manager') || func.includes('handler')) {
      return 'design';
    } else if (func.includes('requirement') || func.includes('criteria')) {
      return 'requirement';
    } else {
      return 'task';
    }
  }

  private calculateAlignment(
    mappings: ImplementationMapping[],
    unspecifiedImplementations: { file: string; functionality: string; suggestedSpecCategory: string; }[]
  ): SpecificationAlignment {
    const specifiedButNotImplemented = mappings.filter(m => m.implementationStatus === 'missing');
    const implementedButNotSpecified = unspecifiedImplementations;
    const alignedFeatures = mappings.filter(m => m.implementationStatus !== 'missing');
    
    const totalSpecs = mappings.length;
    const implementedSpecs = alignedFeatures.length;
    const overallAlignmentScore = totalSpecs > 0 ? Math.round((implementedSpecs / totalSpecs) * 100) : 0;
    
    const recommendations = this.generateAlignmentRecommendations(
      specifiedButNotImplemented,
      implementedButNotSpecified,
      alignedFeatures
    );
    
    return {
      specifiedButNotImplemented,
      implementedButNotSpecified,
      alignedFeatures,
      overallAlignmentScore,
      recommendations
    };
  }

  private generateAlignmentRecommendations(
    missing: ImplementationMapping[],
    unspecified: { file: string; functionality: string; suggestedSpecCategory: string; }[],
    aligned: ImplementationMapping[]
  ): string[] {
    const recommendations: string[] = [];
    
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

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
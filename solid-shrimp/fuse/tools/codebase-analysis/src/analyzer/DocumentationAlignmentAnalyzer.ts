import * as fs from 'fs/promises';
import * as path from 'path';
import type { Stats } from 'fs';
import { glob } from 'glob';
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

export class DocumentationAlignmentAnalyzer {
  private rootPath: string;
  private packages: PackageInfo[];

  constructor(packages: PackageInfo[], rootPath: string = process.cwd()) {
    this.packages = packages;
    this.rootPath = rootPath;
  }

  async analyzeDocumentationAlignment(): Promise<DocumentationAlignmentReport> {
    console.log('Analyzing documentation alignment...');

    // Step 1: Discover all documentation files
    const documentationFiles = await this.discoverDocumentationFiles();
    
    // Step 2: Discover all source files
    const sourceFiles = await this.discoverSourceFiles();
    
    // Step 3: Extract implementation references
    const implementationRefs = await this.extractImplementationReferences(sourceFiles);
    
    // Step 4: Analyze alignments between docs and implementations
    const alignments = await this.analyzeAlignments(documentationFiles, implementationRefs);
    
    // Step 5: Identify documentation issues
    const issues = await this.identifyDocumentationIssues(documentationFiles, alignments);
    
    // Step 6: Identify gaps
    const gaps = this.identifyDocumentationGaps(documentationFiles, sourceFiles, alignments);
    
    // Step 7: Generate recommendations
    const recommendations = this.generateRecommendations(alignments, issues, gaps);

    return this.generateReport(documentationFiles, sourceFiles, alignments, issues, gaps, recommendations);
  }

  private async discoverDocumentationFiles(): Promise<DocumentationFile[]> {
    const docPatterns = [
      '**/README.md',
      '**/README.txt',
      '**/CHANGELOG.md',
      '**/CONTRIBUTING.md',
      '**/docs/**/*.md',
      '**/documentation/**/*.md',
      '**/*.md',
      '**/*.txt'
    ];

    const documentationFiles: DocumentationFile[] = [];

    for (const pattern of docPatterns) {
      const files = await glob(pattern, {
        cwd: this.rootPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**', '.git/**']
      });

      for (const file of files) {
        const fullPath = path.join(this.rootPath, file);
        try {
          const docFile = await this.analyzeDocumentationFile(fullPath, file);
          documentationFiles.push(docFile);
        } catch (error) {
          console.warn(`Failed to analyze documentation file ${file}:`, error);
        }
      }
    }

    return documentationFiles;
  }

  private async analyzeDocumentationFile(fullPath: string, relativePath: string): Promise<DocumentationFile> {
    const stats = await fs.stat(fullPath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const name = path.basename(relativePath);
    
    // Determine documentation type
    const type = this.determineDocumentationType(relativePath, content);
    
    // Determine format
    const format = this.determineDocumentationFormat(relativePath, content);
    
    // Extract sections
    const sections = this.extractDocumentationSections(content);
    
    // Extract references to code
    const references = this.extractCodeReferences(content);
    
    // Extract code examples
    const codeExamples = await this.extractCodeExamples(content);

    return {
      path: relativePath,
      name,
      type,
      format,
      lastModified: stats.mtime,
      size: stats.size,
      content,
      sections,
      references,
      codeExamples
    };
  }

  private determineDocumentationType(filePath: string, content: string): DocumentationFile['type'] {
    const fileName = path.basename(filePath).toLowerCase();
    
    if (fileName.includes('readme')) return 'readme';
    if (fileName.includes('changelog')) return 'changelog';
    if (fileName.includes('api') || content.includes('## API') || content.includes('# API')) return 'api';
    if (filePath.includes('/docs/') || filePath.includes('/documentation/')) return 'guide';
    if (filePath.includes('.kiro/specs/')) return 'spec';
    if (content.includes('@param') || content.includes('@returns') || content.includes('/**')) return 'inline';
    
    return 'unknown';
  }

  private determineDocumentationFormat(filePath: string, content: string): DocumentationFile['format'] {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.md') return 'markdown';
    if (ext === '.txt') return 'text';
    if (content.includes('/**') || content.includes('* @')) return 'jsdoc';
    if (ext === '.ts' || ext === '.tsx') return 'typescript';
    
    return 'unknown';
  }

  private extractDocumentationSections(content: string): DocumentationSection[] {
    const sections: DocumentationSection[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        
        // Find the end of this section
        let endLine = lines.length - 1;
        for (let j = i + 1; j < lines.length; j++) {
          const nextHeaderMatch = lines[j].match(/^#{1,6}\s+/);
          if (nextHeaderMatch) {
            endLine = j - 1;
            break;
          }
        }
        
        const sectionContent = lines.slice(i + 1, endLine + 1).join('\n');
        
        sections.push({
          title,
          level,
          content: sectionContent,
          lineStart: i + 1,
          lineEnd: endLine + 1
        });
      }
    }
    
    return sections;
  }

  private extractCodeReferences(content: string): string[] {
    const references: string[] = [];
    
    // Extract file references
    const fileRefs = content.match(/`[^`]*\.(ts|tsx|js|jsx|py|java|cpp|c|h)`/g);
    if (fileRefs) {
      references.push(...fileRefs.map(ref => ref.slice(1, -1)));
    }
    
    // Extract function/class references
    const codeRefs = content.match(/`[A-Za-z_][A-Za-z0-9_]*\([^)]*\)`/g);
    if (codeRefs) {
      references.push(...codeRefs.map(ref => ref.slice(1, -1)));
    }
    
    // Extract import/require statements in docs
    const importRefs = content.match(/import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g);
    if (importRefs) {
      references.push(...importRefs);
    }
    
    return [...new Set(references)];
  }

  private async extractCodeExamples(content: string): Promise<CodeExample[]> {
    const examples: CodeExample[] = [];
    const lines = content.split('\n');
    
    let inCodeBlock = false;
    let currentExample: Partial<CodeExample> | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start of code block
          const language = line.slice(3).trim() || 'unknown';
          currentExample = {
            language,
            code: '',
            lineStart: i + 1,
            lineEnd: i + 1,
            isValid: true,
            errors: []
          };
          inCodeBlock = true;
        } else {
          // End of code block
          if (currentExample) {
            currentExample.lineEnd = i + 1;
            currentExample.code = currentExample.code?.trim() || '';
            
            // Validate code example
            const validation = await this.validateCodeExample(currentExample as CodeExample);
            currentExample.isValid = validation.isValid;
            currentExample.errors = validation.errors;
            
            examples.push(currentExample as CodeExample);
          }
          currentExample = null;
          inCodeBlock = false;
        }
      } else if (inCodeBlock && currentExample) {
        currentExample.code = (currentExample.code || '') + line + '\n';
      }
    }
    
    return examples;
  }

  private async validateCodeExample(example: CodeExample): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Basic syntax validation based on language
    switch (example.language.toLowerCase()) {
      case 'typescript':
      case 'ts':
        if (!this.isValidTypeScript(example.code)) {
          errors.push('Invalid TypeScript syntax');
        }
        break;
      case 'javascript':
      case 'js':
        if (!this.isValidJavaScript(example.code)) {
          errors.push('Invalid JavaScript syntax');
        }
        break;
      case 'json':
        try {
          JSON.parse(example.code);
        } catch {
          errors.push('Invalid JSON syntax');
        }
        break;
    }
    
    // Check for common issues
    if (example.code.includes('TODO') || example.code.includes('FIXME')) {
      errors.push('Contains TODO/FIXME comments');
    }
    
    if (example.code.trim().length === 0) {
      errors.push('Empty code example');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidTypeScript(code: string): boolean {
    // Basic TypeScript syntax validation
    try {
      // Check for basic syntax issues
      if (code.includes('function') && !code.includes('{')) return false;
      if (code.includes('class') && !code.includes('{')) return false;
      if (code.includes('interface') && !code.includes('{')) return false;
      
      // Check for unmatched brackets
      const openBrackets = (code.match(/\{/g) || []).length;
      const closeBrackets = (code.match(/\}/g) || []).length;
      if (openBrackets !== closeBrackets) return false;
      
      return true;
    } catch {
      return false;
    }
  }

  private isValidJavaScript(code: string): boolean {
    // Basic JavaScript syntax validation
    try {
      // Similar to TypeScript but less strict
      const openBrackets = (code.match(/\{/g) || []).length;
      const closeBrackets = (code.match(/\}/g) || []).length;
      if (openBrackets !== closeBrackets) return false;
      
      return true;
    } catch {
      return false;
    }
  }

  private async discoverSourceFiles(): Promise<string[]> {
    const sourcePatterns = [
      'src/**/*.{ts,tsx,js,jsx}',
      'packages/*/src/**/*.{ts,tsx,js,jsx}',
      'apps/*/src/**/*.{ts,tsx,js,jsx}'
    ];

    const sourceFiles: string[] = [];

    for (const pattern of sourcePatterns) {
      const files = await glob(pattern, {
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

  private async extractImplementationReferences(sourceFiles: string[]): Promise<Map<string, ImplementationReference>> {
    const references = new Map<string, ImplementationReference>();

    for (const file of sourceFiles) {
      try {
        const fullPath = path.join(this.rootPath, file);
        const content = await fs.readFile(fullPath, 'utf-8');
        
        const ref: ImplementationReference = {
          sourceFile: file,
          functions: this.extractFunctions(content),
          classes: this.extractClasses(content),
          interfaces: this.extractInterfaces(content),
          exports: this.extractExports(content),
          imports: this.extractImports(content)
        };
        
        references.set(file, ref);
      } catch (error) {
        console.warn(`Failed to analyze source file ${file}:`, error);
      }
    }

    return references;
  }

  private extractFunctions(content: string): string[] {
    const functions: string[] = [];
    
    // Extract function declarations
    const functionMatches = content.match(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)/g);
    if (functionMatches) {
      functions.push(...functionMatches.map(match => {
        const nameMatch = match.match(/function\s+([A-Za-z_][A-Za-z0-9_]*)/);
        return nameMatch ? nameMatch[1] : '';
      }).filter(Boolean));
    }
    
    // Extract arrow functions
    const arrowMatches = content.match(/(?:export\s+)?(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g);
    if (arrowMatches) {
      functions.push(...arrowMatches.map(match => {
        const nameMatch = match.match(/(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)/);
        return nameMatch ? nameMatch[1] : '';
      }).filter(Boolean));
    }
    
    return functions;
  }

  private extractClasses(content: string): string[] {
    const classes: string[] = [];
    
    const classMatches = content.match(/(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/g);
    if (classMatches) {
      classes.push(...classMatches.map(match => {
        const nameMatch = match.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
        return nameMatch ? nameMatch[1] : '';
      }).filter(Boolean));
    }
    
    return classes;
  }

  private extractInterfaces(content: string): string[] {
    const interfaces: string[] = [];
    
    const interfaceMatches = content.match(/(?:export\s+)?interface\s+([A-Za-z_][A-Za-z0-9_]*)/g);
    if (interfaceMatches) {
      interfaces.push(...interfaceMatches.map(match => {
        const nameMatch = match.match(/interface\s+([A-Za-z_][A-Za-z0-9_]*)/);
        return nameMatch ? nameMatch[1] : '';
      }).filter(Boolean));
    }
    
    return interfaces;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    // Extract named exports
    const namedExports = content.match(/export\s*\{\s*([^}]+)\s*\}/g);
    if (namedExports) {
      namedExports.forEach(exportMatch => {
        const names = exportMatch.match(/\{\s*([^}]+)\s*\}/);
        if (names) {
          const exportNames = names[1].split(',').map(name => name.trim().split(' as ')[0]);
          exports.push(...exportNames);
        }
      });
    }
    
    // Extract default exports
    const defaultExports = content.match(/export\s+default\s+([A-Za-z_][A-Za-z0-9_]*)/g);
    if (defaultExports) {
      exports.push(...defaultExports.map(match => {
        const nameMatch = match.match(/default\s+([A-Za-z_][A-Za-z0-9_]*)/);
        return nameMatch ? nameMatch[1] : '';
      }).filter(Boolean));
    }
    
    return exports;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    
    const importMatches = content.match(/import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g);
    if (importMatches) {
      imports.push(...importMatches.map(match => {
        const moduleMatch = match.match(/from\s+['"`]([^'"`]+)['"`]/);
        return moduleMatch ? moduleMatch[1] : '';
      }).filter(Boolean));
    }
    
    return imports;
  }

  private async analyzeAlignments(
    documentationFiles: DocumentationFile[],
    implementationRefs: Map<string, ImplementationReference>
  ): Promise<DocumentationAlignment[]> {
    const alignments: DocumentationAlignment[] = [];

    for (const [sourceFile, implRef] of implementationRefs) {
      // Find related documentation files
      const relatedDocs = this.findRelatedDocumentation(sourceFile, documentationFiles);
      
      if (relatedDocs.length === 0) {
        // No documentation found
        alignments.push({
          documentationFile: '',
          sourceFile,
          alignmentScore: 0,
          alignmentStatus: 'missing',
          issues: [{
            type: 'missing',
            severity: 'high',
            description: `No documentation found for ${sourceFile}`
          }],
          recommendations: [`Create documentation for ${sourceFile}`]
        });
      } else {
        // Analyze alignment with each related doc
        for (const doc of relatedDocs) {
          const alignment = await this.calculateAlignment(doc, implRef);
          alignments.push(alignment);
        }
      }
    }

    return alignments;
  }

  private findRelatedDocumentation(sourceFile: string, documentationFiles: DocumentationFile[]): DocumentationFile[] {
    const related: DocumentationFile[] = [];
    const sourceBaseName = path.basename(sourceFile, path.extname(sourceFile));
    const sourceDir = path.dirname(sourceFile);

    for (const doc of documentationFiles) {
      // Check if doc is in same directory or parent directory
      const docDir = path.dirname(doc.path);
      if (docDir === sourceDir || sourceDir.startsWith(docDir)) {
        related.push(doc);
        continue;
      }

      // Check if doc references the source file
      if (doc.references.some(ref => ref.includes(sourceBaseName) || ref.includes(sourceFile))) {
        related.push(doc);
        continue;
      }

      // Check if doc content mentions the source file
      if (doc.content.includes(sourceBaseName) || doc.content.includes(sourceFile)) {
        related.push(doc);
      }
    }

    return related;
  }

  private async calculateAlignment(doc: DocumentationFile, implRef: ImplementationReference): Promise<DocumentationAlignment> {
    const issues: DocumentationIssue[] = [];
    const recommendations: string[] = [];
    let alignmentScore = 100;

    // Check if documented functions exist in implementation
    const documentedFunctions = this.extractDocumentedFunctions(doc.content);
    for (const func of documentedFunctions) {
      if (!implRef.functions.includes(func)) {
        issues.push({
          type: 'outdated',
          severity: 'medium',
          description: `Function ${func} is documented but not found in implementation`,
          location: { file: doc.path }
        });
        alignmentScore -= 10;
      }
    }

    // Check if implemented functions are documented
    for (const func of implRef.functions) {
      if (!documentedFunctions.includes(func)) {
        issues.push({
          type: 'missing',
          severity: 'medium',
          description: `Function ${func} is implemented but not documented`,
          location: { file: implRef.sourceFile }
        });
        alignmentScore -= 5;
      }
    }

    // Check code examples validity
    for (const example of doc.codeExamples) {
      if (!example.isValid) {
        issues.push({
          type: 'invalid_code',
          severity: 'high',
          description: `Invalid code example: ${example.errors.join(', ')}`,
          location: { file: doc.path, line: example.lineStart }
        });
        alignmentScore -= 15;
      }
    }

    // Check documentation freshness
    const sourceFileStats = await this.getFileStats(implRef.sourceFile);
    if (sourceFileStats && doc.lastModified < sourceFileStats.mtime) {
      issues.push({
        type: 'outdated',
        severity: 'low',
        description: 'Documentation is older than source file',
        location: { file: doc.path }
      });
      alignmentScore -= 5;
    }

    // Generate recommendations
    if (issues.length > 0) {
      recommendations.push(`Update documentation for ${implRef.sourceFile}`);
    }
    if (doc.codeExamples.some(ex => !ex.isValid)) {
      recommendations.push('Fix invalid code examples');
    }

    const alignmentStatus = this.determineAlignmentStatus(alignmentScore);

    return {
      documentationFile: doc.path,
      sourceFile: implRef.sourceFile,
      alignmentScore: Math.max(0, alignmentScore),
      alignmentStatus,
      issues,
      recommendations
    };
  }

  private extractDocumentedFunctions(content: string): string[] {
    const functions: string[] = [];
    
    // Extract function names from markdown code blocks
    const codeBlocks = content.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      for (const block of codeBlocks) {
        const functionMatches = block.match(/(?:function\s+|const\s+)([A-Za-z_][A-Za-z0-9_]*)/g);
        if (functionMatches) {
          functions.push(...functionMatches.map(match => {
            const nameMatch = match.match(/(?:function\s+|const\s+)([A-Za-z_][A-Za-z0-9_]*)/);
            return nameMatch ? nameMatch[1] : '';
          }).filter(Boolean));
        }
      }
    }
    
    // Extract function names from inline code
    const inlineCode = content.match(/`[A-Za-z_][A-Za-z0-9_]*\([^)]*\)`/g);
    if (inlineCode) {
      functions.push(...inlineCode.map(code => {
        const nameMatch = code.match(/`([A-Za-z_][A-Za-z0-9_]*)\(/);
        return nameMatch ? nameMatch[1] : '';
      }).filter(Boolean));
    }
    
    return [...new Set(functions)];
  }

  private async getFileStats(filePath: string): Promise<Stats | null> {
    try {
      const fullPath = path.join(this.rootPath, filePath);
      return await fs.stat(fullPath);
    } catch {
      return null;
    }
  }

  private determineAlignmentStatus(score: number): DocumentationAlignment['alignmentStatus'] {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'fair';
    if (score > 0) return 'poor';
    return 'missing';
  }

  private async identifyDocumentationIssues(
    documentationFiles: DocumentationFile[],
    alignments: DocumentationAlignment[]
  ): Promise<DocumentationIssue[]> {
    const allIssues: DocumentationIssue[] = [];

    // Collect issues from alignments
    for (const alignment of alignments) {
      allIssues.push(...alignment.issues);
    }

    // Additional issue detection
    for (const doc of documentationFiles) {
      // Check for broken links
      const links = doc.content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
      if (links) {
        for (const link of links) {
          const urlMatch = link.match(/\]\(([^)]+)\)/);
          if (urlMatch) {
            const url = urlMatch[1];
            if (url.startsWith('./') || url.startsWith('../')) {
              // Check if local file exists
              const linkedFile = path.resolve(path.dirname(doc.path), url);
              try {
                await fs.access(path.join(this.rootPath, linkedFile));
              } catch {
                allIssues.push({
                  type: 'broken_link',
                  severity: 'medium',
                  description: `Broken link to ${url}`,
                  location: { file: doc.path }
                });
              }
            }
          }
        }
      }

      // Check for empty sections
      for (const section of doc.sections) {
        if (section.content.trim().length === 0) {
          allIssues.push({
            type: 'incomplete',
            severity: 'low',
            description: `Empty section: ${section.title}`,
            location: { file: doc.path, line: section.lineStart, section: section.title }
          });
        }
      }
    }

    return allIssues;
  }

  private identifyDocumentationGaps(
    documentationFiles: DocumentationFile[],
    sourceFiles: string[],
    alignments: DocumentationAlignment[]
  ): DocumentationAlignmentReport['gaps'] {
    const documentedFiles = new Set(alignments.map(a => a.sourceFile));
    const undocumentedFiles = sourceFiles.filter(file => !documentedFiles.has(file));

    const outdatedDocumentation = alignments
      .filter(a => a.issues.some(i => i.type === 'outdated'))
      .map(a => a.documentationFile);

    const referencedFiles = new Set<string>();
    alignments.forEach(a => referencedFiles.add(a.sourceFile));
    
    const orphanedDocumentation = documentationFiles
      .filter(doc => !alignments.some(a => a.documentationFile === doc.path))
      .map(doc => doc.path);

    const brokenCodeExamples = documentationFiles
      .filter(doc => doc.codeExamples.some(ex => !ex.isValid))
      .map(doc => doc.path);

    return {
      undocumentedFiles,
      outdatedDocumentation,
      orphanedDocumentation,
      brokenCodeExamples
    };
  }

  private generateRecommendations(
    alignments: DocumentationAlignment[],
    issues: DocumentationIssue[],
    gaps: DocumentationAlignmentReport['gaps']
  ): string[] {
    const recommendations: string[] = [];

    if (gaps.undocumentedFiles.length > 0) {
      recommendations.push(`Create documentation for ${gaps.undocumentedFiles.length} undocumented source files`);
    }

    if (gaps.outdatedDocumentation.length > 0) {
      recommendations.push(`Update ${gaps.outdatedDocumentation.length} outdated documentation files`);
    }

    if (gaps.brokenCodeExamples.length > 0) {
      recommendations.push(`Fix broken code examples in ${gaps.brokenCodeExamples.length} documentation files`);
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    if (criticalIssues > 0) {
      recommendations.push(`Address ${criticalIssues} critical documentation issues`);
    }

    const highIssues = issues.filter(i => i.severity === 'high').length;
    if (highIssues > 0) {
      recommendations.push(`Fix ${highIssues} high-priority documentation issues`);
    }

    if (gaps.orphanedDocumentation.length > 0) {
      recommendations.push(`Review and clean up ${gaps.orphanedDocumentation.length} orphaned documentation files`);
    }

    return recommendations;
  }

  private generateReport(
    documentationFiles: DocumentationFile[],
    sourceFiles: string[],
    alignments: DocumentationAlignment[],
    issues: DocumentationIssue[],
    gaps: DocumentationAlignmentReport['gaps'],
    recommendations: string[]
  ): DocumentationAlignmentReport {
    const documentedComponents = alignments.filter(a => a.alignmentStatus !== 'missing').length;
    const undocumentedComponents = gaps.undocumentedFiles.length;
    const documentationCoverage = sourceFiles.length > 0 ? 
      Math.round((documentedComponents / sourceFiles.length) * 100) : 0;

    const alignmentDistribution = {
      excellent: alignments.filter(a => a.alignmentStatus === 'excellent').length,
      good: alignments.filter(a => a.alignmentStatus === 'good').length,
      fair: alignments.filter(a => a.alignmentStatus === 'fair').length,
      poor: alignments.filter(a => a.alignmentStatus === 'poor').length,
      missing: alignments.filter(a => a.alignmentStatus === 'missing').length
    };

    const documentationByType = {
      readme: documentationFiles.filter(d => d.type === 'readme').length,
      api: documentationFiles.filter(d => d.type === 'api').length,
      inline: documentationFiles.filter(d => d.type === 'inline').length,
      spec: documentationFiles.filter(d => d.type === 'spec').length,
      guide: documentationFiles.filter(d => d.type === 'guide').length,
      changelog: documentationFiles.filter(d => d.type === 'changelog').length,
      unknown: documentationFiles.filter(d => d.type === 'unknown').length
    };

    return {
      totalDocumentationFiles: documentationFiles.length,
      totalSourceFiles: sourceFiles.length,
      documentedComponents,
      undocumentedComponents,
      documentationCoverage,
      alignmentDistribution,
      documentationByType,
      documentationFiles,
      alignments,
      issues,
      gaps,
      recommendations
    };
  }
}
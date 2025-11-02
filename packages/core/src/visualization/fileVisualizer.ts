import * as fs from 'fs';
import * as path from 'path';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
  metadata?: Record<string, any>;
}

export interface VisualizationConfig {
  maxDepth: number;
  includeHidden: boolean;
  filterExtensions?: string[];
  groupByType: boolean;
}

export class FileVisualizer {
  constructor(private config: VisualizationConfig) {}

  async generateFileTree(rootPath: string): Promise<FileNode> {
    try {
      const stats = await fs.promises.stat(rootPath);
      const node: FileNode = {
        id: rootPath,
        name: path.basename(rootPath),
        type: stats.isDirectory() ? 'directory' : 'file',
        path: rootPath,
        size: stats.isFile() ? stats.size : undefined
      };

      if (stats.isDirectory() && this.shouldIncludeDirectory(rootPath)) {
        const children = await this.getDirectoryChildren(rootPath);
        node.children = children;
      }

      return node;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate file tree: ${errorMessage}`);
    }
  }

  async generateDependencyGraph(filePath: string): Promise<{ nodes: any[], edges: any[], message?: string }> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const dependencies = this.parseDependencies(content);
      const nodes = [{ id: filePath, label: path.basename(filePath) }];
      const edges = dependencies.map(dep => ({
        from: filePath,
        to: dep,
      }));

      return {
        nodes,
        edges,
        message: 'Dependency graph generated'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        nodes: [],
        edges: [],
        message: `Dependency graph generation failed: ${errorMessage}`
      };
    }
  }

  async generateCodeMetrics(filePath: string): Promise<{ linesOfCode: number, complexity: number, dependencies: number, message?: string }> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      return {
        linesOfCode: lines.length,
        complexity: this.calculateComplexity(content),
        dependencies: this.countDependencies(content),
        message: 'Code metrics calculated'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        linesOfCode: 0,
        complexity: 0,
        dependencies: 0,
        message: `Code metrics calculation failed: ${errorMessage}`
      };
    }
  }

  async exportVisualization(data: any, format: string): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'svg':
        return this.generateSVG(data);
      case 'png':
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async getDirectoryChildren(dirPath: string): Promise<FileNode[]> {
    try {
      const entries = await fs.promises.readdir(dirPath);
      const children: FileNode[] = [];

      for (const entry of entries) {
        if (!this.config.includeHidden && entry.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(dirPath, entry);
        const child = await this.generateFileTree(fullPath);
        children.push(child);
      }

      return this.config.groupByType ? this.groupByType(children) : children;
    } catch {
      return [];
    }
  }

  private shouldIncludeDirectory(dirPath: string): boolean {
    const basename = path.basename(dirPath);
    return this.config.includeHidden || !basename.startsWith('.');
  }

  private groupByType(nodes: FileNode[]): FileNode[] {
    const directories = nodes.filter(node => node.type === 'directory');
    const files = nodes.filter(node => node.type === 'file');
    return [...directories, ...files];
  }

  private calculateComplexity(content: string): number {
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'try'];
    let complexity = 1;

    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private countDependencies(content: string): number {
    return this.parseDependencies(content).length;
  }

  private parseDependencies(content: string): string[] {
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const dependencies = new Set<string>();
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.add(match[1]);
    }
    while ((match = requireRegex.exec(content)) !== null) {
      dependencies.add(match[1]);
    }
    
    return Array.from(dependencies);
  }

  private generateSVG(data: any): string {
    return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16">
        Visualization Data
      </text>
      <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="12">
        ${JSON.stringify(data).substring(0, 50)}...
      </text>
    </svg>`;
  }
}

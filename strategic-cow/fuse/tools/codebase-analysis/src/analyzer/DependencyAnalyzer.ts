import * as fs from 'fs/promises';
import * as path from 'path';
import { FileInfo, PackageInfo } from '../scanner/FileSystemScanner';

export interface DependencyInfo {
  name: string;
  version?: string;
  type: DependencyType;
  source: string; // file or package.json where dependency is found
  isInternal: boolean; // whether it's an internal package
  isUsed: boolean; // whether it's actually imported in code
}

export interface ImportInfo {
  importPath: string;
  importedItems: string[];
  filePath: string;
  lineNumber: number;
  isTypeOnly: boolean;
  isDynamic: boolean;
}

export interface ExportInfo {
  exportedItems: string[];
  filePath: string;
  isDefault: boolean;
  isReExport: boolean;
}

export interface CircularDependency {
  cycle: string[];
  severity: 'warning' | 'error';
  description: string;
}

export interface DependencyConflict {
  packageName: string;
  versions: { version: string; usedBy: string[] }[];
  severity: 'warning' | 'error';
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  circularDependencies: CircularDependency[];
  conflicts: DependencyConflict[];
  unusedDependencies: string[];
  missingDependencies: string[];
}

export interface DependencyNode {
  id: string;
  name: string;
  type: 'package' | 'app' | 'external';
  version?: string;
  path?: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: DependencyType;
  weight: number; // number of imports
}

export enum DependencyType {
  PRODUCTION = 'dependencies',
  DEVELOPMENT = 'devDependencies',
  PEER = 'peerDependencies',
  OPTIONAL = 'optionalDependencies',
  IMPORT = 'import',
  REQUIRE = 'require'
}

export class DependencyAnalyzer {
  private packages: PackageInfo[];
  private internalPackageNames: Set<string>;

  constructor(packages: PackageInfo[]) {
    this.packages = packages;
    this.internalPackageNames = new Set(
      packages.map(pkg => pkg.packageJson?.name || pkg.name)
    );
  }

  async analyzeDependencies(): Promise<DependencyGraph> {
    console.log('Starting dependency analysis...');
    
    const nodes = await this.buildDependencyNodes();
    const edges = await this.buildDependencyEdges();
    const circularDependencies = this.detectCircularDependencies(nodes, edges);
    const conflicts = this.detectVersionConflicts();
    const unusedDependencies = await this.findUnusedDependencies();
    const missingDependencies = await this.findMissingDependencies();

    return {
      nodes,
      edges,
      circularDependencies,
      conflicts,
      unusedDependencies,
      missingDependencies
    };
  }

  private async buildDependencyNodes(): Promise<DependencyNode[]> {
    const nodes: DependencyNode[] = [];
    const externalDeps = new Set<string>();

    // Add internal packages as nodes
    for (const pkg of this.packages) {
      nodes.push({
        id: pkg.packageJson?.name || pkg.name,
        name: pkg.packageJson?.name || pkg.name,
        type: pkg.type === 'app' ? 'app' : 'package',
        version: pkg.packageJson?.version,
        path: pkg.path
      });

      // Collect external dependencies
      if (pkg.packageJson) {
        const deps = {
          ...pkg.packageJson.dependencies,
          ...pkg.packageJson.devDependencies,
          ...pkg.packageJson.peerDependencies,
          ...pkg.packageJson.optionalDependencies
        };

        for (const depName of Object.keys(deps)) {
          if (!this.internalPackageNames.has(depName)) {
            externalDeps.add(depName);
          }
        }
      }
    }

    // Add external dependencies as nodes
    for (const depName of externalDeps) {
      nodes.push({
        id: depName,
        name: depName,
        type: 'external'
      });
    }

    return nodes;
  }

  private async buildDependencyEdges(): Promise<DependencyEdge[]> {
    const edges: DependencyEdge[] = [];

    for (const pkg of this.packages) {
      const packageName = pkg.packageJson?.name || pkg.name;

      // Add package.json dependencies as edges
      if (pkg.packageJson) {
        const depTypes = [
          { deps: pkg.packageJson.dependencies, type: DependencyType.PRODUCTION },
          { deps: pkg.packageJson.devDependencies, type: DependencyType.DEVELOPMENT },
          { deps: pkg.packageJson.peerDependencies, type: DependencyType.PEER },
          { deps: pkg.packageJson.optionalDependencies, type: DependencyType.OPTIONAL }
        ];

        for (const { deps, type } of depTypes) {
          if (deps) {
            for (const depName of Object.keys(deps)) {
              edges.push({
                from: packageName,
                to: depName,
                type,
                weight: 1
              });
            }
          }
        }
      }

      // Add import-based dependencies as edges
      const importEdges = await this.analyzeImports(pkg);
      edges.push(...importEdges);
    }

    return edges;
  }

  private async analyzeImports(pkg: PackageInfo): Promise<DependencyEdge[]> {
    const edges: DependencyEdge[] = [];
    const importCounts = new Map<string, number>();

    for (const file of pkg.sourceFiles) {
      const imports = await this.extractImports(file);
      
      for (const importInfo of imports) {
        const resolvedDep = this.resolveImportPath(importInfo.importPath, pkg);
        if (resolvedDep) {
          const currentCount = importCounts.get(resolvedDep) || 0;
          importCounts.set(resolvedDep, currentCount + 1);
        }
      }
    }

    const packageName = pkg.packageJson?.name || pkg.name;
    for (const [depName, count] of importCounts) {
      edges.push({
        from: packageName,
        to: depName,
        type: DependencyType.IMPORT,
        weight: count
      });
    }

    return edges;
  }

  private async extractImports(file: FileInfo): Promise<ImportInfo[]> {
    try {
      const content = await fs.readFile(file.path, 'utf-8');
      const imports: ImportInfo[] = [];
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Match ES6 imports
        const es6ImportMatch = line.match(/^import\s+(?:type\s+)?(?:(.+?)\s+from\s+)?['"`]([^'"`]+)['"`]/);
        if (es6ImportMatch) {
          const [, importedItems, importPath] = es6ImportMatch;
          imports.push({
            importPath,
            importedItems: importedItems ? this.parseImportedItems(importedItems) : [],
            filePath: file.path,
            lineNumber: i + 1,
            isTypeOnly: line.includes('import type'),
            isDynamic: false
          });
        }

        // Match CommonJS requires
        const requireMatch = line.match(/require\(['"`]([^'"`]+)['"`]\)/);
        if (requireMatch) {
          const [, importPath] = requireMatch;
          imports.push({
            importPath,
            importedItems: [],
            filePath: file.path,
            lineNumber: i + 1,
            isTypeOnly: false,
            isDynamic: false
          });
        }

        // Match dynamic imports
        const dynamicImportMatch = line.match(/import\(['"`]([^'"`]+)['"`]\)/);
        if (dynamicImportMatch) {
          const [, importPath] = dynamicImportMatch;
          imports.push({
            importPath,
            importedItems: [],
            filePath: file.path,
            lineNumber: i + 1,
            isTypeOnly: false,
            isDynamic: true
          });
        }
      }

      return imports;
    } catch (error) {
      console.warn(`Failed to analyze imports in ${file.path}:`, error);
      return [];
    }
  }

  private parseImportedItems(importClause: string): string[] {
    // Simple parsing of imported items - could be enhanced
    const items: string[] = [];
    
    // Handle default imports
    const defaultMatch = importClause.match(/^(\w+)/);
    if (defaultMatch) {
      items.push(defaultMatch[1]);
    }

    // Handle named imports
    const namedMatch = importClause.match(/\{([^}]+)\}/);
    if (namedMatch) {
      const namedItems = namedMatch[1]
        .split(',')
        .map(item => item.trim().split(' as ')[0].trim())
        .filter(item => item);
      items.push(...namedItems);
    }

    // Handle namespace imports
    const namespaceMatch = importClause.match(/\*\s+as\s+(\w+)/);
    if (namespaceMatch) {
      items.push(namespaceMatch[1]);
    }

    return items;
  }

  private resolveImportPath(importPath: string, fromPackage: PackageInfo): string | null {
    // Resolve relative imports to internal packages
    if (importPath.startsWith('.')) {
      return null; // Relative imports within the same package
    }

    // Check if it's an internal package
    if (this.internalPackageNames.has(importPath)) {
      return importPath;
    }

    // Check for scoped internal packages
    const scopedMatch = importPath.match(/^(@[^/]+\/[^/]+)/);
    if (scopedMatch && this.internalPackageNames.has(scopedMatch[1])) {
      return scopedMatch[1];
    }

    // Extract package name from path (e.g., 'lodash/get' -> 'lodash')
    const packageName = importPath.split('/')[0];
    if (packageName.startsWith('@')) {
      const scopedName = importPath.split('/').slice(0, 2).join('/');
      return scopedName;
    }

    return packageName;
  }

  private detectCircularDependencies(nodes: DependencyNode[], edges: DependencyEdge[]): CircularDependency[] {
    const circularDeps: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const adjacencyList = new Map<string, string[]>();

    // Build adjacency list
    for (const edge of edges) {
      if (!adjacencyList.has(edge.from)) {
        adjacencyList.set(edge.from, []);
      }
      adjacencyList.get(edge.from)!.push(edge.to);
    }

    // DFS to detect cycles
    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          const cycle = path.slice(cycleStart);
          cycle.push(neighbor); // Complete the cycle

          circularDeps.push({
            cycle,
            severity: this.isInternalCycle(cycle) ? 'error' : 'warning',
            description: `Circular dependency detected: ${cycle.join(' -> ')}`
          });
        }
      }

      recursionStack.delete(node);
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }

    return circularDeps;
  }

  private isInternalCycle(cycle: string[]): boolean {
    return cycle.every(pkg => this.internalPackageNames.has(pkg));
  }

  private detectVersionConflicts(): DependencyConflict[] {
    const conflicts: DependencyConflict[] = [];
    const versionMap = new Map<string, Map<string, string[]>>();

    // Collect all dependency versions
    for (const pkg of this.packages) {
      if (!pkg.packageJson) continue;

      const packageName = pkg.packageJson.name || pkg.name;
      const allDeps = {
        ...pkg.packageJson.dependencies,
        ...pkg.packageJson.devDependencies,
        ...pkg.packageJson.peerDependencies,
        ...pkg.packageJson.optionalDependencies
      };

      for (const [depName, version] of Object.entries(allDeps)) {
        if (!versionMap.has(depName)) {
          versionMap.set(depName, new Map());
        }
        
        const depVersions = versionMap.get(depName)!;
        if (!depVersions.has(version as string)) {
          depVersions.set(version as string, []);
        }
        depVersions.get(version as string)!.push(packageName);
      }
    }

    // Find conflicts
    for (const [depName, versions] of versionMap) {
      if (versions.size > 1) {
        const versionArray = Array.from(versions.entries()).map(([version, usedBy]) => ({
          version,
          usedBy
        }));

        conflicts.push({
          packageName: depName,
          versions: versionArray,
          severity: this.internalPackageNames.has(depName) ? 'error' : 'warning'
        });
      }
    }

    return conflicts;
  }

  private async findUnusedDependencies(): Promise<string[]> {
    const unused: string[] = [];
    
    for (const pkg of this.packages) {
      if (!pkg.packageJson?.dependencies) continue;

      const declaredDeps = Object.keys(pkg.packageJson.dependencies);
      const usedDeps = new Set<string>();

      // Analyze imports to find actually used dependencies
      for (const file of pkg.sourceFiles) {
        const imports = await this.extractImports(file);
        for (const importInfo of imports) {
          const resolvedDep = this.resolveImportPath(importInfo.importPath, pkg);
          if (resolvedDep && declaredDeps.includes(resolvedDep)) {
            usedDeps.add(resolvedDep);
          }
        }
      }

      // Find unused dependencies
      for (const dep of declaredDeps) {
        if (!usedDeps.has(dep) && !this.internalPackageNames.has(dep)) {
          unused.push(`${pkg.packageJson.name || pkg.name}:${dep}`);
        }
      }
    }

    return unused;
  }

  private async findMissingDependencies(): Promise<string[]> {
    const missing: string[] = [];

    for (const pkg of this.packages) {
      const declaredDeps = new Set([
        ...Object.keys(pkg.packageJson?.dependencies || {}),
        ...Object.keys(pkg.packageJson?.devDependencies || {}),
        ...Object.keys(pkg.packageJson?.peerDependencies || {}),
        ...Object.keys(pkg.packageJson?.optionalDependencies || {})
      ]);

      const usedDeps = new Set<string>();

      // Analyze imports to find used dependencies
      for (const file of pkg.sourceFiles) {
        const imports = await this.extractImports(file);
        for (const importInfo of imports) {
          const resolvedDep = this.resolveImportPath(importInfo.importPath, pkg);
          if (resolvedDep && !this.internalPackageNames.has(resolvedDep)) {
            usedDeps.add(resolvedDep);
          }
        }
      }

      // Find missing dependencies
      for (const dep of usedDeps) {
        if (!declaredDeps.has(dep)) {
          missing.push(`${pkg.packageJson?.name || pkg.name}:${dep}`);
        }
      }
    }

    return missing;
  }
}
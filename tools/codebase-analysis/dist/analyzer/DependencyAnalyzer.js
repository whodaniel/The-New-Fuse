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
exports.DependencyAnalyzer = exports.DependencyType = void 0;
const fs = __importStar(require("fs/promises"));
var DependencyType;
(function (DependencyType) {
    DependencyType["PRODUCTION"] = "dependencies";
    DependencyType["DEVELOPMENT"] = "devDependencies";
    DependencyType["PEER"] = "peerDependencies";
    DependencyType["OPTIONAL"] = "optionalDependencies";
    DependencyType["IMPORT"] = "import";
    DependencyType["REQUIRE"] = "require";
})(DependencyType || (exports.DependencyType = DependencyType = {}));
class DependencyAnalyzer {
    constructor(packages) {
        this.packages = packages;
        this.internalPackageNames = new Set(packages.map(pkg => pkg.packageJson?.name || pkg.name));
    }
    async analyzeDependencies() {
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
    async buildDependencyNodes() {
        const nodes = [];
        const externalDeps = new Set();
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
    async buildDependencyEdges() {
        const edges = [];
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
    async analyzeImports(pkg) {
        const edges = [];
        const importCounts = new Map();
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
    async extractImports(file) {
        try {
            const content = await fs.readFile(file.path, 'utf-8');
            const imports = [];
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
        }
        catch (error) {
            console.warn(`Failed to analyze imports in ${file.path}:`, error);
            return [];
        }
    }
    parseImportedItems(importClause) {
        // Simple parsing of imported items - could be enhanced
        const items = [];
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
    resolveImportPath(importPath, fromPackage) {
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
    detectCircularDependencies(nodes, edges) {
        const circularDeps = [];
        const visited = new Set();
        const recursionStack = new Set();
        const adjacencyList = new Map();
        // Build adjacency list
        for (const edge of edges) {
            if (!adjacencyList.has(edge.from)) {
                adjacencyList.set(edge.from, []);
            }
            adjacencyList.get(edge.from).push(edge.to);
        }
        // DFS to detect cycles
        const dfs = (node, path) => {
            visited.add(node);
            recursionStack.add(node);
            path.push(node);
            const neighbors = adjacencyList.get(node) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor, [...path]);
                }
                else if (recursionStack.has(neighbor)) {
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
    isInternalCycle(cycle) {
        return cycle.every(pkg => this.internalPackageNames.has(pkg));
    }
    detectVersionConflicts() {
        const conflicts = [];
        const versionMap = new Map();
        // Collect all dependency versions
        for (const pkg of this.packages) {
            if (!pkg.packageJson)
                continue;
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
                const depVersions = versionMap.get(depName);
                if (!depVersions.has(version)) {
                    depVersions.set(version, []);
                }
                depVersions.get(version).push(packageName);
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
    async findUnusedDependencies() {
        const unused = [];
        for (const pkg of this.packages) {
            if (!pkg.packageJson?.dependencies)
                continue;
            const declaredDeps = Object.keys(pkg.packageJson.dependencies);
            const usedDeps = new Set();
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
    async findMissingDependencies() {
        const missing = [];
        for (const pkg of this.packages) {
            const declaredDeps = new Set([
                ...Object.keys(pkg.packageJson?.dependencies || {}),
                ...Object.keys(pkg.packageJson?.devDependencies || {}),
                ...Object.keys(pkg.packageJson?.peerDependencies || {}),
                ...Object.keys(pkg.packageJson?.optionalDependencies || {})
            ]);
            const usedDeps = new Set();
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
exports.DependencyAnalyzer = DependencyAnalyzer;
//# sourceMappingURL=DependencyAnalyzer.js.map
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ApiClient } from './ApiClient';
import { ConfigurationManager } from '../config/ConfigurationManager';

export interface WorkspaceIndex {
    workspacePath: string;
    projectName: string;
    files: WorkspaceFile[];
    structure: ProjectStructure;
    lastIndexed: Date;
    gitInfo?: GitInfo;
    dependencies?: ProjectDependencies;
}

export interface WorkspaceFile {
    path: string;
    relativePath: string;
    language: string;
    size: number;
    lastModified: Date;
    analysis?: FileAnalysis;
}

export interface ProjectStructure {
    root: string;
    src: string[];
    tests: string[];
    config: string[];
    docs: string[];
    assets: string[];
    scripts: string[];
}

export interface GitInfo {
    branch: string;
    commit: string;
    status: 'clean' | 'dirty' | 'untracked';
    lastCommit: Date;
    contributors: GitContributor[];
}

export interface GitContributor {
    name: string;
    email: string;
    commits: number;
    lastCommit: Date;
}

export interface ProjectDependencies {
    npm?: PackageInfo;
    python?: PythonInfo;
    java?: JavaInfo;
    dotnet?: DotNetInfo;
    go?: GoInfo;
    rust?: RustInfo;
}

export interface PackageInfo {
    name: string;
    version: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
}

export interface FileAnalysis {
    complexity: number;
    linesOfCode: number;
    functions: number;
    classes: number;
    imports: string[];
    exports: string[];
}

export interface PythonInfo {
    requirements: string[];
    setupPy?: any;
    pyprojectToml?: any;
}

export interface JavaInfo {
    pomXml?: any;
    buildGradle?: any;
}

export interface DotNetInfo {
    projectFiles: string[];
}

export interface GoInfo {
    goMod?: any;
    modules: string[];
}

export interface RustInfo {
    cargoToml?: any;
}

export class WorkspaceIntegrationService {
    private apiClient: ApiClient;
    private configManager: ConfigurationManager;
    private workspaceCache = new Map<string, WorkspaceIndex>();
    private fileWatcher?: vscode.FileSystemWatcher;
    private gitExtension?: any;

    constructor(apiClient: ApiClient, configManager: ConfigurationManager) {
        this.apiClient = apiClient;
        this.configManager = configManager;
        this.initializeGitIntegration();
    }

    /**
     * Initialize workspace integration for current workspace
     */
    async initializeWorkspace(): Promise<WorkspaceIndex | null> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return null;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const projectName = path.basename(workspaceRoot);

        // Check cache first
        const cached = this.workspaceCache.get(workspaceRoot);
        if (cached && this.isCacheValid(cached)) {
            return cached;
        }

        try {
            // Create comprehensive workspace index
            const workspaceIndex: WorkspaceIndex = {
                workspacePath: workspaceRoot,
                projectName,
                files: [],
                structure: await this.analyzeProjectStructure(workspaceRoot),
                lastIndexed: new Date(),
                gitInfo: await this.getGitInfo(workspaceRoot),
                dependencies: await this.analyzeDependencies(workspaceRoot)
            };

            // Index all code files
            await this.indexWorkspaceFiles(workspaceIndex);

            // Cache the result
            this.workspaceCache.set(workspaceRoot, workspaceIndex);

            // Setup file watcher for real-time updates
            this.setupFileWatcher(workspaceRoot);

            return workspaceIndex;
        } catch (error) {
            console.error('Error initializing workspace:', error);
            return null;
        }
    }

    /**
     * Search across workspace with AI assistance
     */
    async searchWorkspace(query: string, options?: {
        fileTypes?: string[];
        includePatterns?: string[];
        excludePatterns?: string[];
        useAI?: boolean;
    }): Promise<SearchResult[]> {
        const workspace = await this.initializeWorkspace();
        if (!workspace) {
            return [];
        }

        try {
            // Get search results from backend
            const response = await this.apiClient.axiosInstance.post('/workspace/search', {
                workspacePath: workspace.workspacePath,
                query,
                options: options || {},
                context: {
                    projectStructure: workspace.structure,
                    gitInfo: workspace.gitInfo,
                    dependencies: workspace.dependencies
                }
            });

            return response.data.results || [];
        } catch (error) {
            console.error('Error searching workspace:', error);
            return [];
        }
    }

    /**
     * Get workspace context for AI tasks
     */
    async getWorkspaceContext(): Promise<WorkspaceContext> {
        const workspace = await this.initializeWorkspace();
        if (!workspace) {
            throw new Error('No workspace available');
        }

        return {
            workspace: workspace,
            recentFiles: await this.getRecentFiles(),
            activeFile: vscode.window.activeTextEditor?.document.fileName,
            gitStatus: await this.getGitStatus(),
            projectHealth: await this.assessProjectHealth(workspace)
        };
    }

    /**
     * Analyze project structure and organization
     */
    private async analyzeProjectStructure(workspaceRoot: string): Promise<ProjectStructure> {
        const structure: ProjectStructure = {
            root: workspaceRoot,
            src: [],
            tests: [],
            config: [],
            docs: [],
            assets: [],
            scripts: []
        };

        try {
            const entries = fs.readdirSync(workspaceRoot, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    this.categorizeDirectory(entry.name, structure);
                } else if (entry.isFile()) {
                    this.categorizeFile(entry.name, structure);
                }
            }
        } catch (error) {
            console.error('Error analyzing project structure:', error);
        }

        return structure;
    }

    /**
     * Index all relevant files in workspace
     */
    private async indexWorkspaceFiles(workspaceIndex: WorkspaceIndex): Promise<void> {
        const patterns = [
            '**/*.{ts,tsx,js,jsx,py,java,cs,cpp,c,go,rs,php,rb,swift,kt,scala}',
            '**/package.json',
            '**/requirements.txt',
            '**/Cargo.toml',
            '**/go.mod',
            '**/*.md',
            '**/*.yml',
            '**/*.yaml'
        ];

        const files = await vscode.workspace.findFiles(
            `{${patterns.join(',')}}`,
            '**/node_modules/**',
            1000
        );

        for (const file of files) {
            try {
                const stat = fs.statSync(file.fsPath);
                const relativePath = path.relative(workspaceIndex.workspacePath, file.fsPath);

                const workspaceFile: WorkspaceFile = {
                    path: file.fsPath,
                    relativePath,
                    language: this.getLanguageFromPath(file.fsPath),
                    size: stat.size,
                    lastModified: stat.mtime
                };

                workspaceIndex.files.push(workspaceFile);
            } catch (error) {
                console.error(`Error indexing file ${file.fsPath}:`, error);
            }
        }
    }

    /**
     * Get Git information for workspace
     */
    private async getGitInfo(workspaceRoot: string): Promise<GitInfo | undefined> {
        if (!this.gitExtension) {
            return undefined;
        }

        try {
            const git = this.gitExtension.exports.getAPI(1);
            const repo = git.repositories.find((r: any) =>
                r.rootUri.fsPath === workspaceRoot
            );

            if (!repo) {
                return undefined;
            }

            const branch = await repo.getCurrentBranch();
            const commits = await repo.log({ maxEntries: 10 });
            const status = await repo.status();

            return {
                branch: branch.name || 'unknown',
                commit: commits[0]?.hash || 'unknown',
                status: status.workingTreeChanges.length > 0 ? 'dirty' : 'clean',
                lastCommit: commits[0]?.date || new Date(),
                contributors: [] // Would need additional processing
            };
        } catch (error) {
            console.error('Error getting Git info:', error);
            return undefined;
        }
    }

    /**
     * Analyze project dependencies
     */
    private async analyzeDependencies(workspaceRoot: string): Promise<ProjectDependencies> {
        const dependencies: ProjectDependencies = {};

        // Check for package.json
        const packageJsonPath = path.join(workspaceRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                dependencies.npm = {
                    name: packageJson.name,
                    version: packageJson.version,
                    dependencies: packageJson.dependencies || {},
                    devDependencies: packageJson.devDependencies || {},
                    scripts: packageJson.scripts || {}
                };
            } catch (error) {
                console.error('Error reading package.json:', error);
            }
        }

        // Check for Python requirements
        const requirementsPath = path.join(workspaceRoot, 'requirements.txt');
        if (fs.existsSync(requirementsPath)) {
            try {
                const requirements = fs.readFileSync(requirementsPath, 'utf8')
                    .split('\n')
                    .filter((line: string) => line.trim() && !line.startsWith('#'));
                dependencies.python = { requirements };
            } catch (error) {
                console.error('Error reading requirements.txt:', error);
            }
        }

        return dependencies;
    }

    /**
     * Setup file system watcher for real-time updates
     */
    private setupFileWatcher(workspaceRoot: string): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }

        const pattern = new vscode.RelativePattern(workspaceRoot, '**/*.{ts,js,tsx,jsx,py,java,cs,cpp,c,go,rs,php,rb,swift,kt,scala}');
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        this.fileWatcher.onDidChange(async (uri: vscode.Uri) => {
            await this.updateFileIndex(uri.fsPath);
        });

        this.fileWatcher.onDidCreate(async (uri: vscode.Uri) => {
            await this.addFileToIndex(uri.fsPath);
        });

        this.fileWatcher.onDidDelete(async (uri: vscode.Uri) => {
            await this.removeFileFromIndex(uri.fsPath);
        });
    }

    /**
     * Get recent files from workspace
     */
    private async getRecentFiles(): Promise<string[]> {
        const workspace = await this.initializeWorkspace();
        if (!workspace) {
            return [];
        }

        return workspace.files
            .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
            .slice(0, 10)
            .map(file => file.path);
    }

    /**
     * Get current Git status
     */
    private async getGitStatus(): Promise<any> {
        const workspace = await this.initializeWorkspace();
        if (!workspace?.gitInfo) {
            return null;
        }

        return workspace.gitInfo;
    }

    /**
     * Assess overall project health
     */
    private async assessProjectHealth(workspace: WorkspaceIndex): Promise<ProjectHealth> {
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Check for common project files
        if (!workspace.files.some(f => f.relativePath === 'package.json' || f.relativePath === 'requirements.txt')) {
            issues.push('No dependency management file found');
            recommendations.push('Add package.json or requirements.txt for dependency management');
        }

        // Check for tests
        if (workspace.structure.tests.length === 0) {
            issues.push('No test directory found');
            recommendations.push('Consider adding a tests directory with test files');
        }

        // Check for documentation
        if (workspace.structure.docs.length === 0) {
            issues.push('No documentation directory found');
            recommendations.push('Consider adding a docs directory with README.md');
        }

        // Check Git status
        if (workspace.gitInfo?.status === 'dirty') {
            issues.push('Working directory has uncommitted changes');
            recommendations.push('Commit changes or stash them for a clean working state');
        }

        return {
            score: Math.max(0, 100 - (issues.length * 10)),
            issues,
            recommendations,
            lastAssessed: new Date()
        };
    }

    /**
     * Update file index when file changes
     */
    private async updateFileIndex(filePath: string): Promise<void> {
        const workspace = await this.initializeWorkspace();
        if (!workspace) return;

        const relativePath = path.relative(workspace.workspacePath, filePath);
        const existingFile = workspace.files.find(f => f.relativePath === relativePath);

        if (existingFile) {
            try {
                const stat = fs.statSync(filePath);
                existingFile.lastModified = stat.mtime;
                existingFile.size = stat.size;
            } catch (error) {
                console.error('Error updating file index:', error);
            }
        }
    }

    /**
     * Add new file to index
     */
    private async addFileToIndex(filePath: string): Promise<void> {
        const workspace = await this.initializeWorkspace();
        if (!workspace) return;

        try {
            const stat = fs.statSync(filePath);
            const relativePath = path.relative(workspace.workspacePath, filePath);

            const workspaceFile: WorkspaceFile = {
                path: filePath,
                relativePath,
                language: this.getLanguageFromPath(filePath),
                size: stat.size,
                lastModified: stat.mtime
            };

            workspace.files.push(workspaceFile);
        } catch (error) {
            console.error('Error adding file to index:', error);
        }
    }

    /**
     * Remove file from index
     */
    private async removeFileFromIndex(filePath: string): Promise<void> {
        const workspace = await this.initializeWorkspace();
        if (!workspace) return;

        const relativePath = path.relative(workspace.workspacePath, filePath);
        workspace.files = workspace.files.filter(f => f.relativePath !== relativePath);
    }

    /**
     * Initialize Git integration
     */
    private async initializeGitIntegration(): Promise<void> {
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        if (gitExtension) {
            this.gitExtension = await gitExtension.activate();
        }
    }

    /**
     * Helper methods
     */
    private categorizeDirectory(dirName: string, structure: ProjectStructure): void {
        const lowerName = dirName.toLowerCase();
        if (['src', 'source', 'lib', 'app'].includes(lowerName)) {
            structure.src.push(dirName);
        } else if (['test', 'tests', 'spec', '__tests__'].includes(lowerName)) {
            structure.tests.push(dirName);
        } else if (['doc', 'docs', 'documentation'].includes(lowerName)) {
            structure.docs.push(dirName);
        } else if (['config', 'configs', 'settings'].includes(lowerName)) {
            structure.config.push(dirName);
        } else if (['asset', 'assets', 'static', 'public'].includes(lowerName)) {
            structure.assets.push(dirName);
        } else if (['script', 'scripts', 'tools', 'bin'].includes(lowerName)) {
            structure.scripts.push(dirName);
        }
    }

    private categorizeFile(fileName: string, structure: ProjectStructure): void {
        const lowerName = fileName.toLowerCase();
        if (['readme.md', 'package.json', 'requirements.txt', 'cargo.toml', 'go.mod'].includes(lowerName)) {
            // These are handled separately in dependencies analysis
        }
    }

    private getLanguageFromPath(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const languageMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.cs': 'csharp',
            '.cpp': 'cpp',
            '.c': 'c',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.md': 'markdown',
            '.yml': 'yaml',
            '.yaml': 'yaml',
            '.json': 'json'
        };

        return languageMap[ext] || 'plaintext';
    }

    private isCacheValid(workspace: WorkspaceIndex): boolean {
        const cacheAge = Date.now() - workspace.lastIndexed.getTime();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        return cacheAge < maxAge;
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
        this.workspaceCache.clear();
    }
}

export interface SearchResult {
    file: string;
    line: number;
    column: number;
    content: string;
    relevance: number;
    context?: string;
}

export interface WorkspaceContext {
    workspace: WorkspaceIndex;
    recentFiles: string[];
    activeFile?: string;
    gitStatus?: GitInfo;
    projectHealth: ProjectHealth;
}

export interface ProjectHealth {
    score: number;
    issues: string[];
    recommendations: string[];
    lastAssessed: Date;
}
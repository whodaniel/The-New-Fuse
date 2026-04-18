"use strict";
/**
 * WorkflowFetcher
 * Fetches n8n workflows from GitHub repositories
 */
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
exports.WorkflowFetcher = void 0;
const fs = __importStar(require("fs-extra"));
const glob_1 = require("glob");
const path = __importStar(require("path"));
const simple_git_1 = require("simple-git");
const WorkflowCategorizer_js_1 = require("../categorizer/WorkflowCategorizer.js");
const WorkflowParser_js_1 = require("../parser/WorkflowParser.js");
class WorkflowFetcher {
    constructor(cacheDir) {
        this.repositories = [
            {
                source: 'Zie619/n8n-workflows',
                url: 'https://github.com/Zie619/n8n-workflows.git',
                branch: 'main',
                workflowPaths: ['**/*.json'],
            },
            {
                source: 'enescingoz/awesome-n8n-templates',
                url: 'https://github.com/enescingoz/awesome-n8n-templates.git',
                branch: 'main',
                workflowPaths: ['**/*.json', 'templates/**/*.json'],
            },
            {
                source: 'Danitilahun/n8n-workflow-templates',
                url: 'https://github.com/Danitilahun/n8n-workflow-templates.git',
                branch: 'main',
                workflowPaths: ['**/*.json', 'workflows/**/*.json'],
            },
        ];
        this.git = (0, simple_git_1.simpleGit)();
        this.parser = new WorkflowParser_js_1.WorkflowParser();
        this.categorizer = new WorkflowCategorizer_js_1.WorkflowCategorizer();
        this.cacheDir = cacheDir || path.join(process.cwd(), '.n8n-workflows-cache');
    }
    /**
     * Fetch workflows from all repositories
     */
    async fetchAll() {
        await this.ensureCacheDir();
        const results = [];
        const allWorkflows = [];
        for (const repo of this.repositories) {
            try {
                console.log(`Fetching workflows from ${repo.source}...`);
                const result = await this.fetchFromRepository(repo);
                results.push(result);
                if (result.success) {
                    // Load workflows from the fetched repository
                    const workflows = await this.loadWorkflowsFromRepo(repo);
                    allWorkflows.push(...workflows);
                }
            }
            catch (error) {
                console.error(`Error fetching from ${repo.source}:`, error);
                results.push({
                    success: false,
                    workflowsAdded: 0,
                    workflowsUpdated: 0,
                    errors: [error instanceof Error ? error.message : String(error)],
                    source: repo.source,
                });
            }
        }
        return { workflows: allWorkflows, results };
    }
    /**
     * Fetch workflows from a specific repository
     */
    async fetchFromRepository(repo) {
        const repoPath = this.getRepoPath(repo.source);
        try {
            // Check if repo already exists
            const exists = await fs.pathExists(repoPath);
            if (exists) {
                // Pull latest changes
                console.log(`Updating repository ${repo.source}...`);
                const git = (0, simple_git_1.simpleGit)(repoPath);
                await git.pull('origin', repo.branch || 'main');
            }
            else {
                // Clone repository
                console.log(`Cloning repository ${repo.source}...`);
                await this.git.clone(repo.url, repoPath, {
                    '--depth': 1,
                    '--branch': repo.branch || 'main',
                });
            }
            return {
                success: true,
                workflowsAdded: 0,
                workflowsUpdated: 0,
                errors: [],
                source: repo.source,
            };
        }
        catch (error) {
            console.error(`Error with repository ${repo.source}:`, error);
            return {
                success: false,
                workflowsAdded: 0,
                workflowsUpdated: 0,
                errors: [error instanceof Error ? error.message : String(error)],
                source: repo.source,
            };
        }
    }
    /**
     * Load workflows from a repository
     */
    async loadWorkflowsFromRepo(repo) {
        const repoPath = this.getRepoPath(repo.source);
        const workflows = [];
        const patterns = repo.workflowPaths || ['**/*.json'];
        for (const pattern of patterns) {
            try {
                const files = (await glob_1.glob(pattern, {
                    cwd: repoPath,
                    absolute: true,
                    ignore: ['**/node_modules/**', '**/package.json', '**/package-lock.json'],
                }));
                console.log(`Found ${files.length} files matching ${pattern} in ${repo.source}`);
                for (const file of files) {
                    try {
                        const content = await fs.readJSON(file);
                        // Skip if not a workflow (e.g., package.json)
                        if (!this.isWorkflowFile(content, file)) {
                            continue;
                        }
                        const workflow = this.parser.parseWorkflow(content, repo.source, path.relative(repoPath, file));
                        if (workflow) {
                            // Categorize workflow
                            workflow.category = this.categorizer.categorize(workflow);
                            workflow.metadata.category = workflow.category;
                            workflows.push(workflow);
                        }
                    }
                    catch (error) {
                        console.error(`Error parsing workflow file ${file}:`, error);
                    }
                }
            }
            catch (error) {
                console.error(`Error globbing pattern ${pattern}:`, error);
            }
        }
        console.log(`Loaded ${workflows.length} workflows from ${repo.source}`);
        return workflows;
    }
    /**
     * Check if a JSON file is a workflow
     */
    isWorkflowFile(content, filePath) {
        // Check if it has workflow-like structure
        if (!content || typeof content !== 'object') {
            return false;
        }
        // Skip package.json and other common files
        const fileName = path.basename(filePath).toLowerCase();
        if (fileName === 'package.json' ||
            fileName === 'package-lock.json' ||
            fileName === 'tsconfig.json' ||
            fileName.startsWith('.')) {
            return false;
        }
        // Check for n8n workflow properties
        return (content.name !== undefined ||
            content.nodes !== undefined ||
            content.connections !== undefined ||
            (content.meta && content.meta.instanceId !== undefined));
    }
    /**
     * Get repository path
     */
    getRepoPath(source) {
        const safeName = source.replace(/[^a-zA-Z0-9-]/g, '_');
        return path.join(this.cacheDir, safeName);
    }
    /**
     * Ensure cache directory exists
     */
    async ensureCacheDir() {
        await fs.ensureDir(this.cacheDir);
    }
    /**
     * Clear cache
     */
    async clearCache() {
        await fs.remove(this.cacheDir);
    }
    /**
     * Get cache info
     */
    async getCacheInfo() {
        const exists = await fs.pathExists(this.cacheDir);
        if (!exists) {
            return { exists: false, repositories: [] };
        }
        const repositories = [];
        const entries = await fs.readdir(this.cacheDir);
        for (const entry of entries) {
            const entryPath = path.join(this.cacheDir, entry);
            const stats = await fs.stat(entryPath);
            if (stats.isDirectory()) {
                repositories.push(entry);
            }
        }
        return { exists: true, repositories };
    }
    /**
     * Fetch workflows from a specific source
     */
    async fetchFromSource(source) {
        const repo = this.repositories.find((r) => r.source === source);
        if (!repo) {
            throw new Error(`Unknown source: ${source}`);
        }
        await this.ensureCacheDir();
        await this.fetchFromRepository(repo);
        return this.loadWorkflowsFromRepo(repo);
    }
    /**
     * Get all configured sources
     */
    getSources() {
        return this.repositories.map((r) => r.source);
    }
    /**
     * Add custom repository
     */
    addRepository(config) {
        this.repositories.push(config);
    }
}
exports.WorkflowFetcher = WorkflowFetcher;
//# sourceMappingURL=WorkflowFetcher.js.map
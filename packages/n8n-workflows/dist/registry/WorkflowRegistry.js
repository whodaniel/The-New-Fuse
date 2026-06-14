/**
 * WorkflowRegistry
 * Manages the registry of n8n workflows
 */
import * as fs from 'fs-extra';
import * as path from 'path';
export class WorkflowRegistry {
    constructor(config = {}) {
        this.workflows = new Map();
        this.storageDir = config.storageDir || path.join(process.cwd(), '.n8n-workflows-registry');
        this.enablePersistence = config.enablePersistence !== false;
        this.lastSync = new Date();
    }
    /**
     * Initialize registry
     */
    async initialize() {
        if (this.enablePersistence) {
            await fs.ensureDir(this.storageDir);
            await this.loadFromDisk();
        }
    }
    /**
     * Add workflow to registry
     */
    addWorkflow(workflow) {
        this.workflows.set(workflow.id, workflow);
    }
    /**
     * Add multiple workflows
     */
    addWorkflows(workflows) {
        workflows.forEach((workflow) => this.addWorkflow(workflow));
    }
    /**
     * Get workflow by ID
     */
    getWorkflow(id) {
        return this.workflows.get(id);
    }
    /**
     * Get all workflows
     */
    getAllWorkflows() {
        return Array.from(this.workflows.values());
    }
    /**
     * Search workflows
     */
    search(query) {
        let results = this.getAllWorkflows();
        // Filter by query text
        if (query.query) {
            const searchLower = query.query.toLowerCase();
            results = results.filter((w) => w.name.toLowerCase().includes(searchLower) ||
                w.description.toLowerCase().includes(searchLower) ||
                w.tags.some((tag) => tag.toLowerCase().includes(searchLower)));
        }
        // Filter by category
        if (query.category) {
            results = results.filter((w) => w.category === query.category);
        }
        // Filter by source
        if (query.source) {
            results = results.filter((w) => w.source === query.source);
        }
        // Filter by tags
        if (query.tags && query.tags.length > 0) {
            results = results.filter((w) => query.tags.some((tag) => w.tags.some((wTag) => wTag.toLowerCase() === tag.toLowerCase())));
        }
        // Filter by complexity
        if (query.complexity) {
            results = results.filter((w) => w.metadata.complexity === query.complexity);
        }
        const total = results.length;
        const limit = query.limit || 50;
        const offset = query.offset || 0;
        // Paginate
        results = results.slice(offset, offset + limit);
        // Calculate category distribution
        const categories = {};
        this.getAllWorkflows().forEach((w) => {
            categories[w.category] = (categories[w.category] || 0) + 1;
        });
        return {
            workflows: results,
            total,
            limit,
            offset,
            categories,
        };
    }
    /**
     * Get workflows by category
     */
    getByCategory(category) {
        return this.getAllWorkflows().filter((w) => w.category === category);
    }
    /**
     * Get workflows by source
     */
    getBySource(source) {
        return this.getAllWorkflows().filter((w) => w.source === source);
    }
    /**
     * Get workflows by tag
     */
    getByTag(tag) {
        const tagLower = tag.toLowerCase();
        return this.getAllWorkflows().filter((w) => w.tags.some((t) => t.toLowerCase() === tagLower));
    }
    /**
     * Get workflow statistics
     */
    getStats() {
        const workflows = this.getAllWorkflows();
        const byCategory = {};
        const bySource = {};
        const byComplexity = {
            simple: 0,
            medium: 0,
            complex: 0,
        };
        const tagCounts = new Map();
        workflows.forEach((w) => {
            // Count by category
            byCategory[w.category] = (byCategory[w.category] || 0) + 1;
            // Count by source
            bySource[w.source] = (bySource[w.source] || 0) + 1;
            // Count by complexity
            if (w.metadata.complexity) {
                byComplexity[w.metadata.complexity]++;
            }
            // Count tags
            w.tags.forEach((tag) => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });
        // Get top tags
        const mostPopularTags = Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
        return {
            totalWorkflows: workflows.length,
            byCategory,
            bySource,
            byComplexity,
            mostPopularTags,
            lastSync: this.lastSync,
        };
    }
    /**
     * Get all categories
     */
    getCategories() {
        const categories = new Set();
        this.getAllWorkflows().forEach((w) => categories.add(w.category));
        return Array.from(categories);
    }
    /**
     * Get all tags
     */
    getAllTags() {
        const tags = new Set();
        this.getAllWorkflows().forEach((w) => {
            w.tags.forEach((tag) => tags.add(tag));
        });
        return Array.from(tags).sort();
    }
    /**
     * Update workflow
     */
    updateWorkflow(id, updates) {
        const workflow = this.workflows.get(id);
        if (!workflow) {
            return false;
        }
        const updated = { ...workflow, ...updates, updatedAt: new Date() };
        this.workflows.set(id, updated);
        return true;
    }
    /**
     * Delete workflow
     */
    deleteWorkflow(id) {
        return this.workflows.delete(id);
    }
    /**
     * Clear all workflows
     */
    clear() {
        this.workflows.clear();
    }
    /**
     * Get workflow count
     */
    count() {
        return this.workflows.size;
    }
    /**
     * Check if workflow exists
     */
    has(id) {
        return this.workflows.has(id);
    }
    /**
     * Save registry to disk
     */
    async saveToDisk() {
        if (!this.enablePersistence) {
            return;
        }
        await fs.ensureDir(this.storageDir);
        const registryPath = path.join(this.storageDir, 'registry.json');
        const workflows = this.getAllWorkflows();
        const data = {
            version: '1.0.0',
            lastSync: this.lastSync.toISOString(),
            count: workflows.length,
            workflows,
        };
        await fs.writeJSON(registryPath, data, { spaces: 2 });
        // Also save individual category files for faster loading
        const categorizedWorkflows = new Map();
        workflows.forEach((w) => {
            if (!categorizedWorkflows.has(w.category)) {
                categorizedWorkflows.set(w.category, []);
            }
            categorizedWorkflows.get(w.category).push(w);
        });
        for (const [category, categoryWorkflows] of categorizedWorkflows) {
            const categoryPath = path.join(this.storageDir, `category-${category}.json`);
            await fs.writeJSON(categoryPath, categoryWorkflows, { spaces: 2 });
        }
    }
    /**
     * Load registry from disk
     */
    async loadFromDisk() {
        if (!this.enablePersistence) {
            return false;
        }
        const registryPath = path.join(this.storageDir, 'registry.json');
        if (!(await fs.pathExists(registryPath))) {
            return false;
        }
        try {
            const data = await fs.readJSON(registryPath);
            if (data.workflows && Array.isArray(data.workflows)) {
                this.workflows.clear();
                data.workflows.forEach((w) => {
                    this.workflows.set(w.id, w);
                });
                if (data.lastSync) {
                    this.lastSync = new Date(data.lastSync);
                }
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error loading registry from disk:', error);
            return false;
        }
    }
    /**
     * Export workflows to JSON
     */
    exportToJSON() {
        return JSON.stringify({
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            count: this.workflows.size,
            workflows: this.getAllWorkflows(),
        }, null, 2);
    }
    /**
     * Import workflows from JSON
     */
    importFromJSON(json) {
        try {
            const data = JSON.parse(json);
            if (data.workflows && Array.isArray(data.workflows)) {
                let imported = 0;
                data.workflows.forEach((w) => {
                    this.addWorkflow(w);
                    imported++;
                });
                return imported;
            }
            return 0;
        }
        catch (error) {
            console.error('Error importing workflows:', error);
            return 0;
        }
    }
    /**
     * Update last sync time
     */
    updateLastSync() {
        this.lastSync = new Date();
    }
    /**
     * Get similar workflows
     */
    getSimilarWorkflows(workflowId, limit = 5) {
        const workflow = this.getWorkflow(workflowId);
        if (!workflow) {
            return [];
        }
        const allWorkflows = this.getAllWorkflows().filter((w) => w.id !== workflowId);
        // Calculate similarity scores
        const scored = allWorkflows.map((w) => ({
            workflow: w,
            score: this.calculateSimilarity(workflow, w),
        }));
        // Sort by score and return top N
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((s) => s.workflow);
    }
    /**
     * Calculate similarity between two workflows
     */
    calculateSimilarity(w1, w2) {
        let score = 0;
        // Same category
        if (w1.category === w2.category) {
            score += 10;
        }
        // Shared tags
        const sharedTags = w1.tags.filter((tag) => w2.tags.includes(tag));
        score += sharedTags.length * 5;
        // Similar node types
        const w1NodeTypes = new Set(w1.nodes.map((n) => n.type));
        const w2NodeTypes = new Set(w2.nodes.map((n) => n.type));
        const sharedNodeTypes = Array.from(w1NodeTypes).filter((type) => w2NodeTypes.has(type));
        score += sharedNodeTypes.length * 3;
        // Same source
        if (w1.source === w2.source) {
            score += 2;
        }
        return score;
    }
}
//# sourceMappingURL=WorkflowRegistry.js.map
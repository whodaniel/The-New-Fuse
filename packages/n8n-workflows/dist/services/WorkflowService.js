/**
 * WorkflowService
 * High-level service for managing n8n workflows
 */
import axios from 'axios';
import { WorkflowCategorizer } from '../categorizer/WorkflowCategorizer.js';
import { WorkflowFetcher } from '../fetcher/WorkflowFetcher.js';
import { WorkflowParser } from '../parser/WorkflowParser.js';
import { WorkflowRegistry } from '../registry/WorkflowRegistry.js';
export class WorkflowService {
    constructor(registryConfig) {
        this.initialized = false;
        this.fetcher = new WorkflowFetcher();
        this.parser = new WorkflowParser();
        this.categorizer = new WorkflowCategorizer();
        this.registry = new WorkflowRegistry(registryConfig);
    }
    /**
     * Initialize the service
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        await this.registry.initialize();
        this.initialized = true;
    }
    /**
     * Sync workflows from all sources
     */
    async syncWorkflows() {
        await this.initialize();
        console.log('Starting workflow sync...');
        const { workflows, results } = await this.fetcher.fetchAll();
        // Add workflows to registry
        this.registry.clear();
        this.registry.addWorkflows(workflows);
        this.registry.updateLastSync();
        // Save to disk
        await this.registry.saveToDisk();
        const stats = this.registry.getStats();
        const errors = results.flatMap((r) => r.errors);
        console.log(`Sync complete. Total workflows: ${workflows.length}`);
        return {
            success: errors.length === 0,
            totalWorkflows: workflows.length,
            stats,
            errors,
        };
    }
    /**
     * Sync workflows from a specific source
     */
    async syncFromSource(source) {
        await this.initialize();
        const workflows = await this.fetcher.fetchFromSource(source);
        // Remove existing workflows from this source
        const existing = this.registry.getBySource(source);
        existing.forEach((w) => this.registry.deleteWorkflow(w.id));
        // Add new workflows
        this.registry.addWorkflows(workflows);
        this.registry.updateLastSync();
        await this.registry.saveToDisk();
        return workflows.length;
    }
    /**
     * Search workflows
     */
    async search(query) {
        await this.initialize();
        return this.registry.search(query);
    }
    /**
     * Get workflow by ID
     */
    async getWorkflow(id) {
        await this.initialize();
        return this.registry.getWorkflow(id);
    }
    /**
     * Get all workflows
     */
    async getAllWorkflows() {
        await this.initialize();
        return this.registry.getAllWorkflows();
    }
    /**
     * Get workflows by category
     */
    async getByCategory(category) {
        await this.initialize();
        return this.registry.getByCategory(category);
    }
    /**
     * Get workflow statistics
     */
    async getStats() {
        await this.initialize();
        return this.registry.getStats();
    }
    /**
     * Get all categories
     */
    async getCategories() {
        await this.initialize();
        const stats = this.registry.getStats();
        const configs = this.categorizer.getCategoryConfigs();
        const categories = configs.map((config) => ({
            name: config.name,
            count: stats.byCategory[config.name] || 0,
            displayName: config.displayName,
            description: config.description,
        }));
        return { categories };
    }
    /**
     * Import workflow to n8n instance
     */
    async importToN8n(request) {
        await this.initialize();
        const n8nInstanceUrl = request.n8nInstanceUrl?.trim() ||
            process.env.N8N_TEMPLATE_HOST_URL ||
            'http://n8n-template-host:5678';
        const validationError = this.validateN8nInstanceUrl(n8nInstanceUrl);
        if (validationError) {
            return {
                success: false,
                error: `Invalid n8n instance URL: ${validationError}`,
            };
        }
        const baseUrl = new URL(n8nInstanceUrl);
        const importUrl = new URL('/api/v1/workflows', baseUrl).toString();
        const workflow = this.registry.getWorkflow(request.workflowId);
        if (!workflow) {
            return {
                success: false,
                error: 'Workflow not found',
            };
        }
        try {
            // Import to n8n instance
            const response = await axios.post(importUrl, {
                ...workflow.jsonDefinition,
                active: request.activate || false,
            }, {
                headers: {
                    'X-N8N-API-KEY': request.apiKey || '',
                    'Content-Type': 'application/json',
                },
            });
            return {
                success: true,
                workflowId: response.data.id,
                message: 'Workflow imported successfully',
            };
        }
        catch (error) {
            console.error('Error importing workflow to n8n:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to import workflow',
            };
        }
    }
    /**
     * Get similar workflows
     */
    async getSimilarWorkflows(workflowId, limit) {
        await this.initialize();
        return this.registry.getSimilarWorkflows(workflowId, limit);
    }
    /**
     * Get all tags
     */
    async getAllTags() {
        await this.initialize();
        return this.registry.getAllTags();
    }
    /**
     * Get workflows by tag
     */
    async getByTag(tag) {
        await this.initialize();
        return this.registry.getByTag(tag);
    }
    /**
     * Export workflows to JSON
     */
    async exportToJSON() {
        await this.initialize();
        return this.registry.exportToJSON();
    }
    /**
     * Import workflows from JSON
     */
    async importFromJSON(json) {
        await this.initialize();
        const imported = this.registry.importFromJSON(json);
        await this.registry.saveToDisk();
        return imported;
    }
    /**
     * Get workflow count
     */
    async getCount() {
        await this.initialize();
        return this.registry.count();
    }
    /**
     * Clear all workflows
     */
    async clear() {
        await this.initialize();
        this.registry.clear();
        await this.registry.saveToDisk();
    }
    validateN8nInstanceUrl(rawUrl) {
        let parsed;
        try {
            parsed = new URL(rawUrl);
        }
        catch {
            return 'Malformed URL';
        }
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            return `Unsupported protocol: ${parsed.protocol}`;
        }
        const host = parsed.hostname.toLowerCase();
        if (this.isDockerComposeHostname(host)) {
            return null;
        }
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
            return 'Loopback URLs are not allowed';
        }
        if (host.startsWith('10.') ||
            host.startsWith('192.168.') ||
            /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
            return 'Private network URLs are not allowed';
        }
        return null;
    }
    isDockerComposeHostname(host) {
        if (process.env.TNF_RUNTIME !== 'docker-compose') {
            return false;
        }
        return /^[a-z0-9][a-z0-9-]*$/.test(host);
    }
}
//# sourceMappingURL=WorkflowService.js.map
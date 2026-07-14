"use strict";
/**
 * Claude Skills Manager
 *
 * Main orchestrator for Claude Skills integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeSkillsManager = void 0;
exports.getClaudeSkillsManager = getClaudeSkillsManager;
exports.resetClaudeSkillsManager = resetClaudeSkillsManager;
const executor_js_1 = require("./executor.js");
const integration_js_1 = require("./integration.js");
const loader_js_1 = require("./loader.js");
const parser_js_1 = require("./parser.js");
const registry_js_1 = require("./registry.js");
/**
 * Main manager class for Claude Skills
 */
class ClaudeSkillsManager {
    constructor(config) {
        this.initialized = false;
        this.loader = new loader_js_1.SkillLoader(config?.loader);
        this.parser = new parser_js_1.SkillParser();
        this.executor = new executor_js_1.SkillExecutor();
        this.registry = new registry_js_1.SkillRegistry();
        this.mcpProvider = new integration_js_1.MCPSkillProvider(this.registry, this.executor);
        if (config?.autoInitialize) {
            this.initialize(config.prioritySkills).catch((error) => {
                console.error('Failed to auto-initialize Claude Skills:', error);
            });
        }
    }
    /**
     * Initialize the skills system
     */
    async initialize(prioritySkills) {
        if (this.initialized) {
            console.warn('Claude Skills Manager already initialized');
            return {
                imported: 0,
                failed: 0,
                skipped: 0,
                skills: [],
                errors: [],
            };
        }
        try {
            // Initialize the loader (clone/update repository)
            await this.loader.initialize();
            // Load skills
            let result;
            if (prioritySkills && prioritySkills.length > 0) {
                // Load only priority skills
                result = await this.loader.loadSkillsByName(prioritySkills);
            }
            else {
                // Load all skills
                result = await this.loader.loadAllSkills();
            }
            // Register skills with registry and executor
            for (const skill of result.skills) {
                await this.registry.register(skill);
                this.executor.registerSkill(skill);
            }
            this.initialized = true;
            console.log(`Claude Skills Manager initialized: ${result.imported} skills loaded, ` +
                `${result.failed} failed, ${result.skipped} skipped`);
            if (result.errors.length > 0) {
                console.warn('Errors during initialization:', result.errors);
            }
            return result;
        }
        catch (error) {
            throw new Error(`Failed to initialize Claude Skills Manager: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Load additional skills by name
     */
    async loadSkills(skillNames) {
        const result = await this.loader.loadSkillsByName(skillNames);
        // Register new skills
        for (const skill of result.skills) {
            await this.registry.register(skill);
            this.executor.registerSkill(skill);
        }
        return result;
    }
    /**
     * Reload all skills from repository
     */
    async reloadSkills() {
        // Clear existing skills
        this.registry.clear();
        this.executor.clear();
        // Reload from repository
        const result = await this.loader.loadAllSkills();
        // Register skills
        for (const skill of result.skills) {
            await this.registry.register(skill);
            this.executor.registerSkill(skill);
        }
        return result;
    }
    /**
     * Execute a skill
     */
    async executeSkill(context) {
        if (!this.initialized) {
            throw new Error('Claude Skills Manager not initialized. Call initialize() first.');
        }
        return await this.executor.execute(context);
    }
    /**
     * Get a skill by ID
     */
    async getSkill(skillId) {
        return await this.registry.get(skillId);
    }
    /**
     * List skills with optional filtering
     */
    async listSkills(filter) {
        return await this.registry.list(filter);
    }
    /**
     * Search skills
     */
    async searchSkills(query) {
        return await this.registry.search(query);
    }
    /**
     * Get skills by category
     */
    async getSkillsByCategory(category) {
        return await this.registry.getByCategory(category);
    }
    /**
     * Get skills by tag
     */
    async getSkillsByTag(tag) {
        return await this.registry.getByTag(tag);
    }
    /**
     * Get all categories
     */
    getCategories() {
        return this.registry.getCategories();
    }
    /**
     * Get all tags
     */
    getTags() {
        return this.registry.getTags();
    }
    /**
     * Get statistics
     */
    getStatistics() {
        return {
            registry: this.registry.getStatistics(),
            executor: this.executor.getStatistics(),
            initialized: this.initialized,
        };
    }
    /**
     * Get MCP provider for integration
     */
    getMCPProvider() {
        return this.mcpProvider;
    }
    /**
     * Get available skill names from repository
     */
    async getAvailableSkillNames() {
        return await this.loader.listAvailableSkills();
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        await this.loader.cleanup();
        this.registry.clear();
        this.executor.clear();
        this.initialized = false;
    }
    /**
     * Check if manager is initialized
     */
    isInitialized() {
        return this.initialized;
    }
}
exports.ClaudeSkillsManager = ClaudeSkillsManager;
/**
 * Create a singleton instance
 */
let globalInstance = null;
/**
 * Get the global Claude Skills Manager instance
 */
function getClaudeSkillsManager(config) {
    if (!globalInstance) {
        globalInstance = new ClaudeSkillsManager(config);
    }
    return globalInstance;
}
/**
 * Reset the global instance (useful for testing)
 */
function resetClaudeSkillsManager() {
    if (globalInstance) {
        globalInstance.cleanup();
        globalInstance = null;
    }
}
//# sourceMappingURL=ClaudeSkillsManager.js.map
"use strict";
/**
 * Extension Registry - Central Repository for Extension Metadata
 *
 * Maintains a persistent registry of all extensions, their metadata, and relationships
 * Provides search, filtering, and management capabilities
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
exports.ExtensionRegistry = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const ExtensionTypes_js_1 = require("../types/ExtensionTypes.js");
class ExtensionRegistry extends events_1.EventEmitter {
    constructor(logger, config) {
        super();
        this.entries = new Map();
        this.initialized = false;
        this.logger = logger;
        this.config = {
            registryFile: 'extension-registry.json',
            enablePersistence: true,
            enableReviews: true,
            enableDownloadTracking: true,
            autoBackup: true,
            backupInterval: 3600000, // 1 hour
            ...config
        };
        // Initialize indexes
        this.indexes = {
            byType: new Map(),
            byCategory: new Map(),
            byAuthor: new Map(),
            byKeyword: new Map()
        };
        this.initializeIndexes();
    }
    /**
     * Initialize the registry
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        this.logger.info('📚 Initializing Extension Registry...');
        try {
            // Load existing registry data
            if (this.config.enablePersistence) {
                await this.loadFromFile();
            }
            // Start periodic tasks
            if (this.config.autoBackup) {
                this.startBackupTask();
            }
            this.initialized = true;
            this.logger.info(`✅ Extension Registry initialized with ${this.entries.size} entries`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`❌ Failed to initialize Extension Registry: ${errorMessage}`);
            throw error;
        }
    }
    /**
     * Register a new extension
     */
    async registerExtension(extension) {
        this.logger.debug(`📝 Registering extension: ${extension.name}`);
        const now = new Date();
        const existingEntry = this.entries.get(extension.id);
        const entry = {
            extension: { ...extension },
            registeredAt: existingEntry?.registeredAt || now,
            lastUpdated: now,
            downloads: existingEntry?.downloads || 0,
            rating: existingEntry?.rating,
            reviews: existingEntry?.reviews || []
        };
        // Update indexes
        this.updateIndexes(extension.id, extension);
        // Store entry
        this.entries.set(extension.id, entry);
        // Persist if enabled
        if (this.config.enablePersistence) {
            await this.saveToFile();
        }
        // Emit event
        this.emit('extensionRegistered', { extension, entry });
        this.logger.info(`✅ Extension registered: ${extension.name}`);
        return entry;
    }
    /**
     * Unregister an extension
     */
    async unregisterExtension(extensionId) {
        this.logger.debug(`📝 Unregistering extension: ${extensionId}`);
        const entry = this.entries.get(extensionId);
        if (!entry) {
            return false;
        }
        // Remove from indexes
        this.removeFromIndexes(extensionId, entry.extension);
        // Remove entry
        this.entries.delete(extensionId);
        // Persist if enabled
        if (this.config.enablePersistence) {
            await this.saveToFile();
        }
        // Emit event
        this.emit('extensionUnregistered', { extensionId, entry });
        this.logger.info(`✅ Extension unregistered: ${extensionId}`);
        return true;
    }
    /**
     * Get extension entry
     */
    getEntry(extensionId) {
        return this.entries.get(extensionId) || null;
    }
    /**
     * Get all entries
     */
    getAllEntries() {
        return Array.from(this.entries.values());
    }
    /**
     * Search extensions
     */
    searchExtensions(query) {
        let results = Array.from(this.entries.values());
        // Apply filters
        if (query.name) {
            const nameLower = query.name.toLowerCase();
            results = results.filter(entry => entry.extension.name.toLowerCase().includes(nameLower) ||
                entry.extension.description?.toLowerCase().includes(nameLower));
        }
        if (query.type) {
            results = results.filter(entry => entry.extension.type === query.type);
        }
        if (query.category) {
            results = results.filter(entry => entry.extension.category === query.category);
        }
        if (query.status) {
            results = results.filter(entry => entry.extension.status === query.status);
        }
        if (query.author) {
            const authorLower = query.author.toLowerCase();
            results = results.filter(entry => entry.extension.author.toLowerCase().includes(authorLower));
        }
        if (query.keywords && query.keywords.length > 0) {
            results = results.filter(entry => query.keywords.some(keyword => entry.extension.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))));
        }
        if (query.minRating) {
            results = results.filter(entry => entry.rating !== undefined && entry.rating >= query.minRating);
        }
        // Sort results
        if (query.sortBy) {
            results.sort((a, b) => {
                let aValue, bValue;
                switch (query.sortBy) {
                    case 'name':
                        aValue = a.extension.name.toLowerCase();
                        bValue = b.extension.name.toLowerCase();
                        break;
                    case 'rating':
                        aValue = a.rating || 0;
                        bValue = b.rating || 0;
                        break;
                    case 'downloads':
                        aValue = a.downloads;
                        bValue = b.downloads;
                        break;
                    case 'updated':
                        aValue = a.lastUpdated.getTime();
                        bValue = b.lastUpdated.getTime();
                        break;
                    case 'created':
                        aValue = a.registeredAt.getTime();
                        bValue = b.registeredAt.getTime();
                        break;
                    default:
                        return 0;
                }
                const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                return query.sortOrder === 'desc' ? -comparison : comparison;
            });
        }
        // Apply pagination
        const total = results.length;
        const offset = query.offset || 0;
        const limit = query.limit || 50;
        const paginatedResults = results.slice(offset, offset + limit);
        const hasMore = offset + limit < total;
        return {
            entries: paginatedResults,
            total,
            hasMore
        };
    }
    /**
     * Get extensions by type
     */
    getExtensionsByType(type) {
        const extensionIds = this.indexes.byType.get(type) || new Set();
        return Array.from(extensionIds)
            .map(id => this.entries.get(id))
            .filter(Boolean);
    }
    /**
     * Get extensions by category
     */
    getExtensionsByCategory(category) {
        const extensionIds = this.indexes.byCategory.get(category) || new Set();
        return Array.from(extensionIds)
            .map(id => this.entries.get(id))
            .filter(Boolean);
    }
    /**
     * Get extensions by author
     */
    getExtensionsByAuthor(author) {
        const extensionIds = this.indexes.byAuthor.get(author.toLowerCase()) || new Set();
        return Array.from(extensionIds)
            .map(id => this.entries.get(id))
            .filter(Boolean);
    }
    /**
     * Get extensions by keyword
     */
    getExtensionsByKeyword(keyword) {
        const extensionIds = this.indexes.byKeyword.get(keyword.toLowerCase()) || new Set();
        return Array.from(extensionIds)
            .map(id => this.entries.get(id))
            .filter(Boolean);
    }
    /**
     * Track download
     */
    async trackDownload(extensionId) {
        if (!this.config.enableDownloadTracking) {
            return false;
        }
        const entry = this.entries.get(extensionId);
        if (!entry) {
            return false;
        }
        entry.downloads++;
        entry.lastUpdated = new Date();
        // Persist if enabled
        if (this.config.enablePersistence) {
            await this.saveToFile();
        }
        this.emit('downloadTracked', { extensionId, downloads: entry.downloads });
        return true;
    }
    /**
     * Add review
     */
    async addReview(extensionId, review) {
        if (!this.config.enableReviews) {
            return false;
        }
        const entry = this.entries.get(extensionId);
        if (!entry) {
            return false;
        }
        const newReview = {
            id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...review,
            createdAt: new Date()
        };
        if (!entry.reviews) {
            entry.reviews = [];
        }
        entry.reviews.push(newReview);
        // Recalculate average rating
        if (entry.reviews && entry.reviews.length > 0) {
            entry.rating = entry.reviews.reduce((sum, r) => sum + r.rating, 0) / entry.reviews.length;
        }
        entry.lastUpdated = new Date();
        // Persist if enabled
        if (this.config.enablePersistence) {
            await this.saveToFile();
        }
        this.emit('reviewAdded', { extensionId, review: newReview, newRating: entry.rating });
        return true;
    }
    /**
     * Get popular extensions
     */
    getPopularExtensions(limit = 10) {
        return this.getAllEntries()
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, limit);
    }
    /**
     * Get top rated extensions
     */
    getTopRatedExtensions(limit = 10) {
        return this.getAllEntries()
            .filter(entry => entry.rating !== undefined)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, limit);
    }
    /**
     * Get recently updated extensions
     */
    getRecentlyUpdatedExtensions(limit = 10) {
        return this.getAllEntries()
            .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
            .slice(0, limit);
    }
    /**
     * Get registry statistics
     */
    getStatistics() {
        const entries = this.getAllEntries();
        const totalDownloads = entries.reduce((sum, entry) => sum + entry.downloads, 0);
        const ratedEntries = entries.filter(entry => entry.rating !== undefined);
        const averageRating = ratedEntries.length > 0
            ? ratedEntries.reduce((sum, entry) => sum + (entry.rating || 0), 0) / ratedEntries.length
            : 0;
        const totalReviews = entries.reduce((sum, entry) => sum + (entry.reviews?.length || 0), 0);
        const byType = {};
        const byCategory = {};
        for (const entry of entries) {
            byType[entry.extension.type] = (byType[entry.extension.type] || 0) + 1;
            byCategory[entry.extension.category] = (byCategory[entry.extension.category] || 0) + 1;
        }
        return {
            totalExtensions: entries.length,
            totalDownloads,
            averageRating,
            totalReviews,
            byType,
            byCategory
        };
    }
    /**
     * Private helper methods
     */
    initializeIndexes() {
        // Initialize all enum values
        for (const type of Object.values(ExtensionTypes_js_1.ExtensionType)) {
            this.indexes.byType.set(type, new Set());
        }
        for (const category of Object.values(ExtensionTypes_js_1.ExtensionCategory)) {
            this.indexes.byCategory.set(category, new Set());
        }
    }
    updateIndexes(extensionId, extension) {
        // Update type index
        if (!this.indexes.byType.has(extension.type)) {
            this.indexes.byType.set(extension.type, new Set());
        }
        this.indexes.byType.get(extension.type).add(extensionId);
        // Update category index
        if (!this.indexes.byCategory.has(extension.category)) {
            this.indexes.byCategory.set(extension.category, new Set());
        }
        this.indexes.byCategory.get(extension.category).add(extensionId);
        // Update author index
        const authorKey = extension.author.toLowerCase();
        if (!this.indexes.byAuthor.has(authorKey)) {
            this.indexes.byAuthor.set(authorKey, new Set());
        }
        this.indexes.byAuthor.get(authorKey).add(extensionId);
        // Update keyword indexes
        for (const keyword of extension.keywords) {
            const keywordKey = keyword.toLowerCase();
            if (!this.indexes.byKeyword.has(keywordKey)) {
                this.indexes.byKeyword.set(keywordKey, new Set());
            }
            this.indexes.byKeyword.get(keywordKey).add(extensionId);
        }
    }
    removeFromIndexes(extensionId, extension) {
        // Remove from type index
        this.indexes.byType.get(extension.type)?.delete(extensionId);
        // Remove from category index
        this.indexes.byCategory.get(extension.category)?.delete(extensionId);
        // Remove from author index
        this.indexes.byAuthor.get(extension.author.toLowerCase())?.delete(extensionId);
        // Remove from keyword indexes
        for (const keyword of extension.keywords) {
            this.indexes.byKeyword.get(keyword.toLowerCase())?.delete(extensionId);
        }
    }
    async loadFromFile() {
        try {
            if (await fs.pathExists(this.config.registryFile)) {
                const data = await fs.readJson(this.config.registryFile);
                // Convert dates back from JSON
                for (const [id, entryData] of Object.entries(data.entries || {})) {
                    const entry = entryData;
                    entry.registeredAt = new Date(entry.registeredAt);
                    entry.lastUpdated = new Date(entry.lastUpdated);
                    // Convert review dates
                    for (const review of entry.reviews || []) {
                        review.createdAt = new Date(review.createdAt);
                    }
                    this.entries.set(id, entry);
                    this.updateIndexes(id, entry.extension);
                }
                this.logger.debug(`📚 Loaded ${this.entries.size} entries from registry file`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to load registry from file: ${errorMessage}`);
        }
    }
    async saveToFile() {
        try {
            const data = {
                version: '1.0.0',
                lastUpdated: new Date(),
                entries: Object.fromEntries(this.entries)
            };
            await fs.writeJson(this.config.registryFile, data, { spaces: 2 });
            this.logger.debug(`📚 Saved ${this.entries.size} entries to registry file`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to save registry to file: ${errorMessage}`);
        }
    }
    startBackupTask() {
        setInterval(async () => {
            if (this.config.enablePersistence) {
                const backupFile = `${this.config.registryFile}.backup.${Date.now()}`;
                try {
                    await fs.copy(this.config.registryFile, backupFile);
                    this.logger.debug(`📚 Registry backed up to ${backupFile}`);
                    // Clean up old backups (keep last 5)
                    await this.cleanupOldBackups();
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.warn(`Failed to backup registry: ${errorMessage}`);
                }
            }
        }, this.config.backupInterval);
    }
    async cleanupOldBackups() {
        try {
            const dir = path.dirname(this.config.registryFile);
            const baseName = path.basename(this.config.registryFile);
            const files = await fs.readdir(dir);
            const backups = files
                .filter(file => file.startsWith(`${baseName}.backup.`))
                .map(file => ({
                name: file,
                path: path.join(dir, file),
                time: parseInt(file.split('.').pop() || '0')
            }))
                .sort((a, b) => b.time - a.time);
            // Keep only the 5 most recent backups
            for (const backup of backups.slice(5)) {
                await fs.remove(backup.path);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to cleanup old backups: ${errorMessage}`);
        }
    }
    /**
     * Public API Extensions
     */
    async exportRegistry(filePath) {
        try {
            const data = {
                version: '1.0.0',
                exportedAt: new Date(),
                entries: Object.fromEntries(this.entries)
            };
            await fs.writeJson(filePath, data, { spaces: 2 });
            this.logger.info(`📚 Registry exported to ${filePath}`);
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to export registry: ${errorMessage}`);
            return false;
        }
    }
    async importRegistry(filePath, merge = true) {
        try {
            const data = await fs.readJson(filePath);
            if (!merge) {
                this.entries.clear();
                this.initializeIndexes();
            }
            for (const [id, entryData] of Object.entries(data.entries || {})) {
                const entry = entryData;
                entry.registeredAt = new Date(entry.registeredAt);
                entry.lastUpdated = new Date(entry.lastUpdated);
                for (const review of entry.reviews || []) {
                    review.createdAt = new Date(review.createdAt);
                }
                this.entries.set(id, entry);
                this.updateIndexes(id, entry.extension);
            }
            if (this.config.enablePersistence) {
                await this.saveToFile();
            }
            this.logger.info(`📚 Registry imported from ${filePath}`);
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to import registry: ${errorMessage}`);
            return false;
        }
    }
    async clearRegistry() {
        this.entries.clear();
        this.initializeIndexes();
        if (this.config.enablePersistence) {
            await this.saveToFile();
        }
        this.emit('registryCleared');
        this.logger.info('📚 Registry cleared');
    }
}
exports.ExtensionRegistry = ExtensionRegistry;
//# sourceMappingURL=ExtensionRegistry.js.map
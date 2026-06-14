import { z } from 'zod';
export const DurableMemoryEntrySchema = z.object({
    id: z.string(),
    key: z.string(),
    content: z.string(),
    category: z.enum(['preference', 'fact', 'instruction', 'context']),
    priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
    createdAt: z.number(),
    updatedAt: z.number(),
    expiresAt: z.number().optional(),
    source: z.string().optional(),
    tags: z.array(z.string()).default([]),
});
export const MEMORY_CONSTRAINTS = {
    maxEntriesPerCategory: 500,
    maxContentLength: 10000,
    maxTotalEntries: 2000,
    defaultTtlMs: 30 * 24 * 60 * 60 * 1000,
    maxTagsPerEntry: 10,
};
export class DurableMemoryService {
    constructor() {
        this.entries = new Map();
        this.userMd = '';
        this.memoryMd = '';
    }
    save(entry) {
        if (entry.content.length > MEMORY_CONSTRAINTS.maxContentLength) {
            throw new Error(`Content exceeds max length of ${MEMORY_CONSTRAINTS.maxContentLength} characters`);
        }
        const categoryEntries = this.getByCategory(entry.category);
        if (categoryEntries.length >= MEMORY_CONSTRAINTS.maxEntriesPerCategory) {
            const oldest = categoryEntries.sort((a, b) => a.updatedAt - b.updatedAt)[0];
            if (oldest)
                this.entries.delete(oldest.id);
        }
        if (this.entries.size >= MEMORY_CONSTRAINTS.maxTotalEntries) {
            const oldest = Array.from(this.entries.values())
                .sort((a, b) => a.updatedAt - b.updatedAt)[0];
            if (oldest)
                this.entries.delete(oldest.id);
        }
        const now = Date.now();
        const full = {
            ...entry,
            id: `mem_${now}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt: now,
            updatedAt: now,
            tags: entry.tags.slice(0, MEMORY_CONSTRAINTS.maxTagsPerEntry),
        };
        this.entries.set(full.id, full);
        if (entry.category === 'preference' || entry.category === 'fact') {
            this.updateUserMd(full);
        }
        else {
            this.updateMemoryMd(full);
        }
        return full;
    }
    get(id) {
        return this.entries.get(id);
    }
    getByCategory(category) {
        return Array.from(this.entries.values()).filter(e => e.category === category);
    }
    search(query) {
        const q = query.toLowerCase();
        return Array.from(this.entries.values()).filter(e => e.content.toLowerCase().includes(q) ||
            e.key.toLowerCase().includes(q) ||
            e.tags.some(t => t.toLowerCase().includes(q)));
    }
    delete(id) {
        return this.entries.delete(id);
    }
    processDirective(directive, content) {
        const lowerDirective = directive.toLowerCase();
        if (lowerDirective.includes('chuck') || lowerDirective.includes('throw') || lowerDirective.includes('save') || lowerDirective.includes('remember')) {
            const isUserMd = lowerDirective.includes('user.md') || lowerDirective.includes('user file');
            const category = isUserMd ? 'preference' : 'fact';
            return this.save({
                key: this.extractKey(directive),
                content,
                category,
                priority: 'medium',
                expiresAt: Date.now() + MEMORY_CONSTRAINTS.defaultTtlMs,
                source: 'user_directive',
                tags: this.extractTags(content),
            });
        }
        return null;
    }
    getUserMd() {
        return this.userMd;
    }
    getMemoryMd() {
        return this.memoryMd;
    }
    updateUserMd(entry) {
        const line = `- **${entry.key}**: ${entry.content}\n`;
        if (!this.userMd.includes(entry.content)) {
            this.userMd += line;
        }
    }
    updateMemoryMd(entry) {
        const line = `- **${entry.key}**: ${entry.content} [${entry.category}] [${entry.priority}]\n`;
        if (!this.memoryMd.includes(entry.content)) {
            this.memoryMd += line;
        }
    }
    extractKey(directive) {
        const words = directive.split(/\s+/).filter(w => w.length > 3 && !['chuck', 'throw', 'that', 'this', 'into', 'save', 'remember'].includes(w.toLowerCase()));
        return words.slice(0, 3).join('_').replace(/[^a-zA-Z0-9_]/g, '') || 'unnamed';
    }
    extractTags(content) {
        const words = content.split(/\s+/).filter(w => w.length > 4);
        return words.slice(0, MEMORY_CONSTRAINTS.maxTagsPerEntry).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
}
//# sourceMappingURL=durableMemoryService.js.map
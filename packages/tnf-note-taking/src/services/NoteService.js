import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { frontmatter } from '../utils/frontmatter.js';
/**
 * Service for managing notes in the TNF note-taking system
 * Provides Obsidian-like functionality including wikilinks, tags, and graph view
 * Supports multi-tenancy via user-specific vaults
 */
export class NoteService {
    constructor(options = {}) {
        this.notesIndex = new Map();
        this.tagsIndex = new Map(); // tag -> noteIds
        this.wikilinksIndex = new Map(); // wikilink -> noteIds
        // Determine user ID: explicit param, env var, or OS user
        const userId = options.userId || process.env.TNF_USER_ID || os.userInfo().username;
        // Base vault path: explicit param, env var, or default ~/.tnf/vault
        const baseVaultPath = options.vaultPath || process.env.TNF_VAULT_PATH || path.join(os.homedir(), '.tnf', 'vault');
        // User-specific vault path
        this.vaultPath = path.join(baseVaultPath, userId);
        // Ensure vault directory exists
        if (!fs.existsSync(this.vaultPath)) {
            fs.mkdirSync(this.vaultPath, { recursive: true });
        }
        // Load existing notes into indices
        this.loadVaultIndex();
    }
    /**
     * Load all notes from the vault into memory indices
     */
    loadVaultIndex() {
        const noteFiles = this.getNoteFiles();
        for (const file of noteFiles) {
            try {
                const filePath = path.join(this.vaultPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const { data, content: body } = frontmatter(content);
                const noteId = path.parse(file).name; // filename without extension
                const metadata = {
                    id: noteId,
                    title: data.title || noteId,
                    content: body,
                    tags: data.tags || [],
                    createdAt: data.createdAt || new Date().toISOString(),
                    updatedAt: data.updatedAt || new Date().toISOString(),
                    filePath: filePath,
                };
                this.notesIndex.set(noteId, metadata);
                this.indexNoteTags(noteId, metadata.tags);
                this.indexNoteWikilinks(noteId, body);
            }
            catch (error) {
                console.warn(`Failed to load note ${file}:`, error);
            }
        }
    }
    /**
     * Get all markdown files in the vault
     */
    getNoteFiles() {
        if (!fs.existsSync(this.vaultPath))
            return [];
        const files = fs.readdirSync(this.vaultPath);
        return files.filter((file) => file.endsWith('.md') || file.endsWith('.markdown'));
    }
    /**
     * Index tags for a note
     */
    indexNoteTags(noteId, tags) {
        for (const tag of tags) {
            if (!this.tagsIndex.has(tag)) {
                this.tagsIndex.set(tag, new Set());
            }
            this.tagsIndex.get(tag).add(noteId);
        }
    }
    /**
     * Index wikilinks for a note
     */
    indexNoteWikilinks(noteId, content) {
        // Match [[wikilink]] or [[wikilink|alias]]
        const wikilinkRegex = /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g;
        let match;
        while ((match = wikilinkRegex.exec(content)) !== null) {
            const wikilink = match[1].trim();
            if (!this.wikilinksIndex.has(wikilink)) {
                this.wikilinksIndex.set(wikilink, new Set());
            }
            this.wikilinksIndex.get(wikilink).add(noteId);
        }
    }
    /**
     * Get all notes
     */
    getAllNotes() {
        return Array.from(this.notesIndex.values()).map((metadata) => ({
            ...metadata,
            tags: [...(metadata.tags || [])],
        }));
    }
    /**
     * Get a note by ID
     */
    getNoteById(id) {
        const metadata = this.notesIndex.get(id);
        if (!metadata)
            return null;
        return {
            ...metadata,
            tags: [...(metadata.tags || [])],
        };
    }
    /**
     * Get a note by title (exact match)
     */
    getNoteByTitle(title) {
        for (const note of this.getAllNotes()) {
            if (note.title === title) {
                return note;
            }
        }
        return null;
    }
    /**
     * Create a new note
     */
    async createNote(options) {
        try {
            // Generate ID from title if not provided
            const id = options.id || this.slugify(options.title);
            // Check if note already exists
            if (this.notesIndex.has(id)) {
                return {
                    success: false,
                    error: `Note with ID '${id}' already exists`,
                };
            }
            // Prepare tags
            const tags = options.tags || [];
            // Prepare content with frontmatter
            const frontmatterData = {
                title: options.title,
                tags: tags,
                createdAt: options.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const content = `---\n${Object.entries(frontmatterData)
                .map(([key, value]) => {
                if (Array.isArray(value)) {
                    return `${key}: [${value.map((v) => JSON.stringify(v)).join(', ')}]`;
                }
                return `${key}: ${JSON.stringify(value)}`;
            })
                .join('\n')}\n---\n\n${options.content || ''}`;
            // Write file
            const filePath = path.join(this.vaultPath, `${id}.md`);
            fs.writeFileSync(filePath, content, 'utf8');
            // Update indices
            const metadata = {
                id,
                title: options.title,
                content: options.content || '',
                tags,
                createdAt: frontmatterData.createdAt,
                updatedAt: frontmatterData.updatedAt,
                filePath,
            };
            this.notesIndex.set(id, metadata);
            this.indexNoteTags(id, tags);
            this.indexNoteWikilinks(id, options.content || '');
            return {
                success: true,
                id,
                message: `Note created successfully`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Update an existing note
     */
    async updateNote(id, options) {
        try {
            const existingNote = this.getNoteById(id);
            if (!existingNote) {
                return {
                    success: false,
                    error: `Note with ID '${id}' not found`,
                };
            }
            // Prepare updates
            const title = options.title ?? existingNote.title;
            const content = options.content ?? existingNote.content;
            const tags = options.tags ?? existingNote.tags;
            // Prepare content with frontmatter
            const frontmatterData = {
                title,
                tags,
                createdAt: existingNote.createdAt, // Keep original creation date
                updatedAt: new Date().toISOString(),
            };
            const contentToWrite = `---\n${Object.entries(frontmatterData)
                .map(([key, value]) => {
                if (Array.isArray(value)) {
                    return `${key}: [${value.map((v) => JSON.stringify(v)).join(', ')}]`;
                }
                return `${key}: ${JSON.stringify(value)}`;
            })
                .join('\n')}\n---\n\n${content}`;
            // Write file
            const filePath = path.join(this.vaultPath, `${id}.md`);
            fs.writeFileSync(filePath, contentToWrite, 'utf8');
            // Update indices (remove old, add new)
            // Remove old tags and wikilinks indices
            this.tagsIndex.clear();
            this.wikilinksIndex.clear();
            // Rebuild indices from scratch (simpler than trying to update)
            this.loadVaultIndex();
            return {
                success: true,
                id,
                message: `Note updated successfully`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Delete a note
     */
    async deleteNote(id) {
        try {
            const existingNote = this.getNoteById(id);
            if (!existingNote) {
                return {
                    success: false,
                    error: `Note with ID '${id}' not found`,
                };
            }
            // Delete file
            const filePath = path.join(this.vaultPath, `${id}.md`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            // Remove from indices
            this.notesIndex.delete(id);
            // Rebuild indices from scratch
            this.tagsIndex.clear();
            this.wikilinksIndex.clear();
            this.loadVaultIndex();
            return {
                success: true,
                id,
                message: `Note deleted successfully`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Search notes by content
     */
    searchNotes(query, limit = 10) {
        if (!query.trim())
            return [];
        const lowerQuery = query.toLowerCase();
        const results = [];
        for (const note of this.getAllNotes()) {
            if (note.title.toLowerCase().includes(lowerQuery) ||
                note.content.toLowerCase().includes(lowerQuery)) {
                results.push({
                    ...note,
                    // Create a snippet showing the match
                    snippet: this.createSnippet(note.content, lowerQuery),
                });
                if (results.length >= limit)
                    break;
            }
        }
        return results;
    }
    /**
     * Get notes by tag
     */
    getNotesByTag(tag) {
        const noteIds = this.tagsIndex.get(tag) || [];
        return Array.from(noteIds)
            .map((id) => this.getNoteById(id))
            .filter((note) => note !== null);
    }
    /**
     * Get all tags
     */
    getAllTags() {
        return Array.from(this.tagsIndex.keys()).sort();
    }
    /**
     * Get backlinks for a note (notes that link to this note)
     */
    getBacklinks(noteIdOrTitle) {
        // First, find the note by ID or title
        let note = null;
        if (this.notesIndex.has(noteIdOrTitle)) {
            note = this.getNoteById(noteIdOrTitle);
        }
        else {
            // Try to find by title
            for (const n of this.getAllNotes()) {
                if (n.title === noteIdOrTitle) {
                    note = n;
                    break;
                }
            }
        }
        if (!note)
            return [];
        // Find notes that link to this note
        const linkedNoteIds = this.wikilinksIndex.get(note.title) || [];
        return Array.from(linkedNoteIds)
            .map((id) => this.getNoteById(id))
            .filter((note) => note !== null);
    }
    /**
     * Get outgoing links (wikilinks) from a note
     */
    getOutgoingLinks(noteId) {
        const note = this.getNoteById(noteId);
        if (!note)
            return [];
        // Extract wikilinks from content
        const wikilinkRegex = /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g;
        const links = [];
        let match;
        while ((match = wikilinkRegex.exec(note.content)) !== null) {
            links.push(match[1].trim());
        }
        return [...new Set(links)]; // Remove duplicates
    }
    /**
     * Get graph data for visualization
     */
    getGraphData() {
        const nodes = [];
        const edges = [];
        // Create nodes for each note
        for (const note of this.getAllNotes()) {
            nodes.push({
                id: note.id,
                label: note.title,
                tags: note.tags || [],
            });
        }
        // Create edges for wikilinks
        for (const note of this.getAllNotes()) {
            const outgoingLinks = this.getOutgoingLinks(note.id);
            for (const linkTitle of outgoingLinks) {
                // Find the target note by title
                const targetNote = this.getNoteByTitle(linkTitle);
                if (targetNote) {
                    edges.push({
                        from: note.id,
                        to: targetNote.id,
                        label: linkTitle,
                    });
                }
            }
        }
        return { nodes, edges };
    }
    /**
     * Create a daily note
     */
    async createDailyNote(templateName) {
        try {
            const today = new Date();
            const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
            const title = `Daily Note ${dateString}`;
            // Get template content if specified
            let content = '';
            if (templateName) {
                const templateNote = this.getNoteByTitle(`Template: ${templateName}`);
                if (templateNote) {
                    content = templateNote.content;
                }
            }
            return await this.createNote({
                title,
                content,
                tags: ['daily'],
                createdAt: today.toISOString(),
            });
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Get service status
     */
    async getStatus() {
        const notes = this.getAllNotes();
        let totalSize = 0;
        for (const note of notes) {
            try {
                const stats = fs.statSync(note.filePath);
                totalSize += stats.size;
            }
            catch (error) {
                // Ignore file stat errors
            }
        }
        return {
            vaultPath: this.vaultPath,
            noteCount: notes.length,
            tagCount: this.tagsIndex.size,
            totalSize,
        };
    }
    /**
     * Helper: Create a snippet showing where the query matches
     */
    createSnippet(content, query, contextLength = 100) {
        const lowerContent = content.toLowerCase();
        const index = lowerContent.indexOf(query);
        if (index === -1) {
            return content.substring(0, Math.min(contextLength, content.length)) + '...';
        }
        const start = Math.max(0, index - contextLength / 2);
        const end = Math.min(content.length, index + query.length + contextLength / 2);
        const before = start > 0 ? '...' : '';
        const after = end < content.length ? '...' : '';
        const snippet = content.substring(start, end);
        return `${before}${snippet}${after}`;
    }
    /**
     * Helper: Convert a string to a slug/ID
     */
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
//# sourceMappingURL=NoteService.js.map
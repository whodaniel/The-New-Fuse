/**
 * Service for managing notes in the TNF note-taking system
 * Provides Obsidian-like functionality including wikilinks, tags, and graph view
 * Supports multi-tenancy via user-specific vaults
 */
export declare class NoteService {
    private vaultPath;
    private notesIndex;
    private tagsIndex;
    private wikilinksIndex;
    constructor(options?: {
        vaultPath?: string;
        userId?: string;
    });
    /**
     * Load all notes from the vault into memory indices
     */
    private loadVaultIndex;
    /**
     * Get all markdown files in the vault
     */
    private getNoteFiles;
    /**
     * Index tags for a note
     */
    private indexNoteTags;
    /**
     * Index wikilinks for a note
     */
    private indexNoteWikilinks;
    /**
     * Get all notes
     */
    getAllNotes(): Note[];
    /**
     * Get a note by ID
     */
    getNoteById(id: string): Note | null;
    /**
     * Get a note by title (exact match)
     */
    getNoteByTitle(title: string): Note | null;
    /**
     * Create a new note
     */
    createNote(options: CreateNoteOptions): Promise<CreateNoteResult>;
    /**
     * Update an existing note
     */
    updateNote(id: string, options: UpdateNoteOptions): Promise<UpdateNoteResult>;
    /**
     * Delete a note
     */
    deleteNote(id: string): Promise<DeleteNoteResult>;
    /**
     * Search notes by content
     */
    searchNotes(query: string, limit?: number): Note[];
    /**
     * Get notes by tag
     */
    getNotesByTag(tag: string): Note[];
    /**
     * Get all tags
     */
    getAllTags(): string[];
    /**
     * Get backlinks for a note (notes that link to this note)
     */
    getBacklinks(noteIdOrTitle: string): Note[];
    /**
     * Get outgoing links (wikilinks) from a note
     */
    getOutgoingLinks(noteId: string): string[];
    /**
     * Get graph data for visualization
     */
    getGraphData(): GraphData;
    /**
     * Create a daily note
     */
    createDailyNote(templateName?: string): Promise<CreateNoteResult>;
    /**
     * Get service status
     */
    getStatus(): Promise<ServiceStatus>;
    /**
     * Helper: Create a snippet showing where the query matches
     */
    private createSnippet;
    /**
     * Helper: Convert a string to a slug/ID
     */
    private slugify;
}
/**
 * Public note interface
 */
export interface Note {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    filePath: string;
    snippet?: string;
}
/**
 * Options for creating a note
 */
export interface CreateNoteOptions {
    id?: string;
    title: string;
    content?: string;
    tags?: string[];
    createdAt?: string;
}
/**
 * Result of creating a note
 */
export interface CreateNoteResult {
    success: boolean;
    id?: string;
    message?: string;
    error?: string;
}
/**
 * Options for updating a note
 */
export interface UpdateNoteOptions {
    title?: string;
    content?: string;
    tags?: string[];
}
/**
 * Result of updating a note
 */
export interface UpdateNoteResult {
    success: boolean;
    id?: string;
    message?: string;
    error?: string;
}
/**
 * Result of deleting a note
 */
export interface DeleteNoteResult {
    success: boolean;
    id?: string;
    message?: string;
    error?: string;
}
/**
 * Service status
 */
export interface ServiceStatus {
    vaultPath: string;
    noteCount: number;
    tagCount: number;
    totalSize: number;
}
/**
 * Graph data for visualization
 */
export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
/**
 * Graph node
 */
export interface GraphNode {
    id: string;
    label: string;
    tags: string[];
}
/**
 * Graph edge
 */
export interface GraphEdge {
    from: string;
    to: string;
    label: string;
}
//# sourceMappingURL=NoteService.d.ts.map
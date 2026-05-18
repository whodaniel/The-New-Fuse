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
  private vaultPath: string;
  private notesIndex: Map<string, NoteMetadata> = new Map();
  private tagsIndex: Map<string, Set<string>> = new Map(); // tag -> noteIds
  private wikilinksIndex: Map<string, Set<string>> = new Map(); // wikilink -> noteIds

  constructor(options: { vaultPath?: string; userId?: string } = {}) {
    // Determine user ID: explicit param, env var, or OS user
    const userId = options.userId || process.env.TNF_USER_ID || os.userInfo().username;

    // Base vault path: explicit param, env var, or default ~/.tnf/vault
    const baseVaultPath =
      options.vaultPath || process.env.TNF_VAULT_PATH || path.join(os.homedir(), '.tnf', 'vault');

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
  private loadVaultIndex(): void {
    const noteFiles = this.getNoteFiles();

    for (const file of noteFiles) {
      try {
        const filePath = path.join(this.vaultPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data, content: body } = frontmatter(content);

        const noteId = path.parse(file).name; // filename without extension
        const metadata: NoteMetadata = {
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
      } catch (error) {
        console.warn(`Failed to load note ${file}:`, error);
      }
    }
  }

  /**
   * Get all markdown files in the vault
   */
  private getNoteFiles(): string[] {
    if (!fs.existsSync(this.vaultPath)) return [];

    const files = fs.readdirSync(this.vaultPath);
    return files.filter((file) => file.endsWith('.md') || file.endsWith('.markdown'));
  }

  /**
   * Index tags for a note
   */
  private indexNoteTags(noteId: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tagsIndex.has(tag)) {
        this.tagsIndex.set(tag, new Set());
      }
      this.tagsIndex.get(tag)!.add(noteId);
    }
  }

  /**
   * Index wikilinks for a note
   */
  private indexNoteWikilinks(noteId: string, content: string): void {
    // Match [[wikilink]] or [[wikilink|alias]]
    const wikilinkRegex = /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g;
    let match;

    while ((match = wikilinkRegex.exec(content)) !== null) {
      const wikilink = match[1].trim();
      if (!this.wikilinksIndex.has(wikilink)) {
        this.wikilinksIndex.set(wikilink, new Set());
      }
      this.wikilinksIndex.get(wikilink)!.add(noteId);
    }
  }

  /**
   * Get all notes
   */
  getAllNotes(): Note[] {
    return Array.from(this.notesIndex.values()).map((metadata) => ({
      ...metadata,
      tags: [...(metadata.tags || [])],
    }));
  }

  /**
   * Get a note by ID
   */
  getNoteById(id: string): Note | null {
    const metadata = this.notesIndex.get(id);
    if (!metadata) return null;

    return {
      ...metadata,
      tags: [...(metadata.tags || [])],
    };
  }

  /**
   * Get a note by title (exact match)
   */
  getNoteByTitle(title: string): Note | null {
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
  async createNote(options: CreateNoteOptions): Promise<CreateNoteResult> {
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
      const metadata: NoteMetadata = {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(id: string, options: UpdateNoteOptions): Promise<UpdateNoteResult> {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<DeleteNoteResult> {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search notes by content
   */
  searchNotes(query: string, limit: number = 10): Note[] {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const results: Note[] = [];

    for (const note of this.getAllNotes()) {
      if (
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          ...note,
          // Create a snippet showing the match
          snippet: this.createSnippet(note.content, lowerQuery),
        });

        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Get notes by tag
   */
  getNotesByTag(tag: string): Note[] {
    const noteIds = this.tagsIndex.get(tag) || [];
    return Array.from(noteIds)
      .map((id) => this.getNoteById(id))
      .filter((note): note is Note => note !== null);
  }

  /**
   * Get all tags
   */
  getAllTags(): string[] {
    return Array.from(this.tagsIndex.keys()).sort();
  }

  /**
   * Get backlinks for a note (notes that link to this note)
   */
  getBacklinks(noteIdOrTitle: string): Note[] {
    // First, find the note by ID or title
    let note: Note | null = null;
    if (this.notesIndex.has(noteIdOrTitle)) {
      note = this.getNoteById(noteIdOrTitle);
    } else {
      // Try to find by title
      for (const n of this.getAllNotes()) {
        if (n.title === noteIdOrTitle) {
          note = n;
          break;
        }
      }
    }

    if (!note) return [];

    // Find notes that link to this note
    const linkedNoteIds = this.wikilinksIndex.get(note.title) || [];
    return Array.from(linkedNoteIds)
      .map((id) => this.getNoteById(id))
      .filter((note): note is Note => note !== null);
  }

  /**
   * Get outgoing links (wikilinks) from a note
   */
  getOutgoingLinks(noteId: string): string[] {
    const note = this.getNoteById(noteId);
    if (!note) return [];

    // Extract wikilinks from content
    const wikilinkRegex = /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g;
    const links: string[] = [];
    let match;

    while ((match = wikilinkRegex.exec(note.content)) !== null) {
      links.push(match[1].trim());
    }

    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Get graph data for visualization
   */
  getGraphData(): GraphData {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

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
  async createDailyNote(templateName?: string): Promise<CreateNoteResult> {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<ServiceStatus> {
    const notes = this.getAllNotes();
    let totalSize = 0;

    for (const note of notes) {
      try {
        const stats = fs.statSync(note.filePath);
        totalSize += stats.size;
      } catch (error) {
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
  private createSnippet(content: string, query: string, contextLength: number = 100): string {
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
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

/**
 * Note metadata (internal representation)
 */
interface NoteMetadata {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  filePath: string;
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
  snippet?: string; // For search results
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

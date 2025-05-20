/**
 * Code snippets manager for The New Fuse - AI Bridge
 */
import { Logger } from './logger.js';

// Create a code snippets-specific logger
const codeSnippetsLogger = new Logger({
  name: 'CodeSnippets',
  level: 'info',
  saveToStorage: true
});

/**
 * Code snippet
 */
interface CodeSnippet {
  id: string;
  name: string;
  language: string;
  code: string;
  description?: string;
  tags?: string[];
  created: number;
  modified: number;
}

/**
 * Code snippets manager
 */
export class CodeSnippetsManager {
  private snippets: CodeSnippet[];
  private logger: Logger;

  /**
   * Create a new CodeSnippetsManager
   */
  constructor() {
    this.snippets = [];
    this.logger = codeSnippetsLogger;
    this.loadSnippets();
  }

  /**
   * Load snippets from storage
   */
  private async loadSnippets(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['codeSnippets']);
      if (result.codeSnippets) {
        this.snippets = result.codeSnippets;
        this.logger.info(`Loaded ${this.snippets.length} code snippets`);
      }
    } catch (error) {
      this.logger.error('Error loading code snippets', error);
    }
  }

  /**
   * Save snippets to storage
   */
  private async saveSnippets(): Promise<void> {
    try {
      await chrome.storage.local.set({ codeSnippets: this.snippets });
      this.logger.info(`Saved ${this.snippets.length} code snippets`);
    } catch (error) {
      this.logger.error('Error saving code snippets', error);
    }
  }

  /**
   * Add a new snippet
   * @param snippet - Code snippet
   * @returns Snippet ID
   */
  addSnippet(snippet: Omit<CodeSnippet, 'id' | 'created' | 'modified'>): string {
    const id = `snippet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();
    
    const newSnippet: CodeSnippet = {
      id,
      ...snippet,
      created: now,
      modified: now
    };
    
    this.snippets.push(newSnippet);
    this.saveSnippets();
    this.logger.info(`Added new snippet: ${snippet.name} (${id})`);
    
    return id;
  }

  /**
   * Update a snippet
   * @param id - Snippet ID
   * @param snippet - Updated snippet
   * @returns Whether the snippet was updated
   */
  updateSnippet(id: string, snippet: Partial<Omit<CodeSnippet, 'id' | 'created' | 'modified'>>): boolean {
    const index = this.snippets.findIndex(s => s.id === id);
    
    if (index === -1) {
      this.logger.warn(`Cannot update unknown snippet: ${id}`);
      return false;
    }
    
    this.snippets[index] = {
      ...this.snippets[index],
      ...snippet,
      modified: Date.now()
    };
    
    this.saveSnippets();
    this.logger.info(`Updated snippet: ${this.snippets[index].name} (${id})`);
    
    return true;
  }

  /**
   * Delete a snippet
   * @param id - Snippet ID
   * @returns Whether the snippet was deleted
   */
  deleteSnippet(id: string): boolean {
    const index = this.snippets.findIndex(s => s.id === id);
    
    if (index === -1) {
      this.logger.warn(`Cannot delete unknown snippet: ${id}`);
      return false;
    }
    
    const snippet = this.snippets[index];
    this.snippets.splice(index, 1);
    this.saveSnippets();
    this.logger.info(`Deleted snippet: ${snippet.name} (${id})`);
    
    return true;
  }

  /**
   * Get a snippet by ID
   * @param id - Snippet ID
   * @returns Snippet or null if not found
   */
  getSnippet(id: string): CodeSnippet | null {
    const snippet = this.snippets.find(s => s.id === id);
    
    if (!snippet) {
      this.logger.warn(`Snippet not found: ${id}`);
      return null;
    }
    
    return { ...snippet };
  }

  /**
   * Get all snippets
   * @returns All snippets
   */
  getAllSnippets(): CodeSnippet[] {
    return [...this.snippets];
  }

  /**
   * Search snippets
   * @param query - Search query
   * @returns Matching snippets
   */
  searchSnippets(query: string): CodeSnippet[] {
    if (!query) {
      return this.getAllSnippets();
    }
    
    const lowerQuery = query.toLowerCase();
    
    return this.snippets.filter(snippet => {
      return (
        snippet.name.toLowerCase().includes(lowerQuery) ||
        snippet.description?.toLowerCase().includes(lowerQuery) ||
        snippet.code.toLowerCase().includes(lowerQuery) ||
        snippet.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * Filter snippets by language
   * @param language - Language to filter by
   * @returns Matching snippets
   */
  filterByLanguage(language: string): CodeSnippet[] {
    if (!language) {
      return this.getAllSnippets();
    }
    
    const lowerLanguage = language.toLowerCase();
    
    return this.snippets.filter(snippet => {
      return snippet.language.toLowerCase() === lowerLanguage;
    });
  }

  /**
   * Filter snippets by tag
   * @param tag - Tag to filter by
   * @returns Matching snippets
   */
  filterByTag(tag: string): CodeSnippet[] {
    if (!tag) {
      return this.getAllSnippets();
    }
    
    const lowerTag = tag.toLowerCase();
    
    return this.snippets.filter(snippet => {
      return snippet.tags?.some(t => t.toLowerCase() === lowerTag);
    });
  }

  /**
   * Get all languages
   * @returns All languages
   */
  getAllLanguages(): string[] {
    const languages = new Set<string>();
    
    this.snippets.forEach(snippet => {
      languages.add(snippet.language);
    });
    
    return Array.from(languages);
  }

  /**
   * Get all tags
   * @returns All tags
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    
    this.snippets.forEach(snippet => {
      snippet.tags?.forEach(tag => {
        tags.add(tag);
      });
    });
    
    return Array.from(tags);
  }

  /**
   * Import snippets
   * @param snippets - Snippets to import
   * @returns Number of imported snippets
   */
  importSnippets(snippets: CodeSnippet[]): number {
    let imported = 0;
    
    snippets.forEach(snippet => {
      // Check if snippet already exists
      const existing = this.snippets.find(s => s.id === snippet.id);
      
      if (existing) {
        // Update existing snippet
        this.updateSnippet(snippet.id, snippet);
      } else {
        // Add new snippet
        this.snippets.push({
          ...snippet,
          modified: Date.now()
        });
      }
      
      imported++;
    });
    
    this.saveSnippets();
    this.logger.info(`Imported ${imported} snippets`);
    
    return imported;
  }

  /**
   * Export snippets
   * @returns Snippets as JSON
   */
  exportSnippets(): string {
    return JSON.stringify(this.snippets, null, 2);
  }

  /**
   * Clear all snippets
   */
  clearSnippets(): void {
    this.snippets = [];
    this.saveSnippets();
    this.logger.info('Cleared all snippets');
  }
}

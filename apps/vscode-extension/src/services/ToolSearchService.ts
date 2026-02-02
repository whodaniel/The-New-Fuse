/**
 * Tool Search Service - Implements Anthropic's Tool Discovery Protocol
 *
 * This service provides dynamic tool discovery using both regex and BM25 search
 * algorithms, aligning with the advanced-tool-use-2025-11-20 beta feature.
 *
 * @see https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool
 */

import { MCPTool, ToolDefinition, ToolSearchConfig, ToolSearchResult } from '../core/types';
import { log } from '../utils/logger';

/**
 * BM25 index structure for tool search
 */
interface BM25Index {
  documents: string[]; // Combined text (name + description + keywords) per tool
  termFrequencies: Map<string, Map<number, number>>; // term -> (docIndex -> frequency)
  documentFrequencies: Map<string, number>; // term -> number of documents containing it
  documentLengths: number[]; // Length of each document
  avgDocLength: number; // Average document length
  k1: number; // BM25 k1 parameter (typically 1.2-2.0)
  b: number; // BM25 b parameter (typically 0.75)
}

/**
 * Default configuration for tool search
 */
const DEFAULT_CONFIG: ToolSearchConfig = {
  enabled: true,
  maxResults: 5,
  defaultMethod: 'bm25',
  alwaysLoadedTools: ['read_file', 'write_file', 'list_directory', 'search_files'],
  deferredCategories: ['google', 'automation', 'external', 'database'],
};

/**
 * Tool Search Service singleton
 * Provides BM25 and regex-based tool discovery for the Tool Search Protocol
 */
export class ToolSearchService {
  private static instance: ToolSearchService;
  private config: ToolSearchConfig;
  private bm25Index: BM25Index | null = null;
  private allTools: MCPTool[] = [];
  private toolsByName: Map<string, MCPTool> = new Map();

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): ToolSearchService {
    if (!ToolSearchService.instance) {
      ToolSearchService.instance = new ToolSearchService();
    }
    return ToolSearchService.instance;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<ToolSearchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ToolSearchConfig {
    return { ...this.config };
  }

  /**
   * Index all available tools for search
   * Should be called whenever the tool set changes
   */
  indexTools(tools: MCPTool[]): void {
    const startTime = Date.now();
    this.allTools = tools;

    // Build name lookup map
    this.toolsByName.clear();
    for (const tool of tools) {
      this.toolsByName.set(tool.name, tool);
    }

    // Build BM25 index
    this.buildBM25Index(tools);

    const elapsed = Date.now() - startTime;
    log.info(`Indexed ${tools.length} tools for search in ${elapsed}ms`);
  }

  /**
   * Search tools using regex pattern
   * Implements tool_search_tool_regex_20251119
   */
  searchByRegex(pattern: string, maxResults: number = this.config.maxResults): ToolSearchResult {
    const startTime = Date.now();

    try {
      // Validate pattern length (max 200 chars per spec)
      if (pattern.length > 200) {
        log.warn('Regex pattern exceeds 200 character limit, truncating');
        pattern = pattern.slice(0, 200);
      }

      const regex = new RegExp(pattern, 'i');
      const matchedTools = this.allTools
        .filter((tool) => regex.test(tool.name) || regex.test(tool.description))
        .slice(0, maxResults);

      const result: ToolSearchResult = {
        tools: matchedTools.map((t) => this.toToolDefinition(t)),
        search_query: pattern,
        search_method: 'regex',
        total_available: this.allTools.length,
        processing_time_ms: Date.now() - startTime,
      };

      log.debug(`Regex search for "${pattern}" found ${matchedTools.length} tools`);
      return result;
    } catch (error) {
      log.error('Invalid regex pattern', error);
      return {
        tools: [],
        search_query: pattern,
        search_method: 'regex',
        total_available: this.allTools.length,
        processing_time_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Search tools using BM25 algorithm
   * Implements tool_search_tool_bm25_20251119
   */
  searchByBM25(query: string, maxResults: number = this.config.maxResults): ToolSearchResult {
    const startTime = Date.now();

    if (!this.bm25Index) {
      log.warn('BM25 index not built, falling back to regex search');
      return this.searchByRegex(query, maxResults);
    }

    const scores = this.scoreBM25(query);
    const topTools = scores
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((s) => this.allTools[s.index]);

    const result: ToolSearchResult = {
      tools: topTools.map((t) => this.toToolDefinition(t)),
      search_query: query,
      search_method: 'bm25',
      total_available: this.allTools.length,
      processing_time_ms: Date.now() - startTime,
    };

    log.debug(`BM25 search for "${query}" found ${topTools.length} tools`);
    return result;
  }

  /**
   * Search tools using the default method
   */
  search(query: string, maxResults?: number): ToolSearchResult {
    if (this.config.defaultMethod === 'regex') {
      return this.searchByRegex(query, maxResults);
    }
    return this.searchByBM25(query, maxResults);
  }

  /**
   * Get tools that should always be loaded (not deferred)
   */
  getAlwaysLoadedTools(): MCPTool[] {
    return this.allTools.filter(
      (tool) =>
        tool.always_load === true ||
        tool.defer_loading === false ||
        this.config.alwaysLoadedTools.includes(tool.name)
    );
  }

  /**
   * Get tools that should be deferred (lazy loaded)
   */
  getDeferredTools(): MCPTool[] {
    return this.allTools.filter(
      (tool) =>
        tool.defer_loading === true &&
        tool.always_load !== true &&
        !this.config.alwaysLoadedTools.includes(tool.name)
    );
  }

  /**
   * Get a specific tool by name
   */
  getToolByName(name: string): MCPTool | undefined {
    return this.toolsByName.get(name);
  }

  /**
   * Convert MCPTool to ToolDefinition format for Anthropic API
   */
  toToolDefinition(tool: MCPTool): ToolDefinition {
    return {
      name: tool.name,
      description: tool.description,
      input_schema: (tool.inputSchema as ToolDefinition['input_schema']) || {
        type: 'object',
        properties: {},
        required: [],
      },
      defer_loading: tool.defer_loading,
    };
  }

  /**
   * Expand tool references to full definitions
   * Used when Claude returns tool_reference blocks
   */
  expandToolReferences(toolNames: string[]): ToolDefinition[] {
    return toolNames
      .map((name) => this.toolsByName.get(name))
      .filter((tool): tool is MCPTool => tool !== undefined)
      .map((tool) => this.toToolDefinition(tool));
  }

  // ==========================================
  // BM25 Implementation
  // ==========================================

  /**
   * Build BM25 index from tools
   */
  private buildBM25Index(tools: MCPTool[]): void {
    const documents: string[] = [];
    const termFrequencies = new Map<string, Map<number, number>>();
    const documentFrequencies = new Map<string, number>();
    const documentLengths: number[] = [];

    // Build document corpus and term frequencies
    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      // Combine name, description, and keywords into searchable text
      const text = [tool.name, tool.description, ...(tool.keywords || [])].join(' ').toLowerCase();

      documents.push(text);

      const terms = this.tokenize(text);
      documentLengths.push(terms.length);

      // Count term frequencies in this document
      const termCounts = new Map<string, number>();
      for (const term of terms) {
        termCounts.set(term, (termCounts.get(term) || 0) + 1);
      }

      // Update global term frequency maps
      for (const [term, count] of termCounts) {
        if (!termFrequencies.has(term)) {
          termFrequencies.set(term, new Map());
        }
        termFrequencies.get(term)!.set(i, count);

        // Update document frequency
        documentFrequencies.set(term, (documentFrequencies.get(term) || 0) + 1);
      }
    }

    // Calculate average document length
    const avgDocLength =
      documentLengths.length > 0
        ? documentLengths.reduce((a, b) => a + b, 0) / documentLengths.length
        : 0;

    this.bm25Index = {
      documents,
      termFrequencies,
      documentFrequencies,
      documentLengths,
      avgDocLength,
      k1: 1.5, // Typical BM25 parameter
      b: 0.75, // Typical BM25 parameter
    };
  }

  /**
   * Score documents against a query using BM25
   */
  private scoreBM25(query: string): Array<{ index: number; score: number }> {
    if (!this.bm25Index) return [];

    const { termFrequencies, documentFrequencies, documentLengths, avgDocLength, k1, b } =
      this.bm25Index;

    const queryTerms = this.tokenize(query.toLowerCase());
    const N = documentLengths.length;
    const scores: Array<{ index: number; score: number }> = [];

    for (let docIndex = 0; docIndex < N; docIndex++) {
      let score = 0;
      const docLength = documentLengths[docIndex];

      for (const term of queryTerms) {
        const df = documentFrequencies.get(term) || 0;
        if (df === 0) continue;

        const termFreqMap = termFrequencies.get(term);
        const tf = termFreqMap?.get(docIndex) || 0;
        if (tf === 0) continue;

        // IDF component: log((N - df + 0.5) / (df + 0.5) + 1)
        const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

        // TF component with length normalization
        const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * docLength) / avgDocLength));

        score += idf * tfNorm;
      }

      scores.push({ index: docIndex, score });
    }

    return scores;
  }

  /**
   * Tokenize text into searchable terms
   */
  private tokenize(text: string): string[] {
    // Split on whitespace and punctuation, filter empty strings
    return text
      .split(/[\s\-_.,;:!?()[\]{}'"<>\/\\]+/)
      .filter((token) => token.length > 1) // Skip single-char tokens
      .map((token) => token.toLowerCase());
  }
}

// ==========================================
// Built-in Tool Search Tool Definitions
// ==========================================

/**
 * Regex-based tool search tool definition
 * For use with Anthropic API when tool_search is enabled
 */
export const TOOL_SEARCH_REGEX_DEFINITION: ToolDefinition = {
  name: 'tool_search_tool_regex_20251119',
  description:
    'Search available tools using a regex pattern. Searches tool names and descriptions. Returns 3-5 most relevant tools. Use this when you know the exact tool name pattern.',
  input_schema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description:
          'Python regex pattern to match tool names or descriptions. Max 200 chars. Examples: "weather", "get_.*_data", "(?i)slack"',
      },
    },
    required: ['pattern'],
  },
  // Note: Tool search tools should never be deferred
};

/**
 * BM25-based tool search tool definition
 * For use with Anthropic API when tool_search is enabled
 */
export const TOOL_SEARCH_BM25_DEFINITION: ToolDefinition = {
  name: 'tool_search_tool_bm25_20251119',
  description:
    'Search available tools using natural language. Uses BM25 relevance ranking. Returns 3-5 most relevant tools. Use this for semantic/conceptual tool discovery.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Natural language query describing the functionality you need. Example: "send a message to slack channel"',
      },
    },
    required: ['query'],
  },
  // Note: Tool search tools should never be deferred
};

// Export singleton getter for convenience
export const getToolSearchService = (): ToolSearchService => ToolSearchService.getInstance();

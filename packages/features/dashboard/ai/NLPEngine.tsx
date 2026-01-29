import { DashboardState } from '../collaboration/types';

interface NLPQuery {
  type: 'search' | 'filter' | 'sort' | 'analyze';
  intent: string;
  parameters: Record<string, unknown>;
  confidence: number;
}

interface EntityMention {
  text: string;
  type: string;
  start: number;
  end: number;
  confidence: number;
}

interface NLPResult {
  query: NLPQuery;
  entities: EntityMention[];
  expandedQuery: string;
  suggestions: string[];
}

export class NLPEngine {
  private vocabulary: Set<string>;
  private synonyms: Map<string, string[]>;
  private entityPatterns: Map<string, RegExp>;

  constructor() {
    this.vocabulary = new Set();
    this.synonyms = new Map();
    this.entityPatterns = new Map();
    this.initialize();
  }

  private initialize() {
    this.initializeVocabulary();
    this.initializeSynonyms();
    this.initializeEntityPatterns();
  }

  private initializeVocabulary() {
    const terms = [
      'dashboard',
      'widget',
      'chart',
      'graph',
      'table',
      'filter',
      'sort',
      'group',
      'analyze',
      'compare',
      'trend',
      'performance',
      'metrics',
      'data',
    ];
    terms.forEach((term) => this.vocabulary.add(term));
  }

  private initializeSynonyms() {
    this.synonyms.set('show', ['display', 'view', 'see']);
    this.synonyms.set('chart', ['graph', 'plot', 'visualization']);
    this.synonyms.set('increase', ['rise', 'grow', 'up']);
    this.synonyms.set('decrease', ['fall', 'drop', 'down']);
    this.synonyms.set('compare', ['versus', 'vs', 'against']);
  }

  private initializeEntityPatterns() {
    this.entityPatterns.set(
      'date',
      /\b(today|yesterday|last (week|month|year)|next (week|month|year))\b/gi
    );
    this.entityPatterns.set('category', /\b(performance|usage|errors|traffic)\b/gi);
  }

  public async processQuery(query: string, context: DashboardState): Promise<NLPResult> {
    const normalizedQuery = this.normalizeQuery(query);
    const entities = this.extractEntities(normalizedQuery);

    const nlpQuery = this.determineQueryIntent(normalizedQuery, entities, context);
    const expandedQuery = this.expandQuery(normalizedQuery, entities, context);
    const suggestions = this.generateSuggestions(normalizedQuery, entities, context);

    return {
      query: nlpQuery,
      entities,
      expandedQuery,
      suggestions,
    };
  }

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,\/#!$%\^&\*;:{}=_`~()]/g, ' ');
  }

  private extractEntities(query: string): EntityMention[] {
    const entities: EntityMention[] = [];
    for (const [type, pattern] of this.entityPatterns.entries()) {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(query)) !== null) {
        entities.push({
          text: match[0],
          type,
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.9,
        });
      }
    }
    return entities;
  }

  private determineQueryIntent(
    query: string,
    entities: EntityMention[],
    context: DashboardState
  ): NLPQuery {
    if (query.includes('find') || query.includes('search') || query.includes('show')) {
      return {
        type: 'search',
        intent: 'find_content',
        parameters: { entities: entities.map((e) => e.text) },
        confidence: 0.8,
      };
    }

    if (query.includes('filter') || query.includes('only') || entities.length > 0) {
      return {
        type: 'filter',
        intent: 'apply_filters',
        parameters: {
          filters: entities.map((e) => ({ type: e.type, value: e.text })),
        },
        confidence: 0.85,
      };
    }

    return {
      type: 'search',
      intent: 'general_search',
      parameters: {},
      confidence: 0.6,
    };
  }

  private expandQuery(query: string, entities: EntityMention[], context: DashboardState): string {
    let expanded = query;
    for (const [word, synonyms] of this.synonyms.entries()) {
      if (query.includes(word)) {
        expanded = `${expanded} ${synonyms.join(' ')}`;
      }
    }
    return expanded;
  }

  private generateSuggestions(
    query: string,
    entities: EntityMention[],
    context: DashboardState
  ): string[] {
    return ['Try filtering by date', 'Compare performance with last week'];
  }
}

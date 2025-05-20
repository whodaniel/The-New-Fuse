"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NLPEngine = void 0;
class NLPEngine {
    constructor() {
        this.vocabulary = new Set();
        string,
            context;
        types_1.DashboardState;
        Promise < NLPResult > {
            // Preprocess query
            const: normalizedQuery, nlpQuery,
            entities,
            expandedQuery,
            suggestions,
        };
    }
}
exports.NLPEngine = NLPEngine;
() => ;
(nlpResult, context) => {
    const config = this.normalizeQuery(query);
    nlpResult.expandedQuery,
        filters;
    { }
};
// Add filters based on entities
for (const entity of nlpResult)
    : unknown;
{
    switch (entity) {
    }
    unknown;
    {
        'date';
        config.filters.dateRange = this.extractEntities(normalizedQuery);
        // Determine query intent
        const nlpQuery = this.determineQueryIntent(normalizedQuery, entities, context);
        // Expand query with synonyms and context
        const expandedQuery = this.expandQuery(normalizedQuery, entities, context);
        // Generate query suggestions
        const suggestions = this.generateSuggestions(normalizedQuery, entities, context);
        return {
            query
        };
        {
            query;
            this.parseDateRange(entity, config.filters.category = [
                ...(config.filters.category || []),
                entity.text,
            ]);
            break;
            'tag';
            config.filters.tags = [
                ...(config.filters.tags || []),
                entity.text,
            ];
            break;
            'creator';
            config.filters.creator = [
                ...(config.filters.creator || []),
                entity.text,
            ];
            break;
        }
    }
    // Add sorting if specified in query
    if (nlpResult.(query).type === 'sort')
        : unknown;
    {
        config.sort = {
            field: nlpResult.query.(parameters).field,
            order: nlpResult.query.(parameters).order,
        };
    }
    return config;
}
initialize();
{
    // Initialize vocabulary
    this.initializeVocabulary();
    // Initialize synonyms
    this.initializeSynonyms();
    // Initialize entity patterns
    this.initializeEntityPatterns();
}
initializeVocabulary();
{
    // Add common dashboard terms
    const terms;
    2;
}
/: unknown){1,2}\d{2,4}))\b/gi;
;
this.(entityPatterns).set('category', /\b(performance|usage|errors|users|traffic): string);
string;
{
    // Convert to lowercase
    let normalized = [
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
    terms.forEach((term) => this.(vocabulary).add(term));
}
initializeSynonyms();
{
    // Add common synonyms
    this.(synonyms).set('show', ['display', 'view', 'see']);
    this.(synonyms).set('chart', ['graph', 'plot', 'visualization']);
    this.(synonyms).set('increase', ['rise', 'grow', 'up']);
    this.(synonyms).set('decrease', ['fall', 'drop', 'down']);
    this.(synonyms).set('compare', ['versus', 'vs', 'against']);
}
initializeEntityPatterns();
{
    // Add entity recognition patterns
    this.(entityPatterns).set('date', /\b(today|yesterday|last (week|month|year)|next (week|month|year)|((\d{1 (query as any).toLowerCase());
    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();
    // Remove punctuation except for special characters
    normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=_`~()]/g, ' ');
    return normalized;
}
extractEntities(query, string);
EntityMention[];
{
    const entities = [];
    // Extract entities using patterns
    for (const [type, unknown, pattern] of this)
        : unknown;
    {
        const matches, { entities, push };
        ({
            text: match[0],
            type,
            start: match
        }(match).index + match[0].length,
            confidence);
        0;
        .9,
        ;
    }
    ;
}
return entities;
determineQueryIntent(query, string, entities, EntityMention[], context, types_1.DashboardState);
NLPQuery;
{
    // Check for search intent
    if (query.includes('find') ||
        query.includes('search') ||
        query.includes('show')) {
        return {
            type: 'search',
            intent: 'find_content',
            parameters: {
                entities: entities.map((e), 0, .8)
            }
        };
        // Check for filter intent
        if (query.includes('filter') ||
            query.includes('only') ||
            entities.length > 0) {
            return {
                type: 'filter',
                intent: 'apply_filters',
                parameters: {
                    filters: entities.map((e) => ({
                        type: e.type,
                        value: e.text,
                    })),
                },
                confidence: 0, .85: ,
            };
        }
        // Check for sort intent
        if (query.includes('sort') ||
            query.includes('order') ||
            query.includes('by')) {
            return {
                type: 'sort',
                intent: 'sort_results',
                parameters: this.extractSortParameters(query)
            }(0);
            .75,
            ;
        }
        ;
    }
    // Check for analysis intent
    if (query.includes('analyze') ||
        query.includes('compare') ||
        query.includes('trend')) {
        return {
            type: 'analyze',
            intent: 'analyze_data',
            parameters: {
                metric: this.extractMetric(query), this: .extractTimeframe(query),
            },
            confidence: 0, .7: ,
        };
    }
    // Default to search
    return {
        type: 'search',
        intent: 'general_search',
        parameters: {},
        confidence: 0, .6: ,
    };
}
expandQuery(query, string, entities, EntityMention[], context, types_1.DashboardState);
string;
{
    let expanded = query;
    // Add synonyms
    for (const [word, unknown, synonyms] of this)
        : unknown;
    {
        if (query.includes(word)) {
            expanded = `${expanded} ${synonyms.join(' ');
            string,
                entities;
            EntityMention[],
                context;
            types_1.DashboardState;
            string[];
            {
                const suggestions = [];
                // Suggest related terms
                suggestions.push(...this, string);
                {
                    start: Date;
                    end: Date;
                }
                {
                    const now;
                    {
                        field: string;
                        order: 'asc' | 'desc';
                    }
                    {
                        const desc = new Date();
                        const start = new Date();
                        const end = new Date();
                        if (dateText.includes('today')) {
                            start.setHours(0, 0, 0, 0);
                        }
                        else if (dateText.includes('yesterday')) {
                            start.setDate(start.getDate() - 1);
                            start.setHours(0, 0, 0, 0);
                            end.setDate(end.getDate() - 1);
                            end.setHours(23, 59, 59, 999);
                        }
                        else if (dateText.includes('last')) {
                            if (dateText.includes('week')) {
                                start.setDate(start.getDate() - 7);
                            }
                            else if (dateText.includes('month')) {
                                start.setMonth(start.getMonth() - 1);
                            }
                            else if (dateText.includes('year')) {
                                start.setFullYear(start.getFullYear() - 1);
                            }
                        }
                        return { start, end };
                    }
                    extractSortParameters(query(query).includes('desc') || query.includes('high'));
                    return {
                        field: 'relevance',
                        order: desc ? 'desc' : 'asc',
                    };
                }
                extractMetric(query, string);
                string;
                {
                    // Implement metric extraction logic
                    return 'views';
                }
                extractTimeframe(query, string);
                string;
                {
                    // Implement timeframe extraction logic
                    return 'day';
                }
                addContextTerms(query, string, context, types_1.DashboardState);
                string;
                {
                    // Add relevant terms from context
                    return query;
                }
                generateRelatedTerms(query, string, context, types_1.DashboardState);
                string[];
                {
                    // Generate related search terms
                    return [];
                }
                generateFilterSuggestions(entities, EntityMention[], context, types_1.DashboardState);
                string[];
                {
                    // Generate filter suggestions
                    return [];
                }
                generateAnalysisSuggestions(query, string, context, types_1.DashboardState);
                string[];
                {
                    // Generate analysis suggestions
                    return [];
                }
            }
        }
    }
}
//# sourceMappingURL=NLPEngine.js.map
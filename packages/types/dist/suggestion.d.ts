export interface Suggestion {
    id: string;
    text: string;
    type: string;
    confidence: number;
    metadata?: unknown;
}
export interface SuggestionProvider {
    getSuggestions(query: string): Promise<Suggestion[]>;
}
//# sourceMappingURL=suggestion.d.ts.map
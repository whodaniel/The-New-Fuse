export declare class NLPEngine {
    private vocabulary;
    private synonyms;
    private entityPatterns;
    constructor();
    generateSearchConfig(): Promise<void>;
}

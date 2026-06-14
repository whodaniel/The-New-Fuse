export declare class CodebaseVectorizer {
    private openai;
    private embeddingModel;
    private batchSize;
    constructor();
    /**
     * Main entry point: Vectorize entire codebase
     */
    vectorizeCodebase(rootPath: string): Promise<void>;
    /**
     * Scan codebase and extract code entities
     */
    private scanCodebase;
    /**
     * Extract functions, classes, etc. from code
     * (Simplified version - production would use TypeScript AST or tree-sitter)
     */
    private extractCodeEntities;
    /**
     * Extract code block (simplified - would use AST for proper bracket matching)
     */
    private extractBlock;
    /**
     * Store entities in database
     */
    private storeEntities;
    /**
     * Generate embeddings for entities
     */
    private generateEmbeddings;
    /**
     * Extract relationships between code entities
     */
    private extractRelationships;
    /**
     * Create snapshot of current state
     */
    private createSnapshot;
    /**
     * Cleanup
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=codebase-vectorizer.d.ts.map
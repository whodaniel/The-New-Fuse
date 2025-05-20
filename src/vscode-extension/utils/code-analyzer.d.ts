import * as vscode from 'vscode';
/**
 * CodeAnalyzer uses tree-sitter for parsing and analyzing code
 * This provides a more robust syntax-aware code understanding similar to Copilot
 */
export declare class CodeAnalyzer {
    private parser;
    private parsers;
    private languageWasm;
    private initialized;
    /**
     * Initialize the code analyzer
     */
    initialize(): Promise<void>;
    /**
     * Initialize tree-sitter and load language parsers
     */
    private initializeTreeSitter;
    /**
     * Load a language parser
     */
    private loadLanguageParser;
    /**
     * Get the language ID for a file
     */
    private getLanguageForFile;
    /**
     * Parse text and get the syntax tree
     */
    parseText(text: string, language: string): any;
    /**
     * Get abstract syntax tree for a document
     */
    getASTForDocument(document: vscode.TextDocument): Promise<any>;
    /**
     * Get functions defined in a document
     * This provides code structure understanding similar to Copilot
     */
    getFunctions(document: vscode.TextDocument): Promise<any[]>;
    /**
     * Get the name of a function from its node
     */
    private getFunctionName;
    /**
     * Get the parameters of a function from its node
     */
    private getParams;
    /**
     * Analyze a document to extract context for LLM prompting
     * This helps create better context for AI suggestions, similar to Copilot
     */
    analyzeDocument(document: vscode.TextDocument): Promise<any>;
    /**
     * Get imports from a document
     */
    private getImports;
    /**
     * Get classes from a document
     */
    private getClasses;
    /**
     * Generate a summary of the document
     */
    private generateDocumentSummary;
}
export declare function getCodeAnalyzer(): CodeAnalyzer;
//# sourceMappingURL=code-analyzer.d.ts.map
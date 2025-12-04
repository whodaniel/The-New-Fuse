interface CodeBlock {
    language: string;
    code: string;
    highlighted: string;
}
interface ParseOptions {
    detectFromContent?: boolean;
    highlightCode?: boolean;
}
export declare function parseCodeBlock(block: string, options?: ParseOptions): CodeBlock;
export declare function extractCodeBlocks(content: string): CodeBlock[];
export declare function wrapInCodeBlock(code: string, language?: string): string;
export declare function isCodeBlock(text: string): boolean;
export declare function getLanguageLabel(language: string): string;
export {};

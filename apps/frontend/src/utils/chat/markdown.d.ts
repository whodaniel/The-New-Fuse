interface MarkdownOptions {
    disableLinks?: boolean;
    disableHighlight?: boolean;
    stripHtml?: boolean;
}
export default function renderMarkdown(content: string, options?: MarkdownOptions): string;
export declare function extractCodeBlocks(content: string): string[];
export declare function stripMarkdown(content: string): string;
export {};

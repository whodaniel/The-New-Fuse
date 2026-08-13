/**
 * Parse frontmatter from markdown content
 * @param content The markdown content with frontmatter
 * @returns Object with data (frontmatter) and content (body)
 */
export declare function frontmatter(content: string): {
    data: Record<string, any>;
    content: string;
};
/**
 * Stringify frontmatter and content back to markdown
 * @param data The frontmatter data
 * @param content The markdown content (without frontmatter)
 * @returns Markdown string with frontmatter
 */
export declare function stringifyFrontmatter(data: Record<string, any>, content: string): string;
//# sourceMappingURL=frontmatter.d.ts.map
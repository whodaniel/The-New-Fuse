import matter from 'gray-matter';
/**
 * Parse frontmatter from markdown content
 * @param content The markdown content with frontmatter
 * @returns Object with data (frontmatter) and content (body)
 */
export function frontmatter(content) {
    const parsed = matter(content);
    return {
        data: parsed.data || {},
        content: parsed.content
    };
}
/**
 * Stringify frontmatter and content back to markdown
 * @param data The frontmatter data
 * @param content The markdown content (without frontmatter)
 * @returns Markdown string with frontmatter
 */
export function stringifyFrontmatter(data, content) {
    return `---\n${JSON.stringify(data, null, 2)}\n---\n\n${content}`;
}
//# sourceMappingURL=frontmatter.js.map
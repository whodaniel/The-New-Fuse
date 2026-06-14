import { z } from 'zod';
export const RichTextDocumentSchema = z.object({
    id: z.string(),
    content: z.string(),
    formatting: z.array(z.object({
        type: z.enum(['bold', 'italic', 'underline', 'strikethrough', 'code', 'link', 'heading', 'list', 'blockquote']),
        start: z.number().int().min(0),
        end: z.number().int().min(0),
        attributes: z.record(z.string(), z.unknown()).optional(),
    })),
    metadata: z.object({
        createdAt: z.number(),
        updatedAt: z.number(),
        version: z.number().int().min(0),
        authorId: z.string().optional(),
    }),
});
export class RichTextService {
    constructor() {
        this.documents = new Map();
    }
    createDocument(id, content, authorId) {
        const now = Date.now();
        const doc = {
            id,
            content,
            formatting: [],
            metadata: { createdAt: now, updatedAt: now, version: 1, authorId },
        };
        this.documents.set(id, doc);
        return doc;
    }
    applyFormatting(documentId, type, start, end, attributes) {
        const doc = this.documents.get(documentId);
        if (!doc)
            return null;
        if (start >= end || start > doc.content.length)
            return doc;
        doc.formatting.push({ type, start, end: Math.min(end, doc.content.length), attributes });
        doc.metadata.updatedAt = Date.now();
        doc.metadata.version++;
        return doc;
    }
    updateContent(documentId, content) {
        const doc = this.documents.get(documentId);
        if (!doc)
            return null;
        doc.content = content;
        doc.metadata.updatedAt = Date.now();
        doc.metadata.version++;
        return doc;
    }
    toHtml(documentId) {
        const doc = this.documents.get(documentId);
        if (!doc)
            return null;
        let html = doc.content;
        const sortedFormatting = [...doc.formatting].sort((a, b) => b.start - a.start);
        for (const fmt of sortedFormatting) {
            const before = html.slice(0, fmt.start);
            const target = html.slice(fmt.start, fmt.end);
            const after = html.slice(fmt.end);
            const wrapped = this.wrapWithHtmlTag(fmt.type, target, fmt.attributes);
            html = before + wrapped + after;
        }
        return html;
    }
    toMarkdown(documentId) {
        const doc = this.documents.get(documentId);
        if (!doc)
            return null;
        let md = doc.content;
        const sortedFormatting = [...doc.formatting].sort((a, b) => b.start - a.start);
        for (const fmt of sortedFormatting) {
            const before = md.slice(0, fmt.start);
            const target = md.slice(fmt.start, fmt.end);
            const after = md.slice(fmt.end);
            const wrapped = this.wrapWithMarkdown(fmt.type, target);
            md = before + wrapped + after;
        }
        return md;
    }
    getDocument(documentId) {
        return this.documents.get(documentId);
    }
    wrapWithHtmlTag(type, content, attributes) {
        const attrStr = attributes ? ' ' + Object.entries(attributes).map(([k, v]) => `${k}="${v}"`).join(' ') : '';
        switch (type) {
            case 'bold': return `<strong>${content}</strong>`;
            case 'italic': return `<em>${content}</em>`;
            case 'underline': return `<u>${content}</u>`;
            case 'strikethrough': return `<del>${content}</del>`;
            case 'code': return `<code>${content}</code>`;
            case 'link': return `<a href="${attributes?.href ?? '#'}">${content}</a>`;
            case 'heading': return `<h2>${content}</h2>`;
            case 'list': return `<li>${content}</li>`;
            case 'blockquote': return `<blockquote>${content}</blockquote>`;
            default: return content;
        }
    }
    wrapWithMarkdown(type, content) {
        switch (type) {
            case 'bold': return `**${content}**`;
            case 'italic': return `*${content}*`;
            case 'underline': return `__${content}__`;
            case 'strikethrough': return `~~${content}~~`;
            case 'code': return `\`${content}\``;
            case 'heading': return `## ${content}`;
            case 'list': return `- ${content}`;
            case 'blockquote': return `> ${content}`;
            default: return content;
        }
    }
}
//# sourceMappingURL=richTextService.js.map
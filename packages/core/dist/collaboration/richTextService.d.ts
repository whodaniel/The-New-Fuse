import { z } from 'zod';
export declare const RichTextDocumentSchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    formatting: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            bold: "bold";
            italic: "italic";
            underline: "underline";
            strikethrough: "strikethrough";
            code: "code";
            link: "link";
            heading: "heading";
            list: "list";
            blockquote: "blockquote";
        }>;
        start: z.ZodNumber;
        end: z.ZodNumber;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    metadata: z.ZodObject<{
        createdAt: z.ZodNumber;
        updatedAt: z.ZodNumber;
        version: z.ZodNumber;
        authorId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type RichTextDocument = z.infer<typeof RichTextDocumentSchema>;
export declare class RichTextService {
    private documents;
    createDocument(id: string, content: string, authorId?: string): RichTextDocument;
    applyFormatting(documentId: string, type: RichTextDocument['formatting'][number]['type'], start: number, end: number, attributes?: Record<string, unknown>): RichTextDocument | null;
    updateContent(documentId: string, content: string): RichTextDocument | null;
    toHtml(documentId: string): string | null;
    toMarkdown(documentId: string): string | null;
    getDocument(documentId: string): RichTextDocument | undefined;
    private wrapWithHtmlTag;
    private wrapWithMarkdown;
}
//# sourceMappingURL=richTextService.d.ts.map
import { z } from 'zod';
export declare const DocumentDeltaSchema: z.ZodObject<{
    documentId: z.ZodString;
    version: z.ZodNumber;
    operations: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"insert">;
        position: z.ZodNumber;
        content: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"delete">;
        position: z.ZodNumber;
        length: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"replace">;
        position: z.ZodNumber;
        length: z.ZodNumber;
        content: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"format">;
        position: z.ZodNumber;
        length: z.ZodNumber;
        attributes: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>], "type">>;
    baseVersion: z.ZodNumber;
}, z.core.$strip>;
export type DocumentDelta = z.infer<typeof DocumentDeltaSchema>;
export interface DeltaResult {
    accepted: boolean;
    newVersion: number;
    appliedOperations: number;
    conflict?: string;
}
export declare class DeltaDocumentService {
    private documents;
    getDocument(documentId: string): {
        content: string;
        version: number;
    } | null;
    applyDelta(delta: DocumentDelta): DeltaResult;
    createDocument(documentId: string, initialContent?: string): void;
}
//# sourceMappingURL=deltaDocumentService.d.ts.map
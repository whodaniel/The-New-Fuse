import { z } from 'zod';
export const DocumentDeltaSchema = z.object({
    documentId: z.string(),
    version: z.number().int().min(0),
    operations: z.array(z.discriminatedUnion('type', [
        z.object({
            type: z.literal('insert'),
            position: z.number().int().min(0),
            content: z.string(),
        }),
        z.object({
            type: z.literal('delete'),
            position: z.number().int().min(0),
            length: z.number().int().min(1),
        }),
        z.object({
            type: z.literal('replace'),
            position: z.number().int().min(0),
            length: z.number().int().min(1),
            content: z.string(),
        }),
        z.object({
            type: z.literal('format'),
            position: z.number().int().min(0),
            length: z.number().int().min(1),
            attributes: z.record(z.string(), z.unknown()),
        }),
    ])),
    baseVersion: z.number().int().min(0),
});
export class DeltaDocumentService {
    constructor() {
        this.documents = new Map();
    }
    getDocument(documentId) {
        const doc = this.documents.get(documentId);
        return doc ? { content: doc.content, version: doc.version } : null;
    }
    applyDelta(delta) {
        const doc = this.documents.get(delta.documentId);
        if (!doc) {
            this.documents.set(delta.documentId, { content: '', version: 0, formats: new Map() });
        }
        const document = this.documents.get(delta.documentId);
        if (delta.baseVersion !== document.version) {
            return {
                accepted: false,
                newVersion: document.version,
                appliedOperations: 0,
                conflict: `Version mismatch: base=${delta.baseVersion}, current=${document.version}`,
            };
        }
        let applied = 0;
        let content = document.content;
        for (const op of delta.operations) {
            if (op.position > content.length)
                continue;
            switch (op.type) {
                case 'insert':
                    content = content.slice(0, op.position) + op.content + content.slice(op.position);
                    applied++;
                    break;
                case 'delete':
                    content = content.slice(0, op.position) + content.slice(op.position + op.length);
                    applied++;
                    break;
                case 'replace':
                    content = content.slice(0, op.position) + op.content + content.slice(op.position + op.length);
                    applied++;
                    break;
                case 'format':
                    document.formats.set(op.position, op.attributes);
                    applied++;
                    break;
            }
        }
        document.content = content;
        document.version++;
        return {
            accepted: true,
            newVersion: document.version,
            appliedOperations: applied,
        };
    }
    createDocument(documentId, initialContent = '') {
        this.documents.set(documentId, { content: initialContent, version: 1, formats: new Map() });
    }
}
//# sourceMappingURL=deltaDocumentService.js.map
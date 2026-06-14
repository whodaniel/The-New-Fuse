import { z } from 'zod';
export const CollaborationEventSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('cursor_move'),
        userId: z.string(),
        documentId: z.string(),
        position: z.number(),
        timestamp: z.number(),
    }),
    z.object({
        type: z.literal('selection'),
        userId: z.string(),
        documentId: z.string(),
        start: z.number(),
        end: z.number(),
        timestamp: z.number(),
    }),
    z.object({
        type: z.literal('edit'),
        userId: z.string(),
        documentId: z.string(),
        operation: z.discriminatedUnion('op', [
            z.object({ op: z.literal('insert'), position: z.number(), content: z.string() }),
            z.object({ op: z.literal('delete'), position: z.number(), length: z.number() }),
        ]),
        baseVersion: z.number(),
        timestamp: z.number(),
    }),
    z.object({
        type: z.literal('presence'),
        userId: z.string(),
        documentId: z.string(),
        status: z.enum(['active', 'idle', 'away']),
        timestamp: z.number(),
    }),
    z.object({
        type: z.literal('sync'),
        documentId: z.string(),
        version: z.number(),
        content: z.string(),
        timestamp: z.number(),
    }),
]);
export class RealtimeCollaborationService {
    constructor() {
        this.documentVersions = new Map();
        this.documentContent = new Map();
        this.collaborators = new Map();
        this.eventBuffer = new Map();
    }
    joinDocument(documentId, user) {
        if (!this.collaborators.has(documentId)) {
            this.collaborators.set(documentId, new Map());
        }
        this.collaborators.get(documentId).set(user.userId, user);
    }
    leaveDocument(documentId, userId) {
        this.collaborators.get(documentId)?.delete(userId);
    }
    getCollaborators(documentId) {
        return Array.from(this.collaborators.get(documentId)?.values() ?? []);
    }
    applyEdit(documentId, userId, operation, baseVersion) {
        const currentVersion = this.documentVersions.get(documentId) ?? 0;
        if (baseVersion !== currentVersion) {
            return {
                success: false,
                newVersion: currentVersion,
                content: this.documentContent.get(documentId) ?? '',
                conflict: `Version mismatch: base=${baseVersion}, current=${currentVersion}`,
            };
        }
        let content = this.documentContent.get(documentId) ?? '';
        if (operation.op === 'insert' && operation.content) {
            content = content.slice(0, operation.position) + operation.content + content.slice(operation.position);
        }
        else if (operation.op === 'delete' && operation.length) {
            content = content.slice(0, operation.position) + content.slice(operation.position + operation.length);
        }
        const newVersion = currentVersion + 1;
        this.documentVersions.set(documentId, newVersion);
        this.documentContent.set(documentId, content);
        return { success: true, newVersion, content };
    }
    updateCursor(documentId, userId, position) {
        const doc = this.collaborators.get(documentId);
        const collab = doc?.get(userId);
        if (collab)
            collab.cursorPosition = position;
    }
    updatePresence(documentId, userId, status) {
        const doc = this.collaborators.get(documentId);
        const collab = doc?.get(userId);
        if (collab)
            collab.status = status;
    }
    getDocumentState(documentId) {
        return {
            version: this.documentVersions.get(documentId) ?? 0,
            content: this.documentContent.get(documentId) ?? '',
        };
    }
    bufferEvent(documentId, event) {
        if (!this.eventBuffer.has(documentId)) {
            this.eventBuffer.set(documentId, []);
        }
        const buffer = this.eventBuffer.get(documentId);
        buffer.push(event);
        if (buffer.length > 1000)
            buffer.splice(0, buffer.length - 1000);
    }
    flushEvents(documentId) {
        const events = this.eventBuffer.get(documentId) ?? [];
        this.eventBuffer.set(documentId, []);
        return events;
    }
}
//# sourceMappingURL=realtimeCollaborationService.js.map
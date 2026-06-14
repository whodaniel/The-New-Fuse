import { z } from 'zod';
export declare const CollaborationEventSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"cursor_move">;
    userId: z.ZodString;
    documentId: z.ZodString;
    position: z.ZodNumber;
    timestamp: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"selection">;
    userId: z.ZodString;
    documentId: z.ZodString;
    start: z.ZodNumber;
    end: z.ZodNumber;
    timestamp: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"edit">;
    userId: z.ZodString;
    documentId: z.ZodString;
    operation: z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"insert">;
        position: z.ZodNumber;
        content: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"delete">;
        position: z.ZodNumber;
        length: z.ZodNumber;
    }, z.core.$strip>], "op">;
    baseVersion: z.ZodNumber;
    timestamp: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"presence">;
    userId: z.ZodString;
    documentId: z.ZodString;
    status: z.ZodEnum<{
        active: "active";
        idle: "idle";
        away: "away";
    }>;
    timestamp: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"sync">;
    documentId: z.ZodString;
    version: z.ZodNumber;
    content: z.ZodString;
    timestamp: z.ZodNumber;
}, z.core.$strip>], "type">;
export type CollaborationEvent = z.infer<typeof CollaborationEventSchema>;
export interface Collaborator {
    userId: string;
    displayName: string;
    color: string;
    cursorPosition?: number;
    selectionRange?: {
        start: number;
        end: number;
    };
    status: 'active' | 'idle' | 'away';
}
export declare class RealtimeCollaborationService {
    private documentVersions;
    private documentContent;
    private collaborators;
    private eventBuffer;
    joinDocument(documentId: string, user: Collaborator): void;
    leaveDocument(documentId: string, userId: string): void;
    getCollaborators(documentId: string): Collaborator[];
    applyEdit(documentId: string, userId: string, operation: {
        op: 'insert' | 'delete';
        position: number;
        content?: string;
        length?: number;
    }, baseVersion: number): {
        success: boolean;
        newVersion: number;
        content: string;
        conflict?: string;
    };
    updateCursor(documentId: string, userId: string, position: number): void;
    updatePresence(documentId: string, userId: string, status: Collaborator['status']): void;
    getDocumentState(documentId: string): {
        version: number;
        content: string;
    };
    bufferEvent(documentId: string, event: CollaborationEvent): void;
    flushEvents(documentId: string): CollaborationEvent[];
}
//# sourceMappingURL=realtimeCollaborationService.d.ts.map
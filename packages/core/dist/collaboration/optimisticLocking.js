import { z } from 'zod';
export const OptimisticLockingSchema = z.object({
    documentId: z.string(),
    documentVersion: z.number().int().min(0),
    edits: z.array(z.object({
        field: z.string(),
        oldValue: z.unknown(),
        newValue: z.unknown(),
    })),
});
export class OptimisticLockingService {
    constructor() {
        this.documentVersions = new Map();
        this.documentState = new Map();
    }
    getCurrentVersion(documentId) {
        return this.documentVersions.get(documentId) ?? 0;
    }
    checkConflict(request) {
        const currentVersion = this.getCurrentVersion(request.documentId);
        if (request.documentVersion === currentVersion) {
            return {
                hasConflict: false,
                currentVersion,
                providedVersion: request.documentVersion,
            };
        }
        const currentState = this.documentState.get(request.documentId) ?? {};
        const conflictingFields = [];
        for (const edit of request.edits) {
            if (currentState[edit.field] !== edit.oldValue) {
                conflictingFields.push(edit.field);
            }
        }
        return {
            hasConflict: true,
            currentVersion,
            providedVersion: request.documentVersion,
            conflictingFields: conflictingFields.length > 0 ? conflictingFields : undefined,
        };
    }
    applyEdit(request) {
        const conflict = this.checkConflict(request);
        if (conflict.hasConflict) {
            return conflict;
        }
        const state = this.documentState.get(request.documentId) ?? {};
        for (const edit of request.edits) {
            state[edit.field] = edit.newValue;
        }
        const newVersion = this.getCurrentVersion(request.documentId) + 1;
        this.documentVersions.set(request.documentId, newVersion);
        this.documentState.set(request.documentId, state);
        return {
            hasConflict: false,
            currentVersion: newVersion,
            providedVersion: request.documentVersion,
        };
    }
    forceUpdate(documentId, state) {
        this.documentState.set(documentId, state);
        this.documentVersions.set(documentId, this.getCurrentVersion(documentId) + 1);
    }
}
//# sourceMappingURL=optimisticLocking.js.map
import { z } from 'zod';
export declare const OptimisticLockingSchema: z.ZodObject<{
    documentId: z.ZodString;
    documentVersion: z.ZodNumber;
    edits: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        oldValue: z.ZodUnknown;
        newValue: z.ZodUnknown;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type OptimisticLockingRequest = z.infer<typeof OptimisticLockingSchema>;
export interface ConflictResult {
    hasConflict: boolean;
    currentVersion: number;
    providedVersion: number;
    conflictingFields?: string[];
    resolvedValue?: Record<string, unknown>;
}
export declare class OptimisticLockingService {
    private documentVersions;
    private documentState;
    getCurrentVersion(documentId: string): number;
    checkConflict(request: OptimisticLockingRequest): ConflictResult;
    applyEdit(request: OptimisticLockingRequest): ConflictResult;
    forceUpdate(documentId: string, state: Record<string, unknown>): void;
}
//# sourceMappingURL=optimisticLocking.d.ts.map
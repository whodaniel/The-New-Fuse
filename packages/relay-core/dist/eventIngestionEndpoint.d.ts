import { z } from 'zod';
export declare const InvalidEventTestSchema: z.ZodObject<{
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    expectedError: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type InvalidEventTest = z.infer<typeof InvalidEventTestSchema>;
export interface ErrorHandlingResult {
    accepted: boolean;
    error?: {
        code: string;
        message: string;
        field?: string;
    };
    httpStatus: number;
}
export declare class EventValidationError extends Error {
    readonly code: string;
    readonly field?: string;
    constructor(message: string, code: string, field?: string);
}
export declare class EventIngestionEndpoint {
    validateEvent(payload: Record<string, unknown>): ErrorHandlingResult;
    ingest(payload: Record<string, unknown>): Promise<ErrorHandlingResult>;
}
export declare function createInvalidEventTests(): InvalidEventTest[];
//# sourceMappingURL=eventIngestionEndpoint.d.ts.map
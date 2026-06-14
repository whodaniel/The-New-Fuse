import { z } from 'zod';
export declare function sanitizeEventPayload<T extends Record<string, unknown>>(payload: T): T;
export declare const SecuredEventSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    timestamp: z.ZodNumber;
    source: z.ZodOptional<z.ZodString>;
    correlationId: z.ZodOptional<z.ZodString>;
    meta: z.ZodOptional<z.ZodObject<{
        sanitized: z.ZodDefault<z.ZodBoolean>;
        sanitizedFields: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SecuredEvent = z.infer<typeof SecuredEventSchema>;
export declare function createSecuredEvent(raw: {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    timestamp?: number;
    source?: string;
    correlationId?: string;
}): SecuredEvent;
//# sourceMappingURL=secure-event-payload.d.ts.map
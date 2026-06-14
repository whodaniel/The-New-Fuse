import { z } from 'zod';
export declare const EventSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    timestamp: z.ZodDefault<z.ZodNumber>;
    source: z.ZodOptional<z.ZodString>;
    correlationId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Event = z.infer<typeof EventSchema>;
export interface EventReducer {
    eventType: string;
    reduce(state: Record<string, unknown>, event: Event): Record<string, unknown>;
}
export interface SideEffect {
    id: string;
    eventType: string;
    execute(event: Event, state: Record<string, unknown>): Promise<void>;
}
export interface ProcessorResult {
    newState: Record<string, unknown>;
    sideEffects: SideEffect[];
}
export declare class EventProcessor {
    private reducers;
    private sideEffects;
    registerReducer(reducer: EventReducer): void;
    registerSideEffect(effect: SideEffect): void;
    process(state: Record<string, unknown>, event: Event): ProcessorResult;
    processAndExecute(state: Record<string, unknown>, event: Event): Promise<Record<string, unknown>>;
    getRegisteredEventTypes(): string[];
    getSideEffectsForType(eventType: string): SideEffect[];
}
//# sourceMappingURL=event-processor.d.ts.map
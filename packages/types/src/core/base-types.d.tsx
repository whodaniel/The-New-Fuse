/**
 * Core base types used throughout the application
 */
import 'reflect-metadata';
/**
 * Type alias for UUID strings
 */
export type UUID = string;
/**
 * Type alias for ISO DateTime strings
 */
export type ISODateTime = string;
/**
 * Base entity interface that provides common fields for all entities
 */
export interface BaseEntity {
    id: UUID;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}
/**
 * Interface for error context data
 */
export interface ErrorContext {
    timestamp: ISODateTime;
    source: string;
    severity: string;
    metadata?: Record<string, unknown>;
}
/**
 * Base custom error class that can be extended
 */
export declare class CustomError extends Error {
    context: ErrorContext;
    constructor(message: string, context: Partial<ErrorContext>);
}
export type UnknownRecord = Record<string, unknown>;
export type JsonValue = string | number | boolean | null | JsonValue[] | {
    [key: string]: JsonValue;
};
export type Primitive = string | number | boolean | undefined | null;
export interface DataMap extends UnknownRecord {
    [key: string]: JsonValue;
}
export interface BaseConfig {
    data: DataMap;
}
//# sourceMappingURL=base-types.d.ts.map
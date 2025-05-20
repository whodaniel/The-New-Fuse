import 'reflect-metadata';
export type UUID = string;
export type ISODateTime = string;
export interface BaseEntity {
    id: UUID;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
}
export interface ErrorContext {
    timestamp: ISODateTime;
    source: string;
    severity: string;
    metadata?: Record<string, unknown>;
}
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
//# sourceMappingURL=base-types.d.d.ts.map
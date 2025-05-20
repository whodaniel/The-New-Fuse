import { UnknownRecord, JsonValue, DataMap } from './core/base-types.js';
export type { UnknownRecord, JsonValue, DataMap };
export type ApiResponse<T> = {
    data: T;
    error?: string;
    meta?: Record<string, JsonValue>;
};
export type Handler<T = unknown, R = void> = (data: T) => Promise<R> | R;
export type ValidationResult<T> = {
    isValid: boolean;
    value?: T;
    errors?: string[];
};
//# sourceMappingURL=common-types.d.d.ts.map
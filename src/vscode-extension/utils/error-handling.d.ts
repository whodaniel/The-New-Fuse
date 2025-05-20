export interface ErrorWithMessage {
    message: string;
}
export declare function isErrorWithMessage(error: unknown): error is ErrorWithMessage;
export declare function toErrorWithMessage(maybeError: unknown): ErrorWithMessage;
export declare function getErrorMessage(error: unknown): string;
export declare class BaseError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=error-handling.d.ts.map
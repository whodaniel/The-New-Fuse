export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

export class MCPError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'MCPError';
    }
}

export const ErrorCode = {
    INVALID_REQUEST: 'INVALID_REQUEST',
    CONNECTION_ERROR: 'CONNECTION_ERROR',
    PROVIDER_ERROR: 'PROVIDER_ERROR',
    TIMEOUT: 'TIMEOUT',
    UNKNOWN: 'UNKNOWN'
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];


/**
 * AIError: Custom error for AI-related exceptions.
 */
export class AIError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AIError';
    }
}
export {};

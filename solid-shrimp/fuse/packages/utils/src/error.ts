/**
 * Temporary stub for AIError until core package is built
 */
export class AIError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AIError';
    }
}

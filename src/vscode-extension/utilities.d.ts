/**
 * Utility functions for The New Fuse VSCode Extension
 */
/**
 * Safely get error message from any error object
 * This handles the TypeScript 'unknown' type for errors in catch blocks
 *
 * @param error Any error object (including unknown type)
 * @returns A string message for the error
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Safely get error name and message
 *
 * @param error Any error object (including unknown type)
 * @returns An object containing name and message properties
 */
export declare function getErrorDetails(error: unknown): {
    name: string;
    message: string;
};
//# sourceMappingURL=utilities.d.ts.map
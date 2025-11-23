/**
 * Validates that a URL is well-formed, uses http/https, and resolves to a public IP address.
 * Returns an object with a 'valid' boolean and an optional 'reason' for failure.
 *
 * NOTE: This function uses Node.js dns module and is only available in server environments.
 */
export declare function isValidPublicUrl(url: string): Promise<{
    valid: boolean;
    reason?: string;
}>;
//# sourceMappingURL=validators.server.d.ts.map
import { z } from 'zod';
import { UserRepository } from './types.js';
declare const UserCredentialsSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UserCredentialsType = z.infer<typeof UserCredentialsSchema>;
export declare const UserCredentials: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare class AuthService {
    private jwtSecret;
    private userRepository?;
    constructor(secret: string, userRepository?: UserRepository);
    /**
     * Validates user credentials against the configured user store.
     *
     * @throws {Error} If no user repository is configured
     * @param {UserCredentialsType} credentials - The credentials to validate
     * @returns {Promise<boolean>} Promise resolving to true if valid, false otherwise
     */
    validateCredentials(credentials: UserCredentialsType): Promise<boolean>;
    generateToken(payload: Record<string, unknown>, expiresIn?: string): string;
    verifyToken(token: string): Record<string, unknown> | null;
}
export {};
//# sourceMappingURL=index.d.ts.map
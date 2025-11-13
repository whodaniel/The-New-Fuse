import { z } from 'zod';
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
    constructor(secret: string);
    validateCredentials(_credentials: UserCredentialsType): Promise<boolean>;
    generateToken(payload: Record<string, unknown>, expiresIn?: string): string;
    verifyToken(token: string): Record<string, unknown> | null;
}
export {};
//# sourceMappingURL=index.d.ts.map
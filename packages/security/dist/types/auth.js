import { z } from 'zod';
// Zod schemas for validation
export const UserCredentialsSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(8).max(100),
    email: z.string().email().optional(),
});
export const TokenPayloadSchema = z.object({
    userId: z.string(),
    username: z.string(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    sessionId: z.string(),
    issuedAt: z.number(),
    expiresAt: z.number(),
});
//# sourceMappingURL=auth.js.map
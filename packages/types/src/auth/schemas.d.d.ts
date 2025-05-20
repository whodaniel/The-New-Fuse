import { z } from 'zod';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    rememberMe?: boolean | undefined;
}, {
    password: string;
    email: string;
    rememberMe?: boolean | undefined;
}>;
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    confirmPassword: string;
}, {
    password: string;
    email: string;
    confirmPassword: string;
}>, {
    password: string;
    email: string;
    confirmPassword: string;
}, {
    password: string;
    email: string;
    confirmPassword: string;
}>;
export declare const resetSchema: z.ZodObject<{
    email: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    newPassword: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    code?: string | undefined;
    newPassword?: string | undefined;
}, {
    email: string;
    code?: string | undefined;
    newPassword?: string | undefined;
}>;
//# sourceMappingURL=schemas.d.d.ts.map
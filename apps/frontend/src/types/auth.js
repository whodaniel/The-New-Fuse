import { z } from 'zod';
// Form Schemas
export var emailSchema = z.string().email('Invalid email address');
export var passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
export var loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    rememberMe: z.boolean().optional(),
});
export var registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    acceptTerms: z.boolean().refine(function (val) { return val === true; }, 'You must accept the terms'),
}).refine(function (data) { return data.password === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export var resetPasswordSchema = z.object({
    email: emailSchema,
    code: z.string().optional(),
    newPassword: passwordSchema.optional(),
});

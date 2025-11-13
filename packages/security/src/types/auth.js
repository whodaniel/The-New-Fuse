"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenPayloadSchema = exports.UserCredentialsSchema = void 0;
const zod_1 = require("zod");
// Zod schemas for validation
exports.UserCredentialsSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50),
    password: zod_1.z.string().min(8).max(100),
    email: zod_1.z.string().email().optional()
});
exports.TokenPayloadSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    username: zod_1.z.string(),
    roles: zod_1.z.array(zod_1.z.string()),
    permissions: zod_1.z.array(zod_1.z.string()),
    sessionId: zod_1.z.string(),
    issuedAt: zod_1.z.number(),
    expiresAt: zod_1.z.number()
});
//# sourceMappingURL=auth.js.map
import { PrismaClient } from '@prisma/client';
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePasswords(password: string, hashedPassword: string): Promise<boolean>;
export declare function generateToken(payload: any, expiresIn?: string): string;
export declare function verifyToken(token: string): any;
export declare function validateUser(email: string, password: string, prisma: PrismaClient): Promise<any>;

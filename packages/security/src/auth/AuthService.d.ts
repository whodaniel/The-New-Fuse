import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { HashingService } from './hashing.service';
export interface User {
    id: string;
    email: string;
    name?: string;
    permissions: Permission[];
}
export interface Permission {
    id: string;
    name: string;
}
export interface LoginResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        name?: string;
    };
}
export interface RegisterResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        name?: string;
    };
}
interface UserWithPermissions {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
    hashedPassword: string;
    role: any;
    userPermissions: Array<{
        permission: {
            id: string;
            name: string;
        };
    }>;
}
export declare class AuthService {
    private readonly prisma;
    private readonly hashingService;
    private readonly jwtSecret;
    constructor(prisma: PrismaService, hashingService: HashingService);
    authenticate(req: Request): Promise<boolean>;
    private extractTokenFromRequest;
    validatePermission(user: User, permission: string): Promise<boolean>;
    validateUser(email: string, password: string): Promise<UserWithPermissions | null>;
    login(user: UserWithPermissions): Promise<LoginResponse>;
    register(email: string, password: string, name?: string): Promise<RegisterResponse>;
    validateToken(token: string): Promise<any>;
    logout(token: string): Promise<{
        message: string;
    }>;
    validateFirebaseToken(token: string): Promise<any>;
    authenticateFirebase(firebaseToken: string): Promise<LoginResponse>;
}
export {};
//# sourceMappingURL=AuthService.d.ts.map
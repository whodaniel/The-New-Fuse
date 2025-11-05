import { PrismaService } from './prisma.service';
import { User } from '@the-new-fuse/database/generated/prisma';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findUserByEmail(email: string): Promise<User | null>;
    findUserByUsername(username: string): Promise<User | null>;
    createUser(email: string, hashedPassword: string, username: string): Promise<User>;
    getUserProfileById(userId: string): Promise<User | null>;
    updateUserProfileById(userId: string, profileData: Partial<User>): Promise<User | null>;
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<User>;
}
export interface UserProfile {
    id: string;
    email: string;
    username: string;
    displayName?: string;
    bio?: string;
    preferences?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=userService.d.ts.map
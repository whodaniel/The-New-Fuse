import { User, UserRole } from '../types';
import { PrismaService } from '../prisma.service';
export declare class UserRepository {
    private prisma;
    constructor(prisma: PrismaService);
    private mapDatabaseUserToUser;
    private getUserSelect;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findMany(filters?: any): Promise<User[]>;
    create(data: any): Promise<User>;
    update(id: string, data: any): Promise<User>;
    delete(id: string): Promise<User>;
    findByRole(role: UserRole): Promise<User[]>;
    updatePassword(id: string, passwordHash: string): Promise<User>;
    updateRole(id: string, role: UserRole): Promise<User>;
    searchUsers(query: string): Promise<User[]>;
    getUserStats(): Promise<any>;
    count(filters?: any): Promise<number>;
}
//# sourceMappingURL=user.repository.d.ts.map
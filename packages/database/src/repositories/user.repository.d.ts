import { User, UserRole, Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
export declare class UserRepository {
    private prisma;
    constructor(prisma: PrismaService);
    private mapDatabaseUserToUser;
    private getUserSelect;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findMany(filters?: Prisma.UserWhereInput): Promise<User[]>;
    create(data: Prisma.UserCreateInput): Promise<User>;
    update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
    delete(id: string): Promise<User>;
    findByRole(role: UserRole): Promise<User[]>;
    updatePassword(id: string, hashedPassword: string): Promise<User>;
    updateRole(id: string, role: UserRole): Promise<User>;
    searchUsers(query: string): Promise<User[]>;
    getUserStats(): Promise<{
        total: number;
        recent: number;
        byRole: Record<string, number>;
    }>;
    count(filters?: any): Promise<number>;
}
//# sourceMappingURL=user.repository.d.ts.map
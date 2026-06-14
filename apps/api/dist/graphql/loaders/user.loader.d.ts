import type { User } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
export declare class UserLoader {
    private readonly db;
    private readonly batchUsers;
    constructor(db: DatabaseService);
    load(userId: string): Promise<User | null>;
    loadMany(userIds: string[]): Promise<(User | null)[]>;
}
//# sourceMappingURL=user.loader.d.ts.map
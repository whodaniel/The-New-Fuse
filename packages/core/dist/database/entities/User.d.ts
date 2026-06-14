export declare class User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    hashPassword(): Promise<void>;
    comparePassword(password: string): Promise<boolean>;
    toJSON(): Omit<this, "toJSON" | "passwordHash" | "hashPassword" | "comparePassword">;
}
//# sourceMappingURL=User.d.ts.map
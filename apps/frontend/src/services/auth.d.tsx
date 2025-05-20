import { User } from '@/types/user';
export declare class AuthService {
    static getUserData(uid: string): Promise<User>;
    static enable2FA(userId: string): Promise<string>;
    static disable2FA(userId: string): Promise<void>;
}

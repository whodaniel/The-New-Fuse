import { User } from '../entities/User';
export declare const authService: {
    register({ name, email, password }: {
        name: string;
        email: string;
        password: string;
    }): Promise<{
        user: User & User[];
        accessToken: string;
        refreshToken: string;
    }>;
    login({ email, password }: {
        email: string;
        password: string;
    }): Promise<{
        user: User;
        accessToken: string;
        refreshToken: string;
    }>;
    getCurrentUser(userId: string): Promise<{
        user: User;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
};

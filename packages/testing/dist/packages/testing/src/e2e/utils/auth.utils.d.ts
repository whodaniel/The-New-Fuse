import { Page } from '@playwright/test';
export type AuthUser = {
    username: string;
    password: string;
};
export declare class AuthUtils {
    private page;
    constructor(page: Page);
    loginAsUser(user: AuthUser): Promise<void>;
    getAuthToken(): Promise<string | null>;
    setAuthToken(token: string): Promise<void>;
    clearAuth(): Promise<void>;
}
//# sourceMappingURL=auth.utils.d.ts.map
export interface UserProfile {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    timezone?: string;
    language?: string;
}
export interface UserPreferences {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    privacy?: {
        profileVisible: boolean;
        activityVisible: boolean;
    };
    dashboard?: {
        widgets: string[];
        layout: 'grid' | 'list';
    };
}
export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'user' | 'guest';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    profile?: UserProfile;
    preferences?: UserPreferences;
}
export type SafeUser = Omit<User, 'passwordHash'>;
//# sourceMappingURL=user.types.d.ts.map
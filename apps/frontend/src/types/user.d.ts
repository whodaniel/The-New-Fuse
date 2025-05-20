export interface User {
    id: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    createdAt: string;
    updatedAt: string;
    isVerified: boolean;
    is2FAEnabled: boolean;
    preferences?: UserPreferences;
    roles?: string[];
}
export interface UserPreferences {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: NotificationPreferences;
}
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    inApp: boolean;
}

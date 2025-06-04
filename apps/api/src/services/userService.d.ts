interface UserProfile {
    id: string;
    email: string;
    displayName?: string;
    bio?: string;
    preferences?: {
        theme?: 'light' | 'dark' | 'system';
        notifications?: boolean;
    };
}
/**
 * Retrieves a user's profile by their ID.
 * @param userId The ID of the user.
 * @returns The user profile, or null if not found.
 */
export declare const getUserProfileById: (userId: string) => Promise<UserProfile | null>;
/**
 * Updates a user's profile by their ID.
 * @param userId The ID of the user.
 * @param profileData Partial data to update the profile.
 * @returns The updated user profile, or null if not found.
 */
export declare const updateUserProfileById: (userId: string, profileData: Partial<UserProfile>) => Promise<UserProfile | null>;
export { UserProfile };

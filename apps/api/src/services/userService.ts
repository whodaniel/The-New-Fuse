// In-memory store for user profiles
// In a real application, this would be a database.
interface UserProfile {
    id: string;
    email: string; // Assuming email is a unique identifier and part of the profile
    displayName?: string;
    bio?: string;
    preferences?: {
        theme?: 'light' | 'dark' | 'system';
        notifications?: boolean;
    };
    // Add other fields from the existing User model if necessary
    // For example, if registration creates a user with a password hash, that shouldn't be here.
    // This profile is for displayable and editable user information.
}

// Initialize with some mock data, including the MOCK_USER_ID used in controller
const userProfilesStore: Map<string, UserProfile> = new Map([
    ['mockUserId123', {
        id: 'mockUserId123',
        email: 'user@example.com',
        displayName: 'Mock User',
        bio: 'This is a mock user bio.',
        preferences: {
            theme: 'dark',
            notifications: true,
        }
    }],
    ['anotherUser456', {
        id: 'anotherUser456',
        email: 'another@example.com',
        displayName: 'Another User',
        bio: 'Loves coding.',
        preferences: {
            theme: 'light',
            notifications: false,
        }
    }]
]);

/**
 * Retrieves a user's profile by their ID.
 * @param userId The ID of the user.
 * @returns The user profile, or null if not found.
 */
export const getUserProfileById = async (userId: string): Promise<UserProfile | null> => {
    const profile = userProfilesStore.get(userId);
    return profile ? { ...profile } : null; // Return a copy
};

/**
 * Updates a user's profile by their ID.
 * @param userId The ID of the user.
 * @param profileData Partial data to update the profile.
 * @returns The updated user profile, or null if not found.
 */
export const updateUserProfileById = async (
    userId: string,
    profileData: Partial<UserProfile>
): Promise<UserProfile | null> => {
    const existingProfile = userProfilesStore.get(userId);
    if (!existingProfile) {
        return null;
    }

    // Merge new data with existing profile data
    // Ensure 'id' and 'email' are not overwritten by partial update if they are part of profileData
    const updatedProfile: UserProfile = {
        ...existingProfile,
        ...profileData,
        id: existingProfile.id, // Preserve original ID
        email: existingProfile.email, // Preserve original email
        preferences: {
            ...existingProfile.preferences,
            ...profileData.preferences,
        },
    };

    userProfilesStore.set(userId, updatedProfile);
    return { ...updatedProfile }; // Return a copy
};

// Potentially, a function to create a basic profile when a user registers,
// if not handled by the registration service itself.
// For now, we assume profiles are created or exist.

export { UserProfile };
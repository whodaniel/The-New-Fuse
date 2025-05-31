// Initialize with some mock data, including the MOCK_USER_ID used in controller
const userProfilesStore = new Map([
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
export const getUserProfileById = async (userId) => {
    const profile = userProfilesStore.get(userId);
    return profile ? { ...profile } : null; // Return a copy
};
/**
 * Updates a user's profile by their ID.
 * @param userId The ID of the user.
 * @param profileData Partial data to update the profile.
 * @returns The updated user profile, or null if not found.
 */
export const updateUserProfileById = async (userId, profileData) => {
    const existingProfile = userProfilesStore.get(userId);
    if (!existingProfile) {
        return null;
    }
    // Merge new data with existing profile data
    // Ensure 'id' and 'email' are not overwritten by partial update if they are part of profileData
    const updatedProfile = {
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

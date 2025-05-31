import * as userService from '../services/userService';
// Hardcoded user ID for now, as per instructions
const MOCK_USER_ID = 'mockUserId123';
export const getUserProfile = async (req, res, next) => {
    try {
        // In a real app, userId would come from an authenticated session (e.g., req.user.id)
        const userId = MOCK_USER_ID; // Or req.user.id if auth is implemented
        const userProfile = await userService.getUserProfileById(userId);
        if (!userProfile) {
            res.status(404).json({ message: 'User profile not found' });
            return;
        }
        res.status(200).json(userProfile);
    }
    catch (error) {
        next(error);
    }
};
export const updateUserProfile = async (req, res, next) => {
    try {
        // In a real app, userId would come from an authenticated session
        const userId = MOCK_USER_ID; // Or req.user.id if auth is implemented
        const profileData = req.body;
        // Basic validation (more robust validation should be added)
        if (Object.keys(profileData).length === 0) {
            res.status(400).json({ message: 'Request body cannot be empty' });
            return;
        }
        if (profileData.displayName !== undefined && typeof profileData.displayName !== 'string') {
            res.status(400).json({ message: 'Invalid displayName format' });
            return;
        }
        if (profileData.bio !== undefined && typeof profileData.bio !== 'string') {
            res.status(400).json({ message: 'Invalid bio format' });
            return;
        }
        // Add more validation for preferences if necessary
        const updatedProfile = await userService.updateUserProfileById(userId, profileData);
        if (!updatedProfile) {
            res.status(404).json({ message: 'User profile not found or update failed' });
            return;
        }
        res.status(200).json(updatedProfile);
    }
    catch (error) {
        next(error);
    }
};

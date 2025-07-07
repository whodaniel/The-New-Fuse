"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = exports.getUserProfile = void 0;
const userService = __importStar(require("../services/userService"));
// Hardcoded user ID for now, as per instructions
const MOCK_USER_ID = 'mockUserId123';
const getUserProfile = async (req, res, next) => {
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
exports.getUserProfile = getUserProfile;
const updateUserProfile = async (req, res, next) => {
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
exports.updateUserProfile = updateUserProfile;

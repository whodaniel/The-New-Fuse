import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userController';
// import { authenticateToken } from '../middleware/auth'; // Assuming auth middleware exists or will be added
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: User Profile
 *   description: User profile management
 */
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: [] # Assuming JWT authentication
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 displayName:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     theme:
 *                       type: string
 *                     notifications:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User profile not found
 */
router.get('/profile', /* authenticateToken, */ getUserProfile); // Placeholder for auth middleware
/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: [] # Assuming JWT authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: User's display name
 *               bio:
 *                 type: string
 *                 description: User's biography
 *               preferences:
 *                 type: object
 *                 properties:
 *                   theme:
 *                     type: string
 *                     enum: [light, dark, system]
 *                     description: Preferred theme
 *                   notifications:
 *                     type: boolean
 *                     description: Notification settings
 *             example:
 *               displayName: "Jane Doe"
 *               bio: "Software Developer"
 *               preferences:
 *                 theme: "dark"
 *                 notifications: true
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 displayName:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 preferences:
 *                   type: object
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User profile not found
 */
router.put('/profile', /* authenticateToken, */ updateUserProfile); // Placeholder for auth middleware
export default router;

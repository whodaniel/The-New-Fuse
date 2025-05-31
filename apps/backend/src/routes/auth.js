import express from 'express';
import { authController, googleAuth, googleAuthCallback } from '../controllers/authController.js';
// Create the router
export const authRouter = express.Router();
// Google OAuth routes
authRouter.get('/google', googleAuth);
authRouter.get('/google/callback', googleAuthCallback);
// Local auth routes
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authController.getCurrentUser);

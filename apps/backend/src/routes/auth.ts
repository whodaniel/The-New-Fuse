import express from 'express';
import { AppConfigService } from '../config/app-config.service';
import { SecureAuthController } from '../controllers/authController';

// Create the router
export const authRouter = express.Router();

// Initialize secure auth controller with config service
const appConfig = new AppConfigService();
const authController = new SecureAuthController(appConfig);

// Google OAuth routes
authRouter.get('/google', authController.googleAuth);
authRouter.get('/google/callback', ...authController.googleAuthCallback);

// Local auth routes
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authController.getCurrentUser);

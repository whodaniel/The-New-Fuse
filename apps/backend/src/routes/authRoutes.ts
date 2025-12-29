import express, { NextFunction, Request, Response } from 'express';
import { AppConfigService } from '../config/app-config.service';
import { SecureAuthController } from '../controllers/authController';

const router = express.Router();

// Initialize secure auth controller with config service
const appConfig = new AppConfigService();
const authController = new SecureAuthController(appConfig);

// Wrapper function to handle async route handlers
const asyncHandler = (fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Local auth routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', asyncHandler(authController.getCurrentUser));

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', ...authController.googleAuthCallback);

export const authRoutes = router;

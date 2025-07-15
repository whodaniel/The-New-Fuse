import express from 'express';
import { authController, googleAuth, googleAuthCallback, register, login, logout, getCurrentUser } from '../controllers/authController';

// Create the router
export const authRouter = express.Router();

// Google OAuth routes
authRouter.get('/google', googleAuth);
authRouter.get('/google/callback', googleAuthCallback);

// Local auth routes
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', getCurrentUser);

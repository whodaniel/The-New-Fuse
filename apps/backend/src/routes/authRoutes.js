import express from 'express';
import passport from 'passport';
import { register, login, logout, getCurrentUser } from '../controllers/authController.js';
const router = express.Router();
// Wrapper function to handle async route handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
// Local auth routes
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/me', asyncHandler(getCurrentUser));
// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
});
export const authRoutes = router;

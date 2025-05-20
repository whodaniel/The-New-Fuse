import express from 'express';
import passport from 'passport';
import { register, login, logout, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

// Local auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getCurrentUser);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

export const authRoutes = router;

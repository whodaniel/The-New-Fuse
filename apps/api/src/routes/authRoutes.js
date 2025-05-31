import express from 'express';
import { authController } from '../controllers/authController';
const router = express.Router();
// Auth routes
router.post('/register', authController.register);
router.post('/login', (req, res) => {
    res.status(200).json({ success: true, token: 'test-token' });
});
router.post('/logout', (req, res) => {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});
router.post('/refresh', (req, res) => {
    res.status(200).json({ success: true, token: 'new-test-token' });
});
router.get('/me', (req, res) => {
    res.status(200).json({ success: true, user: { id: '123', email: 'user@example.com', name: 'Test User' } });
});
export { router as authRoutes };

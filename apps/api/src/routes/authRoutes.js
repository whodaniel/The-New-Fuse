"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
exports.authRoutes = router;
// Auth routes
router.post('/register', authController_1.authController.register);
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

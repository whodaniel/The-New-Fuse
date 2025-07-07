"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.getCurrentUser = exports.logout = exports.login = exports.register = exports.googleAuthCallback = exports.googleAuth = void 0;
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const token_1 = require("../utils/token");
const prisma = new client_1.PrismaClient();
exports.googleAuth = passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
});
exports.googleAuthCallback = [
    passport_1.default.authenticate('google', { session: false }),
    async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                throw new Error('No user from Google');
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
            await prisma.session.create({
                data: {
                    userId: user.id,
                    token,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                }
            });
            // Redirect to frontend with token
            res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
        }
        catch (error) {
            console.error('Google auth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }
    },
];
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword
            }
        });
        // Generate token
        const token = (0, token_1.generateToken)(user.id);
        // Create session
        await prisma.session.create({
            data: {
                token,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user'
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        // Generate token
        const token = (0, token_1.generateToken)(user.id);
        // Create session
        await prisma.session.create({
            data: {
                token,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in'
        });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        // Delete session
        await prisma.session.delete({
            where: { token }
        });
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging out'
        });
    }
};
exports.logout = logout;
const getCurrentUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        // Get user
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            }
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting current user'
        });
    }
};
exports.getCurrentUser = getCurrentUser;
// Export the controller object for use in routes
exports.authController = {
    register: exports.register,
    login: exports.login,
    logout: exports.logout,
    getCurrentUser: exports.getCurrentUser,
    googleAuth: exports.googleAuth,
    googleAuthCallback: exports.googleAuthCallback
};

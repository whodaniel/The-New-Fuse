"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const data_source_1 = require("../data-source");
const User_1 = require("../entities/User");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
exports.authService = {
    async register({ name, email, password }) {
        // Check if user already exists
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const user = userRepository.create({
            name,
            email,
            password: hashedPassword,
            role: 'user'
        });
        await userRepository.save(user);
        // Generate tokens
        const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-jwt-secret-key', { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key', { expiresIn: '7d' });
        // Save refresh token to user
        user.refreshToken = refreshToken;
        await userRepository.save(user);
        return {
            user,
            accessToken,
            refreshToken
        };
    },
    async login({ email, password }) {
        // Find user
        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }
        // Generate tokens
        const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-jwt-secret-key', { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key', { expiresIn: '7d' });
        // Save refresh token to user
        user.refreshToken = refreshToken;
        await userRepository.save(user);
        return {
            user,
            accessToken,
            refreshToken
        };
    },
    async getCurrentUser(userId) {
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        return { user };
    },
    async refreshToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key');
            // Find user
            const user = await userRepository.findOne({
                where: {
                    id: decoded.userId,
                    refreshToken
                }
            });
            if (!user) {
                throw new Error('Invalid refresh token');
            }
            // Generate new tokens
            const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-jwt-secret-key', { expiresIn: '15m' });
            const newRefreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key', { expiresIn: '7d' });
            // Save new refresh token to user
            user.refreshToken = newRefreshToken;
            await userRepository.save(user);
            return {
                accessToken,
                refreshToken: newRefreshToken
            };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
};

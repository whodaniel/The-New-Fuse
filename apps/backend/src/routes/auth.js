"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
// Create the router
exports.authRouter = express_1.default.Router();
// Google OAuth routes
exports.authRouter.get('/google', authController_1.googleAuth);
exports.authRouter.get('/google/callback', authController_1.googleAuthCallback);
// Local auth routes
exports.authRouter.post('/register', authController_1.authController.register);
exports.authRouter.post('/login', authController_1.authController.login);
exports.authRouter.post('/logout', authController_1.authController.logout);
exports.authRouter.get('/me', authController_1.authController.getCurrentUser);

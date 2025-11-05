"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatService_1 = require("../services/chatService");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Wrapper function to handle async route handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
router.use(auth_1.authMiddleware);
router.get('/history', asyncHandler(async (req, res) => {
    try {
        // Check if user exists in the request
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const page = parseInt(req.query.page) || 1;
        const history = await chatService_1.ChatService.getChatHistory(req.user.id, page);
        res.json(history);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error retrieving chat history:', errorMessage);
        res.status(500).json({ error: 'Failed to retrieve chat history' });
    }
}));
router.post('/message', asyncHandler(async (req, res) => {
    try {
        // Check if user exists in the request
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { role, content } = req.body;
        const message = await chatService_1.ChatService.addMessage(req.user.id, role, content);
        res.json(message);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error adding message:', errorMessage);
        res.status(400).json({ error: 'Invalid message data' });
    }
}));
router.delete('/history', asyncHandler(async (req, res) => {
    try {
        // Check if user exists in the request
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const result = await chatService_1.ChatService.clearChatHistory(req.user.id);
        res.json(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error clearing chat history:', errorMessage);
        res.status(500).json({ error: 'Failed to clear chat history' });
    }
}));
exports.default = router;
//# sourceMappingURL=chatRoutes.js.map
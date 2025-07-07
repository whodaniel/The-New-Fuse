"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post('/api/onboarding/start', (req, res) => {
    // In a real application, more sophisticated detection logic would be here.
    // This could involve analyzing request headers, IP address, user agent,
    // authentication tokens, or other specific markers.
    const isAgentRequest = Math.random() > 0.5; // 50% chance for demo
    if (isAgentRequest) {
        res.json({ userType: 'ai_agent' });
    }
    else {
        res.json({ userType: 'human' });
    }
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const agents_1 = require("./routes/agents");
const authRoutes_1 = require("./routes/authRoutes");
const onboardingRoutes_1 = __importDefault(require("./routes/onboardingRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes")); // Added userRoutes import
const app = (0, express_1.default)();
const port = process.env.PORT || 3003;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use('/api/agents', agents_1.agentRouter);
app.use('/api/auth', authRoutes_1.authRoutes);
app.use('/api/users', userRoutes_1.default); // Added userRoutes
app.use(onboardingRoutes_1.default); // Register onboarding routes
// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to The New Fuse API Server', status: 'online' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});
app.listen(port, () => {
    console.log(`API server running on port ${port}`);
});

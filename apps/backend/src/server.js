"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./routes/auth");
// Import other routes as needed
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
// API routes
app.use('/api/auth', auth_1.authRouter);
// Add other API routes here
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    // Serve frontend static files
    app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
    });
}
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionMiddleware = void 0;
const SessionManager_1 = require("../services/SessionManager");
const sessionMiddleware = (req, res, next) => {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    if (sessionId) {
        const session = SessionManager_1.sessionManager.getSession(sessionId);
        if (session) {
            // req.session = session; // This line causes a type conflict with express-session
            // Here we would typically load the user from the database
            // For this example, we'll just create a mock user
            req.user = {
                id: session.userId,
                email: 'user@example.com',
                roles: ['user']
            };
        }
    }
    next();
};
exports.sessionMiddleware = sessionMiddleware;
//# sourceMappingURL=session.middleware.js.map
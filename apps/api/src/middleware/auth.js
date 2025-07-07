"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const errorHandler_1 = require("./errorHandler");
/**
 * Authentication middleware
 * Verifies that the user is authenticated before proceeding
 */
function authenticate(req, res, next) {
    // TODO: Implement proper authentication
    // This is just a placeholder implementation
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'test-token' || process.env.NODE_ENV === 'development') {
        // For development, allow any token
        next();
    }
    else {
        // In a real implementation, we would verify the token
        next(new errorHandler_1.ApiError(401, 'Unauthorized'));
    }
}

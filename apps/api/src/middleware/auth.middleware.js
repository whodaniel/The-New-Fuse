/**
 * Authentication Middleware - JWT token validation
 */
import jwt from 'jsonwebtoken';
export function authMiddleware(req, res, next) {
    const authReq = req;
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, jwtSecret);
        authReq.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
        }
        else if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
        }
        else {
            res.status(500).json({ error: 'Authentication error' });
        }
    }
}
//# sourceMappingURL=auth.middleware.js.map
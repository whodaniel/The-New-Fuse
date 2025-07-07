"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.verifyFirebaseToken = void 0;
const firebase_admin_1 = require("../lib/firebase-admin");
const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await firebase_admin_1.auth.verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role,
        };
        next();
    }
    catch (error) {
        console.error('Error verifying Firebase token:', error);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
exports.verifyFirebaseToken = verifyFirebaseToken;
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: No user found' });
        }
        const { uid } = req.user;
        const userRecord = await firebase_admin_1.auth.getUser(uid);
        const customClaims = userRecord.customClaims || {};
        if (!customClaims.admin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        next();
    }
    catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireAdmin = requireAdmin;

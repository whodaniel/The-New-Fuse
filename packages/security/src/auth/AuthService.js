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
exports.AuthService = void 0;
const jwt = __importStar(require("jsonwebtoken"));
class AuthService {
    prisma;
    hashingService;
    jwtSecret;
    constructor(prisma, hashingService) {
        this.prisma = prisma;
        this.hashingService = hashingService;
        this.jwtSecret = process.env.JWT_SECRET || 'super-secret-key';
    }
    async authenticate(req) {
        try {
            const token = this.extractTokenFromRequest(req);
            if (!token)
                return false;
            const decoded = jwt.verify(token, this.jwtSecret);
            if (!decoded.userId)
                return false;
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.userId },
                include: {
                    userPermissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            });
            if (!user)
                return false;
            // Transform user data to match the expected User interface
            const transformedUser = {
                id: user.id,
                email: user.email,
                name: user.name || undefined,
                permissions: user.userPermissions.map((up) => ({
                    id: up.permission.id,
                    name: up.permission.name
                }))
            };
            req.user = transformedUser;
            return true;
        }
        catch {
            return false;
        }
    }
    extractTokenFromRequest(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
    async validatePermission(user, permission) {
        return user.permissions.some(p => p.name === permission);
    }
    // Consolidated methods from other auth services
    async validateUser(email, password) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                userPermissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
        if (user && user.hashedPassword && await this.hashingService.compare(password, user.hashedPassword)) {
            return user;
        }
        return null;
    }
    async login(user) {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: jwt.sign(payload, this.jwtSecret),
            user: {
                id: user.id,
                email: user.email,
                name: user.name || undefined
            }
        };
    }
    async register(email, password, name) {
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        // Hash password
        const hashedPassword = await this.hashingService.hash(password);
        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                hashedPassword,
                name,
                role: 'USER'
            }
        });
        // Generate JWT token
        const payload = { email: user.email, sub: user.id };
        const access_token = jwt.sign(payload, this.jwtSecret);
        return {
            access_token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name || undefined
            }
        };
    }
    async validateToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        }
        catch {
            return null;
        }
    }
    async logout(token) {
        // In a production system, you might want to blacklist the token
        // For now, just return success
        return { message: 'Logged out successfully' };
    }
    async validateFirebaseToken(token) {
        // Firebase token validation logic - placeholder for now
        // In production, verify the Firebase token with Firebase Admin SDK
        // For now, return a mock decoded token
        return {
            uid: 'firebase-user-' + Date.now(),
            email: 'firebase@example.com',
            name: 'Firebase User'
        };
    }
    async authenticateFirebase(firebaseToken) {
        // Firebase authentication logic - placeholder for now
        // In production, verify the Firebase token with Firebase Admin SDK
        const decodedToken = await this.validateFirebaseToken(firebaseToken);
        // For now, we'll create a mock user - replace with actual Firebase verification
        const mockUser = {
            id: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            createdAt: new Date(),
            updatedAt: new Date(),
            hashedPassword: '',
            role: 'USER',
            userPermissions: []
        };
        return this.login(mockUser);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development-only';
const SALT_ROUNDS = 10;
// Hash a password
export async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}
// Compare a password with a hash
export async function comparePasswords(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}
// Generate a JWT token
export function generateToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
// Verify a JWT token
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Error('Invalid token');
    }
}
// Validate user credentials
export async function validateUser(email, password, prisma) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return null;
    }
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
        return null;
    }
    // Don't return the password
    const { password: _, ...result } = user;
    return result;
}

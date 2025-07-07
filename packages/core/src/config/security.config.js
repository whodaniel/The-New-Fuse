import { registerAs } from '@nestjs/config';
import * as crypto from 'crypto';
export default registerAs('security', () => {
    const jwtSecret = process.env.JWT_SECRET || generateSecretKey();
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET must be set in production environment');
    }
    return {
        jwt: {
            secret: jwtSecret,
            expiresIn: process.env.JWT_EXPIRES_IN || '1h',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        },
        cors: {
            origin: getCorsOrigins(),
            credentials: true,
            optionsSuccessStatus: 200
        },
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later'
        },
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"]
                }
            },
            crossOriginEmbedderPolicy: false
        },
        encryption: {
            algorithm: 'aes-256-gcm',
            keyLength: 32,
            ivLength: 16,
            tagLength: 16
        },
        session: {
            secret: process.env.SESSION_SECRET || jwtSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000') // 24 hours
            }
        },
        bcrypt: {
            saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
        },
        apiKeys: {
            headerName: 'x-api-key',
            validKeys: process.env.API_KEYS?.split(',') || []
        },
        oauth: {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackUrl: process.env.GOOGLE_CALLBACK_URL
            },
            github: {
                clientId: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackUrl: process.env.GITHUB_CALLBACK_URL
            }
        }
    };
});
function generateSecretKey() {
    return crypto.randomBytes(32).toString('hex');
}
function getCorsOrigins() {
    const origins = process.env.CORS_ORIGINS;
    if (!origins) {
        return process.env.NODE_ENV === 'development';
    }
    if (origins === '*') {
        return true;
    }
    return origins.split(',').map(origin => origin.trim());
}

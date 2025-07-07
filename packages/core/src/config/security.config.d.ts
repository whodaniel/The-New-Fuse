declare const _default: (() => {
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    cors: {
        origin: boolean | string[];
        credentials: boolean;
        optionsSuccessStatus: number;
    };
    rateLimit: {
        windowMs: number;
        max: number;
        message: string;
    };
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: string[];
                styleSrc: string[];
                scriptSrc: string[];
                imgSrc: string[];
                connectSrc: string[];
            };
        };
        crossOriginEmbedderPolicy: boolean;
    };
    encryption: {
        algorithm: string;
        keyLength: number;
        ivLength: number;
        tagLength: number;
    };
    session: {
        secret: string;
        resave: boolean;
        saveUninitialized: boolean;
        cookie: {
            secure: boolean;
            httpOnly: boolean;
            maxAge: number;
        };
    };
    bcrypt: {
        saltRounds: number;
    };
    apiKeys: {
        headerName: string;
        validKeys: string[];
    };
    oauth: {
        google: {
            clientId: string;
            clientSecret: string;
            callbackUrl: string;
        };
        github: {
            clientId: string;
            clientSecret: string;
            callbackUrl: string;
        };
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    cors: {
        origin: boolean | string[];
        credentials: boolean;
        optionsSuccessStatus: number;
    };
    rateLimit: {
        windowMs: number;
        max: number;
        message: string;
    };
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: string[];
                styleSrc: string[];
                scriptSrc: string[];
                imgSrc: string[];
                connectSrc: string[];
            };
        };
        crossOriginEmbedderPolicy: boolean;
    };
    encryption: {
        algorithm: string;
        keyLength: number;
        ivLength: number;
        tagLength: number;
    };
    session: {
        secret: string;
        resave: boolean;
        saveUninitialized: boolean;
        cookie: {
            secure: boolean;
            httpOnly: boolean;
            maxAge: number;
        };
    };
    bcrypt: {
        saltRounds: number;
    };
    apiKeys: {
        headerName: string;
        validKeys: string[];
    };
    oauth: {
        google: {
            clientId: string;
            clientSecret: string;
            callbackUrl: string;
        };
        github: {
            clientId: string;
            clientSecret: string;
            callbackUrl: string;
        };
    };
}>;
export default _default;
export interface SecurityConfig {
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    cors: {
        origin: string[] | boolean;
        credentials: boolean;
        optionsSuccessStatus: number;
    };
    rateLimit: {
        windowMs: number;
        max: number;
        message: string;
    };
    helmet: {
        contentSecurityPolicy: {
            directives: Record<string, string[]>;
        };
        crossOriginEmbedderPolicy: boolean;
    };
    encryption: {
        algorithm: string;
        keyLength: number;
        ivLength: number;
        tagLength: number;
    };
    session: {
        secret: string;
        resave: boolean;
        saveUninitialized: boolean;
        cookie: {
            secure: boolean;
            httpOnly: boolean;
            maxAge: number;
        };
    };
    bcrypt: {
        saltRounds: number;
    };
    apiKeys: {
        headerName: string;
        validKeys: string[];
    };
    oauth: {
        google: {
            clientId?: string;
            clientSecret?: string;
            callbackUrl?: string;
        };
        github: {
            clientId?: string;
            clientSecret?: string;
            callbackUrl?: string;
        };
    };
}
//# sourceMappingURL=security.config.d.ts.map
import { registerAs } from '@nestjs/config';
import * as crypto from 'crypto';
export default registerAs('security', () => {
  // Implementation needed
}
  const jwtSecret = process.env.JWT_SECRET || generateSecretKey();
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  // Implementation needed
}
    throw new Error('JWT_SECRET must be set in production environment');
  }

  return {
  // Implementation needed
}
    jwt: {
  // Implementation needed
}
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    cors: {
  // Implementation needed
}
      origin: getCorsOrigins(),
      credentials: true,
      optionsSuccessStatus: 200
    },
    rateLimit: {
  // Implementation needed
}
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later'
    },
    helmet: {
  // Implementation needed
}
      contentSecurityPolicy: {
  // Implementation needed
}
        directives: {
  // Implementation needed
}
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
  // Implementation needed
}
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16
    },
    session: {
  // Implementation needed
}
      secret: process.env.SESSION_SECRET || jwtSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
  // Implementation needed
}
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000') // 24 hours
      }
    },
    bcrypt: {
  // Implementation needed
}
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
    },
    apiKeys: {
  // Implementation needed
}
      headerName: 'x-api-key',
      validKeys: process.env.API_KEYS?.split(',') || []
    },
    oauth: {
  // Implementation needed
}
      google: {
  // Implementation needed
}
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL
      },
      github: {
  // Implementation needed
}
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackUrl: process.env.GITHUB_CALLBACK_URL
      }
    }
  };
});
function generateSecretKey(): string {
  // Implementation needed
}
  return crypto.randomBytes(32).toString('hex');
}

function getCorsOrigins(): string[] | boolean {
  // Implementation needed
}
  const origins = process.env.CORS_ORIGINS;
  if (!origins) {
  // Implementation needed
}
    return process.env.NODE_ENV === 'development';
  }
  
  if (origins === '*') {
  // Implementation needed
}
    return true;
  }
  
  return origins.split(',').map(origin => origin.trim());
}

export interface SecurityConfig {
  // Implementation needed
}
  jwt: {
  // Implementation needed
}
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
  // Implementation needed
}
    origin: string[] | boolean;
    credentials: boolean;
    optionsSuccessStatus: number;
  };
  rateLimit: {
  // Implementation needed
}
    windowMs: number;
    max: number;
    message: string;
  };
  helmet: {
  // Implementation needed
}
    contentSecurityPolicy: {
  // Implementation needed
}
      directives: Record<string, string[]>;
    };
    crossOriginEmbedderPolicy: boolean;
  };
  encryption: {
  // Implementation needed
}
    algorithm: string;
    keyLength: number;
    ivLength: number;
    tagLength: number;
  };
  session: {
  // Implementation needed
}
    secret: string;
    resave: boolean;
    saveUninitialized: boolean;
    cookie: {
  // Implementation needed
}
      secure: boolean;
      httpOnly: boolean;
      maxAge: number;
    };
  };
  bcrypt: {
  // Implementation needed
}
    saltRounds: number;
  };
  apiKeys: {
  // Implementation needed
}
    headerName: string;
    validKeys: string[];
  };
  oauth: {
  // Implementation needed
}
    google: {
  // Implementation needed
}
      clientId?: string;
      clientSecret?: string;
      callbackUrl?: string;
    };
    github: {
  // Implementation needed
}
      clientId?: string;
      clientSecret?: string;
      callbackUrl?: string;
    };
  };
}
# Environment Variables Documentation

## Frontend Environment Variables

### Core Configuration
```env
# API URL for backend communication
VITE_API_URL=http://localhost:3001

# Environment mode (development/production)
NODE_ENV=development

# WebSocket connection URL
VITE_WS_URL=ws://localhost:3001

# Enable/disable debug features
VITE_DEBUG_MODE=false
```

### Authentication
```env
# Authentication token storage key
VITE_AUTH_TOKEN_KEY=auth_token

# Token refresh interval in minutes
VITE_TOKEN_REFRESH_INTERVAL=15
```

## Backend Environment Variables

### Server Configuration
```env
# Server port number
PORT=3001

# Node environment (development/production)
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# API rate limit per minute
RATE_LIMIT=100
```

### Database Configuration
```env
# PostgreSQL connection details
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=the_new_fuse
DB_SSL=false

# Database pool configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Authentication
```env
# JWT configuration
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Password hashing
BCRYPT_SALT_ROUNDS=12
```

### Monitoring
```env
# Monitoring configuration
ENABLE_MONITORING=true
METRICS_INTERVAL=60000
ERROR_THRESHOLD=50

# Health check configuration
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
```

### Logging
```env
# Log configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=logs/app.log
MAX_LOG_SIZE=10m
MAX_LOG_FILES=5
```

## Usage Instructions

1. Copy the appropriate `.env.example` file for your service:
   ```bash
   cp apps/frontend/.env.example apps/frontend/.env
   cp apps/api/.env.example apps/api/.env
   ```

2. Fill in the values in your new `.env` files

3. For development, you can use the default values in `.env.example`

4. For production, ensure you set secure values for:
   - JWT secrets
   - Database credentials
   - API rate limits
   - SSL certificates

## Environment Specific Configurations

### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_MONITORING=true
DB_SSL=false
```

### Production
```env
NODE_ENV=production
LOG_LEVEL=info
ENABLE_MONITORING=true
DB_SSL=true
RATE_LIMIT=60
```

### Testing
```env
NODE_ENV=test
LOG_LEVEL=debug
ENABLE_MONITORING=false
DB_DATABASE=the_new_fuse_test
```

## Security Notes

1. Never commit `.env` files to version control
2. Use strong, unique values for secrets in production
3. Rotate secrets periodically
4. Use different database credentials for different environments
5. Enable SSL in production for database connections

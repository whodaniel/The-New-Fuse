# Environment Variables Documentation

Complete reference for all environment variables used across The New Fuse
platform.

## Table of Contents

- [Overview](#overview)
- [Shared Variables](#shared-variables)
- [Service-Specific Variables](#service-specific-variables)
  - [API Service](#api-service)
  - [API Gateway](#api-gateway)
  - [Backend Service](#backend-service)
  - [Frontend Service](#frontend-service)
- [External Services](#external-services)
- [Security Considerations](#security-considerations)
- [Validation](#validation)

## Overview

Environment variables configure application behavior across different
environments (development, staging, production). This document provides a
comprehensive reference for all variables used in the platform.

### Variable Naming Conventions

- **Backend services (Node.js):** Use `VARIABLE_NAME` format
- **Frontend (Vite):** Must start with `VITE_` prefix (e.g., `VITE_API_URL`)
- **React legacy code:** May use `REACT_APP_` or `NEXT_PUBLIC_` prefixes

### Required vs Optional

- **Required:** Must be set for service to function
- **Optional:** Service works without them, but features may be limited
- **Conditional:** Required only if using specific features

## Shared Variables

These variables must be **identical** across multiple services.

### JWT_SECRET

**Used in:** API Service, Backend Service **Type:** String (minimum 32
characters) **Required:** Yes **Security:** CRITICAL - Never commit to version
control

Secret key used for signing and verifying JWT tokens.

```bash
# Generation
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Production Requirements:**

- Minimum 64 characters recommended
- Use cryptographically secure random generation
- Must be identical in API and Backend services
- Rotate periodically (every 90 days)

**Default:** `your-secret-key` (development only)

**Example:**

```bash
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

### DATABASE_URL

**Used in:** API Service, Backend Service **Type:** PostgreSQL connection string
**Required:** Yes

PostgreSQL database connection URL.

**Format:**

```bash
postgresql://[user]:[password]@[host]:[port]/[database]?[params]
```

**Railway:**

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Example:**

```bash
# Development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fuse

# Production (Railway auto-generated)
DATABASE_URL=postgresql://postgres:***@containers-us-west-1.railway.app:5432/railway
```

**Related Variables:**

- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`

---

### REDIS_URL

**Used in:** API Service, Backend Service **Type:** Redis connection string
**Required:** Recommended

Redis connection URL for caching and session management.

**Format:**

```bash
redis://[password]@[host]:[port]/[db]
rediss://[password]@[host]:[port]/[db]  # Secure
```

**Railway:**

```bash
REDIS_URL=${{Redis.REDIS_URL}}
```

**Example:**

```bash
# Development
REDIS_URL=redis://localhost:6379

# Production with auth
REDIS_URL=redis://password@containers-us-west-1.railway.app:6379
```

**Alternative:** Can use `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` separately

---

## Service-Specific Variables

### API Service

#### Server Configuration

##### NODE_ENV

**Type:** String **Required:** No **Default:** `development` **Valid values:**
`development`, `production`, `test`

Determines application environment and behavior.

**Effects:**

- `production`: Enables optimizations, disables debug features, strict security
- `development`: Enables debug features, verbose logging, relaxed security
- `test`: Used for automated testing

```bash
NODE_ENV=production
```

##### PORT / API_PORT

**Type:** Number **Required:** No **Default:** `3001` **Range:** 1-65535

Port number for API server to listen on.

```bash
PORT=3001
API_PORT=3001  # Alternative name
```

#### JWT Configuration

##### JWT_SECRET

See [Shared Variables](#jwt_secret)

##### JWT_REFRESH_SECRET

**Type:** String (minimum 32 characters) **Required:** Yes **Security:**
CRITICAL

Separate secret for refresh token signing.

```bash
JWT_REFRESH_SECRET=<64-character-random-string>
```

##### JWT_EXPIRATION / JWT_EXPIRES_IN

**Type:** String (time span) **Required:** No **Default:** `1h`

Access token expiration time.

#### Agent Security & Federation

##### A2A_REQUIRE_TENANT_SCOPE

**Type:** Boolean **Required:** No **Default:** `true`

Require tenant/org/agency scope on A2A subscriptions outside system/broadcast channels.

```bash
A2A_REQUIRE_TENANT_SCOPE=true
```

##### AGENT_INVITE_REQUIRED

**Type:** Boolean **Required:** No **Default:** `true`

Require invitation codes for agent registration and orchestrator onboarding.

```bash
AGENT_INVITE_REQUIRED=true
```

**Format:** `<number><unit>` where unit is `s` (seconds), `m` (minutes), `h`
(hours), `d` (days)

```bash
JWT_EXPIRATION=1h
JWT_EXPIRES_IN=15m  # More secure
```

##### JWT_REFRESH_EXPIRATION / JWT_REFRESH_EXPIRES_IN

**Type:** String (time span) **Required:** No **Default:** `7d`

Refresh token expiration time.

```bash
JWT_REFRESH_EXPIRATION=7d
```

##### JWT_ISSUER

**Type:** String **Required:** No **Default:** `the-new-fuse-api`

JWT issuer claim for token validation.

```bash
JWT_ISSUER=the-new-fuse-api
```

##### JWT_AUDIENCE

**Type:** String **Required:** No **Default:** `the-new-fuse-clients`

JWT audience claim for token validation.

```bash
JWT_AUDIENCE=the-new-fuse-clients
```

#### CORS Configuration

##### ALLOWED_ORIGINS

**Type:** Comma-separated string **Required:** Recommended for production

Allowed origins for CORS requests.

```bash
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Production
ALLOWED_ORIGINS=https://app.thenewfuse.com,https://admin.thenewfuse.com
```

**Security:** Never use `*` in production

##### FRONTEND_URL

**Type:** URL string **Required:** Recommended

Primary frontend application URL.

```bash
FRONTEND_URL=https://app.thenewfuse.com
```

#### Rate Limiting

##### RATE_LIMIT_DEFAULT

**Type:** Number **Required:** No **Default:** `100`

Default number of requests allowed per window.

```bash
RATE_LIMIT_DEFAULT=100
```

##### RATE_LIMIT_WINDOW

**Type:** Number (milliseconds) **Required:** No **Default:** `60000` (1 minute)

Time window for rate limiting.

```bash
RATE_LIMIT_WINDOW=60000  # 1 minute
```

##### RATE_LIMIT_AUTH

**Type:** Number **Required:** No **Default:** `5`

Rate limit for authentication endpoints (login, register).

```bash
RATE_LIMIT_AUTH=5  # 5 attempts per minute
```

##### RATE_LIMIT_API

**Type:** Number **Required:** No **Default:** `100`

Rate limit for general API endpoints.

```bash
RATE_LIMIT_API=100
```

#### External Services

##### OPENAI_API_KEY

**Type:** String (starts with `sk-`) **Required:** Conditional (if using OpenAI)
**Security:** SECRET

OpenAI API key for GPT models.

```bash
OPENAI_API_KEY=sk-...
```

##### ANTHROPIC_API_KEY

**Type:** String (starts with `sk-ant-`) **Required:** Conditional (if using
Claude) **Security:** SECRET

Anthropic API key for Claude models.

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

##### WEB3AUTH_CLIENT_ID

**Type:** String **Required:** Conditional (if using Web3Auth)

Web3Auth client identifier.

```bash
WEB3AUTH_CLIENT_ID=your-client-id
```

##### WEB3AUTH_JWT_SECRET

**Type:** String (minimum 32 characters) **Required:** Conditional (if using
Web3Auth) **Security:** SECRET

Secret for Web3Auth JWT signing.

```bash
WEB3AUTH_JWT_SECRET=<64-character-random-string>
```

##### ETHEREUM_RPC_URL

**Type:** URL **Required:** Conditional (if using blockchain features)

Ethereum RPC endpoint URL.

```bash
ETHEREUM_RPC_URL=https://rpc.ankr.com/eth
```

#### Email Configuration

##### SMTP_HOST

**Type:** String **Required:** Conditional (if using email)

SMTP server hostname.

```bash
SMTP_HOST=smtp.sendgrid.net
```

##### SMTP_PORT

**Type:** Number **Required:** Conditional (if using email) **Common values:**
587 (TLS), 465 (SSL), 25 (unsecured)

SMTP server port.

```bash
SMTP_PORT=587
```

##### SMTP_USER

**Type:** String **Required:** Conditional (if using email)

SMTP authentication username.

```bash
SMTP_USER=apikey
```

##### SMTP_PASS

**Type:** String **Required:** Conditional (if using email) **Security:** SECRET

SMTP authentication password.

```bash
SMTP_PASS=SG.xxxxx
```

#### Monitoring & Logging

##### LOG_LEVEL

**Type:** String **Required:** No **Default:** `info` **Valid values:** `error`,
`warn`, `info`, `debug`, `verbose`

Logging verbosity level.

```bash
# Production
LOG_LEVEL=warn

# Development
LOG_LEVEL=debug
```

##### SENTRY_DSN

**Type:** URL **Required:** Optional

Sentry error tracking DSN.

```bash
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### API Gateway

#### Backend Service URLs

##### BACKEND_SERVICE_URL

**Type:** URL **Required:** No **Default:** `http://localhost:3001`

Backend service URL for proxying requests.

```bash
# Development
BACKEND_SERVICE_URL=http://localhost:3001

# Production
BACKEND_SERVICE_URL=https://backend-production.up.railway.app
```

##### AGENTS_SERVICE_URL

**Type:** URL **Required:** No **Default:** `http://localhost:3001`

AI Agents service URL.

```bash
AGENTS_SERVICE_URL=https://api-service-production.up.railway.app
```

##### WEBHOOKS_SERVICE_URL

**Type:** URL **Required:** No **Default:** `http://localhost:3002`

Webhooks service URL.

```bash
WEBHOOKS_SERVICE_URL=https://webhooks-production.up.railway.app
```

##### THEIA_IDE_URL

**Type:** URL **Required:** No **Default:** `http://localhost:3007`

SkIDEancer IDE service URL.

```bash
THEIA_IDE_URL=https://ide-production.up.railway.app
```

#### CORS Configuration

##### CORS_ORIGINS

**Type:** Comma-separated string **Required:** No **Default:**
`http://localhost:3000,http://localhost:5173`

Allowed CORS origins for API Gateway.

```bash
CORS_ORIGINS=https://app.thenewfuse.com
```

### Backend Service

#### Server Configuration

##### PORT

**Type:** Number **Required:** No **Default:** `5000`

Backend service port.

```bash
PORT=5000
```

#### OpenClaw / Skill Security

##### OPENCLAW_SKILL_SIGNATURE_REQUIRED

**Type:** Boolean **Required:** No **Default:** `false`

Require skill signature verification before execution.

```bash
OPENCLAW_SKILL_SIGNATURE_REQUIRED=true
```

##### OPENCLAW_SKILL_SIGNING_KEY

**Type:** String **Required:** Conditional (if signature required) **Security:** SECRET

HMAC secret used to verify OpenClaw skill signatures.

```bash
OPENCLAW_SKILL_SIGNING_KEY=your-hmac-secret
```

#### Authentication

##### GOOGLE_CLIENT_ID

**Type:** String **Required:** Conditional (if using Google OAuth)

Google OAuth 2.0 client ID.

```bash
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

##### GOOGLE_CLIENT_SECRET

**Type:** String **Required:** Conditional (if using Google OAuth) **Security:**
SECRET

Google OAuth 2.0 client secret.

```bash
GOOGLE_CLIENT_SECRET=xxxxx
```

##### GOOGLE_CALLBACK_URL

**Type:** URL **Required:** Conditional (if using Google OAuth)

OAuth callback URL registered with Google.

```bash
GOOGLE_CALLBACK_URL=https://app.thenewfuse.com/auth/google/callback
```

#### AWS Configuration

##### AWS_ACCESS_KEY_ID

**Type:** String **Required:** Conditional (if using S3) **Security:** SECRET

AWS access key for S3 operations.

```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
```

##### AWS_SECRET_ACCESS_KEY

**Type:** String **Required:** Conditional (if using S3) **Security:** CRITICAL

AWS secret key for S3 operations.

```bash
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

##### AWS_REGION

**Type:** String **Required:** Conditional (if using AWS) **Default:**
`us-east-1`

AWS region for services.

```bash
AWS_REGION=us-east-1
```

##### S3_BUCKET_NAME

**Type:** String **Required:** Conditional (if using S3)

S3 bucket name for file uploads.

```bash
S3_BUCKET_NAME=tnf-uploads-production
```

### Frontend Service

Frontend variables must be prefixed with `VITE_` to be accessible in the
browser.

#### API Configuration

##### VITE_API_URL

**Type:** URL **Required:** No **Default:** `http://localhost:3001`

Backend API base URL.

```bash
# Development
VITE_API_URL=http://localhost:3001

# Production
VITE_API_URL=https://api-gateway.thenewfuse.com
```

##### VITE_WS_URL

**Type:** WebSocket URL **Required:** No **Default:** `ws://localhost:3001`

WebSocket server URL.

```bash
# Development
VITE_WS_URL=ws://localhost:3001

# Production
VITE_WS_URL=wss://api-gateway.thenewfuse.com
```

#### Feature Flags

##### VITE_ENABLE_ANALYTICS

**Type:** Boolean string **Required:** No **Default:** `false`

Enable analytics tracking.

```bash
VITE_ENABLE_ANALYTICS=true
```

##### VITE_ENABLE_DEBUG

**Type:** Boolean string **Required:** No **Default:** `true`

Enable debug features.

```bash
# Production
VITE_ENABLE_DEBUG=false

# Development
VITE_ENABLE_DEBUG=true
```

#### Firebase Configuration

All Firebase variables are required together if using Firebase authentication.

##### VITE_FIREBASE_API_KEY

**Type:** String **Required:** Conditional **Security:** PUBLIC (but restrict in
Firebase console)

```bash
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXX
```

##### VITE_FIREBASE_AUTH_DOMAIN

**Type:** String **Required:** Conditional

```bash
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
```

##### VITE_FIREBASE_PROJECT_ID

**Type:** String **Required:** Conditional

```bash
VITE_FIREBASE_PROJECT_ID=your-app
```

## Security Considerations

### Critical Security Variables

These variables must be kept secret and never committed to version control:

1. `JWT_SECRET` - Token signing
2. `JWT_REFRESH_SECRET` - Refresh token signing
3. `DATABASE_URL` - Contains database credentials
4. `REDIS_URL` - May contain Redis password
5. `SMTP_PASS` - Email service password
6. `AWS_SECRET_ACCESS_KEY` - AWS credentials
7. `OPENAI_API_KEY` - AI service key
8. `ANTHROPIC_API_KEY` - AI service key
9. `GOOGLE_CLIENT_SECRET` - OAuth secret
10. `WEB3AUTH_JWT_SECRET` - Web3 signing secret

### Best Practices

1. **Never commit secrets to Git**
   - Use `.env.local` for local development
   - Add `.env.local` to `.gitignore`
   - Use `.env.example` as template without actual secrets

2. **Use strong secrets in production**
   - Minimum 64 characters for JWT secrets
   - Use cryptographically secure random generation
   - Rotate secrets periodically

3. **Restrict CORS origins**
   - Never use `*` in production
   - List explicit allowed origins
   - Include protocol (http/https)

4. **Use environment-specific values**
   - `localhost` URLs for development
   - HTTPS URLs for production
   - Separate databases for staging/production

5. **Validate on startup**
   - Use validation scripts in each service
   - Fail fast if required variables missing
   - Warn about insecure configurations

## Validation

Each service includes environment validation:

- **Backend:** `/home/user/fuse/apps/backend/src/utils/validate-env.ts`
- **API:** `/home/user/fuse/apps/api/src/utils/validate-env.ts`
- **API Gateway:** `/home/user/fuse/apps/api-gateway/src/utils/validate-env.ts`
- **Frontend:** `/home/user/fuse/apps/frontend/src/utils/validate-env.ts`

### Running Validation

```typescript
import { validateEnvironmentOrExit } from './utils/validate-env';

// In main.ts or server.ts
validateEnvironmentOrExit();
```

Validation checks:

- Required variables are present
- Values match expected format
- Secrets meet minimum length
- Production-specific requirements
- Warns about insecure configurations

## Quick Reference

### Development Setup

```bash
# Copy example files
cp .env.example .env.local

# Or for all services
find apps -name ".env.example" -exec sh -c 'cp "$1" "${1%.example}"' _ {} \;

# Generate secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Production Checklist

- [ ] All JWT secrets are unique and 64+ characters
- [ ] Database URLs use production databases
- [ ] CORS origins are restrictive
- [ ] HTTPS is used for all URLs
- [ ] API keys for external services are set
- [ ] Monitoring (Sentry) is configured
- [ ] Log level is `warn` or `error`
- [ ] Debug features are disabled
- [ ] Email service is configured
- [ ] All required variables are set

# Security Migration Guide

**The New Fuse - Critical Security and Performance Fixes**

This guide documents the security improvements implemented by the Implementer
Agent and provides step-by-step instructions for deploying these changes.

---

## Overview

This migration implements critical security fixes to eliminate hardcoded
secrets, add input validation, and establish fail-fast configuration validation.
The changes are backward compatible where possible but require environment
variable updates for production deployment.

### What Changed

1. **Centralized Configuration Service** - All configuration now goes through
   `AppConfigService` with startup validation
2. **Input Validation DTOs** - All user inputs are validated using
   class-validator decorators
3. **Removed Hardcoded Secrets** - All `|| '[REDACTED_SECRET]-key'` fallbacks
   have been eliminated
4. **Enhanced .env Documentation** - Clear security requirements and validation
   rules

---

## Pre-Deployment Checklist

Before deploying these changes, ensure you have:

- [ ] Access to your production environment variables
- [ ] Ability to generate secure random strings (32+ characters)
- [ ] Database connection string ready
- [ ] Redis connection string ready
- [ ] At least one AI service API key (Anthropic or OpenAI)
- [ ] Backup of current environment variables

---

## Step 1: Generate Secure Secrets

### Generate JWT Secret (Required)

The JWT_SECRET must be at least 32 characters and cannot contain placeholder
values.

**Using Node.js:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using OpenSSL:**

```bash
openssl rand -hex 32
```

**Using Python:**

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Save the output - you'll need it for your `.env` file.

### Generate Additional Secrets (Optional but Recommended)

Generate separate secrets for:

- `JWT_REFRESH_SECRET` (if using refresh tokens)
- `WEB3AUTH_JWT_SECRET` (if using Web3 auth)
- `EXTENSION_JWT_SECRET` (if using VS Code extension)

---

## Step 2: Update Environment Variables

### Required Variables

These variables MUST be set or the application will fail to start:

```bash
# CRITICAL - Application will not start without these

# JWT Secret (minimum 32 characters, no placeholders)
JWT_SECRET=<your-generated-secret-from-step-1>

# Database (valid PostgreSQL connection string)
DATABASE_URL=postgresql://username:password@host:port/database

# Redis (valid Redis connection string)
REDIS_URL=redis://host:port
```

### Production-Only Requirements

In production mode (`NODE_ENV=production`), these additional requirements apply:

```bash
# Frontend URL (required for CORS and OAuth)
FRONTEND_URL=https://your-production-frontend.com

# At least ONE AI service API key required
ANTHROPIC_API_KEY=sk-ant-xxxxx
# OR
OPENAI_API_KEY=sk-xxxxx
```

### Recommended Production Variables

```bash
# JWT Configuration
JWT_ISSUER=the-new-fuse
JWT_EXPIRES_IN=7d

# CORS Origins (comma-separated, should NOT include localhost)
CORS_ORIGINS=https://your-frontend.com,https://www.your-frontend.com

# Backend URL
BACKEND_URL=https://your-backend.com
```

### Example .env File

See `.env.example` for a complete example with all variables documented.

---

## Step 3: Validation Behavior

### Fail-Fast Validation

The application now validates configuration on startup. If any required
variables are missing or invalid, the application will:

1. **Log detailed error messages** showing exactly what's wrong
2. **Refuse to start** (process.exit(1))
3. **Display all validation errors** at once

Example validation error output:

```
Configuration validation failed:
  1. JWT_SECRET is required but not set
  2. DATABASE_URL is required but not set
  3. FRONTEND_URL is required but not set

Application cannot start with invalid configuration.
Please check your .env file and ensure all required secrets are set.
```

### Common Validation Errors

| Error                                            | Cause                   | Solution                                |
| ------------------------------------------------ | ----------------------- | --------------------------------------- |
| `JWT_SECRET is required but not set`             | Missing JWT_SECRET      | Add JWT_SECRET to .env                  |
| `JWT_SECRET must be at least 32 characters long` | Secret too short        | Use generated secret from Step 1        |
| `JWT_SECRET contains a placeholder value`        | Using default value     | Replace with real secret                |
| `DATABASE_URL is required but not set`           | Missing database config | Add valid PostgreSQL URL                |
| `REDIS_URL is required but not set`              | Missing Redis config    | Add valid Redis URL                     |
| `At least one AI service API key required`       | Missing API keys (prod) | Add ANTHROPIC_API_KEY or OPENAI_API_KEY |

---

## Step 4: Testing the Migration

### Local Testing

1. **Update your local `.env` file:**

   ```bash
   cp .env.example .env
   # Edit .env with real values
   ```

2. **Generate test secrets:**

   ```bash
   export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   echo "JWT_SECRET=$JWT_SECRET" >> .env
   ```

3. **Ensure Docker services are running:**

   ```bash
   pnpm run docker:start
   ```

4. **Start the backend:**

   ```bash
   pnpm --filter @the-new-fuse/backend-app run dev
   ```

5. **Check for validation errors:**
   - If configuration is valid, you'll see:
     `Configuration validation successful`
   - If configuration is invalid, you'll see detailed error messages

### Test Input Validation

The new DTOs validate all user inputs. Test with:

```bash
# Register with weak password (should fail)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"weak"}'

# Should return: 400 Bad Request with validation errors

# Register with strong password (should succeed)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@#","name":"Test User"}'

# Should return: 201 Created
```

### Run Tests

```bash
# Run all tests
pnpm --filter @the-new-fuse/backend-app run test

# Run config tests specifically
pnpm --filter @the-new-fuse/backend-app run test app-config.service.spec

# Run DTO validation tests
pnpm --filter @the-new-fuse/backend-app run test dto-validation.spec
```

---

## Step 5: Deployment to Production

### CloudRuntime Deployment

1. **Set environment variables in CloudRuntime dashboard:**

   ```bash
   # Navigate to your CloudRuntime project
   # Go to Variables tab
   # Add/update these variables:

   NODE_ENV=production
   JWT_SECRET=<your-secure-secret>
   DATABASE_URL=<cloud_runtime-postgres-url>
   REDIS_URL=<cloud_runtime-redis-url>
   FRONTEND_URL=<your-frontend-url>
   ANTHROPIC_API_KEY=<your-api-key>
   CORS_ORIGINS=<your-frontend-url>
   ```

2. **Deploy the updated code:**

   ```bash
   git add .
   git commit -m "feat(security): implement centralized config and input validation"
   git push
   ```

3. **Monitor deployment logs:**
   - Watch for `Configuration validation successful`
   - Check for any validation errors
   - Verify application starts successfully

### Docker Deployment

1. **Update docker-compose.yml or Dockerfile with environment variables**

2. **Create production .env file:**

   ```bash
   # DO NOT commit this file
   # Add to .gitignore if not already there

   NODE_ENV=production
   JWT_SECRET=<secure-secret>
   # ... other variables
   ```

3. **Build and deploy:**
   ```bash
   docker-compose up -d --build
   docker-compose logs -f backend
   ```

### Kubernetes Deployment

1. **Create Kubernetes secrets:**

   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: tnf-secrets
   type: Opaque
   stringData:
     jwt-secret: <your-secure-secret>
     database-url: <your-database-url>
     redis-url: <your-redis-url>
   ```

2. **Update deployment to reference secrets:**
   ```yaml
   env:
     - name: JWT_SECRET
       valueFrom:
         secretKeyRef:
           name: tnf-secrets
           key: jwt-secret
     - name: DATABASE_URL
       valueFrom:
         secretKeyRef:
           name: tnf-secrets
           key: database-url
   ```

---

## Step 6: Post-Deployment Verification

### Health Checks

1. **Check application startup:**

   ```bash
   # Should see successful startup message
   curl http://your-backend/health
   ```

2. **Test authentication:**

   ```bash
   # Test registration
   curl -X POST http://your-backend/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!@#"}'

   # Test login
   curl -X POST http://your-backend/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!@#"}'
   ```

3. **Verify input validation:**

   ```bash
   # Test with invalid data (should fail with 400)
   curl -X POST http://your-backend/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"not-an-email","password":"weak"}'
   ```

4. **Monitor logs for errors:**
   - No configuration validation errors
   - No JWT verification errors
   - Input validation working as expected

---

## Rollback Plan

If issues occur during deployment:

### Immediate Rollback

1. **Revert to previous deployment:**

   ```bash
   git revert HEAD
   git push
   ```

2. **Restore previous environment variables** (if modified)

3. **Restart services**

### Gradual Migration

If you need to migrate gradually:

1. The new code maintains backward compatibility with legacy exports
2. Old endpoints will continue to work but log deprecation warnings
3. You can migrate one service at a time

---

## Security Improvements Summary

### Before (Vulnerabilities)

- ❌ Hardcoded fallback secrets in 6+ files
- ❌ No input validation on user data
- ❌ No startup configuration validation
- ❌ Weak or default JWT secrets in development

### After (Secured)

- ✅ Centralized configuration with fail-fast validation
- ✅ All inputs validated with class-validator DTOs
- ✅ No hardcoded secrets or fallback defaults
- ✅ Minimum 32-character JWT secrets enforced
- ✅ Production-specific validation rules
- ✅ Comprehensive test coverage

---

## Files Modified

### New Files Created

- `apps/backend/src/config/app-config.service.ts` - Centralized config with
  validation
- `apps/backend/src/config/app-config.module.ts` - Global config module
- `apps/backend/src/dto/login.dto.ts` - Login input validation
- `apps/backend/src/dto/register.dto.ts` - Registration input validation
- `apps/backend/src/dto/create-agent.dto.ts` - Agent creation validation
- `apps/backend/src/dto/update-agent.dto.ts` - Agent update validation
- `apps/backend/src/dto/index.ts` - DTO exports
- `apps/backend/src/config/app-config.service.spec.ts` - Config tests
- `apps/backend/src/dto/dto-validation.spec.ts` - DTO validation tests

### Files Updated

- `apps/backend/src/app.module.ts` - Use AppConfigModule, remove hardcoded
  secrets
- `apps/backend/src/main.ts` - Enhanced ValidationPipe configuration
- `apps/backend/src/middleware/auth.ts` - Use AppConfigService for JWT
  verification
- `apps/backend/src/utils/auth.ts` - Converted to service with DI
- `apps/backend/src/utils/auth.utils.ts` - Converted to service with DI
- `apps/backend/src/controllers/authController.ts` - Use DTOs and
  AppConfigService
- `apps/backend/src/controllers/agentController.ts` - Use validation DTOs
- `.env.example` - Enhanced documentation with security requirements

---

## Support and Troubleshooting

### Common Issues

**Issue:** Application fails to start with "Configuration validation failed"
**Solution:** Check error messages and ensure all required environment variables
are set correctly

**Issue:** "JWT_SECRET contains a placeholder value" **Solution:** Replace
placeholder with a real 32+ character secret generated using the methods in Step
1

**Issue:** Tests failing after migration **Solution:** Update test environment
setup to include required environment variables

**Issue:** "Required configuration value X is not set" **Solution:** Add the
missing variable to your .env file

### Getting Help

1. Check application logs for detailed error messages
2. Review this migration guide
3. Check `.env.example` for required variables
4. Run tests to verify configuration: `pnpm run test`

---

## Maintenance

### Adding New Configuration

When adding new configuration variables:

1. Add getter to `AppConfigService`
2. Add validation in `onModuleInit()` if required
3. Document in `.env.example`
4. Add tests to `app-config.service.spec.ts`

### Adding New DTOs

When adding new input validation:

1. Create DTO in `apps/backend/src/dto/`
2. Add class-validator decorators
3. Export from `apps/backend/src/dto/index.ts`
4. Add tests to `dto-validation.spec.ts`
5. Use in controller with type annotation

---

## Conclusion

This migration significantly improves The New Fuse's security posture by:

- Eliminating hardcoded secrets
- Adding comprehensive input validation
- Implementing fail-fast configuration validation
- Establishing secure-by-default patterns

All changes are production-ready and fully tested. Follow this guide carefully
to ensure a smooth migration.

**Next Steps:** After successful deployment, monitor your production logs for
any validation errors or security warnings, and update your deployment
documentation to reflect the new environment variable requirements.

---

**Migration implemented by:** Implementer Agent **Date:** 2025-12-29
**Version:** 1.0.0

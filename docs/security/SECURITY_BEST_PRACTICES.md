# Security Best Practices Guide
**The New Fuse Platform**

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation](#input-validation)
3. [API Security](#api-security)
4. [Data Protection](#data-protection)
5. [Secrets Management](#secrets-management)
6. [Dependency Management](#dependency-management)
7. [Error Handling](#error-handling)
8. [Logging & Monitoring](#logging--monitoring)
9. [Code Review Guidelines](#code-review-guidelines)
10. [Security Checklist](#security-checklist)

---

## Authentication & Authorization

### JWT Token Handling

**DO:**
```typescript
// ✓ Use environment variables for secrets
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set');
}

// ✓ Set appropriate token expiration
const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
const refreshToken = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

// ✓ Validate tokens properly
try {
  const decoded = jwt.verify(token, jwtSecret);
  return decoded;
} catch (error) {
  throw new UnauthorizedException('Invalid token');
}
```

**DON'T:**
```typescript
// ✗ Never use hardcoded secrets
const jwtSecret = 'my-secret-key';

// ✗ Don't set very long expiration
const token = jwt.sign(payload, secret, { expiresIn: '30d' });

// ✗ Don't ignore token validation errors
const decoded = jwt.verify(token, secret); // No error handling
```

### Password Security

**DO:**
```typescript
// ✓ Use bcrypt with appropriate salt rounds
import * as bcrypt from 'bcrypt';

async hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // 10-12 is recommended
  return bcrypt.hash(password, saltRounds);
}

async verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ✓ Enforce strong password requirements
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
```

**DON'T:**
```typescript
// ✗ Never store passwords in plain text
user.password = password;

// ✗ Don't use MD5 or SHA1 for passwords
const hash = crypto.createHash('md5').update(password).digest('hex');

// ✗ Don't use low salt rounds
const hash = bcrypt.hashSync(password, 4);
```

### Permission Checks

**DO:**
```typescript
// ✓ Always check permissions before sensitive operations
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('admin:write')
async deleteUser(@Param('id') id: string) {
  return this.userService.delete(id);
}

// ✓ Implement role-based access control
if (!user.roles.includes('ADMIN')) {
  throw new ForbiddenException('Insufficient permissions');
}
```

**DON'T:**
```typescript
// ✗ Don't rely on client-side permission checks only
// ✗ Don't skip permission checks for "internal" endpoints
// ✗ Don't use weak permission checks
if (user.isAdmin === 'true') { // String comparison vulnerability
  // ...
}
```

---

## Input Validation

### Request Validation

**DO:**
```typescript
// ✓ Use class-validator for DTOs
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;

  @IsString()
  @MaxLength(100)
  name: string;
}

// ✓ Enable validation globally
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));

// ✓ Sanitize all input
const sanitizedInput = this.inputSanitization.sanitizeText(userInput);
```

**DON'T:**
```typescript
// ✗ Don't trust user input
const query = `SELECT * FROM users WHERE id = ${req.params.id}`;

// ✗ Don't skip validation
@Post('create')
async create(@Body() data: any) { // No validation!
  return this.service.create(data);
}

// ✗ Don't use eval() or similar
eval(userInput); // NEVER DO THIS
```

### SQL Injection Prevention

**DO:**
```typescript
// ✓ Use Drizzle's parameterized queries
const user = await drizzle.user.findUnique({
  where: { id: userId }
});

// ✓ Use parameterized queries for raw SQL
const users = await drizzle.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;
```

**DON'T:**
```typescript
// ✗ Never concatenate user input into SQL
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✗ Don't use raw SQL without parameters
await drizzle.$executeRawUnsafe(`DELETE FROM users WHERE id = ${id}`);
```

### XSS Prevention

**DO:**
```typescript
// ✓ Sanitize HTML content
import { InputSanitizationService } from './security/input-sanitization.service';

const sanitizedHtml = this.sanitization.sanitizeHTML(userHtml);

// ✓ Set proper Content-Type headers
res.setHeader('Content-Type', 'application/json');

// ✓ Use CSP headers
res.setHeader('Content-Security-Policy', "default-src 'self'");
```

**DON'T:**
```typescript
// ✗ Don't render user input directly
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✗ Don't disable XSS protection
res.setHeader('X-XSS-Protection', '0');
```

---

## API Security

### Rate Limiting

**DO:**
```typescript
// ✓ Implement rate limiting for all endpoints
@UseGuards(RateLimitGuard)
@RateLimit({ requests: 100, window: 60000 }) // 100 req/min
async getData() {
  return this.service.getData();
}

// ✓ Use stricter limits for auth endpoints
@RateLimit({ requests: 5, window: 60000 }) // 5 req/min
async login(@Body() credentials: LoginDto) {
  return this.authService.login(credentials);
}
```

**DON'T:**
```typescript
// ✗ Don't skip rate limiting
// ✗ Don't use same limits for all endpoints
// ✗ Don't forget to handle distributed rate limiting
```

### CORS Configuration

**DO:**
```typescript
// ✓ Use strict CORS configuration
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});

// ✓ Validate origin in production
const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];
origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}
```

**DON'T:**
```typescript
// ✗ Never use wildcard in production
app.enableCors({ origin: '*' });

// ✗ Don't allow all origins
origin: true,
```

### API Key Management

**DO:**
```typescript
// ✓ Use API keys for service-to-service auth
@UseGuards(ApiKeyGuard)
async internalEndpoint() {
  // ...
}

// ✓ Rotate API keys regularly
// ✓ Use different keys for different environments
// ✓ Store API keys in environment variables
```

**DON'T:**
```typescript
// ✗ Don't hardcode API keys
const apiKey = 'sk-1234567890abcdef';

// ✗ Don't expose API keys in client-side code
// ✗ Don't use same API key for all services
```

---

## Data Protection

### Encryption

**DO:**
```typescript
// ✓ Use strong encryption algorithms
import * as crypto from 'crypto';

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm'; // Authenticated encryption

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    };
  }
}

// ✓ Encrypt sensitive data before storage
const encrypted = await this.encryption.encrypt(sensitiveData);
await drizzle.user.update({
  where: { id },
  data: { encryptedData: JSON.stringify(encrypted) }
});
```

**DON'T:**
```typescript
// ✗ Don't use weak encryption
const cipher = crypto.createCipher('des', 'key'); // Weak algorithm

// ✗ Don't use CBC without authentication
const algorithm = 'aes-256-cbc'; // Consider GCM instead

// ✗ Don't hardcode encryption keys
const key = 'my-encryption-key';
```

### PII Handling

**DO:**
```typescript
// ✓ Minimize PII collection
// ✓ Encrypt PII at rest
// ✓ Mask PII in logs
logger.info(`User logged in: ${maskEmail(user.email)}`);

// ✓ Implement data retention policies
async cleanupOldData() {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 6);

  await drizzle.user.deleteMany({
    where: {
      deletedAt: { lt: cutoffDate }
    }
  });
}
```

**DON'T:**
```typescript
// ✗ Don't log sensitive data
logger.info(`Password: ${password}`);
logger.debug(`Credit card: ${creditCard}`);

// ✗ Don't store PII unnecessarily
// ✗ Don't share PII with third parties without consent
```

---

## Secrets Management

### Environment Variables

**DO:**
```typescript
// ✓ Use environment variables for secrets
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

// ✓ Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// ✓ Use .env.example for documentation
# .env.example
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

**DON'T:**
```typescript
// ✗ Don't commit .env files
// ✗ Don't use default values for secrets
const secret = process.env.JWT_SECRET || '[REDACTED_SECRET]';

// ✗ Don't expose secrets in error messages
throw new Error(`Database connection failed: ${DATABASE_URL}`);
```

### Secret Rotation

**DO:**
```typescript
// ✓ Support multiple active keys
const secrets = [
  process.env.JWT_SECRET_CURRENT,
  process.env.JWT_SECRET_PREVIOUS
];

// ✓ Implement graceful rotation
function verifyToken(token: string): any {
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch (e) {
      continue;
    }
  }
  throw new UnauthorizedException('Invalid token');
}
```

---

## Dependency Management

### Package Security

**DO:**
```bash
# ✓ Regularly audit dependencies
pnpm audit

# ✓ Update dependencies
pnpm update

# ✓ Use exact versions for critical packages
{
  "dependencies": {
    "jsonwebtoken": "9.0.2" // Exact version
  }
}

# ✓ Enable automated security updates (Dependabot, Renovate)
```

**DON'T:**
```bash
# ✗ Don't ignore audit warnings
# ✗ Don't use outdated packages
# ✗ Don't install packages from untrusted sources
```

---

## Error Handling

### Secure Error Messages

**DO:**
```typescript
// ✓ Use generic error messages in production
if (process.env.NODE_ENV === 'production') {
  return { error: 'An error occurred' };
} else {
  return { error: error.message, stack: error.stack };
}

// ✓ Log detailed errors server-side
logger.error('Database error:', {
  error: error.message,
  stack: error.stack,
  userId: user.id
});
```

**DON'T:**
```typescript
// ✗ Don't expose stack traces to users
res.status(500).json({ error: error.stack });

// ✗ Don't expose internal paths
throw new Error(`File not found: /var/www/internal/secret.txt`);

// ✗ Don't expose database errors
catch (e) {
  res.send(e.message); // Might expose SQL queries
}
```

---

## Logging & Monitoring

### Security Logging

**DO:**
```typescript
// ✓ Log authentication events
logger.info('User login attempt', {
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  success: true
});

// ✓ Log authorization failures
logger.warn('Unauthorized access attempt', {
  userId: user.id,
  resource: 'admin_panel',
  ip: req.ip
});

// ✓ Log security events
logger.security('Rate limit exceeded', {
  ip: req.ip,
  endpoint: req.path,
  limit: 100
});
```

**DON'T:**
```typescript
// ✗ Don't log sensitive data
logger.info('User data:', { password, creditCard });

// ✗ Don't log tokens
logger.debug(`Token: ${jwt}`);
```

---

## Code Review Guidelines

### Security Checklist for Code Reviews

**Authentication & Authorization:**
- [ ] Are authentication checks present?
- [ ] Are permission checks implemented?
- [ ] Are JWT tokens validated properly?
- [ ] Are passwords hashed with bcrypt?

**Input Validation:**
- [ ] Is user input validated?
- [ ] Are DTOs using class-validator?
- [ ] Is input sanitized?
- [ ] Are file uploads validated?

**API Security:**
- [ ] Is rate limiting implemented?
- [ ] Are security headers set?
- [ ] Is CORS configured properly?
- [ ] Are API keys protected?

**Data Protection:**
- [ ] Is sensitive data encrypted?
- [ ] Are secrets in environment variables?
- [ ] Is PII handled properly?
- [ ] Are database queries parameterized?

**Error Handling:**
- [ ] Are errors handled gracefully?
- [ ] Are error messages generic in production?
- [ ] Are errors logged properly?
- [ ] Are stack traces hidden from users?

---

## Security Checklist for New Features

### Before Deployment

**Code Security:**
- [ ] All user input is validated
- [ ] All user input is sanitized
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No CSRF vulnerabilities
- [ ] Authentication implemented
- [ ] Authorization implemented
- [ ] Rate limiting configured
- [ ] Error handling implemented
- [ ] Security logging added

**Configuration:**
- [ ] Environment variables configured
- [ ] No hardcoded secrets
- [ ] CORS configured properly
- [ ] Security headers set
- [ ] HTTPS enforced (production)

**Dependencies:**
- [ ] Dependencies audited
- [ ] No known vulnerabilities
- [ ] Packages from trusted sources
- [ ] Lock file updated

**Testing:**
- [ ] Security tests written
- [ ] Integration tests pass
- [ ] Manual security testing performed
- [ ] Code review completed

**Documentation:**
- [ ] Security considerations documented
- [ ] API authentication documented
- [ ] Environment variables documented
- [ ] Deployment instructions updated

---

## Emergency Response

### If Secrets Are Compromised

1. **Immediately rotate all affected secrets**
2. **Revoke all active sessions**
3. **Audit logs for suspicious activity**
4. **Notify affected users**
5. **Document incident**
6. **Update security procedures**

### If Vulnerability Is Discovered

1. **Assess severity and impact**
2. **Create patch immediately**
3. **Test patch thoroughly**
4. **Deploy to production ASAP**
5. **Notify stakeholders**
6. **Document and learn**

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Drizzle Security](https://www.drizzle.io/docs/concepts/components/drizzle-client/deployment#security)

---

**Remember:** Security is everyone's responsibility. When in doubt, ask for a security review.

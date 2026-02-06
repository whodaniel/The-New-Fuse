# Developer Security Checklist

**The New Fuse Platform**

## Quick Reference

Use this checklist for every feature, bug fix, or code change you make. Security
is everyone's responsibility!

---

## Pre-Development Checklist

**Before you start coding:**

- [ ] Review the security requirements for your feature
- [ ] Identify sensitive data that will be handled
- [ ] Check if authentication/authorization is needed
- [ ] Review similar code for security patterns
- [ ] Read relevant sections of Security Best Practices guide

---

## During Development

### Authentication & Authorization

- [ ] **Authentication implemented** for protected endpoints
- [ ] **Authorization checks** verify user permissions
- [ ] **JWT tokens validated** properly (not just decoded)
- [ ] **Session management** is secure (httpOnly, secure, sameSite)
- [ ] **Password hashing** uses bcrypt (never store plain text)
- [ ] **Multi-factor authentication** supported (if applicable)
- [ ] **Token expiration** is reasonable (15 min for access, 7 days for refresh)
- [ ] **Refresh token rotation** implemented

**Example:**

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('resource:action')
async protectedEndpoint() {
  // Your code here
}
```

### Input Validation

- [ ] **All user input validated** using class-validator
- [ ] **DTOs defined** with proper validation decorators
- [ ] **Validation enabled** globally in main.ts
- [ ] **Input sanitized** to prevent XSS
- [ ] **File uploads** have size and type restrictions
- [ ] **Query parameters** are validated
- [ ] **Path parameters** are validated
- [ ] **Request body size** is limited

**Example:**

```typescript
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
```

### SQL Injection Prevention

- [ ] **Drizzle used** for database queries (parameterized by default)
- [ ] **No raw SQL** with user input concatenation
- [ ] **Raw queries** use parameterization ($queryRaw, not $queryRawUnsafe)
- [ ] **ORM methods** used instead of raw SQL when possible

**Good:**

```typescript
await drizzle.user.findUnique({ where: { id: userId } });
await drizzle.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
```

**Bad:**

```typescript
await drizzle.$executeRawUnsafe(`DELETE FROM users WHERE id = ${id}`);
```

### XSS Prevention

- [ ] **Output encoding** for HTML content
- [ ] **DOMPurify** used for user-generated HTML
- [ ] **Content-Type** headers set correctly
- [ ] **CSP headers** configured
- [ ] **No eval()** or similar dangerous functions
- [ ] **No innerHTML** with user content
- [ ] **Template escaping** enabled

**Example:**

```typescript
const sanitizedHtml = this.inputSanitization.sanitizeHTML(userInput);
```

### CSRF Protection

- [ ] **CSRF middleware** enabled for state-changing requests
- [ ] **CSRF tokens** included in forms
- [ ] **Double-submit cookies** or synchronizer tokens used
- [ ] **SameSite cookie** attribute set
- [ ] **State-changing operations** require POST/PUT/DELETE (not GET)

### API Security

- [ ] **Rate limiting** implemented
- [ ] **CORS configured** properly (not wildcard in production)
- [ ] **Security headers** set (CSP, X-Frame-Options, etc.)
- [ ] **API versioning** used
- [ ] **Pagination** implemented for list endpoints
- [ ] **Request/response logging** enabled (without sensitive data)
- [ ] **Error messages** don't leak sensitive information

**Example:**

```typescript
@UseGuards(RateLimitGuard)
@RateLimit({ requests: 100, window: 60000 })
async getData() {
  // Your code here
}
```

### Data Protection

- [ ] **Sensitive data encrypted** at rest
- [ ] **Sensitive data encrypted** in transit (HTTPS/TLS)
- [ ] **PII minimized** (only collect what's needed)
- [ ] **Data retention** policies followed
- [ ] **Passwords never logged** or exposed
- [ ] **Tokens never logged** in plain text
- [ ] **Credit cards** handled via PCI-compliant provider
- [ ] **Personal data** can be exported/deleted (GDPR)

**Example:**

```typescript
// Encrypt before storing
const encrypted = await this.encryption.encrypt(sensitiveData);
await drizzle.user.update({
  where: { id },
  data: { encryptedField: JSON.stringify(encrypted) },
});
```

### Secrets Management

- [ ] **No hardcoded secrets** in code
- [ ] **Environment variables** used for all secrets
- [ ] **No secrets in version control** (.env in .gitignore)
- [ ] **No secrets in logs** or error messages
- [ ] **Secrets validated** at startup
- [ ] **.env.example** updated with new variables
- [ ] **API keys rotated** regularly

**Good:**

```typescript
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is required');
}
```

**Bad:**

```typescript
const jwtSecret = process.env.JWT_SECRET || 'default-secret';
```

### Error Handling

- [ ] **Errors caught** and handled gracefully
- [ ] **Error messages** are generic in production
- [ ] **Stack traces** not exposed to users
- [ ] **Errors logged** with context
- [ ] **Sensitive data** not in error messages
- [ ] **Database errors** sanitized before sending to client

**Example:**

```typescript
try {
  // Your code
} catch (error) {
  this.logger.error('Error processing request', {
    error: error.message,
    userId: user.id,
    // Don't log passwords, tokens, etc.
  });

  if (process.env.NODE_ENV === 'production') {
    throw new InternalServerErrorException('An error occurred');
  } else {
    throw error;
  }
}
```

### Logging

- [ ] **Security events logged** (login, logout, permission changes)
- [ ] **Failed authentication logged** with details
- [ ] **No sensitive data** in logs (passwords, tokens, PII)
- [ ] **Logs include context** (user ID, IP, timestamp)
- [ ] **Structured logging** used
- [ ] **Log levels** appropriate (error, warn, info, debug)

**Example:**

```typescript
this.logger.security('Failed login attempt', {
  email: email,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  reason: 'invalid_password',
});
```

### Dependencies

- [ ] **Only trusted packages** used
- [ ] **Package versions** reviewed for vulnerabilities
- [ ] **Dependencies up to date**
- [ ] **Lock file** committed (package-lock.json)
- [ ] **No deprecated packages**
- [ ] **License compliance** checked

**Run before committing:**

```bash
pnpm audit
pnpm outdated
```

### File Operations

- [ ] **File uploads validated** (type, size, name)
- [ ] **Path traversal** prevented
- [ ] **Uploaded files** virus scanned
- [ ] **File permissions** set correctly
- [ ] **Temporary files** cleaned up
- [ ] **File storage** secure and isolated

**Example:**

```typescript
const sanitizedFileName = this.inputSanitization.sanitizeFileName(fileName);
if (file.size > MAX_FILE_SIZE) {
  throw new BadRequestException('File too large');
}
if (!ALLOWED_TYPES.includes(file.mimetype)) {
  throw new BadRequestException('Invalid file type');
}
```

### WebSocket Security

- [ ] **Authentication required** for WebSocket connections
- [ ] **Origin validation** implemented
- [ ] **Rate limiting** for messages
- [ ] **Message validation** performed
- [ ] **WSS (secure)** used in production
- [ ] **Connection timeout** configured

### Third-Party Integrations

- [ ] **API keys** stored securely
- [ ] **OAuth flows** implemented correctly
- [ ] **Redirect URIs** validated
- [ ] **Webhook signatures** verified
- [ ] **Rate limits** respected
- [ ] **Timeout configured** for external calls
- [ ] **Errors handled** gracefully

---

## Code Review Checklist

**Before requesting review:**

- [ ] Run security validation: `node scripts/validate-security.js`
- [ ] Run tests: `pnpm test`
- [ ] Check for hardcoded secrets
- [ ] Review error handling
- [ ] Check logging (no sensitive data)
- [ ] Update documentation

**For reviewers:**

- [ ] Authentication/authorization present where needed
- [ ] Input validation comprehensive
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Secrets in environment variables
- [ ] Error handling appropriate
- [ ] Logging secure
- [ ] No hardcoded sensitive data

---

## Pre-Commit Checklist

**Run these commands:**

```bash
# 1. Lint your code
pnpm lint

# 2. Run tests
pnpm test

# 3. Check for security issues
node scripts/validate-security.js

# 4. Check for dependency vulnerabilities
pnpm audit
```

**Manual checks:**

- [ ] No secrets in code
- [ ] No debugging code (console.log, debugger)
- [ ] No commented-out sensitive code
- [ ] Environment variables documented in .env.example
- [ ] No large files accidentally committed
- [ ] Commit message is descriptive

---

## Pre-Deployment Checklist

**Before deploying to production:**

### Environment Configuration

- [ ] All environment variables set
- [ ] Secrets rotated if needed
- [ ] Database connection secure (SSL)
- [ ] CORS configured for production domains
- [ ] Rate limits appropriate for production
- [ ] Logging level set to 'warn' or 'error'

### Security Configuration

- [ ] HTTPS/TLS enabled
- [ ] Security headers configured
- [ ] CSP policy strict
- [ ] CSRF protection enabled
- [ ] Rate limiting enabled
- [ ] Session configuration secure

### Testing

- [ ] All tests passing
- [ ] Security tests passing
- [ ] Integration tests passing
- [ ] Manual security testing done
- [ ] Penetration testing results reviewed (if applicable)

### Monitoring

- [ ] Error monitoring configured
- [ ] Security logging enabled
- [ ] Alerts configured
- [ ] Health checks working
- [ ] Metrics collection enabled

### Documentation

- [ ] API documentation updated
- [ ] Security considerations documented
- [ ] Environment variables documented
- [ ] Deployment instructions updated
- [ ] Changelog updated

---

## Security Tools

### Required Tools

**Install these:**

```bash
# ESLint for code quality
pnpm add -D eslint @typescript-eslint/eslint-plugin

# Security linting
pnpm add -D eslint-plugin-security

# Dependency checking
pnpm add -D npm-audit-resolver
```

### Recommended VS Code Extensions

- **ESLint** - Code linting
- **SonarLint** - Security and quality
- **GitLens** - Git insights
- **Better Comments** - Highlight security comments
- **Drizzle** - Database ORM support

### Git Hooks

**Set up pre-commit hook:**

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run security validation
node scripts/validate-security.js

# Run linter
pnpm lint

# Run tests
pnpm test
```

---

## Common Security Mistakes

### Avoid These Mistakes:

**❌ Trusting User Input**

```typescript
// BAD
const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
```

**❌ Hardcoded Secrets**

```typescript
// BAD
const jwtSecret = 'my-secret-key';
```

**❌ Exposing Stack Traces**

```typescript
// BAD
res.status(500).json({ error: error.stack });
```

**❌ Weak Authentication**

```typescript
// BAD
if (req.headers.authorization === 'Bearer token') {
  // No validation!
}
```

**❌ Missing Input Validation**

```typescript
// BAD
@Post('create')
async create(@Body() data: any) { // No DTO!
  return this.service.create(data);
}
```

**❌ Logging Sensitive Data**

```typescript
// BAD
logger.info('User login', { password, token });
```

**❌ Weak CORS**

```typescript
// BAD
app.enableCors({ origin: '*' });
```

---

## Security Resources

### Documentation

- [Security Best Practices](/docs/security/SECURITY_BEST_PRACTICES.md)
- [Security Audit Report](/docs/security/SECURITY_AUDIT_REPORT.md)
- [Incident Response Plan](/docs/security/INCIDENT_RESPONSE_PLAN.md)
- [Vulnerability Disclosure](/docs/security/VULNERABILITY_DISCLOSURE_POLICY.md)

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Drizzle Security](https://www.drizzle.io/docs/concepts/components/drizzle-client/deployment#security)

### Training

- OWASP Web Security Testing Guide
- Secure Code Warrior (training platform)
- HackTheBox (hands-on practice)
- Security awareness training (quarterly)

---

## Getting Help

### Questions?

**Security Team:**

- **Email:** security@thenewfuse.com
- **Slack:** #security

**Before asking:**

1. Check Security Best Practices guide
2. Review similar code in the codebase
3. Search OWASP resources

**When asking:**

- Describe what you're trying to achieve
- Share relevant code snippet
- Explain what you've tried
- Ask specific questions

---

## Report Security Issues

**If you find a security vulnerability:**

1. **DO NOT** commit or push the vulnerable code
2. **DO NOT** discuss in public channels
3. **DO** report to security@thenewfuse.com immediately
4. **DO** include detailed steps to reproduce
5. **DO** suggest a fix if you have one

---

## Remember

**Security Principles:**

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimum necessary permissions
3. **Fail Securely** - Failures should deny access
4. **Don't Trust User Input** - Always validate and sanitize
5. **Security by Design** - Build security in from the start
6. **Keep it Simple** - Complex code has more vulnerabilities

**When in Doubt:**

If you're unsure about a security decision:

1. Ask the security team
2. Review the security documentation
3. Look for similar implementations
4. Err on the side of caution

---

**Security is a shared responsibility. Thank you for keeping The New Fuse
secure!**

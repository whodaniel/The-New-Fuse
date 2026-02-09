# Security Remediation Roadmap
**The New Fuse Platform**
**Generated:** 2025-11-18

## Overview

This roadmap outlines the security improvements needed based on our comprehensive security audit. Items are prioritized by severity and impact.

## Executive Summary

**Current Security Score:** 7.5/10 (GOOD)
**Target Security Score:** 9.5/10 (EXCELLENT)
**Estimated Timeline:** 12 weeks
**Required Resources:** 2-3 engineers

---

## Phase 1: Critical Security Fixes (Week 1-2)

**Priority:** CRITICAL
**Timeline:** 2 weeks
**Owner:** Security Team

### 1.1 Remove Hardcoded Secrets
**Status:** 🔴 Critical
**Effort:** 8 hours
**Impact:** High

**Issues:**
- Multiple files contain hardcoded secret fallbacks
- Default JWT secrets in development mode
- Weak encryption key fallbacks

**Files to Fix:**
```
/apps/backend/src/controllers/authController.ts:29
/apps/backend/src/utils/auth.utils.ts:6
/apps/backend/src/utils/token.ts:6
/apps/backend/src/auth/auth.module.ts:19
/packages/security/src/auth/AuthService.ts:41
/apps/api/src/security/security-integration.service.ts:111
/apps/api/src/config/security.config.ts:97
/apps/api/src/config.ts:10
/packages/core/src/security/encryption.ts:11
/packages/core/src/security/security.service.ts:20
/config/config.ts:10
/src/auth/MCPOAuthServer.ts:58
```

**Action Items:**
- [ ] Remove all hardcoded fallback secrets
- [ ] Implement startup validation for required secrets
- [ ] Add environment variable validation script
- [ ] Update documentation

**Implementation:**
```typescript
// Before (INSECURE):
const jwtSecret = process.env.JWT_SECRET || 'default-secret';

// After (SECURE):
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}
```

**Validation Script:**
```bash
#!/bin/bash
# scripts/validate-secrets.sh

required_secrets=(
  "JWT_SECRET"
  "JWT_REFRESH_SECRET"
  "DATABASE_URL"
  "REDIS_URL"
  "ENCRYPTION_KEY"
)

for secret in "${required_secrets[@]}"; do
  if [ -z "${!secret}" ]; then
    echo "ERROR: $secret is not set"
    exit 1
  fi
done

echo "✓ All required secrets are set"
```

### 1.2 Fix Encryption Implementation
**Status:** 🔴 Critical
**Effort:** 12 hours
**Impact:** High

**Issues:**
- Weak key derivation
- Using AES-CBC instead of AES-GCM
- No authentication for encrypted data

**Action Items:**
- [ ] Implement proper key derivation (PBKDF2/scrypt)
- [ ] Migrate to AES-GCM for authenticated encryption
- [ ] Add key rotation mechanism
- [ ] Update all encrypted data

**Implementation:**
```typescript
import * as crypto from 'crypto';

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret) {
      throw new Error('ENCRYPTION_KEY is required');
    }

    // Proper key derivation
    this.key = crypto.pbkdf2Sync(
      secret,
      process.env.ENCRYPTION_SALT || 'default-salt',
      100000, // iterations
      32,     // key length
      'sha256'
    );
  }

  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex'),
      version: 'v2' // For migration tracking
    };
  }

  decrypt(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(data.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### 1.3 Update Vulnerable Dependencies
**Status:** 🔴 Critical
**Effort:** 4 hours
**Impact:** Medium

**Action Items:**
- [ ] Run `pnpm audit --fix`
- [ ] Manually update packages that cannot be auto-fixed
- [ ] Test application thoroughly
- [ ] Update lock file

**Commands:**
```bash
# 1. Audit and fix
pnpm audit --fix

# 2. Update specific packages
pnpm update undici path-to-regexp esbuild cookie dompurify tmp js-yaml

# 3. Test
pnpm test
pnpm build

# 4. Verify no new vulnerabilities
pnpm audit
```

---

## Phase 2: High-Priority Improvements (Week 3-4)

**Priority:** HIGH
**Timeline:** 2 weeks
**Owner:** Development Team

### 2.1 Implement Secret Rotation
**Status:** 🟡 High
**Effort:** 16 hours
**Impact:** High

**Action Items:**
- [ ] Support multiple active JWT secrets
- [ ] Implement graceful secret rotation
- [ ] Create secret rotation runbook
- [ ] Set up automated rotation reminders

**Implementation:**
```typescript
// Multi-secret support for graceful rotation
class JWTService {
  private readonly secrets: string[];

  constructor() {
    this.secrets = [
      process.env.JWT_SECRET_CURRENT!,
      process.env.JWT_SECRET_PREVIOUS, // Optional for rotation
    ].filter(Boolean);
  }

  sign(payload: any): string {
    // Always sign with current secret
    return jwt.sign(payload, this.secrets[0], {
      expiresIn: '15m',
      issuer: 'the-new-fuse',
    });
  }

  verify(token: string): any {
    // Try all secrets for verification
    for (const secret of this.secrets) {
      try {
        return jwt.verify(token, secret);
      } catch (error) {
        continue;
      }
    }
    throw new UnauthorizedException('Invalid token');
  }
}
```

### 2.2 Enable Database Encryption at Rest
**Status:** 🟡 High
**Effort:** 8 hours
**Impact:** High

**Action Items:**
- [ ] Enable PostgreSQL encryption at rest
- [ ] Configure Railway database encryption
- [ ] Encrypt sensitive fields in application layer
- [ ] Document encryption strategy

**Prisma Field-Level Encryption:**
```typescript
// Install prisma-field-encryption
// pnpm add prisma-field-encryption

// In Prisma middleware
prisma.$use(async (params, next) => {
  if (params.model === 'User') {
    if (params.action === 'create' || params.action === 'update') {
      if (params.args.data.email) {
        params.args.data.email = encrypt(params.args.data.email);
      }
    }

    const result = await next(params);

    if (params.action === 'findUnique' || params.action === 'findMany') {
      if (result && result.email) {
        result.email = decrypt(result.email);
      }
    }

    return result;
  }

  return next(params);
});
```

### 2.3 Strengthen CSP Policy
**Status:** 🟡 High
**Effort:** 12 hours
**Impact:** Medium

**Action Items:**
- [ ] Remove 'unsafe-inline' from CSP
- [ ] Implement nonce-based CSP
- [ ] Add CSP reporting
- [ ] Test with all pages

**Implementation:**
```typescript
// Generate nonce for each request
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Enhanced CSP with nonce
app.use((req, res, next) => {
  const nonce = res.locals.cspNonce;

  res.setHeader('Content-Security-Policy',
    `default-src 'self'; ` +
    `script-src 'self' 'nonce-${nonce}'; ` +
    `style-src 'self' 'nonce-${nonce}'; ` +
    `img-src 'self' data: https:; ` +
    `font-src 'self'; ` +
    `connect-src 'self' wss: https:; ` +
    `frame-src 'none'; ` +
    `object-src 'none'; ` +
    `base-uri 'self'; ` +
    `form-action 'self'; ` +
    `upgrade-insecure-requests; ` +
    `report-uri /api/csp-report`
  );

  next();
});
```

### 2.4 Implement WebSocket Authentication
**Status:** 🟡 High
**Effort:** 8 hours
**Impact:** Medium

**Action Items:**
- [ ] Add JWT authentication to WebSocket connections
- [ ] Implement rate limiting for WebSocket messages
- [ ] Add connection timeout
- [ ] Enable WSS in production

**Implementation:**
```typescript
// Socket.io with JWT authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const user = await jwtService.verify(token);
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Rate limiting for WebSocket
const messageRateLimiter = new Map();

io.on('connection', (socket) => {
  socket.on('message', async (data) => {
    const userId = socket.data.user.id;
    const now = Date.now();

    if (!messageRateLimiter.has(userId)) {
      messageRateLimiter.set(userId, []);
    }

    const messages = messageRateLimiter.get(userId);
    const recentMessages = messages.filter(t => now - t < 60000);

    if (recentMessages.length >= 30) {
      socket.emit('error', 'Rate limit exceeded');
      return;
    }

    recentMessages.push(now);
    messageRateLimiter.set(userId, recentMessages);

    // Process message
    await handleMessage(socket, data);
  });
});
```

---

## Phase 3: Medium-Priority Enhancements (Week 5-8)

**Priority:** MEDIUM
**Timeline:** 4 weeks
**Owner:** Development Team

### 3.1 Implement Centralized Logging
**Status:** 🟢 Medium
**Effort:** 24 hours
**Impact:** High

**Options:**
1. **ELK Stack** (Elasticsearch, Logstash, Kibana)
2. **Datadog**
3. **CloudWatch Logs**
4. **Logtail**

**Action Items:**
- [ ] Choose logging solution
- [ ] Set up centralized logging infrastructure
- [ ] Configure log shipping
- [ ] Create security dashboards
- [ ] Set up alerts

### 3.2 Add JWT Token Blacklisting
**Status:** 🟢 Medium
**Effort:** 8 hours
**Impact:** Medium

**Implementation:**
```typescript
// Redis-based token blacklist
class TokenBlacklistService {
  constructor(private redis: Redis) {}

  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    const key = `blacklist:${token}`;
    await this.redis.setex(key, expiresIn, '1');
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.redis.get(key);
    return result === '1';
  }
}

// In JWT guard
async validateToken(token: string): Promise<User> {
  if (await this.blacklist.isBlacklisted(token)) {
    throw new UnauthorizedException('Token has been revoked');
  }

  return this.jwtService.verify(token);
}

// On logout
async logout(token: string): Promise<void> {
  const decoded = this.jwtService.decode(token);
  const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
  await this.blacklist.blacklistToken(token, expiresIn);
}
```

### 3.3 Implement GDPR Compliance Features
**Status:** 🟢 Medium
**Effort:** 40 hours
**Impact:** High

**Action Items:**
- [ ] Data export functionality
- [ ] Account deletion with data cleanup
- [ ] Consent management
- [ ] Privacy policy
- [ ] Cookie consent banner
- [ ] Data retention policies

**Data Export:**
```typescript
@Get('export')
@UseGuards(JwtAuthGuard)
async exportUserData(@CurrentUser() user: User) {
  const data = {
    profile: await this.getUserProfile(user.id),
    messages: await this.getUserMessages(user.id),
    workflows: await this.getUserWorkflows(user.id),
    agents: await this.getUserAgents(user.id),
    generatedAt: new Date().toISOString(),
  };

  return {
    data,
    format: 'JSON',
    gdprCompliant: true,
  };
}
```

**Account Deletion:**
```typescript
@Delete('account')
@UseGuards(JwtAuthGuard)
async deleteAccount(@CurrentUser() user: User) {
  // Soft delete user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      deletedAt: new Date(),
      email: `deleted_${user.id}@deleted.local`,
      isActive: false,
    },
  });

  // Schedule hard delete after 30 days
  await this.scheduler.scheduleDataDeletion(user.id, 30);

  return { message: 'Account scheduled for deletion' };
}
```

### 3.4 Set Up Monitoring and Alerting
**Status:** 🟢 Medium
**Effort:** 16 hours
**Impact:** High

**Action Items:**
- [ ] Set up Prometheus metrics
- [ ] Create Grafana dashboards
- [ ] Configure alerts
- [ ] Set up PagerDuty/OpsGenie
- [ ] Document alert response procedures

**Metrics to Monitor:**
- Failed login attempts
- Rate limit violations
- API error rates
- Response times
- Database performance
- Memory/CPU usage
- Active sessions

---

## Phase 4: Low-Priority & Ongoing (Week 9-12)

**Priority:** LOW
**Timeline:** 4 weeks (ongoing)
**Owner:** Entire Team

### 4.1 Implement Automated Security Scanning
**Status:** 🔵 Low
**Effort:** 12 hours
**Impact:** Medium

**Tools to Implement:**
- **Snyk:** Dependency vulnerability scanning
- **SonarQube:** Code quality and security
- **OWASP ZAP:** Dynamic security testing
- **Trivy:** Container scanning

**CI/CD Integration:**
```yaml
# .github/workflows/security.yml
name: Security Scanning

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main

      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### 4.2 Security Training Program
**Status:** 🔵 Low
**Effort:** Ongoing
**Impact:** High

**Training Topics:**
- Secure coding practices
- OWASP Top 10
- Authentication best practices
- Input validation
- Incident response
- Social engineering awareness

**Schedule:**
- **Monthly:** Security newsletter
- **Quarterly:** Security training session
- **Bi-annually:** Phishing simulation
- **Annually:** Comprehensive security review

### 4.3 Regular Security Audits
**Status:** 🔵 Low
**Effort:** Ongoing
**Impact:** High

**Audit Schedule:**
- **Weekly:** Automated dependency scans
- **Monthly:** Code security review
- **Quarterly:** Manual security audit
- **Annually:** External penetration test

### 4.4 Increase Password Salt Rounds
**Status:** 🔵 Low
**Effort:** 2 hours
**Impact:** Low

**Action Items:**
- [ ] Update salt rounds from 10 to 12
- [ ] Test performance impact
- [ ] Deploy gradually

**Implementation:**
```typescript
class HashingService {
  private readonly saltRounds = 12; // Increased from 10

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
}
```

---

## Implementation Checklist

### Week 1-2: Critical Fixes
- [ ] Remove all hardcoded secrets
- [ ] Implement startup validation
- [ ] Fix encryption implementation
- [ ] Update vulnerable dependencies
- [ ] Test thoroughly
- [ ] Deploy to production

### Week 3-4: High-Priority
- [ ] Implement secret rotation
- [ ] Enable database encryption
- [ ] Strengthen CSP policy
- [ ] Implement WebSocket auth
- [ ] Test thoroughly
- [ ] Deploy to production

### Week 5-8: Medium-Priority
- [ ] Set up centralized logging
- [ ] Implement token blacklisting
- [ ] Add GDPR features
- [ ] Configure monitoring
- [ ] Create dashboards
- [ ] Document procedures

### Week 9-12: Low-Priority & Ongoing
- [ ] Set up automated scanning
- [ ] Launch security training
- [ ] Schedule regular audits
- [ ] Increase bcrypt rounds
- [ ] Continuous improvement

---

## Success Metrics

### Security KPIs

**Before Remediation:**
- Security Score: 7.5/10
- Critical Vulnerabilities: 3
- High Vulnerabilities: 4
- Hardcoded Secrets: 12
- Dependency Vulnerabilities: 7
- OWASP Compliance: 70%

**Target After Remediation:**
- Security Score: 9.5/10
- Critical Vulnerabilities: 0
- High Vulnerabilities: 0
- Hardcoded Secrets: 0
- Dependency Vulnerabilities: 0
- OWASP Compliance: 95%

**Monitoring Metrics:**
- Mean Time to Detect (MTTD): <15 minutes
- Mean Time to Respond (MTTR): <4 hours
- False Positive Rate: <5%
- Security Test Coverage: >80%

---

## Budget and Resources

### Estimated Costs

**Tools and Services:**
- Snyk Pro: $99/month
- Datadog: $15/host/month
- PagerDuty: $21/user/month
- External Pen Test: $5,000/year
- Security Training: $1,000/year

**Total Annual Cost:** ~$10,000

**Personnel:**
- Security Lead: 20% allocation
- Backend Engineers: 40 hours/month for 3 months
- DevOps Engineer: 20 hours/month

---

## Risk Assessment

### Risks if Not Implemented

**Critical Issues:**
- **Data Breach Risk:** HIGH - Hardcoded secrets could be exploited
- **Compliance Risk:** HIGH - GDPR violations possible
- **Reputation Risk:** HIGH - Security incidents damage trust
- **Financial Risk:** MEDIUM - Potential fines and legal costs

**Mitigation:**
Immediate implementation of Phase 1 (Critical Fixes) is essential.

---

## Approval and Sign-off

**Prepared by:** Security Team
**Date:** 2025-11-18
**Review by:** CTO, Engineering Manager
**Approved by:** _________________
**Start Date:** _________________

---

**Next Steps:**
1. Review and approve this roadmap
2. Assign owners for each phase
3. Create tickets in project management system
4. Begin Phase 1 implementation
5. Weekly progress reviews

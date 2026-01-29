# Security Systems Review and Hardening Skill

## Purpose

Perform comprehensive security audits of TNF infrastructure, codebases, and
configurations. This skill provides systematic security review procedures with
automated hardening recommendations.

## Self-Referential Knowledge

This skill references:

- [`.kilocoderules`](../.kilocoderules) - Project security guidelines
- [`docs/SECURITY.md`](../docs/SECURITY.md) - Security documentation
- [`packages/core/src/security/`](../packages/core/src/security/) - Security
  utilities

## Pre-Flight Checklist

- [ ] Identify scope (repository, environment, or specific service)
- [ ] Confirm access to target files/configurations
- [ ] Review previous security reports if available
- [ ] Set severity threshold (Critical/High/Medium/Low)

## Security Review Process

### Phase 1: Environment Scan

```bash
# Run initial security scan
node .agent/skills/security-review/scripts/env-scan.js
```

**Checks:**

1. Environment variables for secrets exposure
2. `.env` files in repository
3. Hardcoded credentials in source code
4. JWT secret strength
5. API key patterns

### Phase 2: Dependency Audit

```bash
# Check for vulnerable dependencies
pnpm audit --audit-level moderate

# Or use the skill script
node .agent/skills/security-review/scripts/dependency-check.js
```

**Checks:**

1. Known CVEs in dependencies
2. Outdated security-critical packages
3. Unmaintained dependencies
4. License compliance issues

### Phase 3: Configuration Review

**Files to Review:**

- [ ] `.kilocode/mcp.json` - MCP server configurations
- [ ] `nginx/*.conf` - Load balancer security headers
- [ ] `docker/*.yml` - Container security settings
- [ ] `packages/*/src/config/*` - Application configs

**Security Headers Checklist:**

```yaml
# Required headers for all HTTP responses
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Phase 4: Code Security Analysis

**Critical Patterns to Find:**

```bash
# Search for dangerous patterns
grep -r "eval(" --include="*.ts" --include="*.js" src/
grep -r "innerHTML" --include="*.tsx" --include="*.jsx" src/
grep -r "process\.env\[" --include="*.ts" src/
```

**TNF-Specific Checks:**

| Component   | Security Concern       | Detection Pattern            |
| ----------- | ---------------------- | ---------------------------- |
| JWT         | Weak secrets           | `JWT_SECRET` length < 32     |
| Redis       | Unauthenticated access | Missing `AUTH` in connection |
| PostgreSQL  | SQL injection          | Unparameterized queries      |
| API Gateway | Missing rate limiting  | No `@Throttle()` decorator   |
| MCP Servers | Exposed credentials    | Hardcoded in mcp.json        |

### Phase 5: Infrastructure Review

**Docker Security:**

```dockerfile
# Anti-patterns to flag
FROM node:latest  # ❌ Use specific version
USER root         # ❌ Run as non-root
EXPOSE 3000       # ⚠️ Document all exposed ports
```

**Kubernetes Security:**

```yaml
# Required security contexts
securityContext:
  runAsNonRoot: true
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
```

## Hardening Procedures

### Automatic Fixes (Safe)

```bash
# Apply automatic hardening
node .agent/skills/security-review/scripts/auto-harden.js --safe-only
```

**Safe Fixes:**

1. Add security headers to nginx config
2. Update `.gitignore` for sensitive files
3. Add `engines` field to package.json
4. Format security-related code

### Manual Fixes (Requires Review)

**Critical:**

1. Rotate exposed secrets
2. Implement proper JWT secret generation
3. Add authentication to Redis
4. Enable PostgreSQL SSL

**High:**

1. Implement rate limiting
2. Add request validation
3. Enable audit logging
4. Configure CORS properly

**Medium:**

1. Update dependencies
2. Add input sanitization
3. Implement CSP headers
4. Enable security scanning in CI

## Output Report Template

````markdown
# Security Audit Report

**Date:** 2026-01-29  
**Scope:** TNF Monorepo  
**Auditor:** Security Review Skill  
**Severity Threshold:** Medium

## Executive Summary

| Severity | Count | Status         |
| -------- | ----- | -------------- |
| Critical | 0     | ✅ Resolved    |
| High     | 2     | ⚠️ In Progress |
| Medium   | 5     | 📋 Pending     |
| Low      | 3     | 📋 Backlog     |

## Findings

### 🔴 Critical

_None found_

### 🟠 High

#### H-001: JWT Secret in Development Config

**Location:** `.env.development`  
**Finding:** JWT_SECRET uses short, predictable value  
**Impact:** Token forgery possible  
**Remediation:**

```bash
# Generate secure secret
openssl rand -base64 32
```
````

### 🟡 Medium

_[Additional findings...]_

## Remediation Plan

### Immediate (24 hours)

- [ ] Rotate JWT secrets
- [ ] Enable Redis AUTH

### Short-term (1 week)

- [ ] Implement rate limiting
- [ ] Add security headers

### Long-term (1 month)

- [ ] Security audit automation
- [ ] Penetration testing

## Compliance

- [ ] OWASP Top 10
- [ ] SOC 2 Type II
- [ ] GDPR (if applicable)

````

## Integration with TNF

### MCP Server Usage

```typescript
// Trigger security review via MCP
const result = await mcp.accessResource({
  serverName: 'skills',
  uri: 'skill://security-review/audit?scope=repository'
});
````

### CI/CD Integration

```yaml
# .github/workflows/security.yml
name: Security Audit
on:
  schedule:
    - cron: '0 2 * * 1' # Weekly on Monday
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Security Review
        run: node .agent/skills/security-review/scripts/full-audit.js
```

### VSCode Extension

```typescript
// Register security review command
vscode.commands.registerCommand('tnf.securityReview', async () => {
  const panel = vscode.window.createWebviewPanel(
    'securityReview',
    'Security Review',
    vscode.ViewColumn.One,
    {}
  );

  const report = await generateSecurityReport();
  panel.webview.html = renderSecurityReport(report);
});
```

## Testing

### Validation Tests

```bash
# Test security checks
node .agent/skills/security-review/scripts/test-checks.js

# Run integration tests
pnpm test --filter security-review
```

### Example Test Cases

```typescript
describe('Security Review', () => {
  it('detects hardcoded secrets', async () => {
    const findings = await scanFile('const password = "secret123";');
    expect(findings).toContainEqual(
      expect.objectContaining({ severity: 'CRITICAL' })
    );
  });

  it('validates JWT secret length', () => {
    const result = validateJWTSecret('short');
    expect(result.valid).toBe(false);
  });
});
```

## Maintenance

- **Weekly:** Run dependency audit
- **Monthly:** Full security review
- **Quarterly:** Penetration testing
- **On Change:** Review security implications

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SANS Top 25](https://www.sans.org/top25-software-errors/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [TNF Security Policy](../../docs/SECURITY.md)

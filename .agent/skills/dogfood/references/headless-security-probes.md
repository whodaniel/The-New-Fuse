# Headless Security Probes

This document contains a catalog of curl-based security probes for testing web
applications when browser tools are unavailable (e.g., in cron/CI environments).

## DNS Resolution

```bash
# Check if domain resolves
dig +short example.com
# Alternative: curl verbose to see DNS errors
curl -sv --max-time 5 https://example.com/ 2>&1 | grep "Could not resolve"
```

**Critical**: NXDOMAIN (domain does not resolve)

## Security Headers Check

```bash
curl -sI --max-time 5 https://example.com/ 2>&1
```

Check for:

- `x-frame-options` (missing → Medium/High)
- `x-content-type-options` (missing → Medium)
- `content-security-policy` (missing → Medium)
- `referrer-policy` (missing → Low)
- `permissions-policy` (missing → Low)
- `strict-transport-security` (missing → Medium if not behind Cloudflare)
- `x-powered-by` (present → Medium — information disclosure)

## CORS Audit

```bash
# Test with malicious origin
curl -sI -H "Origin: https://evil-test.com" https://example.com/
# Check access-control-allow-origin value
# * is a Critical finding (wildcard CORS)

# Test with legitimate origin
curl -sI -H "Origin: https://legitimate-domain.com" https://example.com/

# Check CORS error response (should not return 500 for CORS issues)
curl -s -o /dev/null -w "%{http_code}" -H "Origin: https://evil-test.com" https://example.com/
```

**Critical**: Wildcard CORS (`access-control-allow-origin: *`) **High**: CORS
error returns 500 instead of appropriate status

## Route Availability

```bash
# Probe key routes
curl -sI -o /dev/null -w "%{http_code}" https://example.com/login
curl -sI -o /dev/null -w "%{http_code}" https://example.com/register
curl -sI -o /dev/null -w "%{http_code}" https://example.com/dashboard
curl -sI -o /dev/null -w "%{http_code}" https://example.com/pricing
curl -sI -o /dev/null -w "%{http_code}" https://example.com/docs
curl -sI -o /dev/null -w "%{http_code}" https://example.com/api/health
```

**High**: 404 on user-facing SPA routes that should work **Medium**: Redirects
to wrong domain

## Information Disclosure

```bash
# Check for version/env/internal paths in response
curl -s https://example.com/ | grep -i "version\|environment\|internal\|stack\|path"
# Check for exposed docs
curl -s https://example.com/api-docs
curl -s https://example.com/api/v1
# Check for common exposed files
curl -sI https://example.com/.env
curl -sI https://example.com/git/config
curl -sI https://example.com/wp-config.php
# Check for JSON info disclosure in root endpoint
curl -s https://example.com/ | grep -i "version\|status\|uptime\|environment\|timestamp" | head -5
```

**Medium**: Swagger/OpenAPI docs exposed in production **Medium**: API index
leaking information **High**: Exposure of sensitive files (.env, config files,
etc.) **Medium**: Internal information exposed in JSON responses (version,
status, uptime, etc.)

## HTML Meta Tag Inspection

```bash
# Check for version/info disclosure in meta tags
curl -s https://example.com/ | grep -i "<meta" | grep -i "version\|api\|release\|build"
```

**Medium**: Version or build information exposed in HTML meta tags

## Additional Probes

```bash
# Check for server header information disclosure
curl -sI https://example.com/ | grep -i "server\|x-powered-by\|via"

# Check for cookie security
curl -sI https://example.com/ | grep -i "set-cookie" | grep -i "httponly\|secure\|samesite"

# Check HTTP methods allowed
curl -sX OPTIONS -I https://example.com/ | grep "allow"

# Basic service availability (beyond specific routes)
curl -s -o /dev/null -w "%{http_code}" https://example.com/
```

**Critical**: Service returns 5xx or connection fails entirely **Medium**:
Service returns 4xx for root endpoint (may indicate misconfiguration)

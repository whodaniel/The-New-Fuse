# Production Deployment Checklist

Quick reference checklist for deploying the frontend to production.

## Pre-Build Verification

- [ ] All tests passing: `pnpm test`
- [ ] No TypeScript errors: `pnpm tsc --noEmit`
- [ ] No linting errors: `pnpm lint`
- [ ] Dependencies up to date and audited: `pnpm audit`
- [ ] No known security vulnerabilities
- [ ] Code review completed and approved

## Environment Configuration

- [ ] Production `.env.production` file created
- [ ] `VITE_API_URL` set to production API endpoint
- [ ] `VITE_WS_URL` set to production WebSocket endpoint
- [ ] `VITE_CDN_URL` configured (if using CDN)
- [ ] `VITE_BASE_PATH` set correctly (default: '/')
- [ ] No sensitive data in environment variables
- [ ] Firebase configuration updated for production
- [ ] All API keys and secrets secured

## Build Process

- [ ] Clean previous build: `pnpm clean`
- [ ] Run production build: `pnpm build`
- [ ] Build completes without errors
- [ ] Check bundle sizes in output
- [ ] Verify chunk sizes are under budget (< 500KB warning limit)
- [ ] Review bundle analysis: Open `dist/bundle-analysis.html`
- [ ] Verify source maps are disabled in production

## Build Output Verification

- [ ] `dist/` directory created
- [ ] `dist/index.html` exists and valid
- [ ] Assets organized in proper directories:
  - `dist/assets/js/` - JavaScript chunks
  - `dist/assets/images/` - Image assets
  - `dist/assets/fonts/` - Font files
- [ ] All chunks have hash-based filenames
- [ ] Compression files generated (.gz and .br)
- [ ] Bundle analysis report generated

## Local Testing

- [ ] Test production build locally: `pnpm preview`
- [ ] Verify app loads correctly
- [ ] Test all main routes
- [ ] Verify lazy-loaded routes work
- [ ] Check browser console for errors
- [ ] Test authentication flow
- [ ] Verify API connections work
- [ ] Test on multiple browsers:
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari
- [ ] Test responsive design on mobile

## Performance Audit

- [ ] Run Lighthouse audit (target: 90+ performance)
- [ ] First Contentful Paint (FCP) < 2.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Total Blocking Time (TBT) < 300ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Initial bundle size < 200KB (gzipped)
- [ ] No render-blocking resources

## Server Configuration

### Nginx Configuration (Recommended)

```nginx
# Compression
gzip on;
gzip_vary on;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Brotli (if available)
brotli on;
brotli_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Cache headers for hashed assets
location ~* ^/assets/.*\.[a-f0-9]{8,}\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# No cache for index.html
location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# SPA fallback
location / {
    try_files $uri $uri/ /index.html;
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### Apache Configuration (Alternative)

```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache headers
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/* "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType font/* "access plus 1 year"
</IfModule>

# SPA fallback
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

## Deployment Steps

- [ ] Backup current production deployment
- [ ] Upload build files to server/CDN
- [ ] Verify file permissions
- [ ] Test deployment in staging environment
- [ ] Update DNS if needed
- [ ] Clear CDN cache if using one
- [ ] Smoke test production deployment
- [ ] Monitor initial traffic

## Post-Deployment

- [ ] Verify app is accessible at production URL
- [ ] Check all routes work correctly
- [ ] Verify API integration
- [ ] Test user authentication
- [ ] Check error tracking (Sentry/etc.)
- [ ] Monitor server logs
- [ ] Check analytics tracking
- [ ] Verify Core Web Vitals in production
- [ ] Monitor for errors in first 24 hours
- [ ] Document deployment details

## Rollback Plan

- [ ] Previous build backed up
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging
- [ ] Team notified of deployment

## Monitoring Setup

- [ ] Uptime monitoring configured (Pingdom, UptimeRobot, etc.)
- [ ] Error tracking active (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] Analytics configured (Google Analytics, Plausible, etc.)
- [ ] Log aggregation setup
- [ ] Alert thresholds configured

## Security Checklist

- [ ] HTTPS enabled (SSL/TLS certificate)
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] No exposed secrets or API keys in bundle
- [ ] CORS configured correctly
- [ ] Rate limiting configured
- [ ] DDoS protection enabled
- [ ] Regular security audits scheduled

## Documentation

- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Server configuration documented
- [ ] Rollback procedure documented
- [ ] Monitoring setup documented
- [ ] Contact information for on-call team

## Final Verification

- [ ] All items above checked
- [ ] Team notified of deployment
- [ ] Deployment time recorded
- [ ] Post-deployment review scheduled

---

## Quick Commands Reference

```bash
# Clean and build
pnpm clean && pnpm build

# Build with analysis
pnpm build:analyze

# Preview production build
pnpm preview

# Run Lighthouse audit
npx lighthouse https://your-production-url.com --view

# Check bundle sizes
du -sh dist/assets/*

# Verify compression
curl -H "Accept-Encoding: gzip,deflate,br" -I https://your-production-url.com
```

## Support Contacts

- **DevOps Team**: [Contact info]
- **On-call Engineer**: [Contact info]
- **Product Owner**: [Contact info]

---

**Last Updated**: [Date] **Deployed By**: [Name] **Deployment Notes**: [Any
special notes]

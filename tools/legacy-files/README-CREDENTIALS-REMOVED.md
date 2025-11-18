# Credentials Files Removed

**Date:** November 18, 2025
**Reason:** Security - Hardcoded credentials detected by GitHub Secret Scanning

## Files Removed/Modified

### 1. firebase-credentials.json
- **Location:** `tools/legacy-files/firebase-credentials.json`
- **Action:** Renamed to `.removed` to prevent git tracking
- **Contains:** Google Cloud Service Account private key
- **Risk:** CRITICAL - Full GCP access
- **Replacement:** Use environment variables or Google Cloud Secret Manager

### 2. Stripe API Key in Settings.tsx
- **Location:** `apps/frontend/src/pages/Settings.tsx:246`
- **Action:** Replaced hardcoded key with placeholder
- **Risk:** CRITICAL - Payment processing access
- **Replacement:** Fetch from secure backend API

### 3. Firebase API Key in set-env.sh
- **Location:** `apps/frontend/scripts/set-env.sh:9`
- **Action:** Replaced with environment variable reference
- **Risk:** HIGH - Firebase project access
- **Replacement:** Use `${FIREBASE_API_KEY}` environment variable

## Security Recommendations

### Immediate Actions Required:

1. **Revoke ALL exposed keys:**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Delete/revoke the exposed Firebase API key
   - Delete the exposed service account
   - Go to Stripe Dashboard → Developers → API Keys
   - Revoke the exposed Stripe key

2. **Generate new keys:**
   - Create new Firebase API keys with proper domain restrictions
   - Create new Google Cloud service account with minimal permissions
   - Generate new Stripe API keys

3. **Store secrets securely:**
   - Use Railway environment variables for production
   - Use `.env.local` for development (already gitignored)
   - Never commit `.env` files with real secrets

### Environment Variable Setup

For Railway production deployment, set these environment variables:

```bash
# Firebase/Google Cloud
FIREBASE_API_KEY=<new-api-key>
FIREBASE_AUTH_DOMAIN=the-new-fuse-2025.firebaseapp.com
FIREBASE_PROJECT_ID=the-new-fuse-2025
FIREBASE_STORAGE_BUCKET=the-new-fuse-2025.appspot.com

# Stripe (backend only)
STRIPE_SECRET_KEY=<new-secret-key>
STRIPE_PUBLISHABLE_KEY=<new-publishable-key>

# Google Cloud Service Account (use Secret Manager or Railway secrets)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/secure/credentials.json
```

### Best Practices Going Forward:

1. ✅ Always use environment variables for secrets
2. ✅ Keep `.env` files in `.gitignore`
3. ✅ Use placeholder values in code examples
4. ✅ Rotate keys immediately if exposed
5. ✅ Implement IP/domain restrictions on API keys
6. ✅ Use minimal IAM permissions for service accounts
7. ✅ Regular security audits with tools like `gitleaks` or `trufflehog`

## Git History Cleanup

⚠️ **IMPORTANT:** The exposed secrets are still in git history!

To completely remove them, use one of these tools:
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)

Example with BFG:
```bash
bfg --delete-files firebase-credentials.json
bfg --replace-text secrets.txt  # Create file with patterns to remove
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

⚠️ **WARNING:** Force pushing rewrites history and will break existing clones!

## Contact

If you have questions about secure credential management, contact the security team.

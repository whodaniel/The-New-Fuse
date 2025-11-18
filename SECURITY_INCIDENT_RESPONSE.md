# 🚨 SECURITY INCIDENT RESPONSE - Exposed API Keys

**Status:** ACTIVE - Immediate Action Required
**Severity:** CRITICAL
**Date Detected:** 2025-11-18

## Summary

GitHub secret scanning has detected **6 publicly exposed secrets** in the repository. These keys are in the public git history and must be considered compromised.

## Exposed Secrets

| Service | Key Type | Status | Priority |
|---------|----------|--------|----------|
| OpenRouter | API Key | 🔴 EXPOSED | CRITICAL |
| Stripe | Live Secret Key | 🔴 EXPOSED | CRITICAL |
| Google Cloud | Service Account #1 | 🔴 EXPOSED | CRITICAL |
| Google Cloud | Service Account #2 | 🔴 EXPOSED | CRITICAL |
| Firebase | API Key #1 | 🔴 EXPOSED | HIGH |
| Firebase | API Key #2 | 🔴 EXPOSED | HIGH |

---

## ⚡ IMMEDIATE ACTIONS (Do These NOW)

### 1. Rotate OpenRouter API Key

**Current Key:** `REDACTED-OPENROUTER-KEY`

**Steps:**
1. Log in to https://openrouter.ai/keys
2. **Revoke** the exposed key immediately
3. **Generate** a new API key
4. Update `.env.local` with the new key:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-NEW_KEY_HERE
   ```
5. Update Railway/production environment variables

**Impact:** API calls will fail until updated

---

### 2. Rotate Stripe API Key

**Current Key:** `REDACTED-STRIPE-KEY`

**Steps:**
1. Log in to https://dashboard.stripe.com/apikeys
2. **DELETE** the exposed secret key immediately
3. **Create** a new secret key
4. Update `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_live_NEW_KEY_HERE
   ```
5. Update production environment
6. **CRITICAL:** Check Stripe dashboard for unauthorized charges
7. Enable fraud detection if not already active

**Impact:** Payment processing will fail until updated
**Risk:** Unauthorized charges possible

---

### 3. Rotate Google Cloud Service Accounts

**Exposed Accounts:**
- `REDACTED-SERVICE-ACCOUNT-1@example.com`
- `REDACTED-SERVICE-ACCOUNT-2@example.com`

**Steps:**
1. Log in to https://console.cloud.google.com/iam-admin/serviceaccounts
2. Select project: `the-new-fuse-2025`
3. For EACH service account:
   - Click on the service account
   - Go to "Keys" tab
   - **Delete** all existing keys
   - Click "Add Key" → "Create New Key" → JSON
   - Download the new JSON file
4. Save new credentials **outside the repository**:
   ```bash
   # DO NOT commit these files
   cp ~/Downloads/new-service-account-1.json ~/secure-credentials/
   cp ~/Downloads/new-service-account-2.json ~/secure-credentials/
   ```
5. Update `.env.local`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/secure/service-account.json
   ```
6. Update production environment variables
7. **Check Google Cloud Audit Logs** for unauthorized access

**Impact:** Firebase, Cloud Storage, and GCP services will fail until updated

---

### 4. Rotate Firebase API Keys

**Exposed Keys:**
- `REDACTED-FIREBASE-KEY-1`
- `REDACTED-FIREBASE-KEY-2`

**Steps:**
1. Log in to https://console.firebase.google.com/project/the-new-fuse-2025/settings/general
2. Under "Your apps", select your web app
3. Under "Firebase SDK snippet", click "Config"
4. **Delete** the current web app
5. **Add** a new web app
6. Copy the new configuration
7. Update `.env.local`:
   ```bash
   VITE_FIREBASE_API_KEY=NEW_API_KEY_HERE
   FIREBASE_API_KEY=NEW_API_KEY_HERE
   ```
8. Update frontend config files
9. Redeploy frontend

**Alternative (Less Disruptive):**
1. Go to Project Settings → General → Web API Key
2. Click "Regenerate" if available
3. Update all references

**Impact:** Frontend authentication will fail until updated

---

## 🛡️ SECONDARY ACTIONS (Do After Rotating Keys)

### 5. Clean Git History

**DO NOT run this until ALL keys are rotated!**

```bash
cd /home/user/fuse

# Make backup
git clone . ../fuse-backup

# Run cleanup script
chmod +x scripts/security/clean-secrets-from-history.sh
./scripts/security/clean-secrets-from-history.sh

# After reviewing cleaned history
git push --force --all origin
git push --force --tags origin
```

**⚠️ WARNING:**
- This rewrites git history
- All collaborators must re-clone the repository
- Existing pull requests may break
- Existing local branches will diverge

---

### 6. Security Hardening

**Immediate:**
```bash
# Verify .gitignore is correct
cat .gitignore | grep -E "(\.env|credentials|\.key|\.pem)"

# Check for remaining secrets
git grep -i "sk_live_" || echo "✅ No Stripe keys found"
git grep -i "AIzaSy" || echo "✅ No Google API keys found"
git grep -i "BEGIN PRIVATE KEY" || echo "✅ No private keys found"
```

**Enable GitHub Secret Scanning Alerts:**
1. Go to https://github.com/whodaniel/fuse/settings/security_analysis
2. Enable "Dependency graph"
3. Enable "Dependabot alerts"
4. Enable "Dependabot security updates"
5. Enable "Secret scanning" (if available)
6. Enable "Push protection" (prevents future commits with secrets)

**Add Pre-commit Hook:**
```bash
# Install git-secrets
brew install git-secrets  # macOS
# OR
sudo apt-get install git-secrets  # Linux

# Configure for repository
cd /home/user/fuse
git secrets --install
git secrets --register-aws
git secrets --add 'sk_live_[a-zA-Z0-9]+'  # Stripe
git secrets --add 'AIzaSy[a-zA-Z0-9_-]+'  # Google
git secrets --add 'sk-or-v1-[a-f0-9]+'    # OpenRouter
```

---

## 📊 Incident Response Checklist

- [ ] **CRITICAL:** Revoke OpenRouter API key
- [ ] **CRITICAL:** Delete Stripe secret key
- [ ] **CRITICAL:** Delete Google Cloud service account keys (both)
- [ ] **CRITICAL:** Rotate Firebase API keys
- [ ] Generate new OpenRouter API key
- [ ] Generate new Stripe secret key
- [ ] Generate new GCP service account keys
- [ ] Generate new Firebase API keys
- [ ] Update `.env.local` with all new keys
- [ ] Update Railway production environment
- [ ] Test authentication with new keys
- [ ] Test payment processing with new keys
- [ ] Test GCP/Firebase services
- [ ] Review Google Cloud Audit Logs
- [ ] Review Stripe transaction history
- [ ] Run git history cleanup script
- [ ] Force push cleaned history
- [ ] Notify collaborators to re-clone
- [ ] Enable GitHub push protection
- [ ] Install git-secrets pre-commit hook
- [ ] Document lessons learned

---

## 🔍 Post-Incident Analysis

**Root Cause:**
- Secret credentials were committed to git before proper `.gitignore` was in place
- Files committed: `service-account-key.json`, `firebase-credentials.json`
- Keys hardcoded in source files: `Settings.tsx`, `firebase.ts`, `docker-compose.yml`

**Prevention:**
1. ✅ Updated `.gitignore` to exclude all credential files
2. ✅ Moved secrets to `.env.local` (gitignored)
3. ✅ Created `.env.example` templates
4. 🔄 Need to install git-secrets pre-commit hook
5. 🔄 Need to enable GitHub push protection

**Timeline:**
- 2025-04-11: Initial secrets committed
- 2025-08-20: Stripe key detected in Settings.tsx
- 2025-11-04: OpenRouter key detected
- 2025-11-18: Comprehensive security fix implemented

---

## 📞 Support Contacts

**If you detect unauthorized usage:**

- **Stripe Support:** https://support.stripe.com/
- **Google Cloud Support:** https://cloud.google.com/support
- **Firebase Support:** https://firebase.google.com/support/contact
- **OpenRouter Support:** https://openrouter.ai/docs#support

---

## ✅ Verification

After rotating all keys, verify:

```bash
# Test OpenRouter
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/models | jq '.data[0]'

# Test Firebase
# (Frontend app should load without auth errors)

# Test Stripe
curl https://api.stripe.com/v1/balance \
  -u "$STRIPE_SECRET_KEY:" | jq

# Test GCP
gcloud auth activate-service-account --key-file=/path/to/new-key.json
gcloud projects list
```

All tests should succeed with HTTP 200 responses.

---

**This is a CRITICAL security incident. Prioritize key rotation above all other work.**

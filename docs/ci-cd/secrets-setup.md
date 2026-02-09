# Secrets Setup Guide

This guide covers all required secrets and environment variables for the CI/CD pipeline.

## Required Secrets

All secrets should be configured in GitHub Settings → Secrets and variables → Actions.

### Core Secrets

#### `RAILWAY_TOKEN`
- **Purpose**: Deploy to Railway
- **Type**: Railway API token
- **Required for**: deploy.yml
- **How to obtain**:
  ```bash
  # Install Railway CLI
  npm install -g @railway/cli

  # Login and get token
  railway login
  railway token
  ```
- **Scopes**: Deploy, read project status

#### `GITHUB_TOKEN`
- **Purpose**: GitHub API access
- **Type**: Automatically provided by GitHub Actions
- **Required for**: All workflows
- **Note**: No manual setup needed

### Optional but Recommended

#### `CODECOV_TOKEN`
- **Purpose**: Upload test coverage to Codecov
- **Type**: Codecov project token
- **Required for**: test.yml, quality.yml
- **How to obtain**:
  1. Sign up at https://codecov.io
  2. Add your repository
  3. Copy the upload token
- **Without this**: Coverage uploads will fail but tests will pass

#### `TURBO_TOKEN`
- **Purpose**: Remote caching for Turborepo
- **Type**: Vercel token
- **Required for**: All workflows (optional)
- **How to obtain**:
  ```bash
  npx turbo login
  npx turbo link
  ```
- **Benefits**: Speeds up builds by caching across CI runs

#### `TURBO_TEAM`
- **Purpose**: Turborepo team ID
- **Type**: Team identifier
- **Required for**: Works with TURBO_TOKEN
- **How to obtain**: Shown during `turbo link`

### Docker Registry (if using Docker Hub)

#### `DOCKER_USERNAME`
- **Purpose**: Docker Hub login
- **Type**: Docker Hub username
- **Required for**: deploy.yml
- **How to obtain**: Your Docker Hub username

#### `DOCKER_PASSWORD`
- **Purpose**: Docker Hub authentication
- **Type**: Docker Hub access token (recommended) or password
- **Required for**: deploy.yml
- **How to obtain**:
  1. Login to Docker Hub
  2. Account Settings → Security → New Access Token
  3. Copy the token

### Monitoring & Notifications

#### `SLACK_WEBHOOK`
- **Purpose**: Deployment notifications
- **Type**: Slack Incoming Webhook URL
- **Required for**: deploy.yml notifications
- **How to obtain**:
  1. Go to Slack App Directory
  2. Search for "Incoming Webhooks"
  3. Add to your workspace
  4. Create webhook for desired channel
  5. Copy webhook URL

### Code Quality

#### `SONAR_TOKEN`
- **Purpose**: SonarCloud code quality analysis
- **Type**: SonarCloud token
- **Required for**: quality.yml
- **How to obtain**:
  1. Sign up at https://sonarcloud.io
  2. Create organization
  3. Add repository
  4. Generate token in Account → Security
- **Without this**: Code quality job will fail

## Environment-Specific Secrets

### Production Environment

Create an environment named `production` in GitHub Settings → Environments.

**Required secrets**:
- All Railway-related secrets
- Production database credentials (if needed)
- Production API keys

**Protection rules**:
- Require reviewers before deployment
- Only allow deployments from `main` branch

### Staging Environment

Create an environment named `staging` in GitHub Settings → Environments.

**Required secrets**:
- Staging Railway token (if separate project)
- Staging database credentials
- Staging API keys

## Setting Up Secrets

### Via GitHub UI

1. Navigate to your repository
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Enter name and value
5. Click "Add secret"

### Via GitHub CLI

```bash
# Install GitHub CLI
# https://cli.github.com

# Set a secret
gh secret set RAILWAY_TOKEN --body "your-token-here"

# Set multiple secrets from a file
gh secret set -f secrets.env

# List all secrets
gh secret list
```

### Via Script

```bash
#!/bin/bash
# setup-secrets.sh

# Read from .env file (DO NOT commit this file!)
source .env.secrets

gh secret set RAILWAY_TOKEN --body "$RAILWAY_TOKEN"
gh secret set CODECOV_TOKEN --body "$CODECOV_TOKEN"
gh secret set DOCKER_USERNAME --body "$DOCKER_USERNAME"
gh secret set DOCKER_PASSWORD --body "$DOCKER_PASSWORD"
gh secret set SLACK_WEBHOOK --body "$SLACK_WEBHOOK"
gh secret set SONAR_TOKEN --body "$SONAR_TOKEN"
gh secret set TURBO_TOKEN --body "$TURBO_TOKEN"
gh secret set TURBO_TEAM --body "$TURBO_TEAM"

echo "All secrets configured!"
```

## Secrets Checklist

Before deploying, ensure all required secrets are set:

- [ ] `RAILWAY_TOKEN` - Railway deployment
- [ ] `CODECOV_TOKEN` - Test coverage (recommended)
- [ ] `DOCKER_USERNAME` - Docker registry (if using)
- [ ] `DOCKER_PASSWORD` - Docker registry (if using)
- [ ] `SLACK_WEBHOOK` - Notifications (recommended)
- [ ] `SONAR_TOKEN` - Code quality (recommended)
- [ ] `TURBO_TOKEN` - Remote caching (optional)
- [ ] `TURBO_TEAM` - Remote caching (optional)

## Verifying Secrets

### Test Railway Token

```bash
# Export your token
export RAILWAY_TOKEN="your-token"

# Test connection
railway status
```

### Test Codecov Token

```bash
# Test upload (dry run)
curl -X POST --data-binary @coverage/lcov.info \
  -H "Content-Type: text/plain" \
  "https://codecov.io/upload/v4?token=$CODECOV_TOKEN&commit=$COMMIT_SHA"
```

### Test Docker Login

```bash
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
```

## Secret Rotation

### Best Practices

1. **Rotate secrets regularly**: Every 90 days minimum
2. **Use tokens, not passwords**: When possible
3. **Scope tokens minimally**: Only required permissions
4. **Monitor usage**: Check for unauthorized access
5. **Revoke old tokens**: After rotation

### Rotation Procedure

1. Generate new token/secret
2. Update in GitHub Secrets
3. Verify CI/CD still works
4. Revoke old token/secret
5. Document rotation date

## Security Best Practices

### DO

- Use environment-specific secrets
- Use fine-grained tokens
- Rotate secrets regularly
- Monitor secret usage
- Use GitHub Environments for production
- Require approvals for production deployments

### DON'T

- Commit secrets to git
- Share secrets in chat/email
- Use the same secrets for dev and prod
- Give secrets broader scope than needed
- Log secret values

## Troubleshooting

### Secret Not Found

**Error**: `Error: Secret RAILWAY_TOKEN not found`

**Solution**:
1. Verify secret name matches exactly (case-sensitive)
2. Check secret is set at repository level (not organization)
3. For environment secrets, ensure environment name matches

### Invalid Token

**Error**: `Error: Authentication failed`

**Solution**:
1. Verify token hasn't expired
2. Check token has required scopes
3. Generate new token
4. Update secret in GitHub

### Secrets Not Available in Forks

**Note**: Secrets are not available in fork PRs for security.

**Solution**: For external contributors:
1. Maintainer must run workflows
2. Or: Use `pull_request_target` (carefully!)
3. Or: Use Dependabot secrets (for Dependabot PRs)

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Railway Documentation](https://docs.railway.app)
- [Codecov Documentation](https://docs.codecov.com)
- [Docker Hub Tokens](https://docs.docker.com/docker-hub/access-tokens/)

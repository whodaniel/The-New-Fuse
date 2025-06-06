# Environment Configuration Guide

This guide covers setting up environment variables and configuration for The New Fuse webhooks, SSE, and serverless architecture across different deployment environments.

## 📋 Environment Variables Overview

### Core API Configuration

```bash
# Node.js Environment
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/tnf_production
POSTGRES_DB=tnf_production
POSTGRES_USER=tnf_user
POSTGRES_PASSWORD=secure_password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis_secure_password

# JWT Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# API Configuration
API_PORT=3000
API_HOST=0.0.0.0
CORS_ORIGINS=https://app.thenewfuse.com,https://dashboard.thenewfuse.com
```

### Webhook Security Configuration

```bash
# Master Webhook Secret
WEBHOOK_SECRET_KEY=webhook_master_secret_key

# Platform-Specific Webhook Secrets
STRIPE_WEBHOOK_SECRET=whsec_stripe_webhook_secret_key
PAYPAL_WEBHOOK_SECRET=paypal_webhook_secret_key
SALESFORCE_WEBHOOK_SECRET=salesforce_webhook_secret_key
HUBSPOT_WEBHOOK_SECRET=hubspot_webhook_secret_key
PIPEDRIVE_WEBHOOK_SECRET=pipedrive_webhook_secret_key
SQUARE_WEBHOOK_SECRET=square_webhook_secret_key
NETSUITE_WEBHOOK_SECRET=netsuite_webhook_secret_key
SAP_WEBHOOK_SECRET=sap_webhook_secret_key
QUICKBOOKS_WEBHOOK_SECRET=quickbooks_webhook_secret_key
ZAPIER_WEBHOOK_SECRET=zapier_webhook_secret_key
WORKATO_WEBHOOK_SECRET=workato_webhook_secret_key
POWER_AUTOMATE_WEBHOOK_SECRET=power_automate_webhook_secret_key
```

### SSE Configuration

```bash
# Server-Sent Events Configuration
SSE_ENABLED=true
SSE_HEARTBEAT_INTERVAL=30000
MAX_SSE_CONNECTIONS=1000
SSE_CONNECTION_TIMEOUT=300000
SSE_REDIS_CHANNEL=sse-notifications
```

### Monitoring and Logging

```bash
# Logging Configuration
LOGGING_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=/app/logs/tnf.log

# Metrics Configuration
METRICS_ENABLED=true
PROMETHEUS_PORT=9090
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure_grafana_password

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30
HEALTH_CHECK_TIMEOUT=5
```

### External Service Configuration

```bash
# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@thenewfuse.com

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Analytics
ANALYTICS_API_KEY=your_analytics_api_key
MIXPANEL_TOKEN=your_mixpanel_token
```

## 🏗️ Environment-Specific Configurations

### Development Environment (.env.development)

```bash
NODE_ENV=development
API_PORT=3000
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/tnf_dev
REDIS_URL=redis://localhost:6379
LOGGING_LEVEL=debug
METRICS_ENABLED=false
SSL_ENABLED=false

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SSE_URL=http://localhost:3000/webhooks/events/stream
REACT_APP_CLOUDFLARE_WORKER_URL=http://localhost:8787
```

### Staging Environment (.env.staging)

```bash
NODE_ENV=staging
API_PORT=3000
DATABASE_URL=postgresql://staging_user:staging_password@staging-db:5432/tnf_staging
REDIS_URL=redis://staging-redis:6379
LOGGING_LEVEL=info
METRICS_ENABLED=true
SSL_ENABLED=true

# Frontend Configuration
REACT_APP_API_URL=https://staging-api.thenewfuse.com
REACT_APP_SSE_URL=https://staging-api.thenewfuse.com/webhooks/events/stream
REACT_APP_CLOUDFLARE_WORKER_URL=https://staging-worker.yourdomain.com
```

### Production Environment (.env.production)

```bash
NODE_ENV=production
API_PORT=3000
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
LOGGING_LEVEL=warn
METRICS_ENABLED=true
SSL_ENABLED=true

# Frontend Configuration
REACT_APP_API_URL=https://api.thenewfuse.com
REACT_APP_SSE_URL=https://api.thenewfuse.com/webhooks/events/stream
REACT_APP_CLOUDFLARE_WORKER_URL=https://worker.thenewfuse.com
```

## ☁️ Cloudflare Workers Configuration

### Development (.env.development)

```bash
ENVIRONMENT=development
LOGGING_LEVEL=DEBUG
METRICS_ENDPOINT=http://localhost:3000/metrics
CRM_API_ENDPOINT=http://localhost:3001/api
ANALYTICS_ENDPOINT=http://localhost:3002/api
```

### Production (.env.production)

```bash
ENVIRONMENT=production
LOGGING_LEVEL=WARN
METRICS_ENDPOINT=https://api.thenewfuse.com/metrics
CRM_API_ENDPOINT=https://crm.thenewfuse.com/api
ANALYTICS_ENDPOINT=https://analytics.thenewfuse.com/api
SSE_REDIS_CHANNEL=sse-notifications
```

## 🔐 Security Configuration

### SSL/TLS Configuration

```bash
# SSL Certificate Paths
SSL_CERT_PATH=/etc/ssl/certs/thenewfuse.crt
SSL_KEY_PATH=/etc/ssl/private/thenewfuse.key
SSL_CA_PATH=/etc/ssl/certs/ca-bundle.crt

# Security Headers
SECURITY_HEADERS_ENABLED=true
HSTS_MAX_AGE=31536000
CSP_ENABLED=true
```

### Rate Limiting

```bash
# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL=true
```

## 🔧 Database Configuration

### Connection Pool Settings

```bash
# Database Pool Configuration
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=30000
DB_QUERY_TIMEOUT=60000
DB_CONNECTION_TIMEOUT=10000
```

### Migration Configuration

```bash
# Database Migration Settings
DB_MIGRATE_ON_START=false
DB_SEED_ON_START=false
DB_BACKUP_ENABLED=true
DB_BACKUP_SCHEDULE="0 2 * * *"
```

## 📊 Monitoring Configuration

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'tnf-api'
    static_configs:
      - targets: ['api:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'tnf-worker'
    static_configs:
      - targets: ['worker.thenewfuse.com']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Grafana Configuration

```bash
# Grafana Environment Variables
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
GF_USERS_ALLOW_SIGN_UP=false
GF_ANALYTICS_REPORTING_ENABLED=false
GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
```

## 🚀 Deployment Scripts

### Environment Setup Script

```bash
#!/bin/bash
# setup-environment.sh

ENVIRONMENT=${1:-development}

echo "Setting up environment: $ENVIRONMENT"

# Copy environment file
cp .env.$ENVIRONMENT .env

# Generate JWT secret if not exists
if [ -z "$JWT_SECRET" ]; then
    export JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT_SECRET: $JWT_SECRET"
fi

# Setup database
npm run db:migrate
npm run db:seed

echo "Environment setup complete for: $ENVIRONMENT"
```

### Health Check Configuration

```bash
# Health Check Endpoints
HEALTH_CHECK_PATHS=/health,/health/ready,/health/live
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_RETRIES=3
HEALTH_CHECK_INTERVAL=30000
```

## 🔍 Validation and Testing

### Environment Validation Script

```javascript
// validate-environment.js
const requiredVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'WEBHOOK_SECRET_KEY'
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

console.log('Environment validation passed');
```

### Configuration Testing

```bash
# Test database connection
npm run test:db

# Test Redis connection
npm run test:redis

# Test webhook endpoints
npm run test:webhooks

# Test SSE connections
npm run test:sse
```

## 📝 Best Practices

1. **Secret Management**: Use a secret management service in production
2. **Environment Isolation**: Keep environment configurations separate
3. **Validation**: Always validate environment variables on startup
4. **Rotation**: Regularly rotate secrets and API keys
5. **Monitoring**: Monitor configuration drift and changes
6. **Backup**: Backup configuration files and environment settings

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Fails**
   - Check DATABASE_URL format
   - Verify network connectivity
   - Confirm credentials

2. **Webhook Signature Validation Fails**
   - Verify webhook secrets
   - Check signature headers
   - Validate payload format

3. **SSE Connections Drop**
   - Check SSE_HEARTBEAT_INTERVAL
   - Verify network stability
   - Monitor connection limits

---

*For more detailed configuration options, see the individual service documentation.*
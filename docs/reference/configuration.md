# Configuration Guide

## GitHub Actions Configuration

### Required Secrets
Configure these secrets in your GitHub repository:

```yaml
SNYK_TOKEN: # For security scanning
CODECOV_TOKEN: # For code coverage reporting
DOCKER_USERNAME: # Docker Hub username
DOCKER_PASSWORD: # Docker Hub password
KUBE_CONFIG_DATA: # Base64 encoded kubeconfig
```

### Environment Configuration
Two environments are configured:
- Staging: For pre-production testing
- Production: For live deployment

## Kubernetes Configuration

### Resource Quotas
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: thefuse-quota
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 4Gi
    limits.cpu: "8"
    limits.memory: 8Gi
```

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: thefuse-network-policy
spec:
  podSelector:
    matchLabels:
      app: thefuse
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - ports:
        - port: 3000
  egress:
    - {}
```

## Application Configuration

### Environment Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://user:password@host:6379
```

### Logging Configuration
```yaml
LOG_LEVEL: info
LOG_FORMAT: json
LOG_FILE: /var/log/app.log
```

### Health Check Configuration
- Liveness probe: /health
- Readiness probe: /ready
- Initial delay: 30s
- Period: 10s

## Security Configuration

### TLS Configuration
- Protocol: TLS 1.3
- Cipher suites: Modern secure configurations
- Certificate renewal: Automatic with Let's Encrypt

### CORS Configuration
```yaml
ALLOWED_ORIGINS:
  - https://staging.example.com
  - https://example.com
```
# Configuration Guide

## Service Configuration
Each service requires specific configuration for optimal operation:

### Service Registry
```yaml
discovery:
  heartbeat_interval: 30s
  cleanup_interval: 300s
  ttl: 60s
```

### Workflow Orchestrator
```yaml
orchestration:
  max_concurrent_workflows: 100
  timeout: 300s
  retry_attempts: 3
```

### State Manager
```yaml
state:
  sync_interval: 15s
  consistency_level: "strong"
  cache_ttl: 300s
```

## Environment Variables
Required environment variables for each service:
- `REDIS_URL`: Redis connection string
- `DATABASE_URL`: Database connection string
- `SERVICE_PORT`: Service port number
- `LOG_LEVEL`: Logging level

## Security Configuration
- TLS certificate configuration
- Authentication settings
- Authorization policies
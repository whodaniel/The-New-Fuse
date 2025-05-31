# The New Fuse Monitoring Guide

## Table of Contents
1. [Overview](#overview)
2. [Metrics Collection](#metrics-collection)
3. [Logging Setup](#logging-setup)
4. [Alert Configuration](#alert-configuration)
5. [Dashboard Setup](#dashboard-setup)
6. [Performance Monitoring](#performance-monitoring)

## Overview

The New Fuse uses a comprehensive monitoring stack:
- Prometheus for metrics collection
- Grafana for visualization
- ELK Stack for log aggregation
- Cloud Monitoring for cloud resources
- Custom health checks for service status

## Metrics Collection

### 1. Prometheus Setup

1. Install Prometheus:
```bash
# Download Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz

# Extract and setup
tar xvfz prometheus-*.tar.gz
cd prometheus-*
```

2. Configure Prometheus (`prometheus.yml`):
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'the-new-fuse'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scheme: 'http'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']
```

### 2. Node Exporter Setup

```bash
# Install node exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.5.0/node_exporter-1.5.0.linux-amd64.tar.gz
tar xvfz node_exporter-*.tar.gz
cd node_exporter-*
./node_exporter
```

### 3. Database Exporters

```bash
# Redis exporter
docker run -d --name redis-exporter \
  -p 9121:9121 \
  oliver006/redis_exporter

# PostgreSQL exporter
docker run -d --name postgres-exporter \
  -p 9187:9187 \
  -e DATA_SOURCE_NAME="postgresql://user:password@localhost:5432/fuse?sslmode=disable" \
  wrouesnel/postgres_exporter
```

## Logging Setup

### 1. ELK Stack Configuration

1. Install Elasticsearch:
```bash
# Add Elastic repository
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-7.x.list
sudo apt update && sudo apt install elasticsearch
```

2. Configure Logstash (`logstash.conf`):
```conf
input {
  file {
    path => "/var/log/fuse/app.log"
    type => "fuse-logs"
    codec => json
  }
}

filter {
  if [type] == "fuse-logs" {
    date {
      match => [ "timestamp", "ISO8601" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "fuse-logs-%{+YYYY.MM.dd}"
  }
}
```

3. Configure Kibana:
```yaml
server.port: 5601
server.host: "localhost"
elasticsearch.hosts: ["http://localhost:9200"]
```

### 2. Log Rotation

Configure logrotate (`/etc/logrotate.d/fuse`):
```conf
/var/log/fuse/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 fuse fuse
    sharedscripts
    postrotate
        systemctl reload fuse
    endscript
}
```

## Alert Configuration

### 1. Prometheus Alerting Rules

Create `alerts.yml`:
```yaml
groups:
- name: fuse-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected
      description: Error rate is above 1% for the last 5 minutes

  - alert: HighLatency
    expr: http_request_duration_seconds{quantile="0.95"} > 0.5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High latency detected
      description: P95 latency is above 500ms

  - alert: HighMemoryUsage
    expr: process_resident_memory_bytes / process_heap_bytes > 0.85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High memory usage
      description: Memory usage is above 85%
```

### 2. Alert Notification

Configure alert manager (`alertmanager.yml`):
```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'slack'

receivers:
- name: 'slack'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts'
    send_resolved: true
```

## Dashboard Setup

### 1. Grafana Installation

```bash
# Install Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana
```

### 2. Dashboard Configuration

Import the following dashboards:
- Node Exporter Full (ID: 1860)
- Redis Dashboard (ID: 763)
- PostgreSQL Overview (ID: 9628)
- Custom The New Fuse Dashboard (provided separately)

### 3. Custom Metrics Dashboard

Create a custom dashboard with:
- Request rate by endpoint
- Error rate
- Response time percentiles
- Cache hit/miss ratio
- Circuit breaker status
- Active WebSocket connections
- Agent status distribution
- Task queue length

## Performance Monitoring

### 1. Application Metrics

Monitor the following metrics:
```typescript
// Request metrics
http_requests_total{method, path, status}
http_request_duration_seconds{method, path}

// Cache metrics
cache_hits_total
cache_misses_total
cache_size_bytes

// Circuit breaker metrics
circuit_breaker_state{service}
circuit_breaker_failures_total{service}

// WebSocket metrics
websocket_connections_active
websocket_messages_total{type}

// Task metrics
task_queue_length
task_processing_duration_seconds
task_status{status}
```

### 2. Resource Monitoring

System resources to monitor:
- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- Connection pool status
- Redis memory usage
- PostgreSQL connections

### 3. Business Metrics

Track the following business metrics:
- Active users
- Agent creation rate
- Task completion rate
- Pipeline execution time
- Error distribution by type
- API usage by endpoint
- WebSocket message rate

## Integration with Cloud Monitoring

### 1. Google Cloud Monitoring

```bash
# Install Cloud Monitoring agent
curl -sSO https://dl.google.com/cloudagents/add-monitoring-agent-repo.sh
sudo bash add-monitoring-agent-repo.sh
sudo apt-get update
sudo apt-get install stackdriver-agent
```

### 2. Custom Metrics Export

Configure custom metrics export in `app.yaml`:
```yaml
env_variables:
  GOOGLE_CLOUD_PROJECT: your-project-id
  MONITORING_EXPORT_INTERVAL: 60
```

### 3. Cloud Logging

Enable structured logging:
```typescript
const logger = new LoggingService({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  logName: 'fuse-application',
  resource: {
    type: 'cloud_run_revision',
    labels: {
      service_name: 'fuse',
      revision_name: process.env.K_REVISION
    }
  }
});
``` 
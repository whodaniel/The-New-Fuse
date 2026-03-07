#!/bin/bash

# Initialize Information Architecture Monitoring

# Create monitoring directories if they don't exist
mkdir -p /var/log/fuse/architecture-monitoring
mkdir -p /var/lib/fuse/metrics/architecture

# Set up Prometheus metrics
cat << EOF > /etc/prometheus/conf.d/architecture-metrics.yml
- job_name: 'architecture-compliance'
  static_configs:
    - targets: ['localhost:9090']
  metrics_path: '/metrics/architecture'
  scrape_interval: 5m
EOF

# Set up Grafana dashboard
cat << EOF > /etc/grafana/provisioning/dashboards/architecture-compliance.json
{
  "dashboard": {
    "id": null,
    "title": "Architecture Compliance",
    "tags": ["architecture", "compliance"],
    "timezone": "browser",
    "refresh": "5m",
    "panels": [
      {
        "title": "Schema Compliance Trends",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "schema_compliance",
            "legendFormat": "Schema Compliance"
          },
          {
            "expr": "cross_reference_validity",
            "legendFormat": "Cross References"
          }
        ]
      },
      {
        "title": "Protocol Standards",
        "type": "gauge",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "mcp_protocol_compliance",
            "legendFormat": "MCP Protocol"
          },
          {
            "expr": "message_format_validity",
            "legendFormat": "Message Format"
          }
        ]
      }
    ]
  }
}
EOF

# Set up logging configuration
cat << EOF > /etc/filebeat/conf.d/architecture-logging.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/fuse/architecture-monitoring/*.log
  fields:
    type: architecture_monitoring
EOF

# Set up alerting rules
cat << EOF > /etc/alertmanager/conf.d/architecture-alerts.yml
groups:
- name: architecture
  rules:
  - alert: LowSchemaCompliance
    expr: schema_compliance < 90
    for: 1h
    labels:
      severity: critical
    annotations:
      summary: Low schema compliance detected
  - alert: ProtocolViolation
    expr: mcp_protocol_compliance < 95
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: MCP protocol violation detected
EOF

# Restart monitoring services
systemctl restart prometheus
systemctl restart grafana-server
systemctl restart filebeat
systemctl restart alertmanager

echo "Architecture monitoring initialization complete"
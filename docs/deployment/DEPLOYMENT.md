# Deployment Guide

## Prerequisites
- Kubernetes cluster
- Helm v3+
- kubectl configured
- Docker registry access

## Deployment Steps

1. Configure Environment:
```bash
# Create namespace
kubectl create namespace fuse

# Add Helm repositories
helm repo add fuse-charts https://charts.fuse.ai
helm repo update
```

2. Deploy Infrastructure:
```bash
# Deploy monitoring stack
helm install monitoring fuse-charts/monitoring \
  --namespace fuse \
  --values monitoring-values.yaml

# Deploy application
helm install fuse fuse-charts/fuse \
  --namespace fuse \
  --values app-values.yaml
```

3. Verify Deployment:
```bash
kubectl get pods -n fuse
kubectl get services -n fuse
```

## Monitoring Setup

1. Access Grafana:
   - URL: https://grafana.your-domain.com
   - Default credentials in secrets

2. Access Prometheus:
   - URL: https://prometheus.your-domain.com
   - Metrics available at /metrics endpoint

## Troubleshooting

Common issues and solutions:
1. Pod crashes on startup...
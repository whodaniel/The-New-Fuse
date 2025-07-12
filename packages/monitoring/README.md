# Monitoring Dashboard Package

Comprehensive system monitoring and observability dashboard for The New Fuse application.

## Overview

This package provides real-time monitoring, alerting, and performance analytics for all system components including:

- System resources (CPU, memory, disk)
- Redis cache performance
- Job queue metrics
- WebSocket connections
- Agent-to-Agent (A2A) communication
- Database performance
- Health checks and alerting

## Features

### Real-time Monitoring
- Live system metrics collection every minute
- Performance dashboards with historical data
- Component health monitoring
- Automatic alerting based on configurable thresholds

### Performance Analytics
- Trend analysis and forecasting
- Bottleneck identification
- Performance recommendations
- SLA monitoring and reporting

### Alert Management
- Configurable alert thresholds
- Multiple severity levels (warning, error, critical)
- Auto-resolution when metrics return to normal
- Alert acknowledgment and resolution tracking

### Dashboard Components
- System overview with key metrics
- Real-time performance charts
- Component health status
- Active alerts management
- Historical trend analysis

## Architecture

```
packages/monitoring/
├── src/
│   ├── dashboard.service.ts      # Core monitoring service
│   ├── dashboard.controller.ts   # REST API endpoints
│   └── monitoring.module.ts      # NestJS module configuration
└── frontend/
    └── MonitoringDashboard.tsx   # React dashboard component
```

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_COLLECTION_INTERVAL=60000
ALERT_CHECK_INTERVAL=30000
HEALTH_CHECK_INTERVAL=300000
```

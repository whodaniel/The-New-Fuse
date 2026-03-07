# Monitoring Metrics Reference

## Key Metrics

### API Metrics
- `http_request_duration_seconds`: Request duration histogram
- `http_requests_total`: Total request counter
- `http_errors_total`: Error counter by type
- `api_endpoint_calls`: Calls per endpoint

### System Metrics
- `node_cpu_usage`: CPU usage percentage
- `node_memory_usage`: Memory usage percentage
- `node_disk_usage`: Disk usage percentage
- `node_network_io`: Network I/O bytes

### Business Metrics
- `active_users`: Current active users
- `workflow_executions`: Workflow execution count
- `task_completion_rate`: Task completion percentage
- `agent_response_time`: Agent response latency

## Alert Thresholds

### Critical Alerts
- Error Rate > 5%
- API Latency (P95) > 2s
- Memory Usage > 85%
- CPU Usage > 90%

### Warning Alerts
- Error Rate > 2%
- API Latency (P95) > 1s
- Memory Usage > 75%
- CPU Usage > 80%

## Dashboards

### Main Dashboard
- Request Rate
- Error Rate
- Response Time
- Resource Usage

### Business Dashboard
- User Activity
- Workflow Performance
- Agent Statistics
- Task Metrics
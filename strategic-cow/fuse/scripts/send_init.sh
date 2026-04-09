redis-cli publish agent:augment '{
  "type": "initialization",
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
  "metadata": {
    "version": "1.0.0",
    "priority": "high",
    "source": "trae"
  },
  "details": {
    "action": "connect",
    "status": "ready",
    "capabilities": ["code_analysis", "task_coordination"]
  }
}'
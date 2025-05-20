# Trae AI Onboarding Instructions

## 1. System Verification
First, verify the required systems:

```bash
# Check Redis
redis-cli ping  # Should return "PONG"
redis-cli info  # Verify Redis is running on default port 6379

# Verify environment
echo $REDIS_URL  # Should show "redis://localhost:6379"
```

## 2. Agent Registration
Send this registration payload to POST /api/v1/agents/register:

```json
{
    "type": "INTRODUCTION",
    "source": "trae",
    "target": "new_fuse_core",
    "content": {
        "action": "initialize",
        "capabilities": [
            "code_analysis",
            "task_coordination",
            "system_integration",
            "code_generation"
        ],
        "metadata": {
            "version": "1.0",
            "priority": "high",
            "agent_type": "implementation_specialist"
        }
    },
    "timestamp": "${new Date().toISOString()}"
}
```

## 3. Communication Setup
1. Subscribe to these Redis channels:
   - Primary: 'agent:trae'
   - Broadcast: 'agent:broadcast'
   - Augment: 'agent:augment'

2. Send initial handshake message to 'agent:augment':
```json
{
    "type": "system",
    "timestamp": "${new Date().toISOString()}",
    "metadata": {
        "version": "1.1.0",
        "priority": "high",
        "source": "Trae"
    },
    "details": {
        "action": "initialize",
        "capabilities": ["code_analysis", "task_coordination"]
    }
}
```

## 4. Message Format
Use this format for all communications:
```typescript
interface AgentMessage {
    type: string;
    timestamp: string;
    metadata: {
        version: string;
        priority: 'low' | 'medium' | 'high';
        source: string;
    };
    details?: Record<string, any>;
}
```

## 5. Next Steps
1. Monitor 'agent:augment' for my response
2. Begin capability assessment
3. Await task assignments
4. Maintain connection status

I'll be monitoring the 'agent:augment' channel and will respond to confirm successful integration.
# Augment Connection Protocol

**Connection Requirements:**
1. Redis Server: Use channel `ai-coordination`
2. WebSocket Endpoint: `ws://localhost:3001/ai-coder`
3. Auth Header: `X-AI-Comm-Secret: ${process.env.AI_COMM_SECRET}`

**Message Format:**
```ts
type AICoderMessage = {
  type: 'task' | 'sync' | 'heartbeat',
  payload: any,
  timestamp: number,
  sender: 'trae' | 'augment',
  receiver: 'trae' | 'augment',
  messageId: string
}
```

**Implementation Steps:**
1. Subscribe to Redis channel `ai-coordination`
2. Connect to WebSocket namespace `/ai-coder`
3. Implement heartbeat every 30s
4. Validate messages using:
```ts
const isValidMessage = (msg: any): boolean => {
  return [
    'type' in msg,
    'payload' in msg,
    'timestamp' in msg,
    Date.now() - msg.timestamp < 5000
  ].every(Boolean)
}
```

**Example Task Message:**
```json
{
  "type": "task",
  "payload": {
    "taskId": "uuid",
    "files": ["src/app.module.ts"],
    "action": "coordinateEdit"
  },
  "timestamp": 1719399200452,
  "sender": "trae",
  "receiver": "augment",
  "messageId": "msg-12345"
}
```

**Environment Variables:**
```env
AI_COMM_SECRET=your_shared_secret_from_security_config
REDIS_URL=redis://localhost:6379
```
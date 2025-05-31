# WebSocket Protocol Documentation

## Connection

WebSocket connections are established at `/api/ws` with required authentication parameters.

## Message Format

All WebSocket messages follow this general format:

```typescript
interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  messageId: string;
  priority?: number;
}
```

## Message Types

### 1. Room Management

#### Join Room
```json
{
  "type": "joinRoom",
  "payload": {
    "roomId": "string"
  }
}
```

#### Leave Room
```json
{
  "type": "leaveRoom",
  "payload": {
    "roomId": "string"
  }
}
```

### 2. Chat Messages

#### Send Message
```json
{
  "type": "message",
  "payload": {
    "roomId": "string",
    "content": "string",
    "metadata": {
      "type": "text|file|system",
      "fileUrl?: "string",
      "fileName?": "string"
    }
  }
}
```

#### Message Received
```json
{
  "type": "messageReceived",
  "payload": {
    "messageId": "string",
    "roomId": "string",
    "senderId": "string",
    "timestamp": "number"
  }
}
```

### 3. Task Updates

#### Task Status Update
```json
{
  "type": "taskUpdate",
  "payload": {
    "taskId": "string",
    "status": "string",
    "progress": "number",
    "metadata": "object"
  }
}
```

#### Task Assignment
```json
{
  "type": "taskAssign",
  "payload": {
    "taskId": "string",
    "assigneeId": "string",
    "priority": "number"
  }
}
```

### 4. System Messages

#### Error Message
```json
{
  "type": "error",
  "payload": {
    "code": "string",
    "message": "string",
    "details": "object"
  }
}
```

#### Health Update
```json
{
  "type": "healthUpdate",
  "payload": {
    "status": "string",
    "metrics": "object"
  }
}
```

## Message Priority Levels

Messages can include a priority field:
- 0: System Critical
- 1: High Priority
- 2: Normal Priority (default)
- 3: Low Priority
- 4: Background Task

## Error Handling

### Reconnection Strategy
The client should implement exponential backoff when attempting to reconnect:
1. Initial delay: 1000ms
2. Maximum delay: 30000ms
3. Multiplier: 1.5

### Error Codes
- 1000: Normal closure
- 1001: Going away
- 1002: Protocol error
- 1003: Unsupported data
- 4000: Invalid authentication
- 4001: Rate limit exceeded
- 4002: Invalid message format
- 4003: Room not found
- 4004: Permission denied

## Client Implementation Example

```typescript
class WebSocketClient {
  private ws: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor(private url: string, private token: string) {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(`${this.url}?token=${this.token}`);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.ws.onmessage = this.handleMessage;
    this.ws.onclose = this.handleClose;
    this.ws.onerror = this.handleError;
  }

  private handleMessage(event: MessageEvent) {
    const message = JSON.parse(event.data);
    // Handle different message types
  }

  private handleClose(event: CloseEvent) {
    if (event.code !== 1000) {
      this.reconnect();
    }
  }

  private async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error('Max reconnection attempts reached');
    }

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));
    this.reconnectAttempts++;
    this.connect();
  }
}
```

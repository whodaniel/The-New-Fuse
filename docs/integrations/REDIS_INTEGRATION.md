# The New Fuse - Redis Integration Guide

This document provides a comprehensive guide for integrating Redis with The New Fuse VSCode extension.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [Storage Interface](#storage-interface)
6. [Message Bus](#message-bus)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)
9. [Examples](#examples)

## Overview

Redis integration in The New Fuse provides two main functionalities:

1. **Persistent Storage**: Redis is used as a persistent storage backend for shared context, tasks, and other data
2. **Message Bus**: Redis pub/sub is used as a message bus for real-time communication between agents

These functionalities enable The New Fuse to scale beyond a single VS Code instance and provide reliable persistence for important data.

## Setup

### Prerequisites

- Redis server (version 5.0 or higher)
- Node.js (version 14 or higher)
- The New Fuse VSCode extension

### Installing Redis

#### On macOS (using Homebrew)

```bash
brew install redis
brew services start redis
```

#### On Ubuntu/Debian

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
```

#### On Windows

1. Download the Redis Windows installer from [https://github.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases)
2. Run the installer and follow the instructions
3. Start the Redis server using the Redis Windows Service or by running `redis-server.exe`

#### Using Docker

```bash
docker run --name redis -p 6379:6379 -d redis
```

### Verifying Installation

To verify that Redis is running correctly, use the Redis CLI:

```bash
redis-cli ping
```

You should receive a response of `PONG`.

## Configuration

The New Fuse can be configured to use Redis through the VS Code settings or programmatically.

### VS Code Settings

Add the following to your VS Code `settings.json`:

```json
{
    "thefuse.redis.enabled": true,
    "thefuse.redis.host": "localhost",
    "thefuse.redis.port": 6379,
    "thefuse.redis.password": "",
    "thefuse.redis.db": 0,
    "thefuse.redis.keyPrefix": "thefuse:",
    "thefuse.redis.useTLS": false
}
```

### Programmatic Configuration

```typescript
import { RedisStorage } from './redis';

// Create Redis storage
const redisStorage = new RedisStorage({
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    keyPrefix: 'thefuse:',
    useTLS: false,
    enabled: true
});

// Connect to Redis
await redisStorage.connect();
```

## Usage

### Basic Usage

```typescript
import { RedisStorage } from './redis';

// Create Redis storage
const redisStorage = new RedisStorage({
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    keyPrefix: 'thefuse:',
    useTLS: false,
    enabled: true
});

// Connect to Redis
await redisStorage.connect();

// Store a value
await redisStorage.set('test-key', 'test-value');

// Retrieve a value
const value = await redisStorage.get('test-key');
console.log('Value:', value);

// Store a complex object
const obj = {
    name: 'Test Object',
    properties: {
        a: 1,
        b: 'string',
        c: true
    },
    array: [1, 2, 3]
};

await redisStorage.set('test-object', obj);

// Retrieve the object
const retrievedObj = await redisStorage.get('test-object');
console.log('Object:', retrievedObj);

// Delete a key
await redisStorage.delete('test-key');

// Find keys by pattern
const keys = await redisStorage.keys('test-*');
console.log('Keys:', keys);

// Disconnect when done
await redisStorage.disconnect();
```

### Using with Shared Context

```typescript
import { SharedContext } from './collaboration/shared-context';
import { RedisStorage } from './redis';

// Create Redis storage
const redisStorage = new RedisStorage({
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    keyPrefix: 'thefuse:',
    useTLS: false,
    enabled: true
});

// Connect to Redis
await redisStorage.connect();

// Create shared context with Redis
const sharedContext = new SharedContext(context, redisStorage);

// Store a value in shared context
await sharedContext.set('context-key', 'context-value');

// Retrieve the value
const value = await sharedContext.get('context-key');
console.log('Value:', value);
```

### Using as a Message Bus

```typescript
import { RedisStorage } from './redis';

// Create Redis storage
const redisStorage = new RedisStorage({
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    keyPrefix: 'thefuse:',
    useTLS: false,
    enabled: true
});

// Connect to Redis
await redisStorage.connect();

// Subscribe to a channel
await redisStorage.subscribe('test-channel', (message) => {
    console.log('Received message:', message);
});

// Publish a message
await redisStorage.publish('test-channel', {
    type: 'test',
    data: 'Hello, Redis!'
});

// Unsubscribe when done
await redisStorage.unsubscribe('test-channel');
```

## Storage Interface

The Redis storage interface provides methods for storing, retrieving, and managing data in Redis.

### API Reference

#### `RedisStorage`

```typescript
class RedisStorage {
    /**
     * Constructor
     * @param config Redis configuration
     */
    constructor(config: RedisConfig);

    /**
     * Connect to Redis
     * @returns Promise that resolves when connected
     */
    connect(): Promise<void>;

    /**
     * Disconnect from Redis
     * @returns Promise that resolves when disconnected
     */
    disconnect(): Promise<void>;

    /**
     * Check if connected to Redis
     * @returns True if connected
     */
    isConnected(): boolean;

    /**
     * Get a value from Redis
     * @param key Key to get
     * @returns Value or null if not found
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Set a value in Redis
     * @param key Key to set
     * @param value Value to set
     * @param ttl Time to live in milliseconds (optional)
     * @returns Promise that resolves when set
     */
    set<T>(key: string, value: T, ttl?: number): Promise<void>;

    /**
     * Delete a key from Redis
     * @param key Key to delete
     * @returns Promise that resolves when deleted
     */
    delete(key: string): Promise<void>;

    /**
     * Find keys by pattern
     * @param pattern Pattern to match
     * @returns Array of matching keys
     */
    keys(pattern: string): Promise<string[]>;

    /**
     * Publish a message to a channel
     * @param channel Channel to publish to
     * @param message Message to publish
     * @returns Promise that resolves when published
     */
    publish(channel: string, message: any): Promise<void>;

    /**
     * Subscribe to a channel
     * @param channel Channel to subscribe to
     * @param callback Callback to call when a message is received
     * @returns Promise that resolves when subscribed
     */
    subscribe(channel: string, callback: (message: any) => void): Promise<void>;

    /**
     * Unsubscribe from a channel
     * @param channel Channel to unsubscribe from
     * @returns Promise that resolves when unsubscribed
     */
    unsubscribe(channel: string): Promise<void>;
}
```

#### `RedisConfig`

```typescript
interface RedisConfig {
    /**
     * Redis host
     */
    host: string;

    /**
     * Redis port
     */
    port: number;

    /**
     * Redis password
     */
    password: string;

    /**
     * Redis database
     */
    db: number;

    /**
     * Key prefix
     */
    keyPrefix: string;

    /**
     * Whether to use TLS
     */
    useTLS: boolean;

    /**
     * Whether Redis is enabled
     */
    enabled: boolean;
}
```

## Message Bus

The Redis message bus provides a pub/sub mechanism for real-time communication between agents.

### Publishing Messages

```typescript
// Publish a message
await redisStorage.publish('channel-name', {
    type: 'message-type',
    data: {
        // Message data
    }
});
```

### Subscribing to Messages

```typescript
// Subscribe to a channel
await redisStorage.subscribe('channel-name', (message) => {
    console.log('Received message:', message);
    
    // Handle the message
    if (message.type === 'message-type') {
        handleMessage(message.data);
    }
});
```

### Unsubscribing from Messages

```typescript
// Unsubscribe from a channel
await redisStorage.unsubscribe('channel-name');
```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to Redis:

1. **Check Redis Server**: Make sure the Redis server is running
   ```bash
   redis-cli ping
   ```

2. **Check Configuration**: Verify that the host, port, and password are correct

3. **Check Network**: Make sure there are no network issues or firewalls blocking the connection

4. **Check Authentication**: If Redis requires authentication, make sure the password is correct

5. **Check TLS**: If using TLS, make sure the TLS configuration is correct

### Data Issues

If you're having trouble with data:

1. **Check Key Prefix**: Make sure the key prefix is consistent across all instances

2. **Check Serialization**: Make sure complex objects are properly serialized and deserialized

3. **Check TTL**: If data is disappearing, check if TTL is set correctly

4. **Check Redis Memory**: Make sure Redis has enough memory and is not evicting keys

### Message Bus Issues

If you're having trouble with the message bus:

1. **Check Subscription**: Make sure you're subscribed to the correct channel

2. **Check Message Format**: Make sure the message format is consistent

3. **Check Redis Pub/Sub**: Make sure Redis pub/sub is working correctly
   ```bash
   redis-cli
   > SUBSCRIBE test
   > PUBLISH test "Hello"
   ```

## Best Practices

### Performance

1. **Use Key Prefixes**: Use key prefixes to organize data and avoid conflicts
2. **Batch Operations**: Batch operations when possible to reduce network overhead
3. **Use TTL**: Set TTL for temporary data to avoid memory leaks
4. **Use Pipelining**: Use pipelining for multiple operations to reduce network overhead
5. **Monitor Memory**: Monitor Redis memory usage to avoid out-of-memory errors

### Reliability

1. **Use Reconnection**: Implement reconnection logic for Redis connections
2. **Handle Errors**: Handle Redis errors gracefully
3. **Use Fallbacks**: Implement fallbacks for when Redis is unavailable
4. **Monitor Redis**: Monitor Redis health and performance
5. **Backup Data**: Regularly backup Redis data

### Security

1. **Use Authentication**: Always use authentication for Redis
2. **Use TLS**: Use TLS for Redis connections in production
3. **Restrict Access**: Restrict Redis access to trusted clients
4. **Sanitize Data**: Sanitize data before storing in Redis
5. **Encrypt Sensitive Data**: Encrypt sensitive data before storing in Redis

## Examples

### Example 1: Persistent Shared Context

This example demonstrates how to use Redis for persistent shared context:

```typescript
import { SharedContext } from './collaboration/shared-context';
import { RedisStorage } from './redis';

// Create Redis storage
const redisStorage = new RedisStorage({
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    keyPrefix: 'thefuse:',
    useTLS: false,
    enabled: true
});

// Connect to Redis
await redisStorage.connect();

// Create shared context with Redis
const sharedContext = new SharedContext(context, redisStorage);

// Store user preferences
await sharedContext.set('user.preferences', {
    theme: 'dark',
    fontSize: 14,
    lineHeight: 1.5
}, {
    metadata: {
        agentId: 'user-agent',
        tags: ['preferences', 'ui']
    }
});

// Store project settings
await sharedContext.set('project.settings', {
    name: 'My Project',
    language: 'typescript',
    framework: 'react'
}, {
    metadata: {
        agentId: 'project-agent',
        tags: ['project', 'settings']
    }
});

// Query context
const preferences = await sharedContext.query({
    prefix: 'user.',
    tags: ['preferences']
});

console.log('User preferences:', preferences);

// Subscribe to changes
const subscription = sharedContext.subscribe('user.*', (entry, changeType) => {
    console.log(`User preferences changed (${changeType}):`, entry.value);
});

// Update preferences
await sharedContext.set('user.preferences', {
    theme: 'light',
    fontSize: 14,
    lineHeight: 1.5
}, {
    metadata: {
        agentId: 'user-agent',
        tags: ['preferences', 'ui']
    }
});

// Unsubscribe when done
subscription.dispose();
```

### Example 2: Real-time Agent Communication

This example demonstrates how to use Redis for real-time agent communication:

```typescript
import { RedisStorage } from './redis';
import { v4 as uuidv4 } from 'uuid';

// Create Redis storage
const redisStorage = new RedisStorage({
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    keyPrefix: 'thefuse:',
    useTLS: false,
    enabled: true
});

// Connect to Redis
await redisStorage.connect();

// Agent information
const agentId = 'agent-1';
const agentName = 'Agent 1';

// Subscribe to agent channel
await redisStorage.subscribe(`agent.${agentId}`, (message) => {
    console.log(`Received message for ${agentName}:`, message);
    
    // Handle the message
    handleAgentMessage(message);
});

// Subscribe to broadcast channel
await redisStorage.subscribe('agent.broadcast', (message) => {
    console.log(`Received broadcast message:`, message);
    
    // Handle the broadcast message
    handleBroadcastMessage(message);
});

// Send a message to another agent
function sendMessageToAgent(recipientId: string, action: string, payload: any) {
    const message = {
        id: uuidv4(),
        sender: agentId,
        senderName: agentName,
        recipient: recipientId,
        action,
        payload,
        timestamp: Date.now()
    };
    
    redisStorage.publish(`agent.${recipientId}`, message);
}

// Send a broadcast message
function sendBroadcastMessage(action: string, payload: any) {
    const message = {
        id: uuidv4(),
        sender: agentId,
        senderName: agentName,
        recipient: 'broadcast',
        action,
        payload,
        timestamp: Date.now()
    };
    
    redisStorage.publish('agent.broadcast', message);
}

// Example: Send a message to another agent
sendMessageToAgent('agent-2', 'greeting', {
    text: 'Hello, Agent 2!'
});

// Example: Send a broadcast message
sendBroadcastMessage('announcement', {
    text: 'Attention all agents!'
});

// Unsubscribe when done
await redisStorage.unsubscribe(`agent.${agentId}`);
await redisStorage.unsubscribe('agent.broadcast');
```

### Example 3: Task Persistence

This example demonstrates how to use Redis for task persistence:

```typescript
import { RedisStorage } from './redis';
import { TaskCoordinationManager } from './collaboration/task-coordination';
import { SharedContext } from './collaboration/shared-context';
import { AgentNegotiationManager } from './collaboration/agent-negotiation';
import { AgentCommunicationManager } from './agent-communication';

// Create Redis storage
const redisStorage = new RedisStorage({
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    keyPrefix: 'thefuse:',
    useTLS: false,
    enabled: true
});

// Connect to Redis
await redisStorage.connect();

// Create shared context with Redis
const sharedContext = new SharedContext(context, redisStorage);

// Create other managers
const negotiationManager = new AgentNegotiationManager(context, sharedContext, communicationManager);
const communicationManager = new AgentCommunicationManager();

// Create task manager
const taskManager = new TaskCoordinationManager(
    context,
    sharedContext,
    negotiationManager,
    communicationManager
);

// Create a task
const task = await taskManager.createTask({
    type: 'code-generation',
    name: 'Generate Factorial Function',
    description: 'Create a function to calculate factorial of a number',
    priority: 'medium',
    context: {
        language: 'typescript',
        requirements: 'Must handle negative numbers and use recursion'
    }
});

console.log('Created task:', task);

// The task will be stored in Redis and can be retrieved even if VS Code is restarted

// Retrieve the task later
const retrievedTask = taskManager.getTask(task.id);
console.log('Retrieved task:', retrievedTask);

// Get task updates
const updates = taskManager.getTaskUpdates(task.id);
console.log('Task updates:', updates);

// Filter tasks
const highPriorityTasks = taskManager.getTasks({
    priority: 'high',
    status: ['pending', 'assigned', 'in-progress']
});

console.log('High priority tasks:', highPriorityTasks);
```

These examples demonstrate how to use Redis integration in The New Fuse for persistent storage and real-time communication.

### Example 4: Redis Channel Monitoring Script

This example demonstrates how to use the `redisChannelMonitor.ts` script to monitor messages on a specific Redis channel. This script is useful for debugging and observing real-time communication between agents or services utilizing Redis Pub/Sub.

The script is located at `src/scripts/redisChannelMonitor.ts`.

**Purpose:**

- Connects to a Redis instance (configurable via environment variables `REDIS_HOST` and `REDIS_PORT`).
- Subscribes to a predefined channel (default: `AI_INTER_LLM_CHANNEL`).
- Sends an initial invitation message to the channel upon successful connection and subscription.
- Logs any messages received on the subscribed channel to the console, along with a timestamp.
- Handles graceful shutdown on `SIGINT` and `SIGTERM` signals.

**Running the Script:**

1.  Ensure you have Node.js and `ts-node` installed, or compile the TypeScript script to JavaScript.
2.  Navigate to the root directory of the project.
3.  Execute the script using `ts-node` (or `node` if compiled):

    ```bash
    # Using ts-node
    npx ts-node src/scripts/redisChannelMonitor.ts

    # Or, if you have ts-node installed globally
    # ts-node src/scripts/redisChannelMonitor.ts
    ```

4.  You can also set `REDIS_HOST` and `REDIS_PORT` environment variables if your Redis server is not running on `localhost:6379`.

    ```bash
    REDIS_HOST=your-redis-host REDIS_PORT=your-redis-port npx ts-node src/scripts/redisChannelMonitor.ts
    ```

**Expected Output:**

Upon starting, the script will attempt to connect to Redis and subscribe to the channel. You should see output similar to this:

```
Attempting to connect to Redis at localhost:6379
Publisher connected to Redis.
Subscriber connected to Redis.
Subscribed to channel: AI_INTER_LLM_CHANNEL
Invitation message sent to AI_INTER_LLM_CHANNEL: {
  sender: 'AI_CODER_1 (Trae)',
  type: 'INVITATION',
  timestamp: '2023-10-27T10:00:00.000Z',
  content: 'Hello, AI Coder 2! I am on the Redis channel. Please join me for collaboration.',
  channel: 'AI_INTER_LLM_CHANNEL'
}

--- Monitoring AI_INTER_LLM_CHANNEL for messages ---
```

As messages are published to the `AI_INTER_LLM_CHANNEL` by other services or agents, they will be logged to the console:

```
[2023-10-27T10:05:00.123Z] Received message on AI_INTER_LLM_CHANNEL: { /* parsed message object */ }
[2023-10-27T10:05:02.456Z] Received raw message on AI_INTER_LLM_CHANNEL: This is a raw string message
```

This script provides a simple way to observe the flow of messages through your Redis-based messaging system.

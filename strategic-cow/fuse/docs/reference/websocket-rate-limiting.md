# WebSocket Rate Limiting in The New Fuse

The New Fuse includes rate limiting for WebSocket connections to prevent abuse and ensure fair resource allocation among clients.

## Overview

Rate limiting restricts the number of messages a client can send within a specific time window. This helps prevent:

- Denial of service attacks
- Resource exhaustion
- Unfair monopolization of server resources
- Accidental infinite loops in client code

## Configuration

WebSocket rate limiting can be configured through VS Code settings:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "The New Fuse"
3. Find the WebSocket rate limiting settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `thefuse.enableWebSocketRateLimit` | Enable rate limiting for WebSocket connections | `true` |
| `thefuse.webSocketRateLimitMaxMessages` | Maximum number of messages allowed in the time window | `100` |
| `thefuse.webSocketRateLimitWindowMs` | Time window in milliseconds | `60000` (1 minute) |
| `thefuse.webSocketRateLimitEmitWarnings` | Emit warnings when approaching the limit | `true` |
| `thefuse.webSocketRateLimitWarningThreshold` | Percentage of the limit at which to emit warnings (0.0-1.0) | `0.8` (80%) |

## Commands

The New Fuse provides commands to manage WebSocket rate limiting:

- **Toggle WebSocket Rate Limiting**: Enable or disable WebSocket rate limiting (Command Palette: `The New Fuse: Toggle WebSocket Rate Limiting`)
- **Show Connected Chrome Extension Clients**: View connected clients and rate limit status (Command Palette: `The New Fuse: Show Connected Chrome Extension Clients`)

## Client Experience

When rate limiting is enabled:

1. **Welcome Message**: Clients receive rate limit information in the welcome message
2. **Warning Messages**: Clients receive warnings when approaching the rate limit
3. **Error Messages**: Clients receive error messages when the rate limit is exceeded
4. **Reset Time**: Error messages include the time until the rate limit resets

## Implementation Details

The rate limiting system:

1. Tracks message timestamps for each client
2. Removes timestamps outside the current time window
3. Checks if the client has exceeded the rate limit
4. Sends warnings when approaching the limit
5. Blocks messages when the limit is exceeded
6. Provides reset time information to clients

## Chrome Extension Support

The Chrome extension automatically detects if the VS Code extension has rate limiting enabled and will:

1. Display rate limit information in the status panel
2. Show warnings when approaching the rate limit
3. Handle rate limit errors gracefully
4. Implement exponential backoff when rate limited

## Troubleshooting

If you experience issues with WebSocket rate limiting:

1. Check the VS Code output panel (View > Output > The New Fuse) for rate limiting logs
2. Adjust the rate limit settings to match your usage patterns
3. Disable rate limiting temporarily for debugging
4. Restart the WebSocket server after changing rate limit settings (Command Palette: `The New Fuse: Restart Chrome WebSocket Server`)

## Best Practices

To avoid rate limiting issues:

1. Batch messages when possible instead of sending many small messages
2. Implement client-side throttling for high-frequency events
3. Use debouncing for user input events
4. Handle rate limit errors gracefully with exponential backoff
5. Monitor rate limit status in the client UI

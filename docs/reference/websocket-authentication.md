# WebSocket Authentication in The New Fuse

The New Fuse includes enhanced authentication for WebSocket connections to improve security and manage client access.

## Overview

The authentication system provides:

- Token-based authentication for WebSocket connections
- Token expiration and refresh mechanism
- Configurable security settings
- Client-specific authentication tracking

## Configuration

WebSocket authentication can be configured through VS Code settings:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "The New Fuse"
3. Find the WebSocket authentication settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `thefuse.enableWebSocketAuth` | Enable authentication for WebSocket connections | `true` |
| `thefuse.requireWebSocketAuth` | Require authentication for WebSocket connections | `true` |
| `thefuse.authTokenExpirationMs` | Token expiration time in milliseconds | `3600000` (1 hour) |
| `thefuse.authRefreshTokenExpirationMs` | Refresh token expiration time in milliseconds | `86400000` (24 hours) |
| `thefuse.authSecretKey` | Secret key for token signing | Auto-generated |

## Commands

The New Fuse provides commands to manage WebSocket authentication:

- **Toggle WebSocket Authentication**: Enable or disable WebSocket authentication (Command Palette: `The New Fuse: Toggle WebSocket Authentication`)
- **Show Connected Chrome Extension Clients**: View connected clients and authentication status (Command Palette: `The New Fuse: Show Connected Chrome Extension Clients`)

## Authentication Flow

1. **Initial Connection**: Client connects to the WebSocket server
2. **Authentication Request**: Client sends an `AUTH` message
   - If no token is provided, a new token is generated (if authentication is not required)
   - If a token is provided, it is validated
3. **Token Response**: Server sends an `AUTH_RESPONSE` message with:
   - Access token
   - Refresh token
   - Token expiration time
4. **Token Refresh**: When the token is about to expire, the client sends an `AUTH` message with the refresh token
5. **Token Revocation**: Tokens are automatically revoked when:
   - The client disconnects
   - The server restarts
   - The token expires

## Chrome Extension Integration

The Chrome extension automatically handles authentication with the VS Code extension:

1. Stores tokens securely in Chrome's local storage
2. Automatically refreshes tokens before they expire
3. Handles authentication errors and reconnection
4. Displays authentication status in the options page

## Security Considerations

- Tokens are signed using a secret key to prevent tampering
- Tokens include client-specific information to prevent token reuse
- Tokens have a limited lifetime to reduce the impact of token theft
- Refresh tokens allow for long-lived sessions without compromising security
- All authentication operations are logged for audit purposes

## Troubleshooting

If you experience issues with WebSocket authentication:

1. Check the VS Code output panel (View > Output > The New Fuse) for authentication logs
2. Verify that the Chrome extension has a valid token
3. Try clearing the Chrome extension's stored tokens and reconnecting
4. Restart the WebSocket server after changing authentication settings (Command Palette: `The New Fuse: Restart Chrome WebSocket Server`)

## Implementation Details

The authentication system uses:

- HMAC-SHA256 for token signing
- Cryptographically secure random token generation
- Automatic token cleanup to prevent memory leaks
- Separate storage for access tokens and refresh tokens

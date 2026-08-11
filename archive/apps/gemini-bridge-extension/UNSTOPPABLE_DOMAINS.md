# Unstoppable Domains Authentication

The New Fuse Chrome Extension now supports authentication using Unstoppable
Domains, allowing users to sign in with their Web3 domains.

## Overview

**Login with Unstoppable** enables owners of Unstoppable Domains to:

- Authenticate without passwords using their blockchain-based domains
- Share profile information and verified wallet addresses
- Access multi-chain verified accounts (Ethereum, Polygon, Solana, etc.)
- Leverage decentralized identity across Web3 applications

## Supported Domain Extensions

Users can authenticate with any Unstoppable Domain, including:

- `.crypto`
- `.nft`
- `.blockchain`
- `.bitcoin`
- `.dao`
- `.wallet`
- `.x`
- `.888`
- `.zil`
- And many more...

## Setup Instructions

### 1. Register Your Application

1. Go to
   [Unstoppable Domains Dashboard](https://dashboard.unstoppabledomains.com)
2. Sign in with your Unstoppable Domain
3. Create a new application
4. Configure your application:
   - **Name**: The New Fuse Extension
   - **Redirect URI**: Get this from extension options (automatically generated)
   - **Environment**: Production

### 2. Get Your Credentials

After creating the application, you'll receive:

- **Client ID**: A unique identifier for your application
- **Client Secret** (optional): For server-side implementations

### 3. Configure the Extension

1. Open the extension options page (right-click extension icon → Options)
2. Scroll to "Unstoppable Domains Authentication"
3. Enter your **Client ID**
4. (Optional) Enter your **Client Secret**
5. Verify the **Redirect URI** matches your dashboard configuration
6. Customize the **Scope** if needed (default is recommended)
7. Click "Save Settings"

### 4. Test Authentication

1. Open the extension popup or navigate to a page with the login component
2. Click "Login with Unstoppable"
3. A popup window will open to Unstoppable Domains
4. Select your domain and approve the connection
5. You'll be redirected back to the extension, now authenticated

## Configuration Options

### Scope

The scope defines what information the extension can access:

```typescript
{
  scope: 'openid wallet email:optional humanity_check:optional';
}
```

**Available Scopes:**

- `openid` (required): Basic OpenID Connect authentication
- `wallet`: Access to primary wallet address
- `email:optional`: User's email address (if provided)
- `humanity_check:optional`: Humanity verification status
- `profile:optional`: Extended profile information

### Redirect URI

The redirect URI is automatically generated based on your extension ID:

```
chrome-extension://<extension-id>/popup.html
```

This URI must be added to your Unstoppable Domains dashboard exactly as shown.

## Authentication Flows

### Popup Flow (Recommended)

The popup flow provides a smoother user experience:

```typescript
import { unstoppableAuth } from './auth/unstoppable-domains-auth';

// Login
try {
  const user = await unstoppableAuth.loginWithPopup();
  console.log('Logged in as:', user.sub);
  console.log('Wallet:', user.wallet_address);
} catch (error) {
  console.error('Login failed:', error);
}
```

### Redirect Flow

For full-page authentication:

```typescript
// Initiate login (redirects user)
await unstoppableAuth.login();

// Handle callback (after redirect)
try {
  const user = await unstoppableAuth.loginCallback();
  console.log('Logged in as:', user.sub);
} catch (error) {
  console.error('Login callback failed:', error);
}
```

## User Information

### Available User Data

After successful authentication, you can access:

```typescript
const user = unstoppableAuth.getUser();

// Basic information
console.log(user.sub); // Domain name (e.g., "alice.crypto")
console.log(user.wallet_address); // Primary wallet address
console.log(user.wallet_type_hint); // Wallet type

// Optional profile (if requested in scope)
console.log(user.name); // Display name
console.log(user.email); // Email address
console.log(user.email_verified); // Email verification status
console.log(user.picture); // Profile picture URL

// Humanity check
console.log(user.humanity_check); // Verification status
console.log(user.humanity_check_id); // Verification ID

// EIP-4361 signature (for additional verification)
console.log(user.eip4361_message);
console.log(user.eip4361_signature);
```

### Verified Addresses

Access verified multi-chain addresses:

```typescript
const verifiedAddresses = await unstoppableAuth.getVerifiedAccounts();

verifiedAddresses.forEach((addr) => {
  console.log(`${addr.symbol}: ${addr.address}`);
  // ETH: 0x...
  // MATIC: 0x...
  // SOL: ...
});
```

## API Reference

### UnstoppableDomainsAuth

#### Configuration

```typescript
await unstoppableAuth.configure({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret', // Optional
  redirectUri: chrome.runtime.getURL('popup.html'),
  scope: 'openid wallet email:optional',
  responseMode: 'query', // or 'fragment'
});
```

#### Authentication Methods

**loginWithPopup()**

```typescript
async loginWithPopup(): Promise<UnstoppableUser>
```

Opens a popup window for authentication. Returns user information on success.

**login()**

```typescript
async login(): Promise<void>
```

Initiates redirect-based authentication flow.

**loginCallback()**

```typescript
async loginCallback(): Promise<UnstoppableUser>
```

Handles the callback after redirect. Must be called on the redirect page.

**logout()**

```typescript
async logout(): Promise<void>
```

Logs out the user and clears the session.

#### State Management

**isAuthenticated()**

```typescript
isAuthenticated(): boolean
```

Returns `true` if user is authenticated and session is valid.

**getUser()**

```typescript
getUser(): UnstoppableUser | null
```

Returns current user information or `null` if not authenticated.

**getAuthorization()**

```typescript
getAuthorization(): UAuthAuthorization | null
```

Returns authorization tokens and metadata.

**getVerifiedAccounts()**

```typescript
async getVerifiedAccounts(): Promise<VerifiedAddress[]>
```

Returns list of verified blockchain addresses.

## React Component Usage

### Basic Login Component

```tsx
import { UnstoppableLogin } from './popup/UnstoppableLogin';

function App() {
  const handleLoginSuccess = (user) => {
    console.log('User logged in:', user.sub);
    // Handle successful authentication
  };

  const handleLoginError = (error) => {
    console.error('Login failed:', error);
    // Handle authentication error
  };

  const handleLogout = () => {
    console.log('User logged out');
    // Handle logout
  };

  return (
    <UnstoppableLogin
      onLoginSuccess={handleLoginSuccess}
      onLoginError={handleLoginError}
      onLogout={handleLogout}
    />
  );
}
```

### Custom Integration

```tsx
import { useState, useEffect } from 'react';
import { unstoppableAuth } from './auth/unstoppable-domains-auth';

function CustomAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (unstoppableAuth.isAuthenticated()) {
      setUser(unstoppableAuth.getUser());
    }
  }, []);

  const handleLogin = async () => {
    try {
      const userData = await unstoppableAuth.loginWithPopup();
      setUser(userData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await unstoppableAuth.logout();
    setUser(null);
  };

  if (user) {
    return (
      <div>
        <h1>Welcome, {user.sub}!</h1>
        <p>Wallet: {user.wallet_address}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return <button onClick={handleLogin}>Login with Unstoppable</button>;
}
```

## Security Considerations

### State & Nonce Verification

The authentication service automatically handles:

- **State parameter**: Prevents CSRF attacks
- **Nonce**: Ensures token freshness and prevents replay attacks
- **Token expiration**: Automatic session cleanup

### Secure Token Storage

- Access tokens and user data are stored in `chrome.storage.local`
- Tokens are automatically cleared on expiration
- No sensitive data is stored in sync storage

### Best Practices

1. **Never expose Client Secret** in client-side code
2. **Validate redirect URIs** - ensure they match your dashboard configuration
3. **Use HTTPS** for all production deployments
4. **Implement token refresh** for long-lived sessions
5. **Clear tokens on logout** - always call `logout()` method

## Error Handling

### Common Errors

**Configuration Not Set**

```typescript
Error: UAuth not configured. Call configure() first.
```

Solution: Call `unstoppableAuth.configure()` with valid credentials.

**Popup Blocked**

```typescript
Error: Failed to open popup window
```

Solution: Ensure popup blockers allow chrome-extension:// origins.

**State Mismatch**

```typescript
Error: State mismatch - possible CSRF attack
```

Solution: Clear browser cache and storage, try authentication again.

**Token Request Failed**

```typescript
Error: Token request failed: Unauthorized
```

Solution: Verify Client ID and Secret are correct in dashboard.

### Error Handling Example

```typescript
try {
  const user = await unstoppableAuth.loginWithPopup();
  console.log('Success:', user);
} catch (error) {
  if (error.message.includes('Popup closed')) {
    console.log('User closed the popup');
  } else if (error.message.includes('State mismatch')) {
    console.error('Security error - possible attack');
  } else {
    console.error('Login error:', error);
  }
}
```

## Advanced Features

### Custom Scope Requests

Request specific user information:

```typescript
await unstoppableAuth.configure({
  clientID: 'your-client-id',
  redirectUri: chrome.runtime.getURL('popup.html'),
  scope: [
    'openid',
    'wallet',
    'email:optional',
    'profile:optional',
    'humanity_check:optional',
    'social:optional',
  ].join(' '),
});
```

### Multi-Chain Address Verification

```typescript
const verifiedAddresses = await unstoppableAuth.getVerifiedAccounts();

const ethAddress = verifiedAddresses.find((a) => a.symbol === 'ETH');
const maticAddress = verifiedAddresses.find((a) => a.symbol === 'MATIC');
const solAddress = verifiedAddresses.find((a) => a.symbol === 'SOL');

if (ethAddress) {
  console.log('Ethereum:', ethAddress.address);
  console.log('Signature:', ethAddress.signature);
}
```

### Session Persistence

Sessions are automatically persisted across browser restarts:

```typescript
// On extension startup
if (unstoppableAuth.isAuthenticated()) {
  const user = unstoppableAuth.getUser();
  console.log('Restored session for:', user.sub);
} else {
  console.log('No active session');
}
```

## Integration with Electron App

Since the TNF Chrome Extension is installed by default in the Electron app's
Chromium browser, Unstoppable Domains authentication is automatically available
there too.

### Electron-Specific Considerations

1. **Extension URL**: The redirect URI will use the extension's
   chrome-extension:// URL
2. **Native Integration**: Can be integrated with Electron's native modules
3. **Session Sharing**: Sessions are isolated per Electron window

## Troubleshooting

### Authentication Fails

1. Verify Client ID is correct
2. Check redirect URI matches exactly (including protocol)
3. Ensure scope is valid
4. Clear browser cache and extension storage
5. Check browser console for detailed error messages

### Popup Doesn't Open

1. Disable popup blockers for chrome-extension:// URLs
2. Check browser permissions for the extension
3. Verify `unstoppableAuth.loginWithPopup()` is called from user interaction

### Session Not Persisting

1. Check `chrome.storage.local` permissions in manifest
2. Verify tokens haven't expired
3. Check for errors in background script console

### Verified Addresses Empty

1. User may not have added verified addresses to their domain
2. Ensure `wallet` scope is requested
3. User needs to verify addresses in Unstoppable Domains dashboard

## Resources

- **Official Documentation**:
  [Unstoppable Domains Developer Portal](https://docs.unstoppabledomains.com/)
- **UAuth JS Library**:
  [SDK Documentation](https://docs.unstoppabledomains.com/identity/sdk-and-libraries/uauth-js/)
- **Authentication Protocol**:
  [Login Protocols](https://docs.unstoppabledomains.com/identity/guides/login-protocols/authentication-protocol/)
- **Dashboard**: [Create Application](https://dashboard.unstoppabledomains.com)
- **Get a Domain**: [Unstoppable Domains](https://unstoppabledomains.com)

## Contributing

To enhance the Unstoppable Domains integration:

1. Update
   [unstoppable-domains-auth.ts](apps/chrome-extension/src/auth/unstoppable-domains-auth.ts)
2. Modify
   [UnstoppableLogin.tsx](apps/chrome-extension/src/popup/UnstoppableLogin.tsx)
   for UI changes
3. Update styles in
   [UnstoppableLogin.css](apps/chrome-extension/src/popup/UnstoppableLogin.css)
4. Add configuration options in
   [options/index.tsx](apps/chrome-extension/src/options/index.tsx)
5. Update this documentation

## License

This feature is part of The New Fuse project and follows the same license terms.

---

**Sources:**

- [Authentication Protocol](https://docs.unstoppabledomains.com/identity/guides/login-protocols/authentication-protocol)
- [UAuth JS Library](https://docs.unstoppabledomains.com/identity/sdk-and-libraries/uauth-js/)
- [Unstoppable Domains Developer Portal](https://docs.unstoppabledomains.com/)

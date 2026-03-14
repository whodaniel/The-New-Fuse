# Web3 URL Support

The New Fuse Chrome Extension now supports automatic resolution of decentralized
web (Web3) URLs to their HTTP gateway equivalents.

## Supported Protocols

The extension automatically resolves the following Web3 protocols:

### IPFS (InterPlanetary File System)

- **Protocol:** `ipfs://`
- **Example:** `ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`
- **Resolves to:**
  `https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`

### IPNS (IPFS Name System)

- **Protocol:** `ipns://`
- **Example:** `ipns://ipfs.io`
- **Resolves to:** `https://ipfs.io/ipns/ipfs.io`

### ENS (Ethereum Name Service)

- **Protocol:** `ens://`
- **Example:** `ens://vitalik.eth`
- **Resolves to:** `https://vitalik.eth.limo`
- **Note:** ENS domains must end with `.eth`

### Arweave

- **Protocol:** `ar://`
- **Example:** `ar://[43-character-transaction-id]`
- **Resolves to:** `https://arweave.net/[transaction-id]`

### Swarm

- **Protocol:** `bzz://`
- **Example:** `bzz://[hash]`
- **Resolves to:** `https://gateway.ethswarm.org/bzz/[hash]`

## Features

### Automatic URL Resolution

- **Address Bar:** Type any Web3 URL directly in the browser address bar, and it
  will automatically resolve to the appropriate gateway
- **Programmatic Navigation:** Web3 URLs passed through the extension's browser
  control API are automatically resolved
- **Notifications:** When a Web3 URL is resolved, a notification shows the
  original URL and the resolved gateway URL

### Configurable Gateways

You can customize which gateways to use for different protocols:

1. Open the extension options page (right-click extension icon → Options)
2. Scroll to the "Web3 URL Support" section
3. Configure custom gateways:
   - **IPFS Gateway:** For `ipfs://` and `ipns://` URLs (default:
     `https://ipfs.io`)
   - **Arweave Gateway:** For `ar://` URLs (default: `https://arweave.net`)
   - **Swarm Gateway:** For `bzz://` URLs (default:
     `https://gateway.ethswarm.org`)

### Enable/Disable Web3 Support

Web3 URL resolution can be toggled on or off:

1. Open extension options
2. Toggle "Enable Web3 URL resolution"
3. Save settings

When disabled, Web3 URLs will not be automatically resolved.

## How It Works

### Architecture

```
User enters Web3 URL
        ↓
Web3 Interceptor (background/web3-interceptor.ts)
        ↓
URL Validation & Resolution (utils/web3-url-resolver.ts)
        ↓
HTTP Gateway URL
        ↓
Browser navigates to resolved URL
        ↓
Notification shown to user
```

### Components

1. **Web3 URL Resolver**
   ([utils/web3-url-resolver.ts](apps/chrome-extension/src/utils/web3-url-resolver.ts))
   - Core utility for detecting and resolving Web3 URLs
   - Validates URL format for each protocol
   - Converts Web3 URLs to HTTP gateway URLs

2. **Web3 Interceptor**
   ([background/web3-interceptor.ts](apps/chrome-extension/src/background/web3-interceptor.ts))
   - Singleton service that manages Web3 configuration
   - Loads/saves settings from Chrome storage
   - Shows notifications when URLs are resolved

3. **Background Script Integration**
   ([background/index.ts](apps/chrome-extension/src/background/index.ts))
   - Listens for `webNavigation.onBeforeNavigate` events
   - Intercepts Web3 URLs typed in the address bar
   - Redirects to resolved HTTP URLs

4. **Browser Control Handler**
   ([background/browser-control-handler.ts](apps/chrome-extension/src/background/browser-control-handler.ts))
   - Intercepts Web3 URLs in programmatic navigation
   - Returns Web3 metadata in navigation results

5. **Options UI**
   ([options/index.tsx](apps/chrome-extension/src/options/index.tsx))
   - User interface for configuring Web3 settings
   - Gateway customization
   - Enable/disable toggle

## Usage Examples

### Basic Navigation

```typescript
// User types in address bar:
ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco

// Extension automatically navigates to:
https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
```

### Programmatic Navigation

```typescript
// Through browser control API:
{
  type: 'NAVIGATE',
  payload: {
    url: 'ens://vitalik.eth',
    newTab: true
  }
}

// Returns:
{
  success: true,
  tabId: 123,
  url: 'https://vitalik.eth.limo',
  web3: {
    protocol: 'ens',
    originalUrl: 'ens://vitalik.eth'
  }
}
```

### Custom Gateway Configuration

```typescript
// Store custom configuration
await chrome.storage.sync.set({
  web3Config: {
    ipfsGateway: 'https://cloudflare-ipfs.com',
    arweaveGateway: 'https://arweave.net',
    swarmGateway: 'https://gateway.ethswarm.org',
  },
});
```

## API Reference

### Web3 URL Resolver

```typescript
import {
  resolveWeb3Url,
  isWeb3Url,
  validateWeb3Url,
} from './utils/web3-url-resolver';

// Check if URL is Web3
const isWeb3 = isWeb3Url('ipfs://QmHash');
// Returns: true

// Resolve Web3 URL
const resolved = resolveWeb3Url('ipfs://QmHash');
// Returns: 'https://ipfs.io/ipfs/QmHash'

// Validate Web3 URL
const validation = validateWeb3Url('ens://example.eth');
// Returns: { valid: true }
```

### Web3 Interceptor

```typescript
import { web3Interceptor } from './background/web3-interceptor';

// Intercept and resolve URL
const result = web3Interceptor.interceptUrl('ipfs://QmHash');
// Returns: {
//   url: 'https://ipfs.io/ipfs/QmHash',
//   wasWeb3: true,
//   protocol: 'ipfs',
//   originalUrl: 'ipfs://QmHash'
// }

// Configure gateways
await web3Interceptor.saveConfig({
  ipfsGateway: 'https://cloudflare-ipfs.com',
});

// Enable/disable
await web3Interceptor.setEnabled(false);
```

## Security Considerations

### Gateway Trust

- Web3 URLs are resolved through third-party HTTP gateways
- Users should trust the gateway providers they configure
- Default gateways are well-established, reputable services

### Content Security Policy

The extension's CSP has been updated to allow connections to Web3 gateways:

- `https://ipfs.io`
- `https://*.ipfs.io`
- `https://cloudflare-ipfs.com`
- `https://*.cloudflare-ipfs.com`
- `https://arweave.net`
- `https://gateway.ethswarm.org`
- `https://*.eth.limo`

### URL Validation

- All Web3 URLs are validated before resolution
- Invalid URLs are rejected and logged
- Malformed URLs do not crash the extension

## Electron App Integration

Since the TNF Chrome Extension is installed by default in the Electron app's
Chromium browser, **Web3 support is automatically available in the Electron
app**. No additional configuration is needed.

When users navigate to Web3 URLs in the Electron app:

1. The extension intercepts the URL
2. Resolves it to an HTTP gateway
3. The Electron BrowserView loads the resolved URL

## Troubleshooting

### Web3 URLs not resolving

1. Check that Web3 support is enabled in extension options
2. Verify the gateway URLs are correct and accessible
3. Check browser console for any errors

### Custom gateway not working

1. Ensure the gateway URL is properly formatted (must start with `https://`)
2. Verify the gateway is online and accessible
3. Clear browser cache and reload

### Notifications not showing

1. Check that browser notifications are enabled for the extension
2. Verify extension permissions include `notifications`

## Future Enhancements

Potential future improvements:

- Support for additional Web3 protocols (Handshake, Sia, etc.)
- Local IPFS node integration
- Gateway fallback/redundancy
- Performance optimization (caching resolved URLs)
- Analytics for Web3 usage patterns

## Contributing

To add support for a new Web3 protocol:

1. Update
   [web3-url-resolver.ts](apps/chrome-extension/src/utils/web3-url-resolver.ts):
   - Add protocol to `Web3Protocol` type
   - Add resolution logic
   - Add validation logic

2. Update
   [web3-interceptor.ts](apps/chrome-extension/src/background/web3-interceptor.ts):
   - Add gateway configuration if needed

3. Update [options UI](apps/chrome-extension/src/options/index.tsx):
   - Add gateway configuration field if needed

4. Update [manifest.json](apps/chrome-extension/manifest.json):
   - Add gateway to CSP if needed

5. Update this documentation

## License

This feature is part of The New Fuse project and follows the same license terms.

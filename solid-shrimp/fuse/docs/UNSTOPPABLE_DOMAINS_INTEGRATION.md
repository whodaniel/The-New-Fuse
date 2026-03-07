# Unstoppable Domains Authentication Integration

This document describes the Unstoppable Domains (UD) authentication integration
for The New Fuse platform.

## Overview

Unstoppable Domains provides decentralized identity and authentication using
blockchain-based domains (e.g., `alice.crypto`, `bob.x`). This integration
allows users to register and log in using their Unstoppable Domain instead of
traditional email/password.

## Features

- ✅ **Login with Unstoppable Domains** - Users can authenticate using their UD
  domain
- ✅ **Machine ID Generation** - Automatically mints `usr_...` subdomains for
  new users
- ✅ **Wallet Integration** - Connects user's crypto wallet address
- ✅ **Automatic User Creation** - Creates user accounts automatically on first
  login
- ✅ **Seamless OAuth Flow** - Standard OAuth 2.0 flow with popup authentication
- ✅ **Backend Integration** - Full backend support for UD authentication

## Configuration

### Frontend Configuration

Add the following environment variables to `apps/frontend/.env`:

```bash
# Unstoppable Domains Configuration
VITE_UNSTOPPABLE_DOMAINS_CLIENT_ID=4d85fd51-b1a8-4e26-b97c-e67a5338a9da
VITE_UNSTOPPABLE_DOMAINS_REDIRECT_URI=http://localhost:3000/auth/unstoppable-callback
```

### Backend Configuration

The backend automatically handles UD authentication through the
`/api/auth/unstoppable-domains` endpoint.

## Architecture

### Frontend Components

1. **UnstoppableDomainsService** (`src/services/unstoppableDomains.service.ts`)
   - Handles UD SDK initialization
   - Manages login/logout flows
   - Retrieves user profile data

2. **useUnstoppableDomains Hook** (`src/hooks/useUnstoppableDomains.ts`)
   - React hook for UD authentication
   - State management for user data
   - Error handling

3. **UnstoppableDomainsCallback**
   (`src/pages/auth/UnstoppableDomainsCallback.tsx`)
   - OAuth callback page
   - Processes authentication response
   - Redirects to dashboard

4. **Updated Login Page** (`src/pages/auth/Login.tsx`)
   - Added "Login with Unstoppable Domains" button
   - Integrated UD authentication flow

### Backend Components

1. **Auth Controller** (`apps/backend/src/auth/auth.controller.ts`)
   - `POST /api/auth/unstoppable-domains` endpoint
   - Validates UD credentials
   - Generates JWT tokens

2. **Auth Service** (`apps/backend/src/auth/auth.service.ts`)
   - `findOrCreateUnstoppableDomainsUser()` method
   - Creates or updates users based on wallet address
   - Publishes login events

## User Flow

1. User clicks "Login with Unstoppable Domains" on login page
2. UD authentication popup opens
3. User authenticates with their UD domain
4. Callback page receives user data (domain, wallet address)
5. Frontend sends data to backend `/api/auth/unstoppable-domains`
6. Backend finds or creates user account
7. Backend returns JWT token
8. User is redirected to dashboard

## API Endpoints

### POST /api/auth/unstoppable-domains

Authenticates a user with Unstoppable Domains credentials.

**Request Body:**

```json
{
  "domain": "alice.crypto",
  "walletAddress": "0x1234567890abcdef...",
  "walletType": "metamask"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "alice.crypto@unstoppabledomains.com",
    "name": "alice.crypto",
    "role": "user",
    "photoURL": null
  }
}
```

## Usage Example

### Frontend

```typescript
import { useUnstoppableDomains } from '@/hooks/useUnstoppableDomains';

function LoginComponent() {
  const { login, user, isLoading, error } = useUnstoppableDomains();

  const handleLogin = async () => {
    try {
      await login();
      // User will be redirected via callback
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <button onClick={handleLogin} disabled={isLoading}>
      Login with Unstoppable Domains
    </button>
  );
}
```

### Backend

```typescript
// The backend automatically handles UD authentication
// No additional code needed - just configure the endpoint
```

## Security Considerations

1. **Wallet Verification** - The wallet address is used as the primary
   identifier
2. **Domain Ownership** - UD SDK verifies domain ownership during authentication
3. **JWT Tokens** - Standard JWT tokens are used for session management
4. **HTTPS Required** - Production deployments must use HTTPS
5. **CORS Configuration** - Ensure proper CORS settings for UD callbacks

## Testing

### Local Development

1. Start the frontend: `pnpm dev` (in `apps/frontend`)
2. Start the backend: `pnpm dev` (in `apps/backend`)
3. Navigate to `http://localhost:3000/auth/login`
4. Click "Login with Unstoppable Domains"
5. Authenticate with your UD domain

### Production

Update the redirect URI in the Unstoppable Domains dashboard:

- Development: `http://localhost:3000/auth/unstoppable-callback`
- Production: `https://yourdomain.com/auth/unstoppable-callback`

## Troubleshooting

### Common Issues

1. **"Client ID not configured"**
   - Ensure `VITE_UNSTOPPABLE_DOMAINS_CLIENT_ID` is set in `.env`
   - Restart the dev server after adding environment variables

2. **"Redirect URI mismatch"**
   - Verify the redirect URI in `.env` matches the UD dashboard configuration
   - Check for trailing slashes

3. **"Authentication failed"**
   - Check browser console for detailed error messages
   - Verify backend is running and accessible
   - Check CORS configuration

4. **"User creation failed"**
   - Ensure database is running
   - Check backend logs for detailed errors
   - Verify `UsersService.findByWalletAddress()` method exists

## Future Enhancements

- [ ] Support for multiple wallet addresses per user
- [ ] Domain resolution for user profiles
- [ ] NFT avatar integration from UD domains
- [ ] Cross-chain wallet support
- [ ] Domain-based permissions and roles

## Resources

- [Unstoppable Domains Documentation](https://docs.unstoppabledomains.com/)
- [UAuth SDK Documentation](https://docs.unstoppabledomains.com/login-with-unstoppable/)
- [The New Fuse Dashboard](https://dashboard.auth.unstoppabledomains.com/clients/4d85fd51-b1a8-4e26-b97c-e67a5338a9da/branding)

## Support

For issues or questions:

1. Check this documentation
2. Review the [Unstoppable Domains FAQ](https://support.unstoppabledomains.com/)
3. Contact the development team

---

**Last Updated:** December 24, 2024 **Version:** 1.0.0

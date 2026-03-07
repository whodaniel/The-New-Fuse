# Account Switching Fix - Chrome Extension

## Problem

When users signed out and tried to sign in with a different Google account, the
extension didn't properly handle the account switch. This caused:

1. Old tokens being cached and reused
2. Data from the previous account lingering
3. Confusion about which account was currently authenticated

## Root Causes

1. **Incomplete sign-out**: The `signOutYouTube()` function only removed
   `youtubeToken` and `youtubeTokenExpiry`, but didn't clear:
   - Chrome's cached auth tokens
   - The `preferWebAuth` flag
   - User profile data
   - Cached playlists/videos from the previous account

2. **No account detection**: The extension didn't track which account was
   authenticated, so it couldn't detect when a different account signed in

3. **Token caching**: Chrome's identity API caches tokens, and if not properly
   cleared, it returns the old account's token even after sign-out

## Solution

### 1. Enhanced Sign-Out ([background.js:886-917](background.js#L886-L917))

```javascript
async function signOutYouTube() {
  try {
    // Remove cached token from Chrome's identity API
    if (youtubeAccessToken) {
      await chrome.identity.removeCachedAuthToken({
        token: youtubeAccessToken,
      });
    }

    // Clear all cached tokens (important for account switching)
    try {
      const allTokens = await chrome.identity.getAllCachedAuthTokens();
      for (const tokenInfo of allTokens) {
        await chrome.identity.removeCachedAuthToken({ token: tokenInfo.token });
      }
    } catch (e) {
      console.warn('⚠️ Could not clear all cached tokens:', e);
    }

    // Clear memory cache
    youtubeAccessToken = null;
    youtubeTokenExpiry = null;

    // Clear storage - remove ALL auth-related keys
    await chrome.storage.local.remove([
      'youtubeToken',
      'youtubeTokenExpiry',
      'preferWebAuth',
      'userProfile',
      'lastAuthAccount',
    ]);

    console.log('✅ Signed out from YouTube - all auth data cleared');
    return { signedOut: true };
  } catch (error) {
    console.error('❌ Error signing out:', error);
    throw error;
  }
}
```

**Changes:**

- Clears ALL cached auth tokens using `getAllCachedAuthTokens()`
- Removes `preferWebAuth`, `userProfile`, and `lastAuthAccount` from storage
- Better error handling and logging

### 2. Account Detection ([background.js:718-753](background.js#L718-L753))

```javascript
async function handleAuthSuccess(token) {
  youtubeAccessToken = token;
  youtubeTokenExpiry = Date.now() + 3600 * 1000; // 1 hour

  // Fetch user profile to detect account switches
  let userProfile = null;
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (response.ok) {
      userProfile = await response.json();
      console.log(`✅ Authenticated as: ${userProfile.email}`);
    }
  } catch (e) {
    console.warn('⚠️ Could not fetch user profile:', e);
  }

  // Check if this is a different account than before
  const stored = await chrome.storage.local.get('lastAuthAccount');
  if (
    stored.lastAuthAccount &&
    userProfile &&
    stored.lastAuthAccount !== userProfile.email
  ) {
    console.log(
      `🔄 Account switched from ${stored.lastAuthAccount} to ${userProfile.email}`
    );
    // Clear any cached data from the previous account
    await chrome.storage.local.remove(['cachedPlaylists', 'cachedVideos']);
  }

  await chrome.storage.local.set({
    youtubeToken: token,
    youtubeTokenExpiry: youtubeTokenExpiry,
    userProfile: userProfile,
    lastAuthAccount: userProfile?.email,
  });

  console.log('✅ YouTube authentication successful');
  return { authenticated: true, token: token, userProfile };
}
```

**Changes:**

- Fetches user profile via OAuth2 userinfo endpoint
- Compares with `lastAuthAccount` to detect switches
- Clears cached playlists/videos when account changes
- Stores `userProfile` and `lastAuthAccount` for future comparisons

### 3. Token Clearing on Re-Auth ([background.js:652-670](background.js#L652-L670))

```javascript
async function authenticateYouTube() {
  try {
    console.log('🔐 Authenticating with YouTube...');

    // Clear any existing cached token first to ensure fresh auth
    // This is crucial for account switching
    if (youtubeAccessToken) {
      try {
        await chrome.identity.removeCachedAuthToken({ token: youtubeAccessToken });
        console.log('🧹 Cleared previous cached token');
      } catch (e) {
        console.warn('⚠️ Could not clear cached token:', e);
      }
    }

    // ... rest of authentication
  }
}
```

**Changes:**

- Proactively clears cached tokens before starting new authentication
- Ensures Chrome doesn't reuse old account's token

### 4. Expired Token Cleanup ([background.js:785-794](background.js#L785-L794))

```javascript
// 3. If we have a token but it's expired, clear it and cached data
if (stored.youtubeToken) {
  console.log('⚠️ Cached token expired, clearing auth data');
  await chrome.storage.local.remove([
    'youtubeToken',
    'youtubeTokenExpiry',
    'cachedPlaylists',
    'cachedVideos',
  ]);
  youtubeAccessToken = null;
  youtubeTokenExpiry = null;
  return { authenticated: false, reason: 'expired' };
}
```

**Changes:**

- Clears cached playlists/videos when token expires
- Ensures clean slate for re-authentication

## Testing Instructions

### Test Case 1: Basic Sign-Out and Re-Sign-In (Same Account)

1. Open the extension popup
2. Click "Sign In with YouTube"
3. Authorize with Account A
4. Verify playlists load correctly
5. Click "Sign Out"
6. Check console - should see "✅ Signed out from YouTube - all auth data
   cleared"
7. Click "Sign In with YouTube" again
8. Authorize with the same Account A
9. Verify playlists load correctly

**Expected Result:** ✅ Extension works normally with same account

### Test Case 2: Account Switching (Different Account)

1. Sign in with Account A (e.g., personal@gmail.com)
2. Note the playlists shown (these belong to Account A)
3. Click "Sign Out"
4. Click "Sign In with YouTube"
5. When Google's auth screen appears, click "Use another account"
6. Sign in with Account B (e.g., work@company.com)
7. Check console - should see:
   ```
   🧹 Cleared previous cached token
   ✅ Authenticated as: work@company.com
   🔄 Account switched from personal@gmail.com to work@company.com
   ```
8. Verify playlists now belong to Account B

**Expected Result:** ✅ Extension correctly switches to new account and shows
Account B's playlists

### Test Case 3: Expired Token Handling

1. Sign in with any account
2. Wait for token to expire (or manually set `youtubeTokenExpiry` to past date
   in storage)
3. Try to fetch playlists
4. Check console - should see "⚠️ Cached token expired, clearing auth data"
5. Extension should prompt to re-authenticate

**Expected Result:** ✅ Extension detects expired token and requires fresh
authentication

### Test Case 4: Multiple Rapid Sign-In/Sign-Out

1. Sign in with Account A
2. Immediately sign out
3. Immediately sign in with Account B
4. Immediately sign out
5. Immediately sign in with Account A again

**Expected Result:** ✅ Each sign-in correctly authenticates with the chosen
account without errors

## Console Logs to Watch For

**Successful Account Switch:**

```
🔐 Authenticating with YouTube...
🧹 Cleared previous cached token
🌐 Starting Web Auth Flow...
✅ Authenticated as: newaccount@gmail.com
🔄 Account switched from oldaccount@gmail.com to newaccount@gmail.com
✅ YouTube authentication successful
```

**Sign-Out:**

```
✅ Signed out from YouTube - all auth data cleared
```

**Expired Token:**

```
⚠️ Cached token expired, clearing auth data
```

## Files Modified

1. **[background.js](background.js)** - Main authentication logic
   - Line 652-670: `authenticateYouTube()` - Added token clearing
   - Line 718-753: `handleAuthSuccess()` - Added account detection
   - Line 785-794: Token expiry handling - Added data cleanup
   - Line 886-917: `signOutYouTube()` - Enhanced to clear all auth data

## Known Limitations

1. `chrome.identity.getAllCachedAuthTokens()` may not be available in all Chrome
   versions - wrapped in try-catch
2. User profile fetch requires `https://www.googleapis.com/auth/userinfo.email`
   scope (already included)
3. Account switching only works properly if user explicitly signs out before
   switching

## Future Enhancements

1. Add a "Switch Account" button that automatically handles sign-out and re-auth
2. Show current account email in the popup UI
3. Support multiple accounts simultaneously (advanced)
4. Add account history/quick switch dropdown

## Rollback Instructions

If this fix causes issues, revert by:

```bash
git checkout HEAD~1 background.js
```

Or manually restore these functions to their previous versions:

- `signOutYouTube()`
- `handleAuthSuccess()`
- `authenticateYouTube()`
- Token expiry check in `isYouTubeAuthenticated()`

---

**Status:** ✅ Ready for Testing **Priority:** High (affects user experience
when switching accounts) **Complexity:** Medium (multi-step auth flow)

# Unstoppable Domains Setup Guide

You're currently on:
https://dashboard.auth.unstoppabledomains.com/clients/4d85fd51-b1a8-4e26-b97c-e67a5338a9da/branding

## Branding Configuration

### Application Information

**Application Name:**

```
The New Fuse
```

**Application Tagline/Description:**

```
AI-powered browser extension with Web3 authentication
```

### Visual Branding

**Logo URL:**

- Option 1: Upload the extension icon from
  `apps/chrome-extension/icons/icon128.png`
- Option 2: Leave blank to use default Unstoppable Domains branding

**Primary Brand Color:**

```
#4C47F7
```

**Secondary/Background Color:**

```
#F8F9FF
```

### Button & UI Customization

**Button Text Color:**

```
#FFFFFF
```

**Button Background Color:**

```
#4C47F7
```

### Privacy & Legal

**Privacy Policy URL:** (optional)

```
[Leave blank or add your URL]
```

**Terms of Service URL:** (optional)

```
[Leave blank or add your URL]
```

**Support Email:**

```
support@thenewfuse.com
```

(or your preferred support email)

## Important: Redirect URI Configuration

After filling in the branding, you MUST also configure:

### Go to the "Settings" tab

**Redirect URIs** - You need your Chrome Extension ID first:

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode" (toggle in top right)
3. Find "The New Fuse Extension" or "Fuse Connect - AI Bridge Extension"
4. Copy the ID (looks like: `abcdefg123456`)

Then add these redirect URIs in the Settings tab:

```
chrome-extension://[YOUR-EXTENSION-ID]/popup.html
chrome-extension://[YOUR-EXTENSION-ID]/options.html
```

**Example:** If your extension ID is `abcdefghijklmnop`, add:

```
chrome-extension://abcdefghijklmnop/popup.html
chrome-extension://abcdefghijklmnop/options.html
```

**Allowed Origins:**

```
chrome-extension://[YOUR-EXTENSION-ID]
```

## After Configuration

1. Save all settings in the dashboard
2. Copy your Client ID: `4d85fd51-b1a8-4e26-b97c-e67a5338a9da`
3. Open The New Fuse extension options
4. Paste the Client ID in "Unstoppable Domains Authentication" section
5. Save settings in the extension
6. Test the login!

## Quick Reference Values

Copy these values to fill in the form:

```
Application Name: The New Fuse
Primary Color: #4C47F7
Background Color: #F8F9FF
Button Color: #4C47F7
Text Color: #FFFFFF
Client ID: 4d85fd51-b1a8-4e26-b97c-e67a5338a9da
```

## Scopes Required

Make sure these scopes are enabled (usually in Settings tab):

- ✅ openid (required)
- ✅ wallet
- ✅ email:optional
- ✅ humanity_check:optional
- ✅ profile:optional

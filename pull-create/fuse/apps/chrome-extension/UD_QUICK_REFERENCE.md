# Unstoppable Domains - Quick Reference Card

Copy and paste these values into your dashboard at:
`https://dashboard.auth.unstoppabledomains.com/clients/4d85fd51-b1a8-4e26-b97c-e67a5338a9da/branding`

---

## Application Information

**Application Name:**
```
The New Fuse
```

**Application Tagline/Description:**
```
AI-powered browser extension with Web3 authentication
```

---

## Visual Branding

**Primary Brand Color:**
```
#4C47F7
```

**Secondary/Background Color:**
```
#F8F9FF
```

**Button Text Color:**
```
#FFFFFF
```

**Button Background Color:**
```
#4C47F7
```

---

## Logo

Upload the extension icon from:
```
apps/chrome-extension/icons/icon128.png
```

Or leave blank to use default Unstoppable Domains branding.

---

## Privacy & Legal

**Support Email:**
```
support@thenewfuse.com
```

**Privacy Policy URL:** (optional - leave blank or add your URL)

**Terms of Service URL:** (optional - leave blank or add your URL)

---

## IMPORTANT: Redirect URI Configuration

### Step 1: Get Your Chrome Extension ID

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode" (toggle in top right)
3. Find "The New Fuse Extension" or "Fuse Connect - AI Bridge Extension"
4. Copy the ID (looks like: `abcdefghijklmnop`)

### Step 2: Configure in Settings Tab

Go to the **Settings** tab (not Branding tab) and add:

**Redirect URIs:**
```
chrome-extension://[YOUR-EXTENSION-ID]/popup.html
chrome-extension://[YOUR-EXTENSION-ID]/options.html
```

**Example:** If your extension ID is `abcdefghijklmnop`:
```
chrome-extension://abcdefghijklmnop/popup.html
chrome-extension://abcdefghijklmnop/options.html
```

**Allowed Origins:**
```
chrome-extension://[YOUR-EXTENSION-ID]
```

---

## Scopes Required (Settings Tab)

Make sure these scopes are enabled:
- ✅ `openid` (required)
- ✅ `wallet`
- ✅ `email:optional`
- ✅ `humanity_check:optional`
- ✅ `profile:optional`

---

## Your Client ID

```
4d85fd51-b1a8-4e26-b97c-e67a5338a9da
```

---

## After Saving

1. Copy your Client ID: `4d85fd51-b1a8-4e26-b97c-e67a5338a9da`
2. Open The New Fuse extension options
3. Paste the Client ID in "Unstoppable Domains Authentication" section
4. Save settings in the extension
5. Test the login!

---

**Need Help?**
- Full documentation: [UNSTOPPABLE_DOMAINS.md](./UNSTOPPABLE_DOMAINS.md)
- Setup guide: [UNSTOPPABLE_SETUP_GUIDE.md](./UNSTOPPABLE_SETUP_GUIDE.md)

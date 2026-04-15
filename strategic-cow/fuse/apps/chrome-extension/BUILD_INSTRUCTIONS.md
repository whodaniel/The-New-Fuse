# Fuse Connect v7 - Build & Installation Instructions

## 🚀 Overview

Fuse Connect v7 is the latest version of the Chrome extension, featuring
multi-node connectivity, federation channels, and enhanced AI platform
detection.

## 🛠️ Build & Verification

### 1. Install Dependencies

Ensure you are in the extension directory:

```bash
cd apps/chrome-extension
npm install
```

### 2. Linting

Run linting to ensure code quality:

```bash
npm run lint
```

_Note: Critical syntax errors have been fixed. Only minor warnings should
remain._

### 3. Build Extension

Build the production artifact for version 7:

```bash
npm run build:v7
```

This generates the `dist-v7` directory.

---

## 🔧 Installation

### 1. Automatic Installer (Recommended)

The automatic installer builds the extension and sets up the Native Messaging
Host (required for controlling services from the extension).

```bash
cd apps/chrome-extension
bash install-v7.sh
```

### 2. Manual Chrome Loading

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** (toggle in the top right).
4. Click **"Load unpacked"**.
5. Select the `dist-v7` directory:
   `/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/dist-v7`

---

## 📡 Native Messaging Host

The native host allows the extension to communicate with local TNF services
(Relay, Monitor, etc.).

- **Manifest Location:**
  `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.thenewfuse.native_host.json`
- **Script Location:** `dist-v7/native-host/tnf-native-host.js`

---

## 🧪 Testing

### Verification Handler

A `TEST_PING` handler has been added to the background script. You can verify
communication between the popup/content and background script by sending a
message:

```javascript
chrome.runtime.sendMessage({ type: 'TEST_PING' }, (response) =>
  console.log(response)
);
```

### Manual Test Plan

1. **Popup:** Verify all tabs (Connect, Agents, Services, Settings) load
   correctly.
2. **Connectivity:** Test connection to the local relay (default:
   `ws://localhost:3000/ws`).
3. **Detection:** Visit Gemini, ChatGPT, or Claude and verify the floating panel
   can be toggled (Ctrl+Shift+F).
4. **Native Host:** Go to the "Services" tab and verify the "Native Host"
   indicator is green.

---

## 📁 Project Structure (v7)

- `src/v6/`: Source of truth for version 7.
- `dist-v7/`: Build output for Chrome.
- `manifest.json`: Extension configuration (v3).
- `webpack.v7.config.cjs`: Webpack configuration for v7.

---

**The New Fuse** - The ultimate AI agent bridge for browser automation.

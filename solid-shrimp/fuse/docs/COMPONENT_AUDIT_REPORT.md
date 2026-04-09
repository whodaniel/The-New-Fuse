# Component Audit Report - The New Fuse

## Generated: 2025-12-15

---

## 1. Chrome Extension Audit (`apps/chrome-extension/`)

### 1.1 Critical Issues

#### ❌ Issue #1: `injectable-ui-fixed.js` is truncated/broken

- **Location**: `apps/chrome-extension/injectable-ui-fixed.js`
- **Problem**: File starts at line 1 with `return;` - missing the class
  definition (TNFInjectableUI)
- **Impact**: The file is unusable as-is and will throw errors if loaded
- **Fix**: Either delete this file or regenerate it from `injectable-ui.js`

#### ❌ Issue #2: Duplicate injectable UI files

- **Files**: `injectable-ui.js` (127KB) and `injectable-ui-fixed.js` (22KB)
- **Problem**: Confusion about which file is authoritative
- **Fix**: Consolidate to a single file

#### ❌ Issue #3: Missing methods in `injectable-ui-fixed.js`

- **Problem**: References methods like `findByPlaceholderText`,
  `findByContentEditable`, `findByContextualClues`, `injectViaEvents`,
  `injectViaClipboard`, `activateSendAdvanced` that are not defined in the
  truncated file
- **Fix**: Use the complete `injectable-ui.js` file instead

### 1.2 Medium Issues

#### ⚠️ Issue #4: Commands not implemented in `background.js`

- **Location**: `background.js` lines 97-118 in commands section
- **Problem**: `inject-floating-panel` and `capture-response` commands defined
  in manifest but need handlers
- **Fix**: Add chrome.commands.onCommand listener

#### ⚠️ Issue #5: Missing `activateSendAdvanced` fallback

- **Location**: `injectable-ui-fixed.js` line 66
- **Problem**: Method `activateSendAdvanced` is called but not defined
- **Fix**: Add the method or use the complete injectable-ui.js

#### ⚠️ Issue #6: Options page settings mismatch

- **Location**: `options.js`
- **Problem**: Settings like `nativeMessaging` not present in options page
- **Fix**: Add native messaging toggle to options UI

### 1.3 Minor Issues

#### ℹ️ Issue #7: Console logging verbose

- **Problem**: Extensive console.log statements in production code
- **Fix**: Add log level filtering based on `devMode` setting

#### ℹ️ Issue #8: CSS files not minified

- **Files**: `popup.css` (18KB), `injectable-ui.css` (15KB)
- **Fix**: Add build step to minify CSS

### 1.4 Improvements

#### ✨ Improvement #1: Add error boundary to floating panel

- Add try-catch wrapper around panel rendering

#### ✨ Improvement #2: Consolidate AI platform selectors

- Currently duplicated between `content.js`, `injectable-ui.js`, and
  `background.js`
- Create shared config file

#### ✨ Improvement #3: Add offline support

- Cache last known state for relay/native connection
- Support offline message queueing

---

## 2. Electron App Audit (`apps/electron-desktop/`)

### 2.1 Critical Issues

#### ❌ Issue #9: `native/host.py` depends on system packages

- **Location**: `native/host.py`
- **Problem**: Requires `psutil` and `pyautogui` but no dependency check
- **Impact**: Native host will fail if packages not installed
- **Fix**: Add dependency check at startup with helpful error message

### 2.2 Medium Issues

#### ⚠️ Issue #10: Native host manifest path hardcoded

- **Location**: `src/main/main.ts` `ensureNativeHostRegistered()`
- **Problem**: Only handles macOS, Windows/Linux not implemented
- **Fix**: Add cross-platform support

#### ⚠️ Issue #11: Missing icon files check

- **Problem**: Build may fail if icon files missing
- **Fix**: Add build-time validation

### 2.3 Minor Issues

#### ℹ️ Issue #12: Electron version not pinned

- **Fix**: Pin exact Electron version for reproducibility

---

## 3. VSCode Extension Audit (`tools/vscode-lm-bridge/`)

### Files Present:

- `server.js` - Main server (12KB)
- `config.js` - Configuration (3KB)
- `types.d.ts` - TypeScript definitions
- `README.md` - Documentation

### 3.1 To Audit:

- [ ] Server startup and shutdown
- [ ] Message routing
- [ ] Error handling
- [ ] Integration with Chrome extension
- [ ] Integration with Electron app

---

## 4. Action Items (Priority Order)

### Immediate (P0):

1. ✅ **FIXED**: Removed broken `injectable-ui-fixed.js`
2. ✅ **FIXED**: Added dependency check to `native/host.py`

### High (P1):

3. ✅ **FIXED**: Added chrome.commands.onCommand handlers for keyboard shortcuts
4. ✅ **FIXED**: Added native messaging toggle to options page (`options.html`,
   `options.js`)
5. ✅ **FIXED**: Added cross-platform support for native host (Windows, Linux,
   macOS)

### Medium (P2):

6. ⏳ Consolidate AI platform selectors
7. ⏳ Add log level filtering
8. ⏳ Minify CSS/JS for production

### Low (P3):

9. ⏳ Add offline support
10. ⏳ Pin package versions
11. ⏳ Add build-time validations

---

## 5. Session Summary

### Completed During This Session:

| Fix | Component        | Description                                                                 |
| --- | ---------------- | --------------------------------------------------------------------------- |
| ✅  | Chrome Extension | Deleted broken `injectable-ui-fixed.js`                                     |
| ✅  | Chrome Extension | Added `chrome.commands.onCommand` handlers for keyboard shortcuts           |
| ✅  | Chrome Extension | Added Native Messaging section to options page                              |
| ✅  | Chrome Extension | Added native messaging settings to options.js                               |
| ✅  | Chrome Extension | Added `window.postMessage` listener to content.js for page-level automation |
| ✅  | Electron App     | Added dependency check to `host.py` with helpful error messages             |
| ✅  | Electron App     | Added cross-platform native host registration (Windows, Linux, macOS)       |

### Next Steps:

1. ⏳ Reload Chrome extension to pick up changes
2. ⏳ Rebuild Electron app with cross-platform support
3. ⏳ Review VSCode extension integration
4. ⏳ Test end-to-end flow with all three components
5. ⏳ Consolidate AI platform selectors across components

---
name: TNF Extension Bridge Standard Operating Procedure
description:
  Standard procedure for creating and maintaining supplementary bridge
  extensions for TNF
tags: chrome-extension, bridge, tnf, operating-procedure
---

# TNF Extension Bridge Standard Operating Procedure

## ✅ STANDARD SPEC FOR SUPPLEMENTARY BRIDGE EXTENSIONS

All secondary bridge extensions **MUST** follow this specification exactly:

### ✅ REQUIRED:

1.  **NO UI OF ANY KIND**
    - ❌ NO popup
    - ❌ NO floating panel
    - ❌ NO injected UI elements
    - ❌ NO keyboard shortcuts
    - ❌ NO toolbar icon click action
    - ✅ ONLY background + content scripts
    - ✅ Run completely silently in the background

2.  **NO USER CONFIGURATION**
    - ❌ NO options page
    - ❌ NO settings
    - ❌ NO toggles
    - ✅ All configuration is controlled exclusively from the main Fuse Connect
      extension

3.  **COMMUNICATION ONLY**
    - Bridge only listens for commands from the main Fuse Connect extension
    - Bridge only sends events back to main Fuse Connect extension
    - Bridge never interacts directly with the user

4.  **OPTIONAL SERVICES**
    - All functionality is implemented as optional services
    - Each service is registered with the main extension
    - Each service appears **ONLY** as a checkbox in the main Fuse Connect
      Services panel

---

## ✅ MANIFEST CLEANUP STEPS

1.  Remove the entire `action` block from manifest.json
2.  Remove the entire `commands` block
3.  Remove all web accessible resources that are for UI
4.  Remove all unused permissions
5.  Keep ONLY `background`, `content_scripts`, `host_permissions`

---

## ✅ BUILD PROCEDURE

1.  Always use the `build:v7` npm script
2.  Verify that popup/floating panel code is not present in the final bundle
3.  Verify manifest is clean after build
4.  Test that clicking the extension icon does nothing

---

## ✅ SERVICE REGISTRATION PATTERN

1.  Bridge extension registers available services with main Fuse Connect
    extension on startup
2.  Main extension displays checkboxes in Services panel for all registered
    services
3.  Main extension sends activate/deactivate commands to bridge when checkboxes
    are toggled
4.  Bridge never enables any service unless explicitly commanded by main
    extension

---

## ❌ COMMON MISTAKES TO AVOID

1.  ❌ Leaving popup entry in manifest
2.  ❌ Leaving keyboard shortcuts
3.  ❌ Injecting any UI elements onto pages
4.  ❌ Showing notifications directly from bridge extension
5.  ❌ Auto-enabling services without user consent from main extension

---

✅ This specification was validated and implemented 2026-04-10 for the Gemini
Bridge extension.

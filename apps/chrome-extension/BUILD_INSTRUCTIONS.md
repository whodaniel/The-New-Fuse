# Fuse Connect - Build Instructions

## ✅ What's Ready

All source files have been created with the new neon cyberpunk design:

### Created Files:

1. ✅ `manifest.json` - Updated to v4.0.0
2. ✅ `src/styles/theme.css` - Complete neon design system
3. ✅ `src/popup/popup-neon.html` - New popup HTML (vanilla JS version)
4. ✅ `src/popup/popup-neon.js` - Popup functionality
5. ✅ `src/popup/popup-neon.css` - Neon-themed styles

### Documentation:

- ✅ `REDESIGN_SPEC.md` - Full design specification
- ✅ `IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- ✅ `BUILD_INSTRUCTIONS.md` - This file

---

## 🚀 How to Build

### Option 1: Use Existing Build System (Recommended)

The project already has webpack configured. You need to:

1. **Update the HTML entry point:**

   ```bash
   cd apps/chrome-extension
   cp src/popup/popup-neon.html src/popup/popup.html
   ```

2. **Install dependencies** (if not already done):

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Build the extension:**

   ```bash
   pnpm run build
   # or
   npm run build
   ```

4. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

### Option 2: Manual Setup (No Build Required)

For quick testing without webpack:

1. **Create a simple dist folder:**

   ```bash
   cd apps/chrome-extension
   mkdir -p dist-manual/icons
   ```

2. **Copy files:**

   ```bash
   # Manifest
   cp manifest.json dist-manual/

   # HTML
   cp src/popup/popup-neon.html dist-manual/popup.html

   # JavaScript
   cp src/popup/popup-neon.js dist-manual/popup.js

   # CSS
   cp src/styles/theme.css dist-manual/theme.css
   cp src/popup/popup-neon.css dist-manual/popup-neon.css

   # Background (use existing)
   cp dist/background.js dist-manual/

   # Content script (use existing)
   cp dist/content.js dist-manual/

   # Icons (use existing)
   cp -r dist/icons/* dist-manual/icons/
   ```

3. **Update popup.html paths:** Edit `dist-manual/popup.html` and change:

   ```html
   <link rel="stylesheet" href="../styles/theme.css" />
   <link rel="stylesheet" href="popup-neon.css" />
   <script src="popup-neon.js"></script>
   ```

   To:

   ```html
   <link rel="stylesheet" href="theme.css" />
   <link rel="stylesheet" href="popup-neon.css" />
   <script src="popup.js"></script>
   ```

4. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist-manual/` folder

---

## 🎨 What You Get

Once built and loaded, you'll see:

### Popup Interface:

- **Neon gradient header** with TNF logo and pulsing status dot
- **4 tabs**: Connect, Agents, Network, Settings
- **Connection status** with real-time indicators
- **AI platform detection** with icon cards
- **Quick action buttons** for common tasks
- **Agent network viewer** showing active agents
- **Settings panel** for configuration

### Visual Features:

- Cyan (#00D9FF) → Purple (#9D4EDD) gradients
- Glowing neon effects on hover
- Pulsing status indicators
- Smooth animations
- Deep space dark theme (#0a0a0f)
- Circuit board patterns

---

## 🔧 Webpack Configuration Update (Optional)

If you want to use webpack to build the new neon popup, update
`webpack.config.cjs`:

```javascript
entry: {
  popup: './src/popup/popup-neon.js',  // Changed from popup-fallback.js
  background: './src/background.ts',
  content: './src/content/index.ts',
  // ... rest of entries
},
```

And in the CopyPlugin patterns:

```javascript
{ from: './src/popup/popup-neon.html', to: 'popup.html' },
{ from: './src/popup/popup-neon.css', to: 'popup-neon.css' },
{ from: './src/styles/theme.css', to: 'theme.css' },
```

---

## 🐛 Troubleshooting

### Icons Missing

If you see broken icon images:

- Check that `dist/icons/` folder exists
- Icons should be copied from the existing build
- Or generate new ones from the TNF monogram

### Styles Not Loading

- Make sure `theme.css` is loaded before `popup-neon.css`
- Check browser console for 404 errors
- Verify file paths in HTML match actual file locations

### Background Connection Fails

- The extension uses existing background service (`dist/background.js`)
- Make sure TNF Relay server is running on `ws://localhost:3001/ws`
- Check Settings tab to configure relay URL

### No Platform Detected

- Navigate to an AI chat site (ChatGPT, Claude, Gemini)
- Platform detection happens in content script
- May need to refresh the page after loading extension

---

## 📁 File Structure

```
dist/ (or dist-manual/)
├── manifest.json           # Extension manifest
├── popup.html             # Main popup (from popup-neon.html)
├── popup.js               # Popup logic (from popup-neon.js)
├── popup-neon.css         # Neon styles
├── theme.css              # Design system
├── background.js          # Background service worker
├── content.js             # Content script
└── icons/                 # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## ✨ Next Steps After Building

1. **Test the Extension:**
   - Click the extension icon
   - Navigate through all 4 tabs
   - Try connecting to TNF Relay
   - Visit an AI chat site to see platform detection

2. **Customize:**
   - Update relay URL in Settings tab
   - Enable/disable auto-reconnect
   - Toggle debug mode for console logs

3. **Integrate:**
   - Connect to actual TNF Relay server
   - Test Redis bridge functionality
   - Verify agent network communication

4. **Deploy:**
   - Package for Chrome Web Store (if desired)
   - Distribute to team members
   - Document usage for end users

---

## 🎯 Success Criteria

You'll know it's working when:

- ✅ Popup opens with neon cyberpunk design
- ✅ Status indicators show connection states
- ✅ Tabs switch smoothly with animations
- ✅ Connect button triggers relay connection
- ✅ AI platform is detected on chat sites
- ✅ Agent count updates when connected
- ✅ Settings can be saved and persisted

---

**The New Fuse** - Your browser's bridge to the AI agent network 🚀

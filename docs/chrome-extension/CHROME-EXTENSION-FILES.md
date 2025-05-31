# Chrome Extension Files

## Source Files

Located in `chrome-extension/src/`:

### Background Scripts

- background/auth-manager.ts
- background/connection-manager.ts  
- background/index.ts
- background/message-handler.ts

### Content Scripts

- content/index.ts

### Popup UI

- popup/chat-manager.ts
- popup/accessibility.ts
- popup/server-management.ts

### Options Page

- options/index.ts

### Utils

- utils/websocket-manager.ts
- utils/websocket-server-launcher.ts
- utils/code-snippets.ts
- utils/file-transfer.ts
- utils/ai-models.ts
- utils/logger.ts
- utils/security.ts
- utils/store.ts

### Types

- types/index.d.ts

### Tests

- tests/setup.ts
- tests/utils/websocket-manager.test.ts
- tests/utils/file-transfer.test.ts
- tests/utils/ai-models.test.ts

### Debug Tools

- debug/logs-viewer.ts

## Build & Configuration Files

- webpack.config.js
- package.json
- tsconfig.json
- quick-build.sh
- start-extension-dev.sh
- jest.config.js

## Assets & Resources

- styles.css
- vendor.css
- icons/
  - icon16.png
  - icon48.png
  - icon128.png
  - icon16-connected.png
  - icon48-connected.png
  - icon128-connected.png
  - icon16-error.png
  - icon48-error.png
  - icon128-error.png
  - icon16-partial.png
  - icon48-partial.png
  - icon128-partial.png
  - icon-success.png
  - icon-error.png
  - icon-warning.png

## Documentation

- POPUP-TROUBLESHOOTING.md
- LICENSE

## Generated Output (dist/)

- background.js
- content.js
- popup.js
- options.js
- floatingPanel.js
- vendor.js
- commons.js
- popup.html
- options.html
- styles/
  - content.css
  - popup.css
  - theme.ts

# The New Fuse - Chrome Extension Workspace Integration

This document explains how the Chrome extension is integrated into The New Fuse workspace using Bun.

## 🚀 Quick Start

### Building the Chrome Extension

```bash
# From workspace root - build just the Chrome extension
bun build:chrome

# Build everything including Chrome extension
bun build:all

# Build and package the Chrome extension for distribution
bun release:chrome
```

### Development

```bash
# Start Chrome extension in development mode (with file watching)
bun dev:chrome

# Start main project development
bun dev

# Start development with port optimization
bun dev:optimized
```

### Testing

```bash
# Test Chrome extension
bun test:chrome

# Test everything
bun test
```

### Packaging for Distribution

```bash
# Create a distributable zip package
bun package:chrome

# Or build and package in one command
bun release:chrome
```

## 📁 Project Structure

```
The New Fuse/
├── chrome-extension/          # Chrome extension workspace
│   ├── dist/                 # Built extension files
│   ├── packages/             # Packaged extension files (.zip)
│   ├── src/                  # Extension source code
│   ├── package.json          # Extension-specific dependencies
│   └── webpack.config.cjs    # Extension build configuration
├── apps/                     # Main application workspaces
├── packages/                 # Shared packages
├── package.json             # Root workspace configuration
└── turbo.json              # Turbo build configuration
```

## 🔧 Workspace Configuration

### Bun Workspaces

The Chrome extension is configured as a workspace in the root `package.json`:

```json
{
  "workspaces": [
    "apps/*",
    "packages/*",
    "chrome-extension"
  ]
}
```

### Available Scripts

From the **workspace root**:

| Command | Description |
|---------|-------------|
| `bun build:chrome` | Build Chrome extension only |
| `bun build:all` | Build main project + Chrome extension |
| `bun dev:chrome` | Start Chrome extension development |
| `bun test:chrome` | Run Chrome extension tests |
| `bun clean:chrome` | Clean Chrome extension build artifacts |
| `bun package:chrome` | Package extension for distribution |
| `bun release:chrome` | Build and package extension |

From the **chrome-extension directory**:

| Command | Description |
|---------|-------------|
| `bun build` | Build the extension |
| `bun dev` | Development mode with watching |
| `bun test` | Run tests |
| `bun package:extension` | Create distribution package |
| `bun build:package` | Build and package |

## 🛠️ Build Process

The Chrome extension build process:

1. **Icon Generation**: Creates all required icon sizes and states
2. **Notification Icons**: Generates notification icon variants
3. **Webpack Build**: Compiles TypeScript, bundles dependencies, optimizes assets
4. **Output**: Creates `dist/` directory with all extension files
5. **Packaging** (optional): Creates timestamped `.zip` file in `packages/`

### Build Outputs

After building, the `chrome-extension/dist/` directory contains:

- `manifest.json` - Extension manifest
- `background.js` - Background script
- `content.js` - Content script
- `popup.html` & `popup.js` - Extension popup
- `options.html` & `options.js` - Options page
- `icons/` - All icon variations
- Various CSS and map files

## 🔍 Dependencies

### Shared Dependencies

Common dependencies are installed at the workspace root level:
- `webpack` & `webpack-cli`
- `html-webpack-plugin`
- `typescript`
- `eslint`

### Extension-Specific Dependencies

The Chrome extension has its own dependencies for:
- React & Material-UI components
- Chrome extension APIs
- Testing frameworks
- Build tools

## 🐛 Troubleshooting

### Common Issues

1. **Build fails with dependency errors**:
   ```bash
   bun install  # Reinstall all dependencies
   ```

2. **Chrome extension not loading**:
   - Check `dist/manifest.json` exists
   - Verify all required files are in `dist/`
   - Check browser console for errors

3. **Development mode not updating**:
   ```bash
   bun clean:chrome  # Clean build cache
   bun dev:chrome    # Restart development
   ```

### Verification

To verify the setup is working:

```bash
# Test build
bun build:chrome

# Check output exists
ls chrome-extension/dist/

# Test packaging
bun package:chrome

# Check package created
ls chrome-extension/packages/
```

## 📋 Installation in Chrome

1. Build the extension: `bun build:chrome`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `chrome-extension/dist/` directory

For distribution:
1. Package the extension: `bun release:chrome`
2. Upload the `.zip` file from `chrome-extension/packages/` to Chrome Web Store

## 🔄 Continuous Integration

The workspace integration allows for:
- Unified dependency management
- Coordinated builds across all projects
- Shared tooling and configuration
- Consistent development workflows

The Chrome extension is now fully integrated into The New Fuse development ecosystem!

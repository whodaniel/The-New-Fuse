# The New Fuse IDE - Independent Build System

## ✅ Current Status: **OPERATIONAL**

**Last Successful Build**: January 3, 2025
**Node Version**: v20.19.5
**Build Status**: ✅ Complete

## 🚀 Quick Start

```bash
# Start the IDE (one command!)
./start-with-node20.sh
```

Then open: **http://localhost:3333**

## 📚 Documentation Quick Links

- **[QUICK_START.md](QUICK_START.md)** - Essential commands
- **[BUILD_SUCCESS_SUMMARY.md](BUILD_SUCCESS_SUMMARY.md)** - Complete build report
- **[THEIA_RECOVERY_PLAN.md](THEIA_RECOVERY_PLAN.md)** - Comprehensive recovery guide

---

## Overview

The New Fuse IDE is a modern, AI-powered development environment built on Theia IDE with Model Context Protocol (MCP) integration. This document describes the independent build system that allows Theia to be built completely separately from the main project build process.

## Features

- 🚀 **Independent Build System**: Complete separation from main project builds
- 🤖 **AI Integration**: Multiple LLM providers (Anthropic, OpenAI, Ollama, HuggingFace)
- 🔗 **MCP Protocol**: Model Context Protocol for enhanced context awareness
- ⚡ **Hot Reload**: Development server with file watching and automatic rebuilds
- 🎯 **Node.js Version Management**: Automatic compatibility checking and version switching
- 📦 **Multiple Package Managers**: Support for yarn, npm, and pnpm
- 🔧 **Memory Optimization**: Configurable memory limits and build concurrency
- 🌐 **Enhanced Server**: WebSocket support, real-time features, and dashboard

## Prerequisites

### Node.js Version Requirements

- **Minimum**: Node.js 18.17.0
- **Maximum**: Node.js 20.x.x
- **Recommended**: Node.js 20.x.x

The build system will automatically check Node.js compatibility and provide guidance if an incompatible version is detected.

### Package Managers

The build system supports multiple package managers:
- **yarn** (preferred)
- **npm** (fallback)
- **pnpm** (experimental)

## Quick Start

### 1. Development Build

```bash
# Navigate to Theia directory
cd apps/theia-ide

# Install dependencies and build
npm run build

# Start development server
npm run dev
```

### 2. Production Build

```bash
# Clean production build
npm run build:prod

# Start production server
npm start
```

### 3. Development with Watch Mode

```bash
# Start development server with file watching
npm run dev:watch

# Or start watcher separately
npm run watch
```

## Available Scripts

### Build Scripts

| Script | Description | Options |
|--------|-------------|---------|
| `npm run build` | Standard development build | --verbose |
| `npm run build:prod` | Production build with optimizations | --clean, --verbose |
| `npm run build:clean` | Clean build (removes artifacts first) | --verbose |
| `npm run build:verbose` | Verbose build output | - |
| `npm run rebuild` | Full rebuild (clean + install + build) | - |
| `npm run rebuild:prod` | Full production rebuild | - |

### Development Scripts

| Script | Description | Options |
|--------|-------------|---------|
| `npm run dev` | Start development server | --port, --host, --no-open, --verbose |
| `npm run dev:watch` | Start dev server with file watching | --port, --host, --no-open, --verbose |
| `npm run dev:no-open` | Start dev server without opening browser | --port, --host, --verbose |
| `npm run start` | Start production server | - |
| `npm run watch` | Start file watcher only | --debounce, --verbose |

### Utility Scripts

| Script | Description |
|--------|-------------|
| `npm run clean` | Remove build artifacts (lib, dist, src-gen, cache) |
| `npm run clean:full` | Remove all generated files including node_modules |
| `npm run theia:build` | Direct Theia CLI build (legacy) |
| `npm run theia:start` | Direct Theia CLI start (legacy) |

## Advanced Usage

### Standalone Build Script

The core build system is implemented in `build-theia-standalone.js`:

```bash
# Direct usage with options
node build-theia-standalone.js --prod --clean --verbose

# Show help
node build-theia-standalone.js --help
```

#### Build Options

- `--prod`, `--production`: Build in production mode
- `--dev`, `--development`: Build in development mode (default)
- `--clean`: Clean build artifacts before building
- `--verbose`, `-v`: Show detailed build output
- `--help`, `-h`: Show help message

### Development Server Options

The development server (`scripts/dev-theia.js`) supports various options:

```bash
# Custom port and host
node scripts/dev-theia.js --port 3001 --host 127.0.0.1

# Disable file watching or browser auto-open
node scripts/dev-theia.js --no-watch --no-open

# Verbose output
node scripts/dev-theia.js --verbose
```

#### Development Server Options

- `--port <number>`: Server port (default: 3000)
- `--host <address>`: Server host (default: 0.0.0.0)
- `--no-watch`: Disable file watching
- `--no-open`: Don't open browser automatically
- `--verbose`, `-v`: Show detailed output

### File Watcher Options

The file watcher (`scripts/watch-theia.js`) can be customized:

```bash
# Custom debounce time
node scripts/watch-theia.js --debounce 2000

# Verbose output
node scripts/watch-theia.js --verbose
```

#### File Watcher Options

- `--debounce <ms>`: Debounce time in milliseconds (default: 1000)
- `--verbose`, `-v`: Show detailed output

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_OPTIONS` | Node.js runtime options | --max_old_space_size=8192 |
| `BUILD_CONCURRENCY` | Build concurrency limit | 2 |
| `PORT` | Server port for development | 3000 |
| `NODE_ENV` | Environment mode | development |

### Build Configuration

The build system uses the following configuration (can be modified in `build-theia-standalone.js`):

```javascript
const CONFIG = {
  theiaVersion: '1.59.0',
  minNodeVersion: '18.17.0',
  maxNodeVersion: '20.999.999',
  defaultPort: 3000,
  buildTimeout: 10 * 60 * 1000, // 10 minutes
  memoryLimit: '8192'
};
```

## File Structure

```
apps/theia-ide/
├── build-theia-standalone.js    # Main build script
├── enhanced-server.js           # Enhanced server with MCP support
├── scripts/
│   ├── dev-theia.js            # Development server
│   └── watch-theia.js          # File watcher
├── src/                        # Source code
│   ├── backend/                # Theia backend source
│   └── frontend/               # Theia frontend source
├── src-gen/                    # Generated Theia files
├── lib/                        # Built files (production)
├── mcp-config.json             # MCP configuration
└── package.json                # Package configuration
```

## Troubleshooting

### Common Issues

#### 1. Node.js Version Incompatibility

**Error**: `Theia v1.59.0 requires Node.js >= 18.17.0 and < 21`

**Solution**:
```bash
# Install compatible Node.js version
nvm install 20
nvm use 20

# Then run the build again
npm run build
```

#### 2. Memory Issues During Build

**Error**: `JavaScript heap out of memory`

**Solution**:
```bash
# Increase memory limit
export NODE_OPTIONS="--max_old_space_size=8192"
npm run build

# Or use the built-in memory management
npm run build:verbose
```

#### 3. Package Manager Conflicts

**Error**: `Package manager not found` or dependency conflicts

**Solution**:
```bash
# Clean and reinstall
npm run clean:full
npm install
npm run build

# Or try different package manager
yarn install
yarn build
```

#### 4. Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Use different port
npm run dev -- --port 3001

# Or kill existing process
lsof -ti:3000 | xargs kill -9
```

### Debug Mode

For detailed debugging, use verbose mode:

```bash
# Verbose build
npm run build:verbose

# Verbose development server
npm run dev -- --verbose

# Verbose file watcher
npm run watch -- --verbose
```

### Build Logs

Build logs are stored in:
- Console output (real-time)
- `COMPLETE_BUILD_LOG.txt` (historical)

## Development Workflow

### Typical Development Session

1. **Initial Setup**:
   ```bash
   cd apps/theia-ide
   npm install
   npm run build
   ```

2. **Start Development**:
   ```bash
   npm run dev:watch
   ```

3. **Make Changes**:
   - Edit source files in `src/`
   - File watcher automatically triggers rebuilds
   - Browser refreshes automatically

4. **Test Production Build**:
   ```bash
   npm run build:prod
   npm start
   ```

### Integration with Main Project

The Theia IDE is designed to work independently but can integrate with the main project:

```bash
# From project root, build Theia independently
cd apps/theia-ide
npm run build:prod

# Return to main project
cd ../..
npm run build:fast  # Excludes Theia from main build
```

## Architecture

### Build System Components

1. **Standalone Build Script** (`build-theia-standalone.js`)
   - Node.js version checking
   - Package manager detection
   - Dependency installation
   - Theia file generation
   - Build execution with timeout handling

2. **Development Server** (`scripts/dev-theia.js`)
   - Theia backend management
   - Enhanced server startup
   - File watching integration
   - Browser auto-opening

3. **File Watcher** (`scripts/watch-theia.js`)
   - Pattern-based file watching
   - Debounced rebuild triggers
   - Cross-platform compatibility

### Enhanced Server Features

The `enhanced-server.js` provides:
- **MCP Integration**: Model Context Protocol server management
- **AI Chat**: Multiple LLM provider support
- **WebSocket Communication**: Real-time features
- **Dashboard**: Development interface at `/dashboard`
- **API Endpoints**: RESTful APIs for AI and MCP features
- **Proxy**: Routes requests to Theia backend

## Performance Optimization

### Build Performance

- **Memory Management**: Configurable memory limits
- **Concurrency Control**: Adjustable build concurrency
- **Timeout Handling**: Prevents hanging builds
- **Incremental Builds**: Only rebuild changed files

### Development Performance

- **Hot Reload**: Automatic browser refresh
- **Debounced Watching**: Prevents excessive rebuilds
- **Selective Watching**: Only watches relevant files
- **Parallel Processing**: Concurrent backend and frontend servers

## Contributing

### Adding New Features

1. **Build Features**: Modify `build-theia-standalone.js`
2. **Development Features**: Modify `scripts/dev-theia.js`
3. **Watching Features**: Modify `scripts/watch-theia.js`
4. **Server Features**: Modify `enhanced-server.js`

### Testing Changes

```bash
# Test build system
npm run build:clean
npm run build:prod

# Test development server
npm run dev:watch

# Test file watcher
npm run watch
```

## Support

For issues related to:
- **Build System**: Check this README and script help output
- **Theia IDE**: Refer to [Theia Documentation](https://theia-ide.org/docs/)
- **MCP Integration**: Check `mcp-config.json` and MCP documentation
- **AI Features**: Verify API keys and provider configurations

## Version History

- **v2.0.0**: Independent build system with MCP integration
- **v1.x.x**: Legacy build system (still available via `:legacy` scripts)

---

**Note**: This build system is completely independent and can be used without the main project build process. All dependencies and configurations are self-contained within the `apps/theia-ide/` directory.
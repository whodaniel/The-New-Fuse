# Getting Started with The New Fuse

## Quick Setup (Recommended)

For the fastest and most reliable setup, use our automated setup script:

```bash
# Clone the repository
git clone <repository-url>
cd The-New-Fuse

# Run the complete setup (handles everything automatically)
./scripts/setup-project.sh
```

This script will:
- ✅ Check your Node.js and Bun versions
- ✅ Install all dependencies with native module support
- ✅ Compile and verify native modules (like canvas)
- ✅ Set up the database schema
- ✅ Verify build and test processes

## Manual Setup

If you prefer to set up manually or need more control:

### 1. Prerequisites

- **Node.js 18.x or 20.x** (recommended for native module compatibility)
- **Bun** (latest version)

```bash
# Install Node.js 18 (if using nvm)
nvm install 18
nvm use 18

# Install Bun
curl -fsSL https://bun.sh/install | bash
```

### 2. Install Dependencies

Use our smart installer that handles native modules automatically:

```bash
# Smart install (recommended)
pnpm run install:smart

# Or standard install (may need manual fixes)
pnpm install
```

### 3. Fix Native Modules (if needed)

If you encounter canvas or other native module issues:

```bash
# Automatic fix
pnpm run fix:native-modules

# Or manual fix
rm -rf node_modules bun.lockb
pnpm install --ignore-scripts
cd node_modules/canvas && node-gyp rebuild && cd ../..
```

## Development Commands

```bash
# Start development servers
pnpm run dev

# Build the project
pnpm run build

# Run tests
pnpm run test

# Run specific services
pnpm run dev:frontend    # Frontend only
pnpm run dev:api        # API only
pnpm run dev:hub        # Browser hub only
```

## Troubleshooting

### Canvas Native Module Issues

If you see errors like "Cannot find module 'canvas.node'":

```bash
# Quick fix
pnpm run fix:native-modules

# Complete reinstall
pnpm run install:smart

# Check system dependencies (macOS)
brew install cairo pango libpng jpeg giflib librsvg
```

### Build or Test Failures

```bash
# Check native modules
node -e "const { createCanvas } = require('canvas'); console.log('Canvas works!');"

# Verify installation
pnpm run prebuild

# Clean and rebuild
pnpm run clean:all
pnpm run install:smart
```

### Port Conflicts

```bash
# Clear all ports
pnpm run clear-ports

# Check what's running
lsof -i :3000 :3005 :3007
```

## Project Structure

```
The-New-Fuse/
├── apps/                    # Applications
│   ├── frontend/           # React frontend
│   ├── api-gateway/        # API gateway
│   ├── electron-desktop/   # Electron app
│   └── ide-ide/         # SkIDEancer IDE
├── packages/               # Shared packages
│   ├── mcp-core/          # MCP implementation
│   ├── sync-core/         # Sync services
│   └── ...
├── scripts/               # Build and setup scripts
├── docs/                  # Documentation
└── deployment/           # Deployment configs
```

## Key Features

- **Browser Hub** - Unified interface for all services
- **MCP Integration** - Model Context Protocol support
- **Multi-tenant Sync** - Real-time synchronization
- **Workflow Builder** - Visual workflow creation
- **Agent System** - AI agent orchestration

## Development Workflow

1. **Start services**: `pnpm run dev`
2. **Open browser hub**: Automatically opens or visit `http://localhost:8080`
3. **Access services**: Use the sidebar to navigate between services
4. **Make changes**: Hot reload is enabled for most services
5. **Run tests**: `pnpm run test` (native modules are automatically checked)

## Environment Variables

Copy the example environment files:

```bash
cp .env.example .env
cp .env.development.example .env.development
```

Key variables:
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - Database connection string
- `REDIS_URL` - Redis connection string

## Native Module Support

This project uses a hybrid package manager approach for native modules:

- **Bun** for fast package installation and runtime
- **Node.js toolchain** for native module compilation
- **Automatic detection** and fixing of native module issues

The setup scripts handle this automatically, but you can also:

```bash
# Check native module status
ls -la node_modules/canvas/build/Release/

# Manual compilation
cd node_modules/canvas && node-gyp rebuild

# System dependencies (varies by OS)
# macOS: brew install cairo pango libpng jpeg giflib librsvg
# Ubuntu: sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

## Getting Help

- **Documentation**: Check `docs/` directory
- **Troubleshooting**: See `TROUBLESHOOTING_GUIDE.md`
- **Native Modules**: See `docs/NATIVE_MODULES_GUIDE.md`
- **Issues**: Create an issue in the repository

## Next Steps

After setup, you might want to:

1. **Explore the browser hub** - `pnpm run dev` and open the interface
2. **Read the architecture docs** - `docs/architecture/`
3. **Try the workflow builder** - Available in the browser hub
4. **Set up your development environment** - IDE extensions, etc.
5. **Run the test suite** - `pnpm run test:all`

Happy coding! 🚀
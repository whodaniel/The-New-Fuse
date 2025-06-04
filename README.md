# The New Fuse

![The New Fuse](media/logo.png)

## Overview

The New Fuse is an AI agent coordination platform that enables intelligent interaction between different AI systems, with a particular focus on integration with VS Code and other development environments. Now featuring **Yarn Berry workspace integration** and **comprehensive Chrome extension automation**.

## 🎆 Latest Features

### Chrome Extension with Yarn Berry Workspace
- **Unified Build System**: Chrome extension integrated with main project using Yarn Berry workspaces
- **Browser Automation**: AI-powered element selection and cross-platform automation
- **One-Command Building**: Build everything with `yarn build:all`
- **Development Workflow**: `yarn dev:chrome` for hot reloading during development
- **Distribution Ready**: `yarn release:chrome` creates Chrome Web Store packages

### Quick Chrome Extension Setup
```bash
# Build the Chrome extension
yarn build:chrome

# Or build everything (main project + Chrome extension)
yarn build:all

# Development mode with file watching
yarn dev:chrome

# Package for Chrome Web Store
yarn release:chrome
```

**Load in Chrome**: Go to `chrome://extensions/` → Enable "Developer mode" → "Load unpacked" → Select `chrome-extension/dist/`

## MCP Configuration

The Model Context Protocol (MCP) enables AI agents to access tools, share context, and communicate effectively. The New Fuse includes a comprehensive MCP configuration system:

- **Universal MCP Configuration Wizard**: Interactive step-by-step configuration tool
- **MCP Setup Script**: All-in-one menu-driven setup utility
- **VS Code Integration**: Run MCP tools directly from VS Code tasks

To configure MCP:

```bash
# Run the all-in-one setup script
./scripts/mcp-setup.sh

# Or launch the wizard directly
./scripts/launch-mcp-wizard.sh
```

For detailed information, see the [MCP Configuration Guide](scripts/MCP-CONFIGURATION-GUIDE.md).

## Quick Links

- [Getting Started](docs/getting-started/README.md)
- [Architecture Overview](docs/architecture/README.md)
- [API Documentation](docs/api/README.md)
- [Development Guide](docs/development/README.md)

## Key Features

- **Agent Discovery & Coordination**: Discover and coordinate AI agents across various systems
- **VS Code Integration**: Seamless integration with Visual Studio Code
- **Workflow Automation**: Create and manage automated workflows between AI systems
- **API Services**: Comprehensive API for integration with external systems

## Installation

For detailed installation instructions, see the [Installation Guide](docs/getting-started/installation.md).

### Quick Start (Docker Compose)

```bash
# Clone the repository
git clone https://github.com/your-org/the-new-fuse.git
cd the-new-fuse

# Start all services using Docker Compose
COMPOSE_BAKE=true docker-compose -f compose.yaml up -d --build
```

- The frontend will be available at http://localhost:3000
- The backend API will be available at http://localhost:3001

#### Notes:
- Make sure all required `.env` files exist in `apps/backend/.env` and `apps/frontend/.env`.
- If you add new monorepo packages or services, ensure their paths exist and are referenced in `compose.yaml`.
- **Yarn 3.x with Corepack**: The Dockerfiles now enable Corepack before installing dependencies to ensure the correct Yarn version is used.
- All references to missing services (e.g., `message-broker`, `chrome-extension`, `frontend/simplified`) have been removed from `compose.yaml` for a clean build experience.

## Development

To start developing, see the [Development Guide](docs/development/guide.md).

Quick start for development:

```bash
# Build with the new consolidated script
./consolidated-build.sh --watch --skip-tests
```

### Development Log

The New Fuse maintains a [Development Log](docs/DEVELOPMENT_LOG.md) to track all significant changes to the codebase. **All contributors, especially AI agents, are required to update this log when making changes.**

You can update the log manually or use our CLI tools:

```bash
# Add a new log entry
yarn fuse log add

# View the development log
yarn fuse log view

# Watch for file changes and automatically track them
yarn fuse log watch
```

For more information, see the [AI Documentation Guide](docs/AI_DOCUMENTATION_GUIDE.md).

## Environment Variable Validation

Ensuring that all necessary environment variables are correctly configured is crucial for the stable operation of The New Fuse platform. Missing or incorrect variables can lead to unexpected behavior, startup failures, or security vulnerabilities.

To help with this, a validation script is provided to check for the existence of required `.env.example` files and critical variables within them.

**How to run the validation:**

Use the following command from the root of the project:

```bash
yarn validate:env
```

Or, if you are using npm:

```bash
npm run validate:env
```

**Example Output:**

*Successful Validation:*

```
Starting environment variable validation...

Checking for required .env files...
Found: .env.example
Found: .env.development.example
Found: .env.production.example
Found: apps/api/.env.example
Found: apps/backend/.env.example
Found: apps/frontend/.env.example

Checking for critical variables in existing .env.example files...
Checking variables in: .env.example
  Found variable: APP_ENV
  Found variable: PORT
Checking variables in: .env.development.example
  Found variable: DATABASE_URL
  Found variable: JWT_SECRET
  Found variable: SENTRY_DSN
... (output continues for all files)

All environment checks passed successfully!
```

*Failed Validation:*

```
Starting environment variable validation...

Checking for required .env files...
Found: .env.example
Missing: .env.development.example
Found: .env.production.example
...

Checking for critical variables in existing .env.example files...
Checking variables in: .env.example
  Found variable: APP_ENV
  Missing variable: PORT
...

Some environment checks failed. Please review the messages above.
```

This script helps ensure that your development and production environments are set up correctly before you run the application.

## Documentation

All documentation has been organized into the `docs/` directory. See the [Documentation Index](docs/README.md) for a complete list of available documentation.

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

[MIT License](LICENSE)
# Repository cleaned and optimized for GitHub - Tue May 20 14:16:42 EDT 2025

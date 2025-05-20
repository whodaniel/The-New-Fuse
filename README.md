# The New Fuse

![The New Fuse](media/logo.png)

## Overview

The New Fuse is an AI agent coordination platform that enables intelligent interaction between different AI systems, with a particular focus on integration with VS Code and other development environments.

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

## Documentation

All documentation has been organized into the `docs/` directory. See the [Documentation Index](docs/README.md) for a complete list of available documentation.

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

[MIT License](LICENSE)

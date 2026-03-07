# Getting Started with The New Fuse

This comprehensive guide provides everything you need to get started with The
New Fuse framework, from installation to running your first features.

## Overview

The New Fuse is an innovative AI collaboration framework designed to enable
seamless interaction between multiple AI agents, LLM providers, and development
tools. It features:

- **Multi-LLM Support**: Work with multiple AI providers simultaneously
- **Agent Collaboration**: Coordinate between different AI agents
- **VS Code Integration**: Native extension for development workflows
- **Model Context Protocol (MCP)**: Standardized communication between AI
  services
- **Real-time Communication**: WebSocket-based inter-agent messaging

## Prerequisites

Before installing The New Fuse, ensure you have the following prerequisites:

- **Node.js**: Version 18.x or higher (recommended: v18.20.2)
- **Yarn**: Version 3.x or higher (recommended: v3.6.3)
- **Docker and Docker Compose**: For containerized services
- **PostgreSQL**: Version 13.x or higher (if running locally)
- **Redis**: Version 6.x or higher (if running locally)
- **VS Code**: For optimal development experience
- **Git**: For version control

## Quick Start

### Option 1: VS Code Extension Quick Start

The fastest way to get started is using the VS Code extension:

1. **Navigate to the project directory:**

   ```bash
   cd .
   ```

2. **Launch VS Code with the extension:**

   ```bash
   ./start.sh
   ```

   If the script isn't executable, make it so first:

   ```bash
   chmod +x start.sh
   ```

3. **Activate the extension:**
   - Open VS Code Command Palette (`Cmd+Shift+P`)
   - Type "The New Fuse: Open Master Command Center"
   - Start exploring the features

### Option 2: Full Development Setup

For complete development access:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-org/the-new-fuse.git
   cd the-new-fuse
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   You can validate your environment variable setup by running
   `yarn validate:env` (or `pnpm run validate:env`) from the project root. This
   script checks for required `.env.example` files and critical variables.

4. **Initialize the database:**

   ```bash
   yarn db:migrate
   yarn db:seed
   ```

5. **Start the development services:**
   ```bash
   pnpm dev
   ```

## Project Structure

The project follows a monorepo structure using Yarn workspaces:

```
/apps                    # Standalone applications
  /frontend             # React frontend application
  /backend              # NestJS backend service
  /api                  # API gateway service
/packages               # Shared packages
  /types                # TypeScript type definitions
  /utils                # Utility functions
  /core                 # Core business logic
  /features             # Feature components
  /api-types            # API type definitions
  /shared               # Shared code and utilities
  /ui-components        # Reusable UI components
/src                    # Source code
  /vscode-extension     # VS Code extension
/docs                   # Documentation
/scripts                # Build and utility scripts
```

## Running Options

### Development Mode

1. **Start all services:**

   ```bash
   pnpm dev
   ```

   This starts frontend, backend, and all supporting services.

2. **Start individual services:**
   ```bash
   yarn workspace @fuse/frontend dev    # Frontend only
   yarn workspace @fuse/backend dev     # Backend only
   yarn workspace @fuse/api dev         # API gateway only
   ```

### Production Mode

1. **Build the project:**

   ```bash
   pnpm build
   ```

2. **Start production services:**
   ```bash
   pnpm start
   ```

### Docker Deployment

1. **Build Docker images:**

   ```bash
   docker-compose build
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/fuse_dev"
REDIS_URL="redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570"

# API Configuration
API_PORT=3000
FRONTEND_PORT=3001

# LLM Provider Configuration
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
CEREBRAS_API_KEY=your_cerebras_key_here

# MCP Configuration
MCP_SERVER_PORT=3002
MCP_WS_PORT=3003

# WebSocket Configuration
WS_PORT=3004
```

### VS Code Extension Configuration

Configure the extension through VS Code settings:

1. Open VS Code Settings (`Cmd+,`)
2. Search for "The New Fuse"
3. Configure the following settings:

```json
{
  "theNewFuse.llmProvider": "vscode",
  "theNewFuse.mcp.url": "ws://localhost:3003/mcp",
  "theNewFuse.mcp.autoConnect": true,
  "theNewFuse.chat.enabled": true,
  "theNewFuse.openai.apiKey": "your-api-key-here",
  "theNewFuse.anthropic.apiKey": "your-api-key-here"
}
```

## First Steps

### 1. Explore the VS Code Extension

After installation, try these features:

1. **Open the Master Command Center:**
   - Command Palette → "The New Fuse: Open Master Command Center"

2. **Start a chat session:**
   - Command Palette → "The New Fuse: Show Chat"

3. **Configure LLM providers:**
   - Command Palette → "The New Fuse: Select LLM Provider"

### 2. Test MCP Integration

1. **Check MCP server health:**

   ```bash
   node scripts/mcp-health-check.js
   ```

2. **Show available MCP tools:**

   ```bash
   node scripts/show-mcp-tools.js
   ```

3. **Register MCP commands:**
   ```bash
   node scripts/initialize-mcp-commands.js
   ```

### 3. Start AI Collaboration

1. **Initialize collaboration mode:**
   - Command Palette → "The New Fuse: Start AI Collaboration"

2. **Create a collaborative task:**
   - Command Palette → "The New Fuse: Create Collaborative Task"

3. **Monitor agent communication:**
   - Command Palette → "The New Fuse: Open Communication Hub"

## Troubleshooting

### Common Issues

1. **Extension not loading:**
   - Check VS Code output panel for errors
   - Restart VS Code
   - Check that all dependencies are installed

2. **MCP connection issues:**
   - Run health check: `node scripts/mcp-health-check.js`
   - Check for port conflicts
   - Verify MCP server configuration

3. **LLM provider errors:**
   - Verify API keys are set correctly
   - Check provider health: Command Palette → "The New Fuse: Check LLM Provider
     Health"
   - Try switching providers: Command Palette → "The New Fuse: Select LLM
     Provider"

### Getting Help

- **Documentation**: Check the `/docs` folder for detailed guides
- **Troubleshooting**: See
  [MCP Troubleshooting Guide](../troubleshooting/MCP-TROUBLESHOOTING-COMPLETE.md)
- **Issues**: Report issues on the project GitHub repository

## Next Steps

Once you have the basic setup working:

1. **Explore Advanced Features:**
   - Multi-agent workflows
   - Custom MCP servers
   - Webhook integrations
   - Real-time collaboration

2. **Development:**
   - Read the [Architecture Guide](../architecture/)
   - Check out [Development Guidelines](../development/)
   - Explore [API Documentation](../reference/)

3. **Customization:**
   - Configure additional LLM providers
   - Set up custom MCP tools
   - Create custom agents
   - Customize the UI

## Related Documentation

- [MCP Complete Guide](../protocols/MCP-COMPLETE-GUIDE.md)
- [Architecture Overview](../architecture/README.md)
- [API Reference](../reference/API.md)
- [Troubleshooting](../troubleshooting/)

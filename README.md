# The New Fuse - SaaS Platform

A comprehensive multi-service SaaS platform with AI-powered workflow management, browser automation, and agent orchestration capabilities.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10.19.0+ (install with `npm install -g pnpm`)
- PostgreSQL 14+
- Redis 6+
- Docker (optional, for local database services)

### Installation

```bash
# Clone the repository
git clone https://github.com/whodaniel/fuse.git
cd fuse

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
pnpm run db:generate

# Run database migrations
pnpm run db:migrate
```

### Development

```bash
# Start all services
pnpm run dev

# Or start individual services
pnpm run dev:frontend    # Frontend only (port 3000)
pnpm run dev:api         # API Server (port 3001)
pnpm run dev:gateway     # API Gateway (port 3002)
pnpm run dev:backend     # Backend services (port 3003)
```

## Architecture

### Core Services

The New Fuse is built as a microservices architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │   API Server    │
│   React + Vite  │◄──►│  NestJS         │◄──►│   NestJS        │
│   Port: 3000    │    │  Port: 3002     │    │   Port: 3001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                       │
         └──────────────────────┼───────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   Backend Services     │
                    │   NestJS + Workers     │
                    │   Port: 3003           │
                    └────────────────────────┘
```

### Service Inventory

#### Frontend Applications
- **Frontend** (`apps/frontend`) - Main React application with Vite
- **Client** (`apps/client`) - Alternative client application

#### API Services
- **API Server** (`apps/api`) - Core API service
- **API Gateway** (`apps/api-gateway`) - Request routing and authentication
- **Backend** (`apps/backend`) - Background services and workers

#### Specialized Services
- **Browser Hub** (`apps/browser-hub`) - Browser automation and management
- **MCP Servers** (`apps/mcp-servers`) - Model Context Protocol servers
- **Relay Server** (`apps/relay-server`) - Real-time communication relay
- **Electron Desktop** (`apps/electron-desktop`) - Desktop application

## Features

### Multi-Agent Orchestration
- Agent-to-agent communication
- Intelligent task delegation
- Workflow management
- Shared context and memory

### Browser Automation
- Chrome extension integration
- Web scraping capabilities
- UI automation
- Visual element interaction

### AI Integration
- Multiple AI provider support (OpenAI, Anthropic, Google)
- Model Context Protocol (MCP) integration
- Streaming responses
- Tool integration

### Real-time Capabilities
- WebSocket support
- Live collaboration
- Real-time updates
- Event-driven architecture

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Chakra UI components
- React Query for data fetching

### Backend
- NestJS framework
- TypeScript
- Prisma ORM
- PostgreSQL database
- Redis caching

### Infrastructure
- Docker containerization
- Railway deployment ready
- Nixpacks build system
- GitHub Actions CI/CD

## Package Manager

This project uses **pnpm** exclusively. Do not use npm or yarn.

```bash
# Install dependencies
pnpm install

# Add a dependency
pnpm add <package>

# Add dev dependency
pnpm add -D <package>

# Run scripts
pnpm run <script>

# Work with specific workspace
pnpm --filter <package-name> <command>
```

## Project Structure

```
fuse/
├── apps/                      # Application services
│   ├── api/                   # Main API server
│   ├── api-gateway/           # API gateway
│   ├── backend/               # Backend services
│   ├── frontend/              # React frontend
│   ├── browser-hub/           # Browser automation
│   ├── mcp-servers/           # MCP servers
│   ├── relay-server/          # Communication relay
│   └── electron-desktop/      # Desktop app
├── packages/                  # Shared packages
│   ├── a2a-core/              # Agent-to-agent core
│   ├── a2a-react/             # Agent React components
│   ├── api-client/            # API client library
│   ├── api-types/             # Shared API types
│   ├── core/                  # Core utilities
│   ├── database/              # Database schemas
│   ├── mcp-core/              # MCP core functionality
│   ├── workflow-engine/       # Workflow processing
│   └── ...                    # Other shared packages
├── scripts/                   # Build and deployment scripts
├── docs/                      # Documentation
└── railway-deploy.sh          # Railway deployment script
```

## Environment Variables

Create a `.env` file in the root directory with:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fuse"
REDIS_URL="redis://localhost:6379"

# API Configuration
API_PORT=3001
GATEWAY_PORT=3002
FRONTEND_PORT=3000
BACKEND_PORT=3003

# Authentication
JWT_SECRET="your-secret-key-here"
JWT_EXPIRATION="7d"

# AI Services (optional)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="..."

# Feature Flags
FEATURE_AI_ANALYSIS=true
FEATURE_WORKFLOW_ENGINE=true
FEATURE_BROWSER_AUTOMATION=true
```

## Available Scripts

### Development
```bash
pnpm run dev              # Start all services
pnpm run dev:frontend     # Frontend only
pnpm run dev:api          # API server only
pnpm run dev:gateway      # API gateway only
pnpm run dev:backend      # Backend services only
```

### Building
```bash
pnpm run build            # Build all packages
pnpm run build:frontend   # Build frontend
pnpm run build:api        # Build API server
```

### Testing
```bash
pnpm run test             # Run all tests
pnpm run test:unit        # Unit tests
pnpm run test:integration # Integration tests
pnpm run test:e2e         # End-to-end tests
```

### Database
```bash
pnpm run db:generate      # Generate Prisma client
pnpm run db:migrate       # Run migrations
pnpm run db:studio        # Open Prisma Studio
pnpm run db:reset         # Reset database with seed data
```

### Quality
```bash
pnpm run lint             # Lint code
pnpm run type-check       # TypeScript checking
pnpm run format           # Format code
```

### Cleaning
```bash
pnpm run clean            # Clean build artifacts
pnpm run clean:cache      # Clear pnpm cache
pnpm run clean:full       # Full clean + remove node_modules
```

## Deployment

### Railway Deployment

The project is configured for easy Railway deployment:

```bash
# Deploy all services
./railway-deploy.sh

# Or deploy individual services
cd apps/frontend && railway up
cd apps/api && railway up
cd apps/backend && railway up
```

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed deployment instructions.

### Docker Deployment

```bash
# Build Docker images
docker build -t fuse-frontend -f apps/frontend/Dockerfile .
docker build -t fuse-api -f apps/api/Dockerfile .

# Run with docker-compose
docker-compose up -d
```

### Environment Setup

1. Configure environment variables in Railway dashboard
2. Add PostgreSQL and Redis plugins
3. Set up custom domains (optional)
4. Configure health checks
5. Monitor deployments

## Development Workflow

### Adding a New Feature

1. Create a new branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the appropriate package/app

3. Test locally
   ```bash
   pnpm run test
   pnpm run type-check
   ```

4. Build to verify
   ```bash
   pnpm run build
   ```

5. Commit and push
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

### Working with Workspaces

```bash
# Install dependency in specific package
pnpm --filter @the-new-fuse/api add express

# Run command in specific package
pnpm --filter @the-new-fuse/frontend run build

# Run command in all packages
pnpm -r run build
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Clean ports (if script exists)
pnpm run clean:ports
```

### Database Connection Issues
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Reset database
pnpm run db:reset
```

### Build Failures
```bash
# Clean and reinstall
pnpm run clean:full
pnpm install
pnpm run build
```

### Type Errors
```bash
# Regenerate Prisma client
pnpm run db:generate

# Run type check
pnpm run type-check
```

## Documentation

- [Development Setup](./DEVELOPMENT_SETUP.md) - Detailed development guide
- [Railway Deployment](./RAILWAY_DEPLOYMENT.md) - Deployment instructions
- [API Documentation](./docs/api/) - API reference
- [Architecture](./docs/architecture/) - System architecture
- [pnpm Standardization](./PNPM_STANDARDIZATION_REPORT.md) - Package manager info

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Ensure all tests pass
6. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/whodaniel/fuse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/whodaniel/fuse/discussions)
- **Documentation**: Check the `docs/` directory

## License

[Add your license information here]

---

**Ready to launch your SaaS platform!** 🚀

For deployment instructions, see [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

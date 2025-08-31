# The New Fuse

A comprehensive multi-agent orchestration framework with browser automation, desktop integration, and AI-powered workflow management.

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) (recommended) or Node.js 18+
- [Docker Desktop](https://docker.com/products/docker-desktop) (for database services)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd the-new-fuse

# Install dependencies (includes automatic native module setup)
bun install
```

> **Note**: The installation process automatically sets up required native modules (canvas, drivelist, node-pty, @vscode/ripgrep) for optimal performance across different systems.

### Development Setup

#### 🚀 NEW: Modular Development (Recommended)

```bash
# Option 1: Fastest startup (no IDE) - RECOMMENDED FOR FIRST RUN
bun run dev:no-ide      # Core services ready in ~11 seconds

# Option 2: Auto-detect mode from .env
cp .env.example .env    # Configure your preferences
bun run dev             # Smart startup based on configuration

# Option 3: Cloud IDE (if available)
bun run dev:cloud-ide   # Connect to remote IDE instance
```

**🔧 Having Build Issues?** → See [Theia Quick Start Guide](docs/THEIA_QUICK_START.md)

#### Legacy Development Options

```bash
# With Docker Infrastructure
bun run docker:start && bun run dev:frontend

# Traditional approach (may have build issues)
bun run dev:legacy
```

## 🏗️ Modular Architecture

### Service Startup Flow

```mermaid
graph TD
    A[Start Development] --> B{Choose Mode}
    B -->|none| C[Core Services Only]
    B -->|local| D[Core + Local Theia]
    B -->|cloud| E[Core + Cloud Theia]
    
    C --> F[API Gateway :3005]
    C --> G[Backend API :3001] 
    C --> H[Frontend :3000]
    C --> I[Electron App]
    
    D --> F & G & H & I
    D --> J[Local Theia :3007]
    
    E --> F & G & H & I  
    E --> K[Cloud Theia Remote]
    
    F & G & H & I --> L[Ready in ~11s]
    J --> M[Ready in ~20s]
    K --> N[Ready in ~12s]
```

### Core Services (Always Available)

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend API   │    │ API Gateway     │
│  React + Vite   │    │  NestJS + Bun    │    │ Route + Auth    │
│  Port: 3000     │    │  Port: 3001      │    │ Port: 3005      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Electron Desktop      │
                    │   Browser Hub + MCP       │
                    │    (Auto-launched)        │
                    └───────────────────────────┘
```

### Optional IDE Layer

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   None Mode     │    │   Local Mode    │    │   Cloud Mode    │
│   Fastest       │    │ Full Local IDE  │    │  Remote IDE     │
│   ~11 seconds   │    │ Port: 3007      │    │ External URL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Core Features

### Multi-Agent Orchestration
- **Agent Communication**: Real-time agent-to-agent messaging
- **Task Delegation**: Intelligent task distribution
- **Workflow Management**: Visual workflow builder
- **Context Sharing**: Shared memory and context management

### Browser Automation
- **Chrome Extension**: Native browser integration
- **Browser Hub**: Unified control interface
- **Web Scraping**: Intelligent data extraction
- **UI Automation**: Visual element interaction

### Desktop Integration
- **Electron App**: Cross-platform desktop application
- **System Integration**: Native OS capabilities
- **Terminal Access**: Integrated terminal management
- **File System Access**: Direct file operations

### AI Integration
- **Multiple Providers**: Support for various AI models
- **Context Protocol**: Model Context Protocol (MCP) support
- **Real-time Processing**: Streaming AI responses
- **Tool Integration**: AI-powered tool usage

### 🤖 Claude Agent System
- **106+ Specialized Agents**: Complete ecosystem of AI agents for every domain
- **Intelligent Search**: Advanced agent discovery with multi-criteria filtering
- **Database Integration**: PostgreSQL storage with full metadata and analytics
- **Slash Commands**: `/search-agents`, `/register-agents`, `/tag-agents` for easy access
- **Auto-Registration**: Agents automatically discovered and stored on startup
- **Performance Tracking**: Usage analytics and effectiveness metrics

## 📦 Components

### Frontend (`apps/frontend`)
- React 18 with TypeScript
- Vite for fast development
- Chakra UI for components
- Real-time WebSocket integration

### Backend (`apps/backend`)
- NestJS framework with Bun runtime
- RESTful API design
- Real-time system monitoring
- Docker service integration

### Electron Desktop (`apps/electron-desktop`)
- Cross-platform desktop application
- Browser Hub integration
- System-level capabilities
- Native menu and tray integration

### Browser Hub (`apps/browser-hub`)
- HTTP server for browser integration
- Chrome extension compatibility
- Visual service management
- Real-time status monitoring

## 🐳 Docker Infrastructure

The project uses Docker for production-ready database services:

### Services
- **PostgreSQL**: Primary database (port 5433)
- **Redis**: Caching and messaging (port 6380)

### Docker Commands

```bash
# Start Docker services
bun run docker:start

# Check service status
bun run docker:status

# Test connectivity
bun run docker:test

# View logs
bun run docker:logs

# Stop services
bun run docker:stop
```

## 🛠️ Development

### Available Scripts

```bash
# Development
bun run dev                 # Start all services
bun run dev:frontend        # Frontend only
bun run dev:backend         # Backend only
bun run dev:hub            # Electron app only

# Docker Management
bun run docker:start       # Start PostgreSQL & Redis
bun run docker:stop        # Stop Docker services
bun run docker:test        # Test connectivity
bun run docker:status      # Check service status

# Building
bun run build              # Build all apps
bun run build:frontend     # Build frontend
bun run build:backend      # Build backend

# Testing
bun run test               # Run all tests
bun run test:frontend      # Frontend tests
bun run test:backend       # Backend tests

# Quality
bun run lint               # Lint all code
bun run type-check         # TypeScript checking
bun run format             # Format code

# Claude Agent Management  
bun run claude:agents:sync     # Synchronize .claude agents
bun run claude:agents:register # Register agents in database
bun run claude:agents:search   # Search agent ecosystem
bun run claude:agents:status   # Agent system status
```

### Development Workflow

1. **Setup Environment**:
   ```bash
   bun install
   bun run docker:start
   bun run claude:agents:sync    # Initialize agent system
   ```

2. **Start Development**:
   ```bash
   bun run dev:frontend
   bun run dev:backend
   bun run dev:hub
   ```

3. **Access Services**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3004
   - Browser Hub: http://localhost:8080
   - Electron: Desktop application

4. **Monitor Services**:
   ```bash
   bun run docker:status
   curl http://localhost:3004/api/services/status
   ```

## 🌐 API Endpoints

### Service Management
- `GET /api/services/status` - Service health status
- `GET /api/system/metrics` - System performance metrics
- `GET /api/system/tools` - Available system tools

### Agent Management
- `POST /api/agents/register/batch` - Register all .claude agents in database
- `GET /api/agents/search` - Advanced search with multi-criteria filtering  
- `GET /api/agents/:id/profile` - Complete agent profile with capabilities
- `GET /api/agents/:id/similar` - Find similar and complementary agents
- `GET /api/agents/:id/relationships` - Agent compatibility and workflows
- `POST /api/agents/:id/usage` - Record agent usage and performance metrics
- `GET /api/agents/statistics` - System-wide agent analytics and insights

## 🧪 Testing

### Unit Tests
```bash
bun run test
```

### Integration Tests
```bash
# Start services first
bun run docker:start
bun run dev

# Run integration tests
bun run test:integration
```

### Docker Integration Test
```bash
bun run docker:test
```

## 📚 Documentation

### Guides
- [Docker Setup Guide](./docs/guides/docker-setup.md)
- [Development Workflow](./docs/guides/development-workflow.md)
- [Database Configuration](./docs/guides/database-configuration.md)
- [Deployment Guide](./docs/guides/deployment-guide.md)

### Troubleshooting
- [Docker Services Issues](./docs/troubleshooting/docker-services.md)

### Architecture
- [System Architecture](./docs/architecture/)
- [API Documentation](./docs/api/)

## 🚀 Deployment

### Development
```bash
# With Docker infrastructure
bun run docker:start
bun run dev
```

### Production
```bash
# Build for production
bun run build

# Deploy with Docker Compose
docker-compose -f docker-compose.yml up -d
```

### Cloud Deployment
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, DigitalOcean Apps
- **Database**: AWS RDS, Google Cloud SQL
- **Redis**: Redis Cloud, AWS ElastiCache

## 🔧 Configuration

### Environment Variables

```bash
# Database (Docker)
DATABASE_URL=postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_dev
REDIS_URL=redis://localhost:6380

# Application
NODE_ENV=development
PORT=3004
API_URL=http://localhost:3004
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET=your-jwt-secret
```

### Docker Configuration

The project includes `docker-compose.dev-simple.yml` for development:

```yaml
services:
  postgres-dev:
    image: postgres:14-alpine
    ports: ["5433:5432"]
  redis-dev:
    image: redis:6
    ports: ["6380:6379"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure Docker services work
5. Submit a pull request

### Development Setup for Contributors

```bash
# Clone your fork
git clone <your-fork-url>
cd the-new-fuse

# Install dependencies
bun install

# Start development environment
bun run docker:start
bun run dev

# Run tests
bun run test
bun run docker:test
```

## 📋 Requirements

### System Requirements
- **Node.js**: 18+ (Bun recommended)
- **Docker**: Latest stable version
- **Memory**: 4GB+ recommended
- **Storage**: 2GB+ available space

### Development Requirements
- **TypeScript**: Latest version
- **Git**: Version control
- **Docker Desktop**: For database services
- **Code Editor**: VS Code recommended

## 🐛 Troubleshooting

### Common Issues

**Native Module Build Errors:**
```bash
# Automatic fix (recommended)
bun run setup:native-modules

# Manual fix
bun run fix:native-modules

# Complete reinstall
rm -rf node_modules && bun install
```

**Docker services won't start:**
```bash
# Check Docker status
docker info

# Restart Docker services
bun run docker:stop
bun run docker:start
```

**Port conflicts:**
```bash
# Check port usage
lsof -i :3000
lsof -i :3004
lsof -i :5433
lsof -i :6380
```

**Connection issues:**
```bash
# Test connectivity
bun run docker:test

# Check logs
bun run docker:logs
```

For detailed troubleshooting, see:
- [Native Modules Guide](./docs/guides/native-modules-guide.md)
- [Docker Services Troubleshooting](./docs/troubleshooting/docker-services.md)

## 📝 License

[Add your license here]

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh) for fast JavaScript runtime
- [Docker](https://docker.com) for containerization
- [NestJS](https://nestjs.com) for backend framework
- [React](https://react.dev) for frontend framework
- [Electron](https://electronjs.org) for desktop integration

## 📞 Support

- **Documentation**: Check the `docs/` directory
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for questions
- **Docker Issues**: See [troubleshooting guide](./docs/troubleshooting/docker-services.md)

---

**Happy coding! 🚀**
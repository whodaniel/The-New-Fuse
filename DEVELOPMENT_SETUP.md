# The New Fuse - Development Setup Guide

## Quick Start

### 1. Environment Setup

```bash
# Copy environment configuration
cp .env.example .env

# Edit .env with your actual values
# Required: DATABASE_URL, JWT_SECRET, API keys for external services
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Generate Prisma types
bun run db:generate
```

### 3. Database Setup

```bash
# Run database migrations
bun run db:migrate

# Optional: Reset database with seed data
bun run db:reset
```

### 4. Start Development

Choose your development scenario:

#### Option A: Gateway + Frontend (Default)

```bash
bun run dev
# Runs: API Gateway + Frontend
# Ports: 3000 (frontend), 3002 (gateway)
```

#### Option B: API Server + Frontend

```bash
bun run dev:full
# Runs: API Server + Frontend
# Ports: 3000 (frontend), 3001 (api server)
```

#### Option C: All Services

```bash
bun run dev:all
# Runs: All services concurrently
# Warning: May be resource intensive
```

#### Option D: Individual Services

```bash
bun run dev:api      # API Server only (port 3001)
bun run dev:gateway  # API Gateway only (port 3002)
bun run dev:frontend # Frontend only (port 3000)
```

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │   API Server    │
│   (Vite)        │◄──►│  (NestJS)       │◄──►│   (Bun)         │
│   Port: 3000    │    │   Port: 3002    │    │   Port: 3001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Development URLs

- **Frontend**: <http://localhost:3000>
- **API Gateway**: <http://localhost:3002>
- **API Server**: <http://localhost:3001>
- **Database Studio**: <http://localhost:5555> (after `bun run db:studio`)

## Environment Variables Guide

### Required for Basic Operation

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `REDIS_URL` - Redis connection for caching/sessions

### Required for External Services

- `OPENAI_API_KEY` - OpenAI integration
- `ANTHROPIC_API_KEY` - Claude integration
- `GEMINI_API_KEY` - Google Gemini integration
- `AWS_ACCESS_KEY_ID` - AWS services
- `AWS_SECRET_ACCESS_KEY` - AWS services

### Optional Features

- `FIREBASE_*` - Firebase integration
- `ETHEREUM_*` - Web3 features
- `SMTP_*` - Email notifications

## Troubleshooting

### Port Conflicts

```bash
# Check what's running on ports
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Clear ports script (runs automatically with dev commands)
bun run clean:ports
```

### Database Issues

```bash
# Reset everything
bun run clean:all
bun install
bun run db:generate
bun run db:migrate
```

### Cache Issues

```bash
# Clear all caches
bun run clean:cache
bun run clean:deps
```

### Type Issues

```bash
# Rebuild types
bun run build:types
bun run type-check
```

## Performance Tips

### Development Mode

- Use `bun run dev:frontend` for frontend-only development
- Use `bun run dev:api` for backend-only development
- Use `bun run dev:full` for full-stack development

### Resource Management

- `dev:all` uses significant resources - use sparingly
- Individual service commands are more efficient
- Monitor with `htop` or Activity Monitor

## Testing

### Run Tests

```bash
bun run test              # All tests
bun run test:unit         # Unit tests only
bun run test:integration  # Integration tests
bun run test:e2e         # End-to-end tests
```

### Coverage

```bash
bun run test:coverage
```

## Advanced Configuration

### Custom Ports

Edit `.env` to change default ports:

```bash
FRONTEND_PORT=3000
API_PORT=3001
GATEWAY_PORT=3002
```

### Feature Flags

Enable/disable features in `.env`:

```bash
FEATURE_AI_ANALYSIS=true
FEATURE_WORKFLOW_ENGINE=true
FEATURE_REAL_TIME_COLLABORATION=true
```

## Getting Help

1. Check logs in terminal for error messages
2. Verify all required environment variables are set
3. Ensure database is running and accessible
4. Check service-specific logs in their respective directories
5. Run `bun run health-check` for comprehensive verification

# Development Guide

## Development Environment Setup

### Prerequisites
```bash
# Verify Node.js version
node --version  # Should be 18+

# Verify Yarn version
yarn --version  # Should be 4.6.0+

# Verify Docker
docker --version  # Should be 24.0+
docker-compose --version  # Should be 2.20+
```

### Initial Setup
```bash
# Clone repository
git clone [repository-url]
cd the-new-fuse

# Install dependencies
yarn install

# Copy environment configuration
cp .env.example .env

# Start development environment
yarn dev
```

## Project Structure

### Core Components
```
apps/backend/
├── src/
│   ├── services/
│   │   └── messages/      # Agent communication
│   ├── scripts/          # Development scripts
│   └── agents/           # AI agent implementations
```

### Agent Communication System
- Redis-based messaging system
- Channels:
  - `agent:composer`
  - `agent:roo-coder`
  - `agent:trae`
  - `agent:broadcast`

### Message Types
```typescript
interface AgentMessage {
  type: 'initialization' | 'acknowledgment' | 'task_request' | 
        'task_update' | 'code_review' | 'suggestion';
  timestamp: string;
  message?: string;
  metadata: {
    version: string;
    priority: 'low' | 'medium' | 'high';
  };
}
```

## Development Workflow

### 1. Code Organization
- Follow TypeScript guidelines
- Use feature-based organization
- Maintain clear separation of concerns

### 2. Version Control
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: description of changes"

# Push changes
git push origin feature/your-feature
```

### 3. Testing
```bash
# Run all tests
yarn test

# Run specific test suites
yarn test:unit
yarn test:integration
```

### 4. Code Quality
```bash
# Format code
yarn format

# Lint code
yarn lint

# Type check
yarn type-check
```

## Agent Development

### Setting Up a New Agent
1. Create agent channel
2. Implement message handlers
3. Add integration tests
4. Document capabilities

### Example Agent Integration
```typescript
const agentConfig = {
  id: 'new-agent',
  channel: 'agent:new-agent',
  capabilities: ['code_analysis', 'task_coordination']
};

await registerAgent(agentConfig);
```

## Troubleshooting

### Common Issues
1. Redis Connection
```bash
# Verify Redis
redis-cli ping
```

2. Database Issues
```bash
# Reset database
yarn db:reset
```

3. Cache Issues
```bash
# Clear cache
yarn clean:cache
```

## Best Practices

### Code Style
- Use TypeScript strict mode
- Write comprehensive tests
- Document public APIs
- Follow SOLID principles

### Performance
- Implement proper error handling
- Use connection pooling
- Cache expensive operations
- Monitor memory usage

### Security
- Validate all inputs
- Use environment variables
- Implement rate limiting
- Follow security best practices

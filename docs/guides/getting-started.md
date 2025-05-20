# Getting Started with The New Fuse

## Quick Start

### Prerequisites
- Node.js 18+
- Yarn 1.22+
- Docker 24.0+
- Docker Compose 2.20+
- Git
- PostgreSQL 17.0

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/organization/the-new-fuse.git
   cd the-new-fuse
   ```

2. **Install Dependencies**
   ```bash
   yarn install
   ```

3. **Set Up Environment**
   ```bash
   # Copy example environment files
   cp apps/frontend/.env.example apps/frontend/.env
   cp apps/api/.env.example apps/api/.env
   ```

4. **Database Setup**

1. Install PostgreSQL 17.0
   ```bash
   brew install postgresql@17
   ```

2. Start PostgreSQL service
   ```bash
   brew services start postgresql@17
   ```

3. Create the database
   ```bash
   createdb fuse
   ```

4. Set up environment variables in `packages/database/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fuse?schema=public"
   ```

5. Run database migrations
   ```bash
   cd packages/database
   yarn prisma migrate dev
   ```

The database should now be ready with all required tables:
- User (authentication and user management)
- Session (session management)
- Organization (organization management)
- Project (project management)
- ApiKey (API key management)

5. **Redis Setup**

1. Install Redis (if not already installed):
   ```bash
   brew install redis
   ```

2. Start Redis service:
   ```bash
   brew services start redis
   ```

3. Verify Redis is running:
   ```bash
   redis-cli ping
   ```
   Should return: `PONG`

4. Configure Redis in your `.env` file:
   ```env
   REDIS_URL="redis://localhost:6379"
   ```

Redis is used for:
- Session management
- Caching
- Real-time features
- Rate limiting

6. **Start Development Environment**
   ```bash
   # Start all services
   yarn dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - API Documentation: http://localhost:3001/api/docs

## Project Structure

```
the-new-fuse/
├── apps/                      # Application packages
│   ├── frontend/             # React frontend application
│   │   ├── src/             # Source code
│   │   ├── public/          # Static assets
│   │   └── package.json     # Frontend dependencies
│   └── api/                 # NestJS backend application
│       ├── src/            # Source code
│       └── package.json    # Backend dependencies
├── packages/                # Shared packages
│   ├── common/             # Shared utilities and types
│   └── ui/                 # Shared UI components
├── docs/                   # Documentation
└── package.json           # Root package.json
```

## Development Workflow

### Running Services

```bash
# Start all services
yarn dev

# Start frontend only
yarn workspace @the-new-fuse/frontend dev

# Start backend only
yarn workspace @the-new-fuse/api dev
```

### Running Tests

```bash
# Run all tests
yarn test

# Run frontend tests
yarn workspace @the-new-fuse/frontend test

# Run backend tests
yarn workspace @the-new-fuse/api test
```

### Code Style and Linting

```bash
# Run linting
yarn lint

# Fix linting issues
yarn lint:fix
```

## Core Features

### 1. User Authentication
- JWT-based authentication
- Role-based access control
- Social authentication providers

### 2. Task Management
- Create and assign tasks
- Real-time updates
- Task prioritization

### 3. Real-time Communication
- WebSocket-based messaging
- Presence indicators
- Typing indicators

## Component Library

Our UI components are built using:
- React 18
- Tailwind CSS
- Headless UI
- Radix UI

[View Component Documentation](../reference/COMPONENTS.md)

## API Integration

### Making API Requests
```typescript
// Example API call
import { api } from '@/lib/api';

const response = await api.get('/tasks');
const tasks = response.data;
```

### WebSocket Integration
```typescript
import { socket } from '@/lib/socket';

socket.on('task:updated', (task) => {
  // Handle task update
});
```

## Development Tools

### Recommended VSCode Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens

### Browser Extensions
- Redux DevTools
- React Developer Tools

## Next Steps

1. [Read the Architecture Overview](../architecture/ARCHITECTURE.md)
2. [Explore the API Documentation](../reference/API.md)
3. [Learn about Components](../reference/COMPONENTS.md)
4. [Review Development Guidelines](/docs/guides/development.md)

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check for processes using ports
   lsof -i :3000
   lsof -i :3001
   ```

2. **Database Connection Issues**
   ```bash
   # Check database container
   docker ps | grep postgres
   docker logs postgres
   ```

3. **Node Module Issues**
   ```bash
   # Clean and reinstall
   rm -rf node_modules
   yarn install
   ```

## Getting Help

- [Submit an Issue](https://github.com/organization/the-new-fuse/issues)
- [View Documentation](../index.md)
- [Join Discord Community](https://discord.gg/the-new-fuse)

## Related Documentation

- [Development Guide](/docs/guides/development.md)
- [Deployment Guide](operations/deployment.md)
- [Architecture Overview](../architecture/ARCHITECTURE.md)

# Developer Workflow

## Services Management

### Redis Configuration
The development environment uses Redis in Docker. Helper functions are provided in your shell configuration:

```bash
# Redis management functions (already added to ~/.zshrc)
redis-clean() {
    brew services stop redis
    redis-cli shutdown || true
    pkill redis-server
    echo "All Redis instances stopped"
}

redis-docker-start() {
    redis-clean
    docker-compose up -d redis
    echo "Docker Redis instance started"
}
```

To manage Redis:
- Stop all Redis instances: `redis-clean`
- Start Redis in Docker: `redis-docker-start`

### Development Services
Access points:
- Main application: http://localhost:3000
- Additional service: http://localhost:8000
- PostgreSQL: localhost:5433
- Redis: localhost:6379

### Development features:
- Hot-reloading enabled
- Source code mounted as volume
- Automatic TypeScript compilation
- No local build required

## Coding Standards

### TypeScript Best Practices
- Use strict mode
- Implement interfaces
- Document with TSDoc
- Use type inference
- Handle errors properly

### React Best Practices
```typescript
// Component Structure
interface ComponentProps {
  // Props definition
}

export const Component: React.FC<ComponentProps> = ({ }) => {
  // Implementation
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### NestJS Best Practices
```typescript
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: []
})
export class FeatureModule {}
```

### General Guidelines
- Follow ESLint configuration
- Implement proper error handling
- Write clear and concise comments
- Use decorators appropriately
- Implement dependency injection
- Follow module structure
- Document APIs

## Testing

### Unit Testing
- **Framework**: Jest
- **Coverage Target**: 80%
- **Focus Areas**:
  - Models and data validation
  - Service layer business logic
  - Utility functions
  - State management
  - WebSocket message handling

### Integration Testing
- **Framework**: Cypress
- **Coverage Target**: 70%
- **Focus Areas**:
  - API endpoints
  - Database operations
  - Authentication flows
  - WebSocket connections
  - External service integrations

### End-to-End Testing
- **Framework**: Selenium
- **Coverage Target**: 50%
- **Focus Areas**:
  - User workflows
  - Cross-browser compatibility
  - Mobile responsiveness
  - Performance metrics
  - Error scenarios

## Version Control

### Branch Strategy
- `main`: Production branch
- `develop`: Development branch
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches

### Commit Guidelines
- Clear commit messages
- Reference issue numbers
- Keep commits focused
- Regular commits

## Contributing

### Pull Request Process
1. Create feature branch
2. Implement changes
3. Write/update tests
4. Update documentation
5. Submit PR
6. Address review comments
7. Merge after approval

### Code Review Guidelines
- Check code style
- Verify test coverage
- Review documentation
- Test functionality
- Check performance impact

## Maintenance

### Regular Tasks
- Update dependencies
- Clean up code
- Update documentation
- Optimize performance
- Monitor system health

### Emergency Procedures
```bash
# Database Issues
npm run migration:revert
tail -f /var/log/postgresql/postgresql-14-main.log

# Application Issues
tail -f logs/app.log
pm2 restart all

# Performance Issues
curl http://localhost:3000/api/metrics
top -p $(pgrep -f "node")
```

## Development Cycle

### Development
```bash
# Start development server
yarn dev

# Run tests
yarn test

# Build application
yarn build
```

### Production
```bash
# Build for production
yarn build

# Start production server
yarn start:prod
```

## Docker Commands Reference

### Common Commands
```bash
# Start all services
docker-compose up --build

# Start specific service
docker-compose up postgres

# View logs
docker-compose logs -f app

# Rebuild specific service
docker-compose up --build app

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Container Management
```bash
# List running containers
docker ps

# Enter container shell
docker exec -it fuse-app bash

# View container logs
docker logs fuse-app -f
```

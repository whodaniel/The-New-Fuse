# Scripts Reference

## Cleanup Scripts

### Main Cleanup Script
The project uses a TypeScript-based cleanup script (`scripts/cleanup.ts`) that consolidates all cleanup operations.

```bash
# Full system cleanup
yarn clean

# Targeted cleanup
yarn clean:deps    # Clean dependencies
yarn clean:build   # Clean build artifacts
yarn clean:docker  # Clean Docker artifacts
yarn clean:cache   # Clean cache
```

## Analysis Scripts

### Component Analysis
```bash
# Run manual component analysis
yarn analyze:components

# Run analysis and show summary report
yarn analyze:components:report

# Run automated analysis (via task system)
yarn task:run component-analysis
```

For more details about automated component analysis, see [Automated Component Analysis](automated-component-analysis.md).

## Development Scripts

### Core Development
```bash
# Start development server
yarn dev

# Start production server
yarn start

# Build project
yarn build

# Type checking
yarn type-check
```

### Testing
```bash
# Run all tests
yarn test

# Run specific tests
yarn test:unit
yarn test:integration
yarn test:e2e
```

### Database Operations
```bash
# Reset development database
yarn db:reset

# Run migrations
yarn db:migrate

# Generate types
yarn db:generate
```

### Docker Operations
```bash
# Start Docker environment
yarn docker:up

# Stop Docker environment
yarn docker:down

# Clean Docker artifacts
yarn clean:docker
```

## Maintenance Scripts

### Code Quality
```bash
# Lint code
yarn lint

# Format code
yarn format

# Check types
yarn type-check
```

### Dependency Management
```bash
# Update dependencies
yarn upgrade-interactive

# Clean dependencies
yarn clean:deps

# Check for outdated packages
yarn outdated
```

## CI/CD Scripts

### Build
```bash
# Production build
yarn build:prod

# Staging build
yarn build:staging
```

### Deployment
```bash
# Deploy to production
yarn deploy:prod

# Deploy to staging
yarn deploy:staging
```

## Troubleshooting Scripts

### System Reset
```bash
# Reset development environment
yarn reset:dev

# Clear all caches
yarn clean:cache

# Reset database
yarn db:reset
```

### Logging
```bash
# View application logs
yarn logs

# View error logs
yarn logs:error
```

## Script Organization

All scripts are organized in the following structure:
```
scripts/
├── cleanup.ts          # Main cleanup script
├── build/             # Build scripts
├── deployment/        # Deployment scripts
├── database/          # Database scripts
└── utils/            # Utility scripts
```

## Best Practices

1. Always use yarn scripts instead of running scripts directly
2. Check script documentation before modifying
3. Test scripts in development before pushing changes
4. Keep scripts modular and focused
5. Maintain consistent error handling
6. Add appropriate logging
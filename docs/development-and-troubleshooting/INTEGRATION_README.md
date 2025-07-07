# Integration Guidelines

This document provides comprehensive guidelines for integrating new components, services, and features into The New Fuse platform.

## Overview

The New Fuse follows a modular architecture with strict integration protocols to ensure system stability, maintainability, and scalability.

## Integration Process

### 1. Pre-Integration Checklist

Before starting any integration:

- [ ] Read all documentation in `/DOCUMENTATION_INDEX.md`
- [ ] Review the current architecture in `/README.md`
- [ ] Check existing integration patterns
- [ ] Understand the modular package structure
- [ ] Verify development environment setup

### 2. Package Structure

All new features should follow the established package structure:

```
packages/
├── your-feature/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
```

### 3. Integration Steps

#### Step 1: Create Package Structure
```bash
# Create new package directory
mkdir -p packages/your-feature/src/{components,services,types}

# Initialize package.json
cd packages/your-feature
npm init -y
```

#### Step 2: Configure TypeScript
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

#### Step 3: Implement Core Components
- Create service interfaces
- Implement React components
- Define TypeScript types
- Add proper exports

#### Step 4: Integration Testing
```bash
# Run integration script
./integrate-your-feature.sh

# Verify build
yarn build

# Test development environment
yarn dev:optimized
```

## Service Integration

### Service Layer Pattern

All services should implement the following pattern:

```typescript
export interface YourFeatureService {
  create(data: CreateData): Promise<YourFeature>;
  read(id: string): Promise<YourFeature>;
  update(id: string, data: UpdateData): Promise<YourFeature>;
  delete(id: string): Promise<void>;
  list(filters?: Filters): Promise<YourFeature[]>;
}

export class YourFeatureServiceImpl implements YourFeatureService {
  // Implementation
}
```

### Dependency Injection

Register services in the main application:

```typescript
// src/services/index.ts
import { YourFeatureServiceImpl } from '@the-new-fuse/your-feature';

export const services = {
  yourFeature: new YourFeatureServiceImpl(),
  // other services...
};
```

## Component Integration

### React Component Guidelines

1. **Use TypeScript**: All components must be typed
2. **Follow naming conventions**: PascalCase for components
3. **Implement proper props**: Define clear interfaces
4. **Add error boundaries**: Handle errors gracefully
5. **Include loading states**: Provide user feedback

### Example Component Structure

```typescript
import React from 'react';

interface YourComponentProps {
  data: YourData;
  onAction: (item: YourData) => void;
  loading?: boolean;
}

export const YourComponent: React.FC<YourComponentProps> = ({
  data,
  onAction,
  loading = false
}) => {
  // Component implementation
};
```

## Workflow Builder Integration

### Adding New Node Types

1. **Define Node Interface**:
```typescript
export interface YourFeatureNode extends BaseNode {
  type: 'your-feature';
  data: YourFeatureNodeData;
}
```

2. **Create Node Component**:
```typescript
export const YourFeatureNodeComponent: React.FC<NodeProps<YourFeatureNode>> = ({
  data,
  onUpdate
}) => {
  // Node implementation
};
```

3. **Register in Toolbar**:
```typescript
// Add to NodeToolbar configuration
{
  category: 'AI',
  type: 'your-feature',
  label: 'Your Feature',
  icon: YourFeatureIcon,
  component: YourFeatureNodeComponent
}
```

## Database Integration

### Schema Guidelines

1. **Use consistent naming**: snake_case for database fields
2. **Add proper indexes**: For performance optimization
3. **Include timestamps**: created_at, updated_at
4. **Version your schemas**: Use migrations
5. **Add constraints**: Ensure data integrity

### Migration Example

```sql
-- Create your_features table
CREATE TABLE your_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_your_features_name ON your_features(name);
CREATE INDEX idx_your_features_created_at ON your_features(created_at);
```

## API Integration

### REST API Endpoints

Follow RESTful conventions:

```typescript
// API routes
GET    /api/your-features      # List all
POST   /api/your-features      # Create new
GET    /api/your-features/:id  # Get specific
PUT    /api/your-features/:id  # Update specific
DELETE /api/your-features/:id  # Delete specific
```

### Request/Response Types

```typescript
export interface CreateYourFeatureRequest {
  name: string;
  description?: string;
  config?: Record<string, any>;
}

export interface YourFeatureResponse {
  id: string;
  name: string;
  description: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

## Testing Integration

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent data={mockData} onAction={jest.fn()} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
import { request } from 'supertest';
import { app } from '../app';

describe('Your Feature API', () => {
  it('creates new feature', async () => {
    const response = await request(app)
      .post('/api/your-features')
      .send({ name: 'Test Feature' })
      .expect(201);
    
    expect(response.body.name).toBe('Test Feature');
  });
});
```

## Chrome Extension Integration

### Extension Component Guidelines

1. **Use Manifest V3**: Follow latest Chrome extension standards
2. **Implement proper messaging**: Background/content script communication
3. **Handle permissions**: Request minimal necessary permissions
4. **Add error handling**: Graceful degradation

### Background Script Integration

```typescript
// background.ts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'your-feature-action') {
    // Handle your feature action
    handleYourFeatureAction(request.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open
  }
});
```

### Content Script Integration

```typescript
// content.ts
function integrateYourFeature() {
  // Add your feature to web pages
  const elements = document.querySelectorAll('.target-selector');
  elements.forEach(element => {
    // Enhance element with your feature
    enhanceElement(element);
  });
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', integrateYourFeature);
} else {
  integrateYourFeature();
}
```

## Build System Integration

### Package.json Configuration

```json
{
  "name": "@the-new-fuse/your-feature",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest"
  },
  "dependencies": {
    // Your dependencies
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Turbo Integration

Add to root `turbo.json`:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Documentation Requirements

### Required Documentation

1. **README.md**: Overview and quick start
2. **API.md**: Detailed API documentation
3. **INTEGRATION.md**: Integration guide
4. **CHANGELOG.md**: Version history
5. **Examples/**: Usage examples

### Documentation Template

```markdown
# Your Feature

Brief description of your feature.

## Installation

\`\`\`bash
npm install @the-new-fuse/your-feature
\`\`\`

## Usage

\`\`\`typescript
import { YourFeature } from '@the-new-fuse/your-feature';

const feature = new YourFeature();
feature.doSomething();
\`\`\`

## API Reference

### Methods

#### `doSomething()`

Description of what this method does.

**Parameters:**
- `param1` (string): Description
- `param2` (number, optional): Description

**Returns:**
- `Promise<Result>`: Description of return value

## Examples

See `examples/` directory for complete examples.
```

## Quality Assurance

### Code Quality Checklist

- [ ] TypeScript strict mode enabled
- [ ] ESLint rules passing
- [ ] Prettier formatting applied
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Documentation complete
- [ ] Examples provided
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Accessibility considerations addressed

### Performance Considerations

1. **Lazy Loading**: Use dynamic imports for large components
2. **Memoization**: Use React.memo for expensive components
3. **Bundle Size**: Monitor and optimize package size
4. **Caching**: Implement appropriate caching strategies
5. **Database Queries**: Optimize queries and use indexes

## Deployment Integration

### Environment Configuration

```bash
# Development
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/newfuse_dev

# Production
NODE_ENV=production
DATABASE_URL=postgresql://prod-server:5432/newfuse_prod
```

### Docker Integration

```dockerfile
# Add to main Dockerfile if needed
COPY packages/your-feature ./packages/your-feature
RUN cd packages/your-feature && npm install && npm run build
```

## Troubleshooting

### Common Issues

**Build Errors**
- Check TypeScript configuration
- Verify all dependencies are installed
- Ensure proper import/export statements

**Runtime Errors**
- Check browser console for detailed errors
- Verify service registration
- Check API endpoint availability

**Integration Failures**
- Verify package.json configurations
- Check Turbo pipeline settings
- Ensure proper TypeScript types

### Debug Mode

Enable debug logging:

```typescript
// Set debug mode
process.env.DEBUG = 'your-feature:*';

// Use debug logging
import debug from 'debug';
const log = debug('your-feature:main');

log('Debug message');
```

## Support

For integration support:

1. Check existing documentation
2. Review similar implementations
3. Create issue in repository
4. Contact development team

## Contributing

1. Fork the repository
2. Create feature branch
3. Follow integration guidelines
4. Add tests and documentation
5. Submit pull request

---

*Integration guidelines for The New Fuse platform*
*Last updated: June 2025*
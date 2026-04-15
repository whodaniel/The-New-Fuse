# Development Guide

## Prerequisites

- Node.js 16+
- Redis 6+
- PostgreSQL 13+
- TypeScript 4.5+
- Git

## Project Setup

```bash
# Clone repository
git clone [repository-url]
cd the-new-fuse

# Install dependencies
yarn install

# Set up environment
cp .env.example .env
# Edit .env with your configuration
```

## Project Structure

```
/
├── packages/               # Monorepo packages
│   ├── ui/                # React components
│   ├── api/               # NestJS backend
│   ├── utils/             # Shared utilities
│   └── redis-communication/ # Redis integration
├── docs/                  # Documentation
├── tests/                 # Test suites
└── package.json          # Project configuration
```

## Component Development

### React Components

```typescript
// Example component structure
import React from 'react';
import { useStore } from ''store'' (see below for file content);

interface Props {
  // Props definition
}

export const Component: React.FC<Props> = ({ }) => {
  // Implementation
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### NestJS Services

```typescript
// Example service structure
import { Injectable } from '@nestjs/common';

@Injectable()
export class Service {
  constructor() {
    // Initialize
  }

  async process(): Promise<void> {
    // Implementation
  }
}
```

## Testing

### Unit Tests
- **Framework**: Jest
- **Coverage Target**: 80%
- **Focus Areas**:
  - Models and data validation
  - Service layer business logic
  - Utility functions
  - State management
  - WebSocket message handling

```typescript
import { render, screen } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('text')).toBeInTheDocument();
  });
});
```

### Integration Tests
- **Framework**: Cypress
- **Coverage Target**: 70%
- **Focus Areas**:
  - API endpoints
  - Database operations
  - Authentication flows
  - WebSocket connections
  - External service integrations

```typescript
import { Test } from '@nestjs/testing';
import { Service } from './service';

describe('Service Integration', () => {
  let service: Service;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [Service],
    }).compile();

    service = module.get(Service);
  });

  it('processes correctly', async () => {
    // Test implementation
  });
});
```

### End-to-End Testing
- **Framework**: Selenium
- **Coverage Target**: 50%
- **Focus Areas**:
  - User workflows
  - Cross-browser compatibility
  - Mobile responsiveness
  - Performance metrics
  - Error scenarios

## Code Style

### TypeScript
- Use strict mode
- Implement interfaces
- Document with TSDoc
- Use type inference
- Handle errors properly

### React
- Use functional components
- Implement hooks correctly
- Follow component structure
- Handle side effects
- Manage state properly

### NestJS
- Use decorators appropriately
- Implement dependency injection
- Follow module structure
- Handle errors properly
- Document APIs

## Deployment

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

## Best Practices

1. Code Quality
   - Write clean, readable code
   - Add proper documentation
   - Follow naming conventions
   - Implement error handling
   - Write comprehensive tests

2. Performance
   - Optimize bundle size
   - Implement lazy loading
   - Use proper caching
   - Monitor performance
   - Handle memory properly

3. Security
   - Validate input
   - Implement authentication
   - Handle sensitive data
   - Follow security best practices
   - Monitor for vulnerabilities

## Database Setup

### Development Environment (SQLite)

SQLite handles persistent storage of conversation history, metadata, and system state:

#### Resources Table
Stores shared resources within workspaces.
```sql
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_workspace ON resources(workspace_id);
```

#### Shared Context Table
Stores context information shared between agents.
```sql
CREATE TABLE shared_context (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence REAL NOT NULL,
  added_by TEXT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sources TEXT
);

CREATE INDEX idx_context_workspace ON shared_context(workspace_id);
```

#### Active Agents Table
Tracks currently active agents in workspaces.
```sql
CREATE TABLE active_agents (
  workspace_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workspace_id, agent_id)
);
```

#### Conversations Table
```sql
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id TEXT PRIMARY KEY,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);
```

#### Messages Table
```sql
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    content TEXT NOT NULL,
    role TEXT NOT NULL,
    type TEXT NOT NULL,
    from_agent TEXT,
    to_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
);
```

#### Metadata Versions Table
```sql
CREATE TABLE IF NOT EXISTS metadata_versions (
    version_id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    metadata TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Metadata Changes Table
```sql
CREATE TABLE IF NOT EXISTS metadata_changes (
    change_id TEXT PRIMARY KEY,
    version_id INTEGER,
    agent_id TEXT NOT NULL,
    change_type TEXT NOT NULL,
    change_description TEXT,
    trigger_event TEXT,
    story_context TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_id) REFERENCES metadata_versions(version_id)
);
```

#### Character Arcs Table
```sql
CREATE TABLE IF NOT EXISTS character_arcs (
    arc_id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    arc_name TEXT NOT NULL,
    description TEXT,
    goals TEXT,
    milestones TEXT,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    completion_time DATETIME,
    status TEXT DEFAULT 'in_progress'
);
```

#### Agent Metadata Table
```sql
CREATE TABLE IF NOT EXISTS agent_metadata (
    agent_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    capabilities TEXT,
    personality_traits TEXT,
    communication_style TEXT,
    expertise_areas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Production Environment (PostgreSQL)

For production deployment, we will migrate to PostgreSQL with the following changes:

1. Use UUID type for ID fields instead of TEXT
2. Add proper foreign key constraints
3. Implement row-level security for multi-tenant isolation
4. Add additional indexes for performance optimization
5. Implement proper connection pooling
6. Set up replication for high availability

The schema will be updated with specific PostgreSQL implementation details when we move to production.

### Redis (Temporary State & Agent Communication)

Redis is used for real-time agent communication and temporary state storage:

#### Agent Communication Channels
- `AI_COORDINATION_CHANNEL`: For agent coordination messages
- `AI_TASK_CHANNEL`: For task-related messages
- `AI_RESULT_CHANNEL`: For task results

#### Temporary State Keys
- `agent:{agentId}:heartbeat`: Agent heartbeat timestamps
- `agent:{agentId}:status`: Current agent status
- `monitor:response_time`: Agent response time metrics
- `monitor:msg_count`: Message count metrics
- `monitor:tool_usage`: Tool usage statistics
- `monitor:errors`: Error rate tracking
- `monitor:agent_load`: Agent load metrics

## Testing Strategy

### Testing Framework Stack

#### Unit Testing
- **Framework**: Jest
- **Coverage Target**: 80%
- **Focus Areas**:
  - Models and data validation
  - Service layer business logic
  - Utility functions
  - State management
  - WebSocket message handling

#### Integration Testing
- **Framework**: Cypress
- **Coverage Target**: 70%
- **Focus Areas**:
  - API endpoints
  - Database operations
  - Authentication flows
  - WebSocket connections
  - External service integrations

#### End-to-End Testing
- **Framework**: Selenium
- **Coverage Target**: 50%
- **Focus Areas**:
  - User workflows
  - Cross-browser compatibility
  - Mobile responsiveness
  - Performance metrics
  - Error scenarios

### Test Categories

#### Smoke Tests (Priority 1)
- User registration and login
- Agent creation and configuration
- Pipeline creation and execution
- Basic WebSocket connectivity
- Core API endpoints

#### Critical Path Tests (Priority 2)
- Complete user authentication flow
- Agent interaction scenarios
- Pipeline stage transitions
- Real-time updates via WebSocket
- Error handling and recovery

#### Neural Memory Tests (Priority 2)
- Vector embedding generation and storage
- Similarity search performance
- Pattern recognition accuracy
- Memory retrieval latency
- Concurrent memory operations
- Memory cleanup and garbage collection

#### WebSocket Tests (Priority 2)
- Connection stability under load
- Reconnection behavior
- Message ordering and delivery
- Binary message handling
- Connection pooling
- Error recovery scenarios
- Load balancing behavior

#### Performance Tests (Priority 3)
- Load testing (Artillery)
- Stress testing
- Memory leak detection
- Database query optimization
- WebSocket connection limits

### Testing Environment

#### Development
- Local development environment
- SQLite database for rapid testing
- Mock external services
- Instant feedback loop

#### Staging
- Production-like environment
- PostgreSQL database
- Limited external service integration
- Performance monitoring

#### Production
- Smoke tests only
- Synthetic monitoring
- Error tracking
- Performance metrics

### Continuous Integration

#### Pre-commit Hooks
- Linting (ESLint)
- Type checking (TypeScript)
- Unit test execution
- Code formatting (Prettier)

#### CI Pipeline
- Automated test execution
- Coverage reporting
- Performance benchmarking
- Security scanning

### Test Data Management

#### Test Data Generation
- Faker.js for realistic data
- Seeding scripts for consistent state
- Clean up procedures
- Data versioning

#### Test Isolation
- Independent test databases
- Transaction rollback
- Container isolation
- State reset between tests

### Error Testing

#### Error Scenarios
- Network failures
- Database errors
- Invalid input handling
- Authentication failures
- WebSocket disconnections

#### Recovery Testing
- Auto-reconnection logic
- Data consistency checks
- State recovery procedures
- Failover mechanisms

### Security Testing

#### Security Scans
- OWASP dependency check
- Static code analysis
- Penetration testing
- API security testing

#### Authentication Testing
- Token validation
- Session management
- Permission checks
- Rate limiting

### Mobile Testing

#### Responsive Design
- Multiple viewport sizes
- Touch interaction
- Gesture support
- Orientation changes

#### Platform Specific
- iOS Safari
- Android Chrome
- PWA functionality
- Offline capabilities

### Documentation

#### Test Documentation
- Test case descriptions
- Setup procedures
- Expected results
- Edge cases
- Known limitations

#### Coverage Reports
- Jest coverage reports
- Cypress dashboard
- Selenium test results
- Performance metrics

### Monitoring & Alerts

#### Test Monitoring
- Test execution time
- Failure rates
- Coverage trends
- Performance regression

#### Alert Configuration
- Critical test failures
- Coverage drops
- Performance degradation
- Security vulnerabilities

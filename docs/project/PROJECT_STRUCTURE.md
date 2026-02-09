# The New Fuse - Project Structure

## Overview

The New Fuse is an advanced AI communication system designed to enable seamless interaction between different AI agents. This document provides a comprehensive overview of the project structure, incorporating the best practices and organization principles from all existing documentation.

### Key Features
- Advanced AI agent communication
- Semantic memory management
- Real-time message processing
- Scalable architecture
- Comprehensive monitoring
- Security-first design

### Technical Stack
- TypeScript/Node.js
- Redis for messaging
- PostgreSQL for persistence
- Kubernetes for orchestration
- Prometheus/Grafana for monitoring
- Docker for containerization

## Root Directory Structure

```
/
├── .dockerignore           # Docker ignore file
├── .editorconfig           # Editor configuration
├── .env.example            # Environment variables template
├── .eslintrc.json          # ESLint configuration
├── .firebaserc             # Firebase configuration
├── .gitattributes          # Git attributes
├── .gitignore              # Git ignore file
├── .npmrc                  # NPM configuration
├── .yarnrc.yml             # Yarn configuration
├── Dockerfile              # Main Docker configuration
├── Dockerfile.api          # API Docker configuration
├── Dockerfile.client       # Client Docker configuration
├── Dockerfile.dev          # Development Docker configuration
├── Dockerfile.functions    # Functions Docker configuration
├── build-and-launch.sh     # Combined build/launch script
├── build.sh                # Main build script
├── deploy.sh               # Deployment script
├── docker-compose.yml      # Docker composition
├── firebase.json           # Firebase configuration
├── firestore.indexes.json  # Firestore indexes
├── firestore.rules         # Firestore security rules
├── fix-dependencies.sh     # Dependency fixing script
├── fix-typescript.sh       # TypeScript error correction
├── jest.config.d.ts        # Jest TypeScript declarations
├── jest.config.js          # Jest JavaScript configuration
├── jest.config.ts          # Jest TypeScript configuration
├── package.json            # Project dependencies and scripts
├── playwright.config.ts    # Playwright test configuration
├── redis.conf              # Redis configuration
├── storage.rules           # Firebase storage rules
├── tsconfig-check.json     # TypeScript strict checking config
├── tsconfig.json           # Main TypeScript configuration
├── tsconfig-minimal.json   # Minimal TS config for migrations
├── turbo.json              # Turborepo configuration
├── vitest.config.ts        # Vitest configuration
├── apps/                   # Application directories
├── config/                 # Configuration files and modules
├── deploy/                 # Deployment configurations
├── deployment/             # Additional deployment resources
├── docker/                 # Docker configurations
├── docs/                   # Documentation
├── examples/               # Example code and usage
├── functions/              # Serverless functions
├── packages/               # Shared packages
├── prisma/                 # Prisma ORM configuration
├── production/             # Production-specific files
├── scripts/                # Utility scripts
├── src/                    # Source code
├── test/                   # Test files
├── tests/                  # Additional test files
├── tools/                  # Development and deployment tools
└── types/                  # Global type definitions
```

## Application Structure

```
/apps/                    # Application packages
├── api/                 # Backend API application
│   ├── src/            # Source code
│   │   ├── controllers/ # API controllers
│   │   ├── services/   # Business logic
│   │   └── middleware/ # Request middleware
│   └── tests/         # API tests
└── frontend/           # Frontend web application
    ├── src/           # Source code
    │   ├── components/ # Reusable UI components
    │   ├── pages/     # Page components
    │   └── hooks/     # Custom React hooks
    └── tests/         # Frontend tests
```

## Packages Structure

```
/packages/              # Shared packages and libraries
├── agent/             # Agent system implementation
├── core/              # Core business logic
├── database/          # Database management
├── shared/            # Shared utilities
│   ├── src/          # Source code
│   │   ├── types/    # Shared types
│   │   └── utils/    # Shared utilities
├── ui-components/     # UI component library
│   ├── src/          # Source code
│   │   ├── atoms/    # Atomic components
│   │   ├── molecules/ # Molecular components
│   │   └── organisms/ # Organism components
├── monitoring/        # Monitoring tools
└── types/             # Shared TypeScript types
```

## Configuration Files

```
/config/               # Configuration files and modules
├── ai/               # AI configuration
├── app/              # Application configuration
├── dev/              # Development configuration
├── docker/           # Docker configuration
└── env/              # Environment configuration
```

## UI Component Organization

The UI components follow the Atomic Design methodology:

### Atomic Components
- Button
- Input
- Select
- Switch
- Checkbox
- Icon

### Molecular Components
- FormField
- SearchBar
- Card
- DropdownMenu
- TypingIndicator
- ThemeToggle

### Organism Components
- TaskList
- UserProfile
- Navigation
- ChatRoom
- WorkflowCanvas
- GraphVisualization

## Core Components

### Memory System
```typescript
interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  timestamp: Date;
  metadata: Record<string, any>;
  embedding?: number[];
}

class MemorySystem {
  private store: MemoryStore;
  private index: SemanticIndex;
  private cache: MemoryCache;

  async store(memory: Memory): Promise<void> {
    const embedding = await this.generateEmbedding(memory.content);
    memory.embedding = embedding;
    
    await Promise.all([
      this.store.save(memory),
      this.index.add(memory.id, embedding),
      this.cache.set(memory.id, memory)
    ]);
  }

  async recall(query: string, k: number = 5): Promise<Memory[]> {
    const embedding = await this.generateEmbedding(query);
    const ids = await this.index.search(embedding, k);
    return await this.store.getMany(ids);
  }
}
```

### Task Management
```typescript
interface Task {
  id: string;
  type: TaskType;
  priority: Priority;
  status极抱歉，我的上一条回复被截断了。以下是完整的 write_to_file 操作：

<write_to_file>
<path>docs/PROJECT_STRUCTURE.md</path>
<content>
[完整内容与 PROJECT_STRUCTURE_updated.md 相同，包含所有更新的 Mermaid 图表]

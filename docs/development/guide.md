# The New Fuse Development Guide

This guide provides detailed instructions for setting up, developing, and deploying The New Fuse project.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Development Environment Setup](#development-environment-setup)
3. [Development Workflow](#development-workflow)
4. [Build Process](#build-process)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

## Project Structure

The New Fuse is a monorepo project with the following structure:

```
fuse/
├── apps/                 # Application modules
│   ├── frontend/         # React frontend application
│   ├── api/              # Backend API service
│   └── message-broker/   # Message broker service
├── packages/             # Shared packages and libraries
│   ├── components/       # UI components
│   ├── core/             # Core functionality
│   ├── database/         # Database integration
│   ├── testing/          # Testing utilities
│   ├── types/            # TypeScript type definitions
│   ├── ui-components/    # UI component library
│   ├── utils/            # Utility functions
│   └── vscode-extension/ # VS Code extension integration
├── prisma/               # Prisma schema and migrations
├── scripts/              # Utility scripts
└── src/                  # Main source code
    ├── agent/            # Agent implementation
    ├── components/       # React components
    ├── core/             # Core services
    ├── mcp/              # Model Context Protocol implementation
    ├── services/         # Business logic services
    └── utils/            # Utility functions
```

## Development Environment Setup

### Prerequisites

- Node.js 18+
- npm 8+
- Docker and Docker Compose
- PostgreSQL (for local development without Docker)
- Redis (for local development without Docker)

### Option 1: Local Development (Recommended for first-time setup)

1. Clone the repository:

```bash
git clone https://github.com/whodaniel/fuse.git
cd fuse
```

2. Run the setup script to install dependencies and build essential packages:

```bash
./setup-project.sh
```

3. Start the development server:

```bash
npm run dev
```

This will start the frontend at http://localhost:3000 and the API at http://localhost:3001.

### Option 2: Docker Development

1. Start the development environment using Docker:

```bash
./dev-launch.sh
```

This will start all services in Docker containers.

## Development Workflow

### Package Development Order

When developing new features or making changes, follow this order to ensure dependencies are properly built:

1. `@the-new-fuse/types` - TypeScript type definitions
2. `@the-new-fuse/utils` - Utility functions
3. `@the-new-fuse/core` - Core functionality
4. `@the-new-fuse/ui` - UI components
5. `@the-new-fuse/feature-tracker` - Feature tracking functionality
6. `@the-new-fuse/feature-suggestions` - Feature suggestions functionality
7. Applications (frontend, api, etc.)

### Building Specific Packages

To build specific packages:

```bash
# Build types package
npm run build:types

# Build utils package
npm run build:utils

# Build core package
npm run build:core

# Build UI package
npm run build:ui

# Build feature-tracker package
npm run build:feature-tracker

# Build feature-suggestions package
npm run build:feature-suggestions
```

### Running in Development Mode

To run the project in development mode:

```bash
npm run dev
```

This will start all services in parallel using Turbo.

## Build Process

### Building for Production

To build the project for production:

```bash
./build-production.sh
```

This script will:

1. Clean up previous builds
2. Install dependencies
3. Build packages in the correct order
4. Build all applications

### Manual Build Process

If you prefer to build manually:

```bash
# Install dependencies
npm install

# Build packages in the correct order
npm run build:types
npm run build:utils
npm run build:core
npm run build:ui
npm run build:feature-tracker
npm run build:feature-suggestions

# Build all applications
npm run build
```

## Testing

### Running Tests

To run all tests:

```bash
npm run test
```

To run specific test suites:

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## Deployment

### CI/CD Pipeline
This project uses GitHub Actions (`.github/workflows/ci-cd.yml`) to automate testing, building, and deployment on pushes and pull requests to `main` and `staging`. Sample workflow:

```yaml
name: Dev-to-Prod CI/CD
on:
  push:
    branches: [ main, staging ]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install --frozen-lockfile
      - run: yarn lint
      - run: yarn test
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      - name: Build & push images
        run: |
          docker build -f docker/Dockerfile.api -t ghcr.io/${{ github.repository }}/api:${{ github.sha }} .
          docker build -f docker/Dockerfile.frontend -t ghcr.io/${{ github.repository }}/frontend:${{ github.sha }} .
          docker push ghcr.io/${{ github.repository }}/api:${{ github.sha }}
          docker push ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Cloud Run
        run: |
          SERVICE=$( [[ "${GITHUB_REF}" == "refs/heads/staging" ]] && echo "api-staging" || echo "api" )
          gcloud run deploy $SERVICE --image ghcr.io/${{ github.repository }}/api:${{ github.sha }} --region us-central1 --platform managed --allow-unauthenticated
        env:
          GITHUB_REF: ${{ github.ref }}
```

### Docker Deployment

For production deployment:

```bash
# Build for production
./build-production.sh

# Start the production environment
docker-compose up -d
```

### Manual Deployment

For manual deployment:

1. Build the project for production:

```bash
npm run build
```

2. Start the services:

```bash
npm run start
```

## Troubleshooting

### Common Issues

1. **Dependency Issues**

If you encounter dependency issues, try cleaning the project and reinstalling:

```bash
./dev-cleanup.sh
./setup-project.sh
```

2. **Port Conflicts**

If you have port conflicts, ensure no other services are running on ports 3000, 3001, 5432, or 6379.

3. **Database Connection Issues**

Ensure PostgreSQL is running and accessible. You can check the connection with:

```bash
docker-compose exec postgres psql -U postgres -d fuse -c "SELECT 1"
```

4. **TypeScript Declaration Errors**

If you encounter TypeScript declaration errors with syntax like `: any:`, run the fix-declarations.mjs script:

```bash
node fix-declarations.mjs
```

5. **Build Errors**

If you encounter build errors, try building the packages in the correct order:

```bash
npm run build:types
npm run build:utils
npm run build:core
npm run build:ui
npm run build:feature-tracker
npm run build:feature-suggestions
npm run build
```

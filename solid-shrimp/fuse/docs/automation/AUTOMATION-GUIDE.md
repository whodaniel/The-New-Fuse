# The New Fuse Automation Guide

This guide provides instructions on how to use the automation scripts to build and run The New Fuse application.

## Master Development Script

The `run-development.sh` script runs the entire development process:

```bash
./run-development.sh
```

This script performs the following steps:
1. Builds the project using the comprehensive build script
2. Runs the tests
3. Starts the application (either frontend and backend separately or using Docker)

## Build Scripts

### Comprehensive Build

The `comprehensive-build.sh` script runs all the fixes and builds the project:

```bash
./comprehensive-build.sh
```

This script performs the following steps:
1. Fixes TypeScript errors
2. Fixes database composite issue
3. Fixes frontend imports
4. Fixes Chakra UI imports
5. Fixes React components
6. Fixes database migrations
7. Fixes Jest configuration
8. Builds the project incrementally

### Incremental Build

The `build-incremental.sh` script builds the project incrementally, starting with the most fundamental packages:

```bash
./build-incremental.sh
```

## Run Scripts

### Frontend

The `run-frontend.sh` script runs the frontend development server:

```bash
./run-frontend.sh
```

The frontend will be available at http://localhost:3000.

### Backend

The `run-backend.sh` script runs the backend development server:

```bash
./run-backend.sh
```

### MCP Server

The `run-mcp-server.sh` script runs the MCP server:

```bash
./run-mcp-server.sh
```

### Docker

The `run-docker-app.sh` script runs the entire application using Docker:

```bash
./run-docker-app.sh
```

### Tests

The `run-tests.sh` script runs all the tests:

```bash
./run-tests.sh
```

## Fix Scripts

### TypeScript Errors

The `fix-all-typescript-errors.sh` script fixes common TypeScript errors in the project:

```bash
./fix-all-typescript-errors.sh
```

### Database Migrations

The `fix-database-migrations.sh` script fixes the database migration issues:

```bash
./fix-database-migrations.sh
```

### Frontend Imports

The `fix-frontend-imports.sh` script fixes the module resolution issues in the frontend package:

```bash
./fix-frontend-imports.sh
```

### Chakra UI Imports

The `fix-chakra-imports.sh` script fixes the Chakra UI imports in the frontend package:

```bash
./fix-chakra-imports.sh
```

### React Components

The `fix-react-components.sh` script fixes the React component issues in the frontend package:

```bash
./fix-react-components.sh
```

### Database Composite

The `fix-database-composite.sh` script fixes the database composite issue:

```bash
./fix-database-composite.sh
```

### Jest Configuration

The `fix-jest-config.sh` script fixes the Jest configuration for ES modules:

```bash
./fix-jest-config.sh
```

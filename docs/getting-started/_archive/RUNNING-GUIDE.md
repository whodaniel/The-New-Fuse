# The New Fuse - Running Guide

This guide provides instructions on how to build, run, and test The New Fuse project.

## Prerequisites

- Node.js v18+ (recommended v18.20.2)
- Yarn v3+ (recommended v3.6.3)
- Docker and Docker Compose
- Git

## Project Structure

The project follows a monorepo structure using Yarn workspaces:

- `/apps` - Contains standalone applications
  - `/frontend` - The frontend UI application
  - `/backend` - The backend service
  - `/api` - The API service
- `/packages` - Contains shared packages
  - `/types` - TypeScript types used across the project
  - `/utils` - Utility functions
  - `/core` - Core business logic
  - `/features` - Feature components and logic
  - `/api-types` - API type definitions
  - `/shared` - Shared code and utilities
  - And more...

## Running Options

There are several ways to run The New Fuse project:

### Option 1: Comprehensive Development Setup

This option builds all packages in the correct order and runs the full application:

```bash
./run-development.sh
```

When prompted, you can choose to:
1. Run frontend and backend separately
2. Run using Docker

### Option 2: Docker Only

This option runs the application using Docker without rebuilding all packages:

```bash
./run-docker-only.sh
```

### Option 3: Docker with Browser View

This option runs Docker services and opens a browser to view the frontend UI:

```bash
./run-and-open-browser.sh
```

### Option 4: Complete Rebuild and Run

This option performs a clean rebuild of all packages and restarts all Docker services:

```bash
./rebuild-and-run.sh
```

### Option 4: Individual Components

You can also run individual components:

- Frontend: `./run-frontend.sh`
- Backend: `./run-backend.sh`
- MCP Server: `./run-mcp-server.sh`

## Building

To build all packages in the correct dependency order:

```bash
./comprehensive-build.sh
```

## Checking Services

To check the status of all running services:

```bash
./check-services.sh
```

## Docker Commands

- Start Docker services: `docker compose up -d`
- Stop Docker services: `docker compose down`
- View logs: `docker compose logs`
- View specific service logs: `docker compose logs [service-name]`

## Accessing Services

Once the application is running:

- Frontend UI: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3002](http://localhost:3002)
- API Service: [http://localhost:3001](http://localhost:3001)

## Troubleshooting

If you encounter issues:

1. Check service status: `./check-services.sh`
2. Verify Docker is running
3. View detailed logs: `./view-logs.sh` or for a specific service `./view-logs.sh typescript-frontend`
4. Check for port conflicts: `lsof -i :3000` (or other port numbers)
5. Restart Docker services: `docker compose restart`
6. Rebuild from scratch: `./rebuild-and-run.sh`

### Common Issues and Solutions

1. **Frontend not loading**
   - Check if the frontend container is running: `docker compose ps typescript-frontend`
   - View frontend logs: `./view-logs.sh typescript-frontend`
   - Verify port 3000 is accessible: `curl -I http://localhost:3000`

2. **Backend API errors**
   - Check backend logs: `./view-logs.sh typescript-backend`
   - Verify the backend container is healthy: `docker compose ps typescript-backend`
   - Check backend is accessible: `curl -I http://localhost:3002`

3. **Docker build errors**
   - Check for Dockerfile syntax errors
   - Ensure all required files are in place
   - Try rebuilding with: `docker compose build --no-cache`

4. **Missing dependencies**
   - Rebuild all packages: `./comprehensive-build.sh`
   - Check yarn workspace configuration
   - Verify package.json files for each package

## Development Tasks

For VS Code users, the following tasks are available:

- **Kill Port Processes** - Kill processes using development ports
- **Check Docker Ports** - Check Docker port availability
- **Build Production Pipeline** - Run the production build process
- **Start WebSocket Server** - Start the WebSocket server for real-time communication

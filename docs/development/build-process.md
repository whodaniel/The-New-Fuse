# The New Fuse Build Process Guide

This guide provides detailed instructions for building and running The New Fuse project in different environments.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Development Environment Setup](#development-environment-setup)
3. [Build Process](#build-process)
4. [Running the Application](#running-the-application)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

## Project Structure

The New Fuse is a monorepo project with the following structure:

```
fuse/
├── apps/                 # Application modules
│   ├── frontend/         # React frontend application
│   ├── api/              # Backend API service
│   └── message-broker/   # Message broker service
├── packages/             # Shared packages and libraries
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── core/             # Core functionality
│   ├── ui/               # UI components
│   └── ...               # Other shared packages
```

## Development Environment Setup

### Prerequisites

- Node.js 18+
- npm 8+ or Yarn 3.6.0+
- Docker and Docker Compose (recommended for containerized development)
- PostgreSQL (for local development without Docker)
- Redis (for local development without Docker)

### Option 1: Docker-based Development Environment (Recommended)

This approach uses Docker to run the complete development environment, including the frontend, API, message broker, PostgreSQL, and Redis:

```bash
./run-dev-docker.sh
```

This script:
1. Checks if Docker is running
2. Builds and starts all Docker containers defined in docker-compose.dev.yml
3. Provides access to the frontend at http://localhost:3000, API at http://localhost:3001, and message broker at http://localhost:3002

### Option 2: Frontend-only Docker Setup

If you only need to run the frontend application:

```bash
./run-frontend-docker.sh
```

This script builds and starts a Docker container for just the frontend application.

### Option 3: Comprehensive Local Setup

This approach sets up the entire project locally with all dependencies and builds essential packages:

```bash
./comprehensive-setup.sh
```

This script:
1. Fixes package.json to use a valid packageManager field
2. Sets up Yarn properly
3. Installs all dependencies
4. Builds essential packages in the correct order
5. Starts the frontend development server

### Option 4: Frontend-only Local Setup

This approach focuses only on running the frontend application locally:

```bash
./run-frontend.sh
```

This script navigates to the frontend directory and starts the development server.

## Build Process

### Complete Build Process

To build all components of The New Fuse project (frontend, API, message broker, VS Code extension, and Chrome extension), use the comprehensive build script:

```bash
./build-all.sh
```

This script:
1. Fixes TypeScript declaration errors
2. Installs dependencies
3. Builds essential packages in the correct order
4. Builds all applications
5. Builds the VS Code extension
6. Builds the Chrome extension
7. Builds Docker images

### Manual Build Process

If you prefer to build manually, follow this order to ensure all dependencies are properly built:

1. Fix TypeScript declaration errors: `node fix-declarations.mjs`
2. Build types package: `npm run build:types`
3. Build utils package: `npm run build:utils`
4. Build core package: `npm run build:core`
5. Build UI package: `npm run build:ui`
6. Build feature-tracker package: `npm run build:feature-tracker`
7. Build feature-suggestions package: `npm run build:feature-suggestions`
8. Build all applications: `npm run build`

### Building Specific Components

#### VS Code Extension

To build only the VS Code extension:

```bash
./build-vscode-extension.sh
```

#### Chrome Extension

To build only the Chrome extension:

```bash
./build-chrome-extension.sh
```

## Running the Application

### Development Mode

#### Docker-based Development (Recommended)

To run the complete application in development mode using Docker:

```bash
./run-dev-docker.sh
```

This will start all services in Docker containers:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Message Broker: http://localhost:3002
- PostgreSQL: localhost:5432
- Redis: localhost:6379

#### Frontend-only Development

To run only the frontend in development mode:

```bash
# Using Docker
./run-frontend-docker.sh

# Without Docker
./run-frontend.sh
```

#### Manual Development

To manually start the development servers:

```bash
# Start the frontend
cd apps/frontend
npm run dev

# Start the API
cd apps/api
npm run dev

# Start the message broker
cd apps/message-broker
npm run dev
```

### Production Mode

To run the application in production mode:

```bash
# Build for production
./build-all.sh

# Start the production environment using Docker
./run-prod-docker.sh
```

The production services will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Message Broker: http://localhost:3002

## Production Deployment

### Docker-based Deployment (Recommended)

For production deployment, use Docker Compose:

```bash
# Build and start the production environment
./run-prod-docker.sh
```

This will build and start all services in Docker containers with proper configuration for production.

### Cloud Deployment

For cloud deployment, you can use the Docker images built by the `build-all.sh` script. The images can be pushed to a container registry and deployed to a cloud provider like AWS, Google Cloud, or Azure.

#### Example: AWS Deployment

1. Push Docker images to Amazon ECR:

```bash
# Authenticate with ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

# Tag images
docker tag fuse-frontend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/fuse-frontend:latest
docker tag fuse-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/fuse-api:latest
docker tag fuse-message-broker:latest <account-id>.dkr.ecr.<region>.amazonaws.com/fuse-message-broker:latest

# Push images
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/fuse-frontend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/fuse-api:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/fuse-message-broker:latest
```

2. Deploy to ECS or EKS using the pushed images.

### VS Code Extension Deployment

To deploy the VS Code extension:

1. Build the extension:

```bash
./build-vscode-extension.sh
```

2. Install the extension in VS Code:
   - Open VS Code
   - Go to Extensions view (Ctrl+Shift+X)
   - Click on the "..." menu and select "Install from VSIX..."
   - Navigate to `packages/vscode-extension/dist/the-new-fuse.vsix` and select it

### Chrome Extension Deployment

To deploy the Chrome extension:

1. Build the extension:

```bash
./build-chrome-extension.sh
```

2. Install the extension in Chrome:
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Navigate to `packages/chrome-extension/dist` and select it

## Troubleshooting

### Common Issues

1. **Workspace Dependencies Issues**

If you encounter issues with workspace dependencies, try:

```bash
# Fix package.json
sed -i.bak 's/"packageManager": "npm@10.2.4"/"packageManager": "yarn@4.9.1"/' package.json

# Set up Yarn properly
corepack enable
yarn set version 4.9.1
yarn config set nodeLinker node-modules

# Install dependencies
yarn install
```

2. **TypeScript Declaration Errors**

If you encounter TypeScript declaration errors with syntax like `: any:`, run:

```bash
node fix-declarations.mjs
```

3. **Build Errors**

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

4. **Port Conflicts**

If you have port conflicts, ensure no other services are running on ports 3000, 3001, 3002, 5432, or 6379. You can check for processes using these ports with:

```bash
# macOS/Linux
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :3002
sudo lsof -i :5432
sudo lsof -i :6379

# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3002
netstat -ano | findstr :5432
netstat -ano | findstr :6379
```

5. **Docker Issues**

If you encounter issues with Docker, try:

```bash
# Stop all containers
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Remove all unused containers, networks, images, and volumes
docker system prune -a --volumes

# Rebuild and start containers
docker-compose up --build
```

6. **Missing Files or Directories**

If you encounter errors about missing files or directories, ensure that all required directories exist:

```bash
# Create necessary directories if they don't exist
mkdir -p apps/frontend/dist
mkdir -p apps/api/dist
mkdir -p apps/message-broker/dist
mkdir -p packages/vscode-extension/dist
mkdir -p packages/chrome-extension/dist
```

7. **Environment Variables**

If you encounter issues with environment variables, ensure that all required environment variables are set. You can create a `.env` file in the root directory with the necessary variables:

```bash
# Create .env file
cat > .env << EOL
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fuse
REDIS_URL=redis://localhost:6379
JWT_SECRET=development-secret-key
JWT_ISSUER=the-new-fuse
BROKER_PORT=3002
EOL
```

8. **VS Code Extension Issues**

If you encounter issues with the VS Code extension, try:

```bash
# Clean the VS Code extension directory
cd packages/vscode-extension
rm -rf node_modules dist
npm install
npm run build
```

9. **Chrome Extension Issues**

If you encounter issues with the Chrome extension, try:

```bash
# Clean the Chrome extension directory
cd packages/chrome-extension
rm -rf node_modules dist
npm install
npm run build
```

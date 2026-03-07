# Installation and Setup Guide

This guide provides detailed instructions for installing and setting up The New Fuse framework for development and production use.

## Prerequisites

Before installing Fuse, ensure you have the following prerequisites:

- **Node.js**: Version 16.x or higher
- **Yarn**: Version 1.22.x or higher
- **PostgreSQL**: Version 13.x or higher
- **Redis**: Version 6.x or higher
- **Docker** (optional): For containerized deployment
- **VS Code** (recommended): For optimal development experience

## Installation Options

### Option 1: Local Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/whodaniel/fuse.git
   cd fuse
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```
   # Application
   NODE_ENV=development
   PORT=3000
   API_PREFIX=/api
   
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/fuse_db
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   
   # Authentication
   JWT_SECRET=your-jwt-secret-key
   JWT_EXPIRATION=3600
   
   # Logging
   LOG_LEVEL=debug
   ```

4. **Initialize the database**

   ```bash
   yarn db:migrate
   yarn db:seed
   ```

5. **Build the project**

   ```bash
   yarn build
   ```

6. **Start the development server**

   ```bash
   yarn dev
   ```

### Option 2: Docker Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/whodaniel/fuse.git
   cd fuse
   ```

2. **Set up environment variables**

   Create a `.env` file (same as above)

3. **Build and start the Docker containers**

   ```bash
   docker-compose up -d
   ```

4. **Initialize the database inside the container**

   ```bash
   docker-compose exec app yarn db:migrate
   docker-compose exec app yarn db:seed
   ```

## VS Code Extension Setup

To integrate Fuse with VS Code:

1. **Ensure VS Code is installed**

2. **Install the VS Code extension**

   ```bash
   cd packages/vscode-extension
   yarn install
   yarn package
   code --install-extension fuse-vscode-*.vsix
   ```

3. **Configure the extension**

   Open VS Code settings (Ctrl+,) and set:
   
   ```json
   {
     "fuse.mcp.serverUrl": "http://localhost:3000",
     "fuse.mcp.enableAutoDiscovery": true
   }
   ```

4. **Initialize MCP Integration**

   Run the VS Code task: `Initialize MCP Integration`

## Quick Start with Scripts

Fuse provides helper scripts for common tasks:

### Using the Activation Script

```bash
# Make the script executable
chmod +x ./activate-fuse.sh

# Run the activation script (sets up environment and dependencies)
./activate-fuse.sh
```

### Setup MCP

```bash
# Run the Setup MCP task
yarn vscode:run-task "Setup MCP"
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

```bash
# Check the database connection
node src/scripts/check-db-connection.js

# Fix role enumeration issues (if they occur)
bash scripts/fix-role-enum-migration-comprehensive.sh
```

### MCP Integration Issues

If MCP integration fails:

1. Check the MCP configuration in `src/vscode-extension/mcp_config.json`
2. Run the test tool: `yarn vscode:run-task "Test MCP Tool"`
3. Consult `mcp_config.README.md` for configuration options

### Docker Issues

For Docker-related issues:

```bash
# View Docker logs
docker-compose logs

# Restart containers
docker-compose restart

# Rebuild containers
docker-compose up -d --build
```

## Advanced Configuration

### Scaling with Multiple Instances

For production environments with multiple instances:

1. Update your `.env` file with load balancer settings:

   ```
   LOAD_BALANCER_ENABLED=true
   INSTANCE_ID=instance-${HOSTNAME}
   ```

2. Ensure Redis is configured for shared state:

   ```
   REDIS_CLUSTER_ENABLED=true
   REDIS_NODES=redis-node-1:6379,redis-node-2:6379,redis-node-3:6379
   ```

### Security Hardening

For enhanced security in production:

1. Update your `.env` file:

   ```
   # Security
   ENFORCE_SSL=true
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   ENABLE_HELMET=true
   ```

2. Use secure JWT configuration:

   ```
   JWT_SECRET=<complex-random-string>
   JWT_REFRESH_SECRET=<different-complex-random-string>
   JWT_ALGORITHM=RS256
   ```

## Next Steps

After installation, consider:

1. Exploring the [API Documentation](./API_SPECIFICATION.md)
2. Running through the examples in `examples/`
3. Setting up a test workflow with `yarn workflow:create-example`
4. Reading the [Architecture Overview](./ARCHITECTURE.md) for deeper understanding
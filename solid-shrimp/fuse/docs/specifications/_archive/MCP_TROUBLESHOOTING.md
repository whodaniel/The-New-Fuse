# MCP Troubleshooting Guide

This document provides solutions for common issues encountered when working with the Model Context Protocol (MCP) in The New Fuse.

## Common Error: "Sorry, no response was returned"

If you're encountering the "Sorry, no response was returned" error, this typically indicates an issue with MCP integration or communication. Follow these steps to diagnose and resolve the issue.

### Quick Fix Steps

1. **Restart MCP Integration**
   ```bash
   # Run from the project root
   ./scripts/initialize-mcp.sh
   ./scripts/setup-mcp.sh
   ```

2. **Verify Docker Services**
   ```bash
   # Check if required containers are running
   docker ps | grep fuse
   ```

3. **Check MCP Server Health**
   ```bash
   curl http://localhost:3000/health
   ```

### Detailed Troubleshooting

#### 1. MCP Configuration Issues

The `mcp_config.json` file may have invalid configuration:

- **Missing or Invalid API Keys**: Replace placeholders like `YOUR_ACTUAL_BRAVE_SEARCH_API_KEY` with valid API keys
- **Incorrect Database Connection**: Verify the PostgreSQL connection string is correct
- **Docker Requirements**: Ensure Docker is running for services that require it

#### 2. Environment Setup

Ensure your environment is properly set up:

```bash
# Make sure all scripts are executable
./scripts/fix-permissions.sh

# Check environment variables
env | grep FUSE

# Verify the correct Node.js version
node --version  # Should be v16 or higher
```

#### 3. Network Issues

Check network connectivity:

```bash
# Test connection to MCP server
curl http://localhost:3000/ping

# Check if required ports are available
lsof -i :3000
lsof -i :6379  # Redis
lsof -i :5432  # PostgreSQL
```

#### 4. Log Analysis

Check logs for error messages:

```bash
# View MCP server logs
cat ./mcp/logs/mcp-server.log

# Check VS Code extension logs
cat ~/.vscode/extensions/fuse-*/logs/extension.log
```

#### 5. Database Issues

If the error is related to database connections:

```bash
# Reset the database
./scripts/reset-db-simple.sh

# Check database connection
node ./src/scripts/check-db-connection.js
```

### Specific Error Scenarios

#### Error: "Cannot find module..."

This indicates missing dependencies:

```bash
# Reinstall dependencies
yarn install

# Rebuild any native modules
yarn rebuild
```

#### Error: "Authentication failed"

Check API key and authentication settings:

1. Verify API keys in `mcp_config.json`
2. Check that environment variables are set correctly
3. Ensure your authentication tokens haven't expired

#### Error: "Docker is not running"

Docker must be running for several MCP servers:

1. Start Docker Desktop or the Docker service
2. Verify Docker is running with `docker info`
3. Restart the MCP setup process

## Advanced Debugging

If the above steps don't resolve the issue:

1. **Enable Debug Mode**
   ```bash
   # Set debug environment variable
   export FUSE_DEBUG=true
   
   # Restart MCP with verbose logging
   VERBOSE=true ./scripts/setup-mcp.sh
   ```

2. **Inspect Network Traffic**
   ```bash
   # Monitor MCP network requests
   tcpdump -i lo0 port 3000 -vv
   ```

3. **Check Resource Usage**
   ```bash
   # Monitor system resources
   top -o cpu
   ```

## Getting Further Help

If you're still experiencing issues after trying these steps:

1. Check the [GitHub Issues](https://github.com/whodaniel/fuse/issues) for similar problems
2. Join the [Discord community](https://discord.gg/thenewfuse) for real-time support
3. Create a new issue with detailed information about your environment and the steps you've taken

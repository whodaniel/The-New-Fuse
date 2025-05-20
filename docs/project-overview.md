# The New Fuse - Project Overview

## Introduction

The New Fuse is a platform for inter-LLM communication, facilitating enhanced interactions between language models and providing a structured environment for multi-agent AI systems. This document provides a comprehensive overview of the project architecture, components, and development workflow.

## Architecture

The project follows a monorepo structure using Turborepo for build orchestration, with the following key components:

### Core Components

- **Types Package**: Shared TypeScript type definitions
- **Utils Package**: Common utility functions
- **Core Package**: Core business logic and services
- **Database Package**: Database access and management
- **Feature Packages**: Specialized functionality modules
- **UI Package**: Shared UI components

### Applications

- **API**: Backend API service built with NestJS
- **Frontend**: React-based frontend application
- **VS Code Extension**: Extension for VS Code integration

### Infrastructure

- **Database**: PostgreSQL for data storage
- **Redis**: For caching and message queuing
- **Docker**: Containerization for development and deployment
- **Kubernetes**: Orchestration for production deployment

## Development Workflow

### Setup

1. Clone the repository
2. Install dependencies: `yarn install`
3. Generate database client: `yarn db:generate`
4. Run database migrations: `yarn db:migrate`
5. Start development servers: `yarn dev`

### Build Process

The build process follows a specific order to ensure dependencies are built correctly:

1. Build types package: `yarn build:types`
2. Build utils package: `yarn build:utils`
3. Build core package: `yarn build:core`
4. Build database package: `yarn build:database`
5. Build remaining packages: `yarn build`

### Testing

- Run linting: `yarn lint`
- Run tests: `yarn test`

### Deployment

Deployment is managed through GitHub Actions with the following environments:

- **Staging**: Deployed from the `develop` branch
- **Production**: Deployed from the `main` branch

## VS Code Tasks

The project includes several VS Code tasks to streamline development:

### Docker Tasks
- `docker-build`: Builds the Docker container for the shared package
- `docker-run: release`: Runs the Docker container in release mode
- `docker-run: debug`: Runs the Docker container in debug mode with development environment

### Development Tasks
- `Live Preview: Run Server`: Runs the live preview server
- `Initialize MCP Integration`: Sets up the Model Context Protocol integration
- `Show MCP Tools`: Displays available MCP tools
- `Test MCP Tool`: Tests MCP tool functionality
- `Ask Agent with MCP Tools`: Interacts with agents using MCP tools

### Setup Tasks
- `Setup MCP`: Runs scripts to set up MCP permissions and extension
- `Create Sample Files`: Generates sample project files
- `Launch VS Code with Extension`: Launches VS Code with the project extension

## Database Management

The project uses both Prisma and TypeORM for database access:

- **Prisma**: Used for schema management and migrations
- **TypeORM**: Used for entity management and queries

### Database Schema

The database includes the following core entities:

- **User**: User management
- **Session**: Session management
- **Agent**: AI agent configuration
- **Task**: Task management
- **Pipeline**: Workflow pipeline configuration

### Migrations

Database migrations are managed through Prisma and can be run with:

```bash
yarn db:migrate
```

## VS Code Extension

The VS Code extension provides integration with the platform and includes:

- **AI Agent Coordination**: Connect and coordinate multiple AI agents
- **AI Collaboration**: Start collaborative coding sessions
- **Protocol Support**: Standardized communication protocols
- **Webview Integration**: Rich UI for interaction

## API Documentation

The API follows RESTful principles and includes the following main endpoints:

- `/api/auth`: Authentication endpoints
- `/api/users`: User management
- `/api/agents`: AI agent management
- `/api/tasks`: Task management
- `/api/pipelines`: Pipeline management

## Frontend Application

The frontend is built with React and includes:

- **Dashboard**: Overview of activities and metrics
- **Agent Management**: Configure and monitor AI agents
- **Task Management**: Create and track tasks
- **Pipeline Editor**: Visual editor for creating workflows
- **Settings**: User and application settings

## Configuration

The project uses environment variables for configuration, with the following key variables:

- `NODE_ENV`: Environment (development, production)
- `DATABASE_URL`: PostgreSQL connection URL
- `REDIS_URL`: Redis connection URL
- `JWT_SECRET`: Secret for JWT authentication
- `API_URL`: URL for the API service
- `WS_URL`: URL for WebSocket connections

## Troubleshooting

### Common Issues

- **Database Connection**: Ensure PostgreSQL is running and the connection URL is correct
- **Build Errors**: Make sure packages are built in the correct order
- **Extension Issues**: Check the VS Code extension logs for errors

### Logs

- API logs: Available in the API service output
- Frontend logs: Available in the browser console
- Extension logs: Available in the VS Code output panel

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `yarn test`
5. Submit a pull request

## License

This project is licensed under the MIT License.

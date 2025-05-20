# The New Fuse Documentation

Welcome to The New Fuse documentation! This comprehensive guide will help you understand and utilize our advanced AI-powered workflow automation system.

## 👤 User Types

The New Fuse serves two primary user types:

1. **Human Users**: Developers, product managers, and other humans who want to build, deploy, and manage AI agents.
2. **AI Agents**: Autonomous AI systems that want to integrate with The New Fuse platform.

We provide specialized documentation for each user type, while maintaining a single source of truth for all platform information.

- [Human User Documentation](#getting-started--concepts): Start here if you're a human user.
- [AI Agent Documentation](ai-agent-integration.md): Start here if you're an AI agent.

## 📚 Core Documentation Sections

**Architecture**
* [Architecture Overview](architecture/overview.md)
* [System Diagrams](architecture/SYSTEM_DIAGRAMS.md)
* [Service Integration](architecture/service-integration.md)
* [MCP Integration](architecture/mcp-integration.md)
* [A2A Coordination](architecture/a2a-coordination.md)
* [A2A Protocol](architecture/a2a-protocol.md)

**Guides**
*   [Development Guide](guides/development.md)
*   [Docker Setup](guides/DOCKER_SETUP.md)
*   [Integration Guides](guides/INTEGRATION_GUIDE.md)
*   [Migration Guide](guides/MIGRATION-GUIDE.md)
*   [Operations Guides](guides/operations/) (Backup, Deployment, Monitoring, Recovery)

**Reference**
*   [API Reference](reference/API.md) (See also: `reference/endpoints.md`, `reference/websocket.md`)
*   [Component Reference](reference/COMPONENTS.md) (See also: `reference/component-standards.md`)
*   [Configuration Reference](reference/configuration/README.md)
*   [Database Reference](reference/database.md)
*   [Environment Reference](reference/environment.md)
*   [Scripts Reference](reference/scripts.md) (See also: `reference/scripts/component-analysis.md`)
*   [Technical Details](reference/TECHNICAL_DETAILS.md)
*   [Command Reference](reference/COMMAND-REFERENCE.md) (See also: `reference/MCP-COMMANDS-GUIDE.md`, `reference/COMMAND-REFERENCE-component-analysis.md`)
*   [Workflow Builder](workflow-builder.md)

**Development**
*   [Developer Workflow](development/DEVELOPER_WORKFLOW.md)
*   [Testing Guide](development/TESTING.md) (See also: `development/integration-testing.md`)
*   [Security Guidelines](development/security-guidelines.md) (See also: `development/SECURITY.md`)

**Deployment & Operations**
*   [Deployment Guide (Operational)](guides/operations/deployment.md)
*   [Deployment Reference (K8s)](deployment/DEPLOYMENT.md)
*   [Monitoring Guide (Operational)](guides/operations/monitoring.md)
*   [Monitoring Reference](deployment/MONITORING.md) (See also: `deployment/METRICS.md`, `deployment/TROUBLESHOOTING.md`)
*   [Scaling Guide](deployment/SCALING.md)

**Project Management**
*   [Project Plans & Status](project/) (Consolidation plans, status, checklists, etc.)
*   Changelogs:
    *   [Advanced Interaction Features (2025-01-08)](project/CHANGELOG-2025-01-08.md)
    *   [Workflow Builder Enhancements (2025-04-15)](project/CHANGELOG-2025-04-15.md)
*   [Analysis Documents](project/PROJECT_ANALYSIS.md)

**Archive**
*   [Archived Documents](_archive/) - Potentially outdated plans and merged docs.

## ℹ️ Version Information

*   Project Version: 1.0.0 (Example - Update if needed)
*   Documentation Last Updated: 2024-01-16 (Example - Update if needed)
*   Required Dependencies:
    *   Node.js: 18+
    *   Yarn: 4.6.0+ (Verify correct version)
    *   Docker: 24.0+
    *   Docker Compose: 2.20+
    *   PostgreSQL: 17.0+
    *   Redis: 7+

## Development Tools

### VS Code Tasks
The project includes several built-in VS Code tasks to streamline development:

#### Docker Tasks
- `docker-build`: Builds the Docker container for the shared package
- `docker-run: release`: Runs the Docker container in release mode
- `docker-run: debug`: Runs the container in debug mode with development environment

#### Development Tasks
- `Live Preview: Run Server`: Runs the live preview server
- `Initialize MCP Integration`: Sets up the Model Context Protocol integration
- `Show MCP Tools`: Displays available MCP tools
- `Test MCP Tool`: Tests MCP tool functionality
- `Ask Agent with MCP Tools`: Interacts with agents using MCP tools

#### Setup Tasks
- `Setup MCP`: Runs scripts to set up MCP permissions and extension
- `Create Sample Files`: Generates sample project files
- `Launch VS Code with Extension`: Launches VS Code with the project extension

To run a task:
1. Open the Command Palette (Cmd/Ctrl + Shift + P)
2. Type 'Tasks: Run Task'
3. Select the desired task from the list

## 🔗 External Resources

*   [GitHub Repository](https://github.com/newfuse) (Example URL)
*   [Community Forum](https://community.newfuse.io) (Example URL)
*   [API Status](https://status.newfuse.io) (Example URL)
*   [Blog](https://blog.newfuse.io) (Example URL)

## 💡 Getting Help

If you can't find what you're looking for:
1.  Review the relevant documentation sections above.
2.  Check the troubleshooting guides within Deployment and Operations.
3.  Submit an issue on the GitHub repository.
4.  Contact support or ask in the community forum.

## 📜 License

This documentation is licensed under the same terms as The New Fuse project.
See [LICENSE](../LICENSE) in the project root for details.

## Analysis Tools
- [Component Analysis](reference/automated-component-analysis.md) - Automated daily tracking of component usage and trends
  - Daily analysis of component usage
  - Historical trend tracking (90 days)
  - Usage metrics and insights
  - Integration with task scheduling system

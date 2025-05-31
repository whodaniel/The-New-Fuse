# Roo Code Agent Automation System - The New Fuse Integration

A comprehensive TypeScript system for automated creation and management of Roo Code AI agents, fully integrated with The New Fuse platform architecture.

## 🚀 Features

- **Pre-defined Agent Templates**: 13+ specialized agent templates for different development roles
- **Team Configurations**: Ready-made team setups (fullstack, startup, enterprise, etc.)
- **MCP Integration**: Full Model Context Protocol support for extending capabilities
- **Multi-tenant Support**: Global and project-specific agent configurations
- **REST API**: Complete NestJS-based API for programmatic access
- **CLI Tool**: Interactive command-line interface for easy management
- **Real-time Communication**: Redis-based inter-agent communication
- **Batch Operations**: Create multiple agents and teams efficiently

## 📋 Agent Templates

### Core Development Agents
- **👨‍💻 Senior Developer** - Complex coding, architecture, code reviews
- **🧪 QA Engineer** - Testing, automation, quality assurance
- **⚙️ DevOps Engineer** - Infrastructure, CI/CD, cloud operations
- **🎨 UI/UX Designer** - Interface design, user experience
- **📝 Technical Writer** - Documentation, guides, content creation
- **🔒 Security Auditor** - Security reviews, vulnerability assessments
- **📊 Data Scientist** - Data analysis, ML, statistical modeling
- **📋 Product Manager** - Product strategy, requirements, roadmaps
- **🔌 API Specialist** - API development, integrations, webhooks
- **🗄️ Database Architect** - Database design, optimization, migrations

### The New Fuse Platform Specialists
- **🔄 Workflow Orchestrator** - Multi-agent workflow coordination
- **🔗 MCP Integration Specialist** - Protocol implementation, tool integration
- **💬 Agent Communication Expert** - Inter-agent messaging, real-time sync

## 🏗️ Architecture Integration

### File Structure in The New Fuse
```
src/
├── services/
│   ├── RooAgentAutomationService.ts      # Main service implementation
│   ├── roo-agent-templates.ts            # Agent templates and configurations
│   └── RooCodeCommunication.ts           # Existing communication service
├── controllers/
│   └── roo-agent-automation.controller.ts # REST API controller
├── modules/
│   └── RooAgentAutomationModule.ts       # NestJS module
├── mcp/
│   └── TNFAgentAutomationMCPServer.ts     # MCP server for Roo Code integration
└── scripts/
    └── roo-agent-cli.ts                   # Command-line interface
```

## 🛠️ Installation & Setup

### 1. Add to The New Fuse Platform

The system is designed to integrate seamlessly with your existing platform. Add the module to your main application:

```typescript
// In your main app.module.ts
import { RooAgentAutomationModule } from './modules/RooAgentAutomationModule';

@Module({
  imports: [
    // ... your existing modules
    RooAgentAutomationModule,
  ],
})
export class AppModule {}
```

### 2. Install Required Dependencies

```bash
# Core dependencies (if not already installed)
npm install @nestjs/common @nestjs/core commander inquirer chalk ora

# Type definitions
npm install -D @types/inquirer @types/node
```

### 3. Configure MCP Server

Add the TNF Agent Automation MCP server to your Roo Code configuration:

```json
{
  "mcpServers": {
    "tnf-agent-automation": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/mcp/TNFAgentAutomationMCPServer.js"],
      "enabled": true
    }
  }
}
```

## 🚀 Usage

### REST API

#### Create a Single Agent
```bash
POST /api/roo-agents/agents
{
  "templateKey": "senior-developer",
  "customizations": {
    "name": "Frontend Specialist",
    "customInstructions": "Focus on React and TypeScript development"
  },
  "isGlobal": true,
  "mcpEnabled": true,
  "autoStart": true
}
```

#### Create a Development Team
```bash
POST /api/roo-agents/teams
{
  "teamType": "fullstack"
}
```

#### List Available Templates
```bash
GET /api/roo-agents/templates
```

#### Get Active Agents
```bash
GET /api/roo-agents/agents
```

#### Update an Agent
```bash
PUT /api/roo-agents/agents/senior-dev
{
  "customInstructions": "Updated instructions for the agent",
  "temperature": 0.4
}
```

#### Delete an Agent
```bash
DELETE /api/roo-agents/agents/senior-dev?isGlobal=true
```

### Command Line Interface

#### Interactive Mode
```bash
npx tsx src/scripts/roo-agent-cli.ts interactive
```

#### Quick Commands
```bash
# Create a single agent
npx tsx src/scripts/roo-agent-cli.ts create-agent

# Create a team
npx tsx src/scripts/roo-agent-cli.ts create-team

# List templates
npx tsx src/scripts/roo-agent-cli.ts list-templates

# Quick create from template
npx tsx src/scripts/roo-agent-cli.ts quick-create senior-developer --name "My Custom Dev"

# Quick team creation
npx tsx src/scripts/roo-agent-cli.ts quick-team fullstack
```

### Programmatic Usage

```typescript
import { RooAgentAutomationService } from './services/RooAgentAutomationService';
import { MCPService } from './services/MCPService';

// Initialize the service
const mcpService = new MCPService();
const agentService = new RooAgentAutomationService(mcpService);
await agentService.initialize('/path/to/workspace');

// Create a single agent
const agent = await agentService.createAgent({
  templateKey: 'senior-developer',
  customizations: {
    name: 'Backend Specialist',
    customInstructions: 'Focus on Node.js and database optimization'
  },
  isGlobal: true,
  mcpEnabled: true,
  autoStart: true
});

// Create a team
const team = await agentService.createDevelopmentTeam('startup');

// List available templates
const templates = agentService.getAvailableTemplates();

// Get statistics
const stats = await agentService.getAgentStatistics();
```

### Using with Roo Code (via MCP)

Once the MCP server is configured, you can interact with the agent automation system directly from Roo Code:

```
# In Roo Code chat
Create a senior developer agent named "Frontend Expert" with React focus

# Or
Set up a fullstack development team for this project

# Or
List all available agent templates and their capabilities
```

## 🔧 Configuration

### Global vs Project-Specific Agents

#### Global Agents
- Stored in user's VS Code global settings
- Available across all workspaces
- Ideal for general-purpose agents

#### Project-Specific Agents
- Stored in `.roo/modes.json` in project root
- Only available in specific project
- Can be version controlled with the project
- Override global agents with same slug

### MCP Server Configuration

The system supports multiple MCP servers:

```typescript
// Available MCP servers
const MCP_SERVERS = {
  'context7': {
    name: 'context7',
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@latest'],
    description: 'General-purpose server with database, web search, utilities'
  },
  'git': {
    name: 'git',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
    description: 'Git operations server'
  },
  'tnf-workflow': {
    name: 'tnf-workflow',
    command: 'node',
    args: ['../mcp/MCPWorkflowServer.js'],
    description: 'The New Fuse workflow management'
  }
};
```

### API Profiles

Configure different model settings for different agent types:

```typescript
const API_PROFILES = {
  'high-performance': {
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    temperature: 0.3,
    maxTokens: 4096
  },
  'cost-effective': {
    provider: 'anthropic',
    model: 'claude-3-haiku',
    temperature: 0.4,
    maxTokens: 2048
  }
};
```

## 🔄 Integration with The New Fuse Workflows

### Event-Driven Integration

The service emits events that can be consumed by other parts of The New Fuse platform:

```typescript
// Listen for agent creation events
agentService.on('agent_created', (agent) => {
  console.log(`New agent created: ${agent.name}`);
  // Trigger workflow, send notifications, etc.
});

agentService.on('team_created', ({ teamType, agents }) => {
  console.log(`Team ${teamType} created with ${agents.length} agents`);
  // Initialize team workflows, setup communication channels, etc.
});
```

### Workflow Orchestration

Integrate with The New Fuse workflow system:

```typescript
// Example: Auto-create agents based on project type
async function setupProjectAgents(projectType: string, projectPath: string) {
  const teamType = getTeamTypeForProject(projectType);
  
  if (teamType) {
    const agents = await agentService.createDevelopmentTeam(teamType);
    
    // Setup project-specific configurations
    for (const agent of agents) {
      await agentService.createProjectMode(agent, projectPath);
    }
    
    return agents;
  }
}
```

### Communication Integration

Leverage existing The New Fuse communication infrastructure:

```typescript
// Integration with existing RooCodeCommunication service
class IntegratedAgentService extends RooAgentAutomationService {
  constructor(
    mcpService: MCPService,
    private communicationService: RooCodeCommunication
  ) {
    super(mcpService);
    
    // Setup communication event handlers
    this.setupCommunicationHandlers();
  }
  
  private setupCommunicationHandlers() {
    this.communicationService.on('collaboration_request', async (request) => {
      if (request.action === 'create_agent') {
        await this.handleRemoteAgentCreation(request);
      }
    });
  }
}
```

## 📊 Monitoring & Analytics

### Built-in Statistics

```typescript
const stats = await agentService.getAgentStatistics();
// Returns:
// {
//   totalAgents: 15,
//   activeAgents: 12,
//   templateUsage: {
//     'senior-developer': 3,
//     'qa-engineer': 2,
//     // ...
//   },
//   teamDistribution: {
//     'development': 8,
//     'testing': 3,
//     // ...
//   }
// }
```

### Integration with The New Fuse Monitoring

```typescript
// Example integration with existing monitoring
import { MetricsService } from '../services/MetricsService';

class MonitoredAgentService extends RooAgentAutomationService {
  constructor(
    mcpService: MCPService,
    private metricsService: MetricsService
  ) {
    super(mcpService);
    this.setupMetricsTracking();
  }
  
  private setupMetricsTracking() {
    this.on('agent_created', (agent) => {
      this.metricsService.incrementCounter('agents.created', {
        template: agent.slug,
        category: agent.categories?.[0] || 'unknown'
      });
    });
    
    this.on('team_created', ({ teamType, agents }) => {
      this.metricsService.incrementCounter('teams.created', {
        type: teamType,
        size: agents.length
      });
    });
  }
}
```

## 🛡️ Security Considerations

### File Access Control

```typescript
// Agents with file restrictions
const restrictedAgent = {
  groups: [
    'read',
    ['edit', {
      fileRegex: '\\.(test|spec)\\.(js|ts)$',
      description: 'Test files only'
    }]
  ]
};
```

### Communication Security

- All inter-agent communication goes through authenticated channels
- Redis-based message routing with proper authentication
- MCP servers run in sandboxed environments

### Configuration Validation

```typescript
// Validate agent configurations before creation
private validateAgentConfig(config: AgentTemplate): void {
  if (!config.name || !config.slug || !config.roleDefinition) {
    throw new Error('Invalid agent configuration: missing required fields');
  }
  
  // Additional validation logic
}
```

## 🔄 Migration Guide

### From Manual Agent Creation

If you've been creating Roo Code agents manually:

1. **Export existing configurations**:
   ```bash
   npx tsx src/scripts/roo-agent-cli.ts export-existing
   ```

2. **Import into the system**:
   ```typescript
   await agentService.importAgent('./existing-agent.json');
   ```

3. **Update to use templates**:
   - Choose the closest matching template
   - Customize with your specific requirements

### From Other Agent Systems

1. **Map existing roles to templates**
2. **Migrate configurations** using the import/export functionality
3. **Update team structures** to use the new team configurations

## 🤝 Contributing

### Adding New Agent Templates

1. **Define the template** in `roo-agent-templates.ts`:
   ```typescript
   'my-new-agent': {
     name: '🎯 My New Agent',
     slug: 'my-new-agent',
     roleDefinition: 'You are specialized in...',
     // ... other properties
   }
   ```

2. **Add to team configurations** if applicable
3. **Update tests** and documentation
4. **Submit a pull request**

### Extending MCP Integration

1. **Add new tools** to the MCP server
2. **Update the tool schema** in `TNFAgentAutomationMCPServer.ts`
3. **Add corresponding service methods**
4. **Test with Roo Code integration**

## 📚 API Reference

### RooAgentAutomationService

#### Methods

- `initialize(workspaceRoot?: string): Promise<void>`
- `createAgent(options: AgentCreationOptions): Promise<AgentTemplate>`
- `createDevelopmentTeam(teamType: string): Promise<AgentTemplate[]>`
- `getAvailableTemplates(): TemplateInfo[]`
- `getActiveAgents(): Map<string, AgentTemplate>`
- `deleteAgent(slug: string, options?: DeleteOptions): Promise<void>`
- `getAgentStatistics(): Promise<AgentStatistics>`

#### Events

- `agent_created` - Fired when an agent is created
- `team_created` - Fired when a team is created
- `agent_deleted` - Fired when an agent is deleted
- `initialized` - Fired when the service is initialized
- `cleanup_complete` - Fired when cleanup is finished

## 🐛 Troubleshooting

### Common Issues

#### 1. MCP Server Not Starting
```bash
# Check MCP server configuration
cat ~/.config/Code/User/mcp_settings.json

# Test MCP server manually
node dist/mcp/TNFAgentAutomationMCPServer.js
```

#### 2. Agent Creation Fails
```bash
# Check permissions
ls -la ~/.config/Code/User/

# Verify workspace access
ls -la .roo/
```

#### 3. Communication Issues
```bash
# Check Redis connection
redis-cli ping

# Verify communication service
npx tsx src/scripts/test-communication.ts
```

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
process.env.ROO_AGENT_DEBUG = 'true';

// Or in code
import { Logger } from '@nestjs/common';
Logger.overrideLogger(['debug', 'error', 'log', 'verbose', 'warn']);
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- The New Fuse platform team
- Roo Code development community
- Model Context Protocol specification contributors
- Open source contributors and maintainers

---

For more information, support, or to contribute, please visit our [GitHub repository](https://github.com/your-org/the-new-fuse) or contact the development team.

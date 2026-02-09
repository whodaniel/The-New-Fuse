# Extending The New Fuse MCP Server

This guide provides advanced techniques for extending The New Fuse MCP server with custom tools, integrations, and capabilities.

## Table of Contents

1. [Advanced Tool Development](#advanced-tool-development)
2. [External System Integration](#external-system-integration)
3. [Custom AI Agent Integration](#custom-ai-agent-integration)
4. [Database Integration](#database-integration)
5. [Multi-Agent Coordination](#multi-agent-coordination)
6. [Security Enhancements](#security-enhancements)
7. [Cloud Deployment](#cloud-deployment)

## Advanced Tool Development

### Creating Tools with Complex Parameter Handling

For tools that need complex parameter validation and transformation:

```typescript
import { z } from 'zod';

// Define a schema with nested objects, conditionals, and transformations
const DeploymentSchema = z.object({
  environment: z.enum(['dev', 'staging', 'production']),
  options: z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    enableFeatures: z.array(z.string()).optional(),
    rollback: z.boolean().default(true)
  }),
  // Using .transform() to preprocess data
  timestamp: z.string().datetime().transform(str => new Date(str))
});

export const deploymentTools = {
  deployApplication: async (params, context) => {
    const { environment, options, timestamp } = params;
    // Implementation
    return { 
      success: true, 
      deploymentId: `deploy-${Date.now()}`, 
      environment, 
      version: options.version 
    };
  }
};
```

### Stateful Tools with Memory

Create tools that remember previous invocations:

```typescript
// In-memory store for tool state (use a database in production)
const diagnosticState = new Map<string, {
  lastRun: Date;
  issues: Array<{ id: string; description: string; fixed: boolean }>;
}>();

export const diagnosticTools = {
  runDiagnostics: async (params, context) => {
    const { agentId } = context;
    // Get previous state or initialize new state
    const state = diagnosticState.get(agentId) || { 
      lastRun: new Date(0), 
      issues: [] 
    };
    
    // Only allow running once per minute
    const now = new Date();
    if ((now.getTime() - state.lastRun.getTime()) < 60000) {
      return { 
        success: false, 
        error: 'Diagnostics can only be run once per minute',
        timeSinceLastRun: Math.floor((now.getTime() - state.lastRun.getTime()) / 1000)
      };
    }
    
    // Run diagnostics and update state
    const newIssues = await runDiagnosticChecks(params.target);
    state.issues = [...state.issues, ...newIssues];
    state.lastRun = now;
    diagnosticState.set(agentId, state);
    
    return { 
      success: true, 
      issuesFound: newIssues.length,
      totalIssues: state.issues.length,
      issues: newIssues
    };
  },
  
  fixIssue: async (params, context) => {
    const { agentId } = context;
    const { issueId } = params;
    
    const state = diagnosticState.get(agentId);
    if (!state) {
      return { success: false, error: 'No diagnostics have been run yet' };
    }
    
    const issue = state.issues.find(i => i.id === issueId);
    if (!issue) {
      return { success: false, error: `Issue ${issueId} not found` };
    }
    
    // Implement fix
    const fixResult = await attemptFix(issue);
    issue.fixed = fixResult.success;
    
    // Update state
    diagnosticState.set(agentId, state);
    
    return { 
      success: fixResult.success, 
      message: fixResult.message
    };
  }
};
```

## External System Integration

### Connecting to GitHub

```typescript
import { Octokit } from '@octokit/rest';
import { z } from 'zod';

// Setup GitHub client outside of tool execution for efficiency
const setupGitHubClient = (token: string) => {
  return new Octokit({ auth: token });
};

export const githubTools = {
  // Create an issue on GitHub
  createIssue: async (params, context) => {
    const { repo, owner, title, body, labels } = params;
    const { agentId, logger } = context;
    
    // Get GitHub token (would come from secure storage in production)
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return { success: false, error: 'GitHub token not configured' };
    }
    
    const octokit = setupGitHubClient(token);
    
    try {
      const response = await octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels
      });
      
      logger.info(`[GitHub] Agent ${agentId} created issue #${response.data.number}`);
      
      return {
        success: true,
        issueNumber: response.data.number,
        issueUrl: response.data.html_url
      };
    } catch (error) {
      logger.error(`[GitHub] Error creating issue:`, error);
      return { 
        success: false, 
        error: error.message || 'Unknown error creating GitHub issue'
      };
    }
  }
};

// Schema for GitHub tools
export const createIssueSchema = z.object({
  owner: z.string().describe('GitHub repository owner'),
  repo: z.string().describe('GitHub repository name'),
  title: z.string().describe('Issue title'),
  body: z.string().describe('Issue description'),
  labels: z.array(z.string()).optional().describe('Labels to apply to the issue')
});
```

### Connecting to Jira

```typescript
import JiraApi from 'jira-client';

// Schema for Jira tools
export const createJiraTicketSchema = z.object({
  project: z.string().describe('Jira project key'),
  issueType: z.string().describe('Type of issue (e.g., "Bug", "Task")'),
  summary: z.string().describe('Short summary of the issue'),
  description: z.string().describe('Full description of the issue'),
  priority: z.string().optional().describe('Priority level')
});

export const jiraTools = {
  createTicket: async (params, context) => {
    // Implementation similar to GitHub tools
  }
};
```

## Custom AI Agent Integration

### Direct LLM Integration

```typescript
import { OpenAI } from 'openai';

// Configure the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const aiTools = {
  generateCode: async (params, context) => {
    const { description, language } = params;
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: `You are a code generation assistant that writes clean, well-documented ${language} code.` 
          },
          { 
            role: "user", 
            content: `Generate ${language} code for: ${description}` 
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const generatedCode = completion.choices[0].message.content;
      
      return {
        success: true,
        code: generatedCode,
        language
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Unknown error generating code' 
      };
    }
  },
  
  explainCode: async (params, context) => {
    const { code, detailLevel } = params;
    
    // Implementation similar to generateCode
  }
};

// Schemas for AI tools
export const generateCodeSchema = z.object({
  description: z.string().describe('Description of the code to generate'),
  language: z.string().describe('Programming language to use')
});

export const explainCodeSchema = z.object({
  code: z.string().describe('Code to explain'),
  detailLevel: z.enum(['basic', 'intermediate', 'advanced']).describe('Level of detail in explanation')
});
```

## Database Integration

### Persisting MCP State to a Database

For production use, the MCP server should persist conversation and state data to a database instead of in-memory:

```typescript
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Database-backed conversation storage
export class DatabaseConversationManager {
  async createConversation(id?: string): Promise<{ conversationId: string }> {
    const conversationId = id || uuidv4();
    
    await prisma.conversation.create({
      data: {
        id: conversationId,
        createdAt: new Date(),
        metadata: {}
      }
    });
    
    return { conversationId };
  }
  
  async addMessage(conversationId: string, role: string, content: string, toolCalls?: any[]): Promise<any> {
    const message = await prisma.message.create({
      data: {
        id: uuidv4(),
        conversationId,
        role,
        content,
        timestamp: new Date(),
        toolCalls: toolCalls ? JSON.stringify(toolCalls) : null
      }
    });
    
    return message;
  }
  
  async getHistory(conversationId: string): Promise<any[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' }
    });
    
    return messages.map(msg => ({
      ...msg,
      toolCalls: msg.toolCalls ? JSON.parse(msg.toolCalls) : undefined
    }));
  }
}
```

## Multi-Agent Coordination

### Agent Coordination Protocol

Implement a protocol for multiple AI agents to coordinate via the MCP server:

```typescript
export const coordinationTools = {
  // Request assistance from another agent
  requestAssistance: async (params, context) => {
    const { targetAgentId, taskDescription, priority, data } = params;
    const { agentId, logger } = context;
    
    logger.info(`Agent ${agentId} requesting assistance from ${targetAgentId}`);
    
    // Create a task request
    const requestId = uuidv4();
    const request = {
      id: requestId,
      requestingAgentId: agentId,
      targetAgentId,
      taskDescription,
      priority,
      data,
      status: 'pending',
      createdAt: new Date()
    };
    
    // Store the request (in-memory for demo, use database in production)
    assistanceRequests.set(requestId, request);
    
    // Notify the target agent (implementation depends on your agent system)
    await notifyAgent(targetAgentId, {
      type: 'assistance_request',
      requestId,
      from: agentId,
      taskDescription,
      priority
    });
    
    return {
      success: true,
      requestId,
      message: `Assistance requested from ${targetAgentId}`
    };
  },
  
  // Check for assistance requests directed to this agent
  checkAssistanceRequests: async (params, context) => {
    const { agentId } = context;
    
    // Find requests for this agent
    const requests = Array.from(assistanceRequests.values())
      .filter(req => req.targetAgentId === agentId && req.status === 'pending');
    
    return {
      success: true,
      pendingRequests: requests.map(req => ({
        id: req.id,
        from: req.requestingAgentId,
        task: req.taskDescription,
        priority: req.priority,
        createdAt: req.createdAt
      }))
    };
  },
  
  // Respond to an assistance request
  respondToAssistance: async (params, context) => {
    const { requestId, response, status } = params;
    const { agentId } = context;
    
    // Find the request
    const request = assistanceRequests.get(requestId);
    if (!request) {
      return { success: false, error: `Request ${requestId} not found` };
    }
    
    // Verify this agent is the target
    if (request.targetAgentId !== agentId) {
      return { 
        success: false, 
        error: `This request is intended for ${request.targetAgentId}, not ${agentId}` 
      };
    }
    
    // Update the request
    request.status = status;
    request.response = response;
    request.respondedAt = new Date();
    
    // Notify the requesting agent
    await notifyAgent(request.requestingAgentId, {
      type: 'assistance_response',
      requestId,
      from: agentId,
      status,
      response
    });
    
    return {
      success: true,
      message: `Response sent to ${request.requestingAgentId}`
    };
  }
};
```

## Security Enhancements

### JWT Authentication

Implement JWT-based authentication for more secure API access:

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Secret key for JWT signing (use environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// JWT middleware
export const jwtAuth = (req: Request, res: Response, next: NextFunction) => {
  // Get token from authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      status: 'error', 
      error: { message: 'No token provided' } 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach agent info to request
    req.agentId = decoded.agentId;
    req.roles = decoded.roles;
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      status: 'error', 
      error: { message: 'Invalid token' } 
    });
  }
};

// Token generation endpoint
app.post('/auth/token', async (req, res) => {
  const { clientId, clientSecret } = req.body;
  
  // Validate credentials (check against database in production)
  if (!clientId || !clientSecret || !validateCredentials(clientId, clientSecret)) {
    return res.status(401).json({ 
      status: 'error', 
      error: { message: 'Invalid credentials' } 
    });
  }
  
  // Get agent details
  const agent = await getAgentByClientId(clientId);
  
  // Generate token
  const token = jwt.sign(
    { 
      agentId: agent.id,
      roles: agent.roles,
      type: agent.type
    }, 
    JWT_SECRET, 
    { expiresIn: '1h' }
  );
  
  return res.status(200).json({
    status: 'success',
    data: { 
      token,
      expiresIn: 3600,
      tokenType: 'Bearer'
    }
  });
});
```

## Cloud Deployment

### Containerization with Docker

Create a Dockerfile for deploying the MCP server:

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code and build
COPY tsconfig.json ./
COPY src ./src
RUN yarn build:mcp

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/mcp/dist ./dist
COPY --from=builder /app/package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create log directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 3000

# Run the server
CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment

Deploy the MCP server to Kubernetes:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
  labels:
    app: mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: thefuse/mcp-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: mcp-secrets
              key: jwt-secret
        - name: GITHUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: mcp-secrets
              key: github-token
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: mcp-secrets
              key: openai-api-key
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "100m"
            memory: "256Mi"
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-server
spec:
  selector:
    app: mcp-server
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```
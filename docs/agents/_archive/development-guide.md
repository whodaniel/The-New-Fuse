# The New Fuse Agent Development Guide

This guide provides detailed instructions for developing agents for The New Fuse platform, including best practices, examples, and integration patterns.

## Introduction to Agents

In The New Fuse ecosystem, agents are autonomous software components that provide specific capabilities and can communicate with other agents through the Model Context Protocol (MCP). Agents can be specialized for particular tasks such as text analysis, code generation, data processing, or domain-specific operations.

## Agent Architecture

### Core Components

An agent in The New Fuse consists of the following core components:

1. **Agent Identity**: Unique identification and metadata
2. **Capability Registry**: Declaration of agent capabilities
3. **Request Handler**: Processing of incoming requests
4. **Context Manager**: Management of conversational and operational context
5. **Communication Interface**: Integration with the MCP protocol

### General Structure

```typescript
class MyCustomAgent implements Agent {
  // Agent identity
  id: string;
  name: string;
  description: string;
  
  // Capability registry
  capabilities: Capability[];
  
  constructor() {
    this.id = 'my-custom-agent';
    this.name = 'My Custom Agent';
    this.description = 'Provides custom processing capabilities';
    this.capabilities = this.defineCapabilities();
  }
  
  // Register the agent with The New Fuse
  async register(): Promise<void> {
    // Implementation
  }
  
  // Define agent capabilities
  defineCapabilities(): Capability[] {
    return [
      {
        id: 'text-processing',
        name: 'Text Processing',
        description: 'Process and analyze text',
        actions: [
          {
            id: 'summarize',
            name: 'Summarize Text',
            description: 'Generate a summary of provided text',
            parameters: [
              {
                name: 'text',
                type: 'string',
                required: true,
                description: 'The text to summarize'
              },
              {
                name: 'maxLength',
                type: 'number',
                required: false,
                description: 'Maximum length of summary',
                default: 200
              }
            ]
          }
        ]
      }
    ];
  }
  
  // Handle incoming requests
  async handleRequest(request: Request): Promise<Response> {
    const { capability, action, parameters } = request;
    
    if (capability === 'text-processing' && action === 'summarize') {
      return this.handleSummarize(parameters);
    }
    
    throw new Error(`Unsupported capability/action: ${capability}/${action}`);
  }
  
  // Implementation of specific actions
  async handleSummarize(parameters: any): Promise<Response> {
    const { text, maxLength } = parameters;
    // Implementation of text summarization
    const summary = '...'; // Actual implementation here
    
    return {
      status: 'success',
      data: { summary }
    };
  }
}
```

## Agent Development Workflow

### 1. Define Agent Purpose and Scope

Before starting development, clearly define:

- Primary purpose of the agent
- Specific capabilities it will provide
- Target use cases and integration scenarios
- Performance and scalability requirements

### 2. Set Up Development Environment

1. Install prerequisites:
   ```bash
   # Clone The New Fuse repository
   git clone https://github.com/whodaniel/fuse.git
   cd fuse
   
   # Install dependencies
   yarn install
   
   # Set up agent development environment
   yarn agent:setup-dev
   ```

2. Create a new agent project:
   ```bash
   # Generate agent scaffold
   yarn agent:create my-custom-agent
   
   # Navigate to agent directory
   cd packages/agents/my-custom-agent
   ```

### 3. Implement Core Logic

1. Define capabilities in `capabilities.ts`
2. Implement request handlers in `handlers/`
3. Configure agent properties in `config.ts`
4. Add unit tests in `__tests__/`

### 4. Test Locally

1. Start the development server:
   ```bash
   # In the agent directory
   yarn dev
   ```

2. Use the agent test client:
   ```bash
   # In another terminal
   yarn agent:test-client
   ```

3. Send test requests to your agent:
   ```json
   {
     "capability": "text-processing",
     "action": "summarize",
     "parameters": {
       "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
       "maxLength": 100
     }
   }
   ```

### 5. Register with The New Fuse

1. Build your agent:
   ```bash
   yarn build
   ```

2. Register with the platform:
   ```bash
   yarn agent:register --name "My Custom Agent" --description "Custom text processing agent"
   ```

## Capability Design Guidelines

### Capability Structure

```typescript
interface Capability {
  id: string;
  name: string;
  description: string;
  version: string;
  actions: Action[];
}

interface Action {
  id: string;
  name: string;
  description: string;
  parameters: Parameter[];
  returns?: ReturnType;
}

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: any;
  enum?: any[];
}

interface ReturnType {
  type: string;
  properties?: Record<string, PropertyType>;
}
```

### Best Practices for Capabilities

1. **Atomicity**: Each capability should be focused on a specific domain
2. **Clarity**: Use descriptive names and clear descriptions
3. **Consistency**: Follow naming conventions across capabilities
4. **Versioning**: Include version information for all capabilities
5. **Validation**: Define parameter constraints and validations

### Example: Text Analysis Capability

```typescript
const textAnalysisCapability: Capability = {
  id: 'text-analysis',
  name: 'Text Analysis',
  description: 'Analyze text for various properties and patterns',
  version: '1.0',
  actions: [
    {
      id: 'sentiment-analysis',
      name: 'Sentiment Analysis',
      description: 'Analyze the sentiment of provided text',
      parameters: [
        {
          name: 'text',
          type: 'string',
          required: true,
          description: 'The text to analyze'
        },
        {
          name: 'language',
          type: 'string',
          required: false,
          description: 'The language of the text (ISO code)',
          default: 'en',
          enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh']
        }
      ],
      returns: {
        type: 'object',
        properties: {
          sentiment: {
            type: 'string',
            enum: ['positive', 'negative', 'neutral']
          },
          score: {
            type: 'number',
            description: 'Sentiment score between -1 (negative) and 1 (positive)'
          },
          confidence: {
            type: 'number',
            description: 'Confidence score between 0 and 1'
          }
        }
      }
    }
  ]
};
```

## Integration with AI Models

### Integrating LLM-based Agents

```typescript
import { OpenAI } from 'langchain/llms/openai';

class LLMAgent implements Agent {
  // Agent identity
  id: string = 'llm-agent';
  name: string = 'Language Model Agent';
  description: string = 'Provides natural language processing using OpenAI models';
  
  // LLM client
  private llm: OpenAI;
  
  constructor() {
    this.llm = new OpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    });
  }
  
  // Handle text generation request
  async handleTextGeneration(parameters: any): Promise<Response> {
    const { prompt, maxLength } = parameters;
    
    try {
      const response = await this.llm.generate(prompt, {
        maxTokens: maxLength || 500
      });
      
      return {
        status: 'success',
        data: {
          text: response.text,
          model: response.model,
          completionTokens: response.usage.completionTokens
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          message: error.message,
          code: 'llm_error'
        }
      };
    }
  }
}
```

### Integration with Custom ML Models

```typescript
import * as tf from '@tensorflow/tfjs-node';

class SentimentAnalysisAgent implements Agent {
  id: string = 'sentiment-analysis-agent';
  name: string = 'Sentiment Analysis Agent';
  description: string = 'Analyzes text sentiment using a custom TensorFlow model';
  
  private model: tf.LayersModel;
  private tokenizer: Tokenizer;
  
  constructor() {
    // Load model and tokenizer during initialization
    this.initialize();
  }
  
  async initialize() {
    this.model = await tf.loadLayersModel('file://./models/sentiment_model/model.json');
    this.tokenizer = new Tokenizer('./models/tokenizer.json');
  }
  
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    // Tokenize and preprocess text
    const tokens = this.tokenizer.tokenize(text);
    const sequence = this.tokenizer.textsToSequences([tokens]);
    const paddedSequence = this.tokenizer.padSequences(sequence, { maxLen: 100 });
    
    // Convert to tensor and predict
    const input = tf.tensor2d(paddedSequence);
    const prediction = this.model.predict(input) as tf.Tensor;
    const score = (await prediction.data())[0];
    
    // Clean up tensors
    input.dispose();
    prediction.dispose();
    
    // Map score to sentiment and confidence
    return {
      sentiment: score > 0.6 ? 'positive' : (score < 0.4 ? 'negative' : 'neutral'),
      score: score * 2 - 1, // Map 0-1 to -1 to 1
      confidence: Math.abs(score - 0.5) * 2 // Map distance from 0.5 to 0-1 range
    };
  }
}
```

## Advanced Agent Features

### Context Management

```typescript
class ContextAwareAgent implements Agent {
  // ...other agent implementation
  
  // Context management
  private contexts: Map<string, Context> = new Map();
  
  // Get or create context
  getContext(contextId: string): Context {
    if (!this.contexts.has(contextId)) {
      this.contexts.set(contextId, {
        id: contextId,
        created: new Date(),
        lastUpdated: new Date(),
        messages: [],
        metadata: {}
      });
    }
    
    return this.contexts.get(contextId);
  }
  
  // Update context with new message
  updateContext(contextId: string, message: Message): void {
    const context = this.getContext(contextId);
    context.messages.push(message);
    context.lastUpdated = new Date();
    
    // Prune old contexts to prevent memory leaks
    this.pruneOldContexts();
  }
  
  // Process request with context awareness
  async handleRequest(request: Request): Promise<Response> {
    const contextId = request.contextId;
    const context = contextId ? this.getContext(contextId) : null;
    
    // Use context in processing
    const result = await this.processWithContext(request, context);
    
    // Update context with new information
    if (contextId) {
      this.updateContext(contextId, {
        role: 'assistant',
        content: JSON.stringify(result),
        timestamp: new Date()
      });
    }
    
    return {
      status: 'success',
      data: result
    };
  }
}
```

### Agent Memory

```typescript
import { VectorStore } from '@thenewfuse/vector-store';

class MemoryEnabledAgent implements Agent {
  // ...other agent implementation
  
  // Vector store for semantic search
  private vectorStore: VectorStore;
  
  constructor() {
    // Initialize vector store
    this.vectorStore = new VectorStore({
      dimensions: 1536,
      similarityMetric: 'cosine'
    });
  }
  
  // Store information in memory
  async rememberInformation(info: string, metadata: any = {}): Promise<string> {
    const memoryId = await this.vectorStore.store(info, metadata);
    return memoryId;
  }
  
  // Retrieve relevant memories
  async recallRelevantInformation(query: string, maxResults: number = 5): Promise<Memory[]> {
    const results = await this.vectorStore.search(query, maxResults);
    return results;
  }
  
  // Use memory in request processing
  async handleRequestWithMemory(request: Request): Promise<Response> {
    // Recall relevant information
    const relevantMemories = await this.recallRelevantInformation(
      request.parameters.query || JSON.stringify(request.parameters)
    );
    
    // Enhance request with memories
    const enhancedRequest = {
      ...request,
      context: {
        ...request.context,
        relevantMemories
      }
    };
    
    // Process the enhanced request
    const response = await this.processRequest(enhancedRequest);
    
    // Store new information learned from this interaction
    if (response.status === 'success' && response.data.shouldRemember) {
      await this.rememberInformation(
        response.data.memoryContent || JSON.stringify(response.data),
        { source: 'interaction', timestamp: new Date(), requestId: request.id }
      );
    }
    
    return response;
  }
}
```

### Multi-step Reasoning

```typescript
class ReasoningAgent implements Agent {
  // ...other agent implementation
  
  async handleComplexReasoning(request: Request): Promise<Response> {
    // Step 1: Break down the problem
    const problemBreakdown = await this.decomposeProblem(request.parameters.problem);
    
    // Step 2: Gather relevant information for each sub-problem
    const informationGathering = await Promise.all(
      problemBreakdown.subProblems.map(async (subProblem) => {
        return {
          subProblem,
          relevantInfo: await this.gatherInformation(subProblem)
        };
      })
    );
    
    // Step 3: Solve each sub-problem
    const subSolutions = await Promise.all(
      informationGathering.map(async ({ subProblem, relevantInfo }) => {
        return {
          subProblem,
          solution: await this.solveSubProblem(subProblem, relevantInfo)
        };
      })
    );
    
    // Step 4: Integrate the solutions
    const integratedSolution = await this.integrateSolutions(
      request.parameters.problem,
      subSolutions
    );
    
    // Step 5: Verify the solution
    const verificationResult = await this.verifySolution(
      request.parameters.problem,
      integratedSolution
    );
    
    // Step 6: Return final result
    return {
      status: 'success',
      data: {
        solution: integratedSolution,
        reasoning: {
          problemBreakdown,
          subSolutions,
          verification: verificationResult
        },
        confidence: verificationResult.confidence
      }
    };
  }
}
```

## Security Best Practices

### Authentication and Authorization

```typescript
import { JwtService } from '@thenewfuse/security';

class SecureAgent implements Agent {
  // ...other agent implementation
  
  private jwtService: JwtService;
  
  constructor() {
    this.jwtService = new JwtService({
      secret: process.env.JWT_SECRET,
      expiresIn: '1h'
    });
  }
  
  // Validate authentication token
  async authenticate(request: Request): Promise<AuthenticationResult> {
    if (!request.authentication || !request.authentication.token) {
      throw new AuthenticationError('Missing authentication token');
    }
    
    try {
      const decoded = await this.jwtService.verify(request.authentication.token);
      return {
        authenticated: true,
        identity: decoded
      };
    } catch (error) {
      throw new AuthenticationError('Invalid authentication token');
    }
  }
  
  // Check if agent has permission for requested capability
  async authorize(identity: Identity, capability: string, action: string): Promise<boolean> {
    // Check permissions in agent registry
    const permissions = await AgentRegistry.getPermissions(identity.agentId);
    
    return permissions.some(permission => 
      (permission.capability === '*' || permission.capability === capability) &&
      (permission.action === '*' || permission.action === action)
    );
  }
  
  // Handle request with security checks
  async handleRequest(request: Request): Promise<Response> {
    try {
      // Authenticate request
      const { authenticated, identity } = await this.authenticate(request);
      
      if (!authenticated) {
        return {
          status: 'error',
          error: {
            code: 'authentication_failed',
            message: 'Authentication failed'
          }
        };
      }
      
      // Authorize capability access
      const authorized = await this.authorize(
        identity, 
        request.capability,
        request.action
      );
      
      if (!authorized) {
        return {
          status: 'error',
          error: {
            code: 'authorization_failed',
            message: 'Not authorized to use this capability/action'
          }
        };
      }
      
      // Process the authenticated and authorized request
      return await this.processRequest(request);
    } catch (error) {
      return {
        status: 'error',
        error: {
          code: 'security_error',
          message: error.message
        }
      };
    }
  }
}
```

### Input Validation

```typescript
import Joi from 'joi';

class ValidationAgent implements Agent {
  // ...other agent implementation
  
  // Schema definitions for parameters
  private schemas: Record<string, Joi.Schema> = {
    'text-processing.summarize': Joi.object({
      text: Joi.string().required().max(10000),
      maxLength: Joi.number().integer().min(10).max(1000).default(200)
    }),
    
    'sentiment-analysis.analyze-sentiment': Joi.object({
      text: Joi.string().required().max(5000),
      language: Joi.string().alphanum().length(2).default('en')
    })
  };
  
  // Validate request parameters
  validateParameters(capability: string, action: string, parameters: any): ValidationResult {
    const schemaKey = `${capability}.${action}`;
    const schema = this.schemas[schemaKey];
    
    if (!schema) {
      throw new Error(`No validation schema for ${schemaKey}`);
    }
    
    const validationResult = schema.validate(parameters, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (validationResult.error) {
      return {
        valid: false,
        errors: validationResult.error.details.map(detail => ({
          path: detail.path.join('.'),
          message: detail.message
        }))
      };
    }
    
    return {
      valid: true,
      value: validationResult.value
    };
  }
  
  // Handle request with validation
  async handleRequest(request: Request): Promise<Response> {
    // Validate parameters
    const validation = this.validateParameters(
      request.capability,
      request.action,
      request.parameters
    );
    
    if (!validation.valid) {
      return {
        status: 'error',
        error: {
          code: 'validation_error',
          message: 'Invalid parameters',
          details: validation.errors
        }
      };
    }
    
    // Use validated parameters
    const validatedRequest = {
      ...request,
      parameters: validation.value
    };
    
    // Process the validated request
    return await this.processRequest(validatedRequest);
  }
}
```

## Testing and Quality Assurance

### Unit Testing

```typescript
import { jest } from '@jest/globals';
import { TextProcessingAgent } from '../src/text-processing-agent';

describe('TextProcessingAgent', () => {
  let agent: TextProcessingAgent;
  
  beforeEach(() => {
    agent = new TextProcessingAgent();
  });
  
  describe('summarize', () => {
    it('should summarize text within the specified length', async () => {
      // Arrange
      const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);
      const maxLength = 100;
      
      // Act
      const response = await agent.handleRequest({
        capability: 'text-processing',
        action: 'summarize',
        parameters: { text, maxLength }
      });
      
      // Assert
      expect(response.status).toBe('success');
      expect(response.data.summary).toBeDefined();
      expect(response.data.summary.length).toBeLessThanOrEqual(maxLength);
    });
    
    it('should handle empty text', async () => {
      // Act
      const response = await agent.handleRequest({
        capability: 'text-processing',
        action: 'summarize',
        parameters: { text: '' }
      });
      
      // Assert
      expect(response.status).toBe('error');
      expect(response.error.code).toBe('invalid_input');
    });
  });
});
```

### Integration Testing

```typescript
import { MCP } from '@thenewfuse/mcp-client';
import { AgentTestHarness } from '@thenewfuse/agent-testing';

describe('Agent Integration Tests', () => {
  let harness: AgentTestHarness;
  let mcpClient: MCP;
  
  beforeAll(async () => {
    // Start the agent in test mode
    harness = await AgentTestHarness.start({
      agentPath: './dist/index.js',
      env: { NODE_ENV: 'test' }
    });
    
    // Connect MCP client
    mcpClient = new MCP({
      serverUrl: harness.getMCPServerUrl(),
      agentId: 'test-client',
      agentName: 'Test Client'
    });
    
    await mcpClient.connect();
  });
  
  afterAll(async () => {
    await mcpClient.disconnect();
    await harness.stop();
  });
  
  it('should register capabilities correctly', async () => {
    // Get agent capabilities
    const agent = await mcpClient.discoverAgent(harness.getAgentId());
    
    // Verify expected capabilities
    expect(agent).toBeDefined();
    expect(agent.capabilities).toContainEqual(
      expect.objectContaining({
        id: 'text-processing',
        actions: expect.arrayContaining([
          expect.objectContaining({ id: 'summarize' })
        ])
      })
    );
  });
  
  it('should successfully process a request', async () => {
    // Send request to the agent
    const response = await mcpClient.sendRequest({
      target: { agentId: harness.getAgentId() },
      capability: 'text-processing',
      action: 'summarize',
      parameters: {
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10),
        maxLength: 100
      }
    });
    
    // Verify response
    expect(response.status).toBe('success');
    expect(response.data.summary).toBeDefined();
  });
});
```

## Debugging and Troubleshooting

### Common Issues and Solutions

1. **Agent Registration Failures**
   - Verify agent ID is unique
   - Check network connectivity to The New Fuse registry
   - Validate capability declaration format

2. **Capability Execution Errors**
   - Check input validation
   - Verify dependencies are available
   - Look for resource constraints (memory, CPU)

3. **Communication Issues**
   - Verify MCP protocol implementation
   - Check authentication credentials
   - Inspect network connectivity

### Debugging Tools

1. **Local Agent Console**
   ```bash
   yarn agent:debug my-agent
   ```

2. **MCP Protocol Inspector**
   ```bash
   yarn mcp:inspect --agent-id my-agent
   ```

3. **Log Analysis**
   ```bash
   yarn logs:analyze --agent my-agent --timeframe last24h
   ```

## Deployment

### Containerization

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy agent source code
COPY . .

# Build the agent
RUN yarn build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV MCP_SERVER_URL=wss://mcp.thenewfuse.ai

# Expose port
EXPOSE 3000

# Start the agent
CMD ["yarn", "start"]
```

### Cloud Deployment

```yaml
# agent-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-custom-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-custom-agent
  template:
    metadata:
      labels:
        app: my-custom-agent
    spec:
      containers:
      - name: agent
        image: thenewfuse/my-custom-agent:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: MCP_SERVER_URL
          value: wss://mcp.thenewfuse.ai
        - name: AGENT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: secretKey
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

## Advanced Integrations

### External API Integration

```typescript
import axios from 'axios';

class WeatherAgent implements Agent {
  id: string = 'weather-agent';
  name: string = 'Weather Information Agent';
  description: string = 'Provides weather information for locations';
  
  private apiKey: string = process.env.WEATHER_API_KEY;
  
  // Define capabilities
  defineCapabilities(): Capability[] {
    return [
      {
        id: 'weather',
        name: 'Weather Information',
        description: 'Get weather data for locations',
        actions: [
          {
            id: 'get-current-weather',
            name: 'Get Current Weather',
            description: 'Get current weather for a location',
            parameters: [
              {
                name: 'location',
                type: 'string',
                required: true,
                description: 'The location to get weather for (city name or coordinates)'
              },
              {
                name: 'units',
                type: 'string',
                required: false,
                description: 'Units for temperature (metric or imperial)',
                default: 'metric',
                enum: ['metric', 'imperial']
              }
            ]
          }
        ]
      }
    ];
  }
  
  // Handle weather request
  async handleGetCurrentWeather(parameters: any): Promise<Response> {
    const { location, units } = parameters;
    
    try {
      const response = await axios.get('https://api.weatherservice.com/current', {
        params: {
          q: location,
          units: units,
          appid: this.apiKey
        }
      });
      
      return {
        status: 'success',
        data: {
          temperature: response.data.main.temp,
          humidity: response.data.main.humidity,
          conditions: response.data.weather[0].description,
          windSpeed: response.data.wind.speed,
          location: {
            name: response.data.name,
            country: response.data.sys.country,
            coordinates: {
              lat: response.data.coord.lat,
              lon: response.data.coord.lon
            }
          },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          code: 'weather_api_error',
          message: error.message
        }
      };
    }
  }
}
```

### Database Integration

```typescript
import { PrismaClient } from '@prisma/client';

class DatabaseAgent implements Agent {
  id: string = 'database-agent';
  name: string = 'Database Agent';
  description: string = 'Provides database access capabilities';
  
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  // Handle database query request
  async handleDatabaseQuery(parameters: any): Promise<Response> {
    const { table, filter, fields, limit } = parameters;
    
    try {
      // Validate permissions to access this table
      this.validateTableAccess(table);
      
      // Execute query
      const results = await this.prisma[table].findMany({
        where: filter,
        select: this.buildSelectObject(fields),
        take: limit || 100
      });
      
      return {
        status: 'success',
        data: {
          results,
          count: results.length
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          code: 'database_error',
          message: error.message
        }
      };
    }
  }
  
  // Validate table access
  private validateTableAccess(table: string): void {
    const allowedTables = ['products', 'categories', 'public_data'];
    
    if (!allowedTables.includes(table)) {
      throw new Error(`Access to table '${table}' is not allowed`);
    }
  }
  
  // Build select object from fields array
  private buildSelectObject(fields: string[]): Record<string, boolean> {
    if (!fields || fields.length === 0) {
      return undefined; // Select all fields
    }
    
    return fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
  }
}
```

### Google ADK Integration

Agents can leverage tools and capabilities provided by Google's Agent Development Kit (ADK) via the integrated Python bridge.

- **Calling ADK Tools:** Use the `ADKBridgeService` to execute tools available in the connected ADK environment.

  ```typescript
  // Example within an agent method
  async summarizeDocumentWithADK(documentUrl: string): Promise<string> {
    // Assuming adkBridgeService is injected or available
    const result = await this.adkBridgeService.callTool('adk_document_summarizer', { url: documentUrl });
    return result.summary;
  }
  ```

- **Further Examples:** For more detailed examples of interacting with the ADK bridge service and its API, see the [ADK Integration Usage Examples](../integrations/adk-usage.md).

## Conclusion

This guide provides a comprehensive overview of agent development for The New Fuse platform. By following these patterns and best practices, you can create powerful, secure, and efficient agents that integrate seamlessly with the ecosystem.

For more information, refer to:
- [The New Fuse API Specification](./API_SPECIFICATION.md)
- [Model Context Protocol (MCP) Specification](./MCP_SPECIFICATION.md)
- [The New Fuse Workflow System Guide](./WORKFLOW_GUIDE.md)
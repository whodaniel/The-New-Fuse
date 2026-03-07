# Complete AI Agent Metadata Schema & JSON Structure

## Overview

Based on analysis of your codebase, "The New Fuse" implements a comprehensive AI Agent system with standardized schemas, database models, and JSON configurations. Here's the complete metadata structure and standardized JSON format.

## Core Agent Data Structure

### Database Schema (Drizzle)
```drizzle
model Agent {
  id            String      @id @default(cuid())
  name          String      @unique
  description   String?
  type          String      
  systemPrompt  String?
  capabilities  String[]    // Array of capability identifiers
  status        AgentStatus @default(INACTIVE)
  config        Json?       // Flexible configuration object
  userId        String      // Owner/creator reference
  user          User        @relation(fields: [userId], references: [id])
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?   // Soft delete support
}

enum AgentStatus {
  ACTIVE
  INACTIVE  
  ARCHIVED
}
```

## Complete TypeScript Schema

### Core Types & Enums

```typescript
// Agent Status States
enum AgentStatus {
  IDLE = "IDLE",
  BUSY = "BUSY", 
  ERROR = "ERROR",
  OFFLINE = "OFFLINE",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED"
}

// Agent Categories
enum AgentType {
  CONVERSATIONAL = "CONVERSATIONAL",
  IDE_EXTENSION = "IDE_EXTENSION", 
  API = "API",
  CHAT = "CHAT",
  WORKFLOW = "WORKFLOW",
  TASK = "TASK",
  ASSISTANT = "ASSISTANT"
}

// Agent Roles
enum AgentRole {
  ASSISTANT = "ASSISTANT",
  DEVELOPER = "DEVELOPER", 
  REVIEWER = "REVIEWER",
  USER = "USER",
  SYSTEM = "SYSTEM"
}

// Deployment Frameworks
enum AgentFramework {
  VSCODE = "VSCODE",
  WEBIDE = "WEBIDE",
  CLI = "CLI"
}
```

### Comprehensive Capabilities Enum

```typescript
enum AgentCapability {
  // Code-related capabilities
  CODE_REVIEW = "CODE_REVIEW",
  CODE_REFACTORING = "CODE_REFACTORING", 
  DEBUGGING = "DEBUGGING",
  TESTING = "TESTING",
  DOCUMENTATION = "DOCUMENTATION",
  CODE_COMPLETION = "CODE_COMPLETION",
  CODE_SUGGESTIONS = "CODE_SUGGESTIONS",
  SYNTAX_HIGHLIGHTING = "SYNTAX_HIGHLIGHTING",
  ERROR_DETECTION = "ERROR_DETECTION",
  CODE_FORMATTING = "CODE_FORMATTING",
  INTELLISENSE = "INTELLISENSE",
  REFACTORING = "REFACTORING",
  DOCUMENTATION_GENERATION = "DOCUMENTATION_GENERATION",

  // Tool-related capabilities  
  TOOL_USAGE = "TOOL_USAGE",
  TASK_EXECUTION = "TASK_EXECUTION",
  FILE_MANAGEMENT = "FILE_MANAGEMENT",
  PROCESS_MANAGEMENT = "PROCESS_MANAGEMENT",
  SHELL_COMMAND_EXECUTION = "SHELL_COMMAND_EXECUTION",

  // Web and API capabilities
  WEB_SEARCH = "WEB_SEARCH",
  WEB_BROWSING = "WEB_BROWSING", 
  API_INTEGRATION = "API_INTEGRATION",

  // Integration capabilities
  GITHUB_INTEGRATION = "GITHUB_INTEGRATION",
  JIRA_INTEGRATION = "JIRA_INTEGRATION",
  LINEAR_INTEGRATION = "LINEAR_INTEGRATION",
  CONFLUENCE_INTEGRATION = "CONFLUENCE_INTEGRATION",
  NOTION_INTEGRATION = "NOTION_INTEGRATION",
  SUPABASE_INTEGRATION = "SUPABASE_INTEGRATION",

  // Memory and context capabilities
  MEMORY_MANAGEMENT = "MEMORY_MANAGEMENT",
  CONTEXT_AWARENESS = "CONTEXT_AWARENESS",
  CODEBASE_RETRIEVAL = "CODEBASE_RETRIEVAL"
}
```

### Tool Types

```typescript
enum AgentToolType {
  // File Management Tools
  SAVE_FILE = "SAVE_FILE",
  EDIT_FILE = "EDIT_FILE", 
  REMOVE_FILES = "REMOVE_FILES",

  // Web Interaction Tools
  OPEN_BROWSER = "OPEN_BROWSER",
  WEB_SEARCH = "WEB_SEARCH",
  WEB_FETCH = "WEB_FETCH",

  // Process Management Tools
  LAUNCH_PROCESS = "LAUNCH_PROCESS",
  KILL_PROCESS = "KILL_PROCESS",
  READ_PROCESS = "READ_PROCESS", 
  WRITE_PROCESS = "WRITE_PROCESS",
  LIST_PROCESSES = "LIST_PROCESSES",

  // Code Analysis Tools
  DIAGNOSTICS = "DIAGNOSTICS",
  CODEBASE_RETRIEVAL = "CODEBASE_RETRIEVAL",

  // Integration Tools
  GITHUB_API = "GITHUB_API",
  LINEAR = "LINEAR",
  JIRA = "JIRA",
  CONFLUENCE = "CONFLUENCE",
  NOTION = "NOTION", 
  SUPABASE = "SUPABASE",

  // Memory Tool
  REMEMBER = "REMEMBER"
}
```

## Complete Agent Metadata Interface

```typescript
interface AgentMetadata {
  // Basic Information
  version: string;
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  lastHeartbeat?: Date;

  // Core Capabilities
  capabilities: AgentCapability[];
  tools?: AgentToolType[];
  personalityTraits: string[];
  communicationStyle: string;
  expertiseAreas: string[];

  // Performance Metrics
  performance?: {
    responseTime?: number;
    tokenUsage?: number;
    errorRate?: number;
    successRate?: number;
    totalTasks?: number;
    averageResponseTime?: number;
    userSatisfaction?: number;
    accuracyScore?: number;
  };

  // Usage Statistics
  usage?: {
    totalRequests?: number;
    activeUsers?: number;
    peakConcurrency?: number;
    resourceUtilization?: number;
  };

  // Learning & Development
  skillDevelopment?: {
    currentLevel: number;
    targetLevel: number;
    learningPath: string[];
    progress: number;
    adaptiveCapabilities?: string[];
    learningStyle?: string;
  };

  // Reasoning & Decision Making
  reasoningStrategies?: {
    primaryMethod: string;
    fallbackMethods: string[];
    decisionMakingStyle: string;
    problemSolvingApproach: string;
  };

  // Character Development
  characterArcs?: {
    currentArc: string;
    progressionStage: string;
    milestones: Array<{
      description: string;
      achieved: boolean;
      timestamp?: Date;
    }>;
  };

  // Integration & Relationships
  relationships?: {
    collaborators: string[];
    dependencies: string[];
    integrations: Array<{
      service: string;
      status: string;
      permissions: string[];
    }>;
  };

  // Configuration & State
  config?: Record<string, unknown>;
  state?: {
    currentContext?: string;
    activeProcesses?: string[];
    memoryUtilization?: number;
    systemLoad?: number;
  };
}
```

## Standardized JSON Structure

### Complete Agent Configuration JSON Schema

```json
{
  "id": "uuid-string",
  "name": "Agent Name",
  "type": "CONVERSATIONAL|IDE_EXTENSION|API|CHAT|WORKFLOW|TASK|ASSISTANT",
  "role": "ASSISTANT|DEVELOPER|REVIEWER|USER|SYSTEM", 
  "framework": "VSCODE|WEBIDE|CLI",
  "status": "ACTIVE|INACTIVE|BUSY|ERROR|OFFLINE|ARCHIVED",
  "description": "Agent description",
  "systemPrompt": "System prompt for the agent",
  
  "capabilities": [
    "CODE_REVIEW",
    "DEBUGGING", 
    "WEB_SEARCH",
    "API_INTEGRATION"
  ],
  
  "tools": [
    "SAVE_FILE",
    "WEB_SEARCH",
    "GITHUB_API"
  ],

  "configuration": {
    "llm": {
      "provider": "openai|anthropic|local",
      "model": "gpt-4|claude-3|llama2",
      "temperature": 0.7,
      "maxTokens": 4000,
      "apiKey": "encrypted_api_key"
    },
    "memory": {
      "enabled": true,
      "maxSize": 1000,
      "ttl": 3600
    },
    "tools": {
      "allowed": ["SAVE_FILE", "WEB_SEARCH"],
      "config": {}
    }
  },

  "metadata": {
    "version": "1.0.0",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "lastActive": "2024-01-01T00:00:00Z",
    
    "personalityTraits": [
      "Helpful",
      "Professional", 
      "Detail-oriented"
    ],
    
    "communicationStyle": "formal|casual|technical",
    
    "expertiseAreas": [
      "Software Development",
      "Code Review",
      "Technical Documentation"
    ],

    "performance": {
      "responseTime": 1200,
      "tokenUsage": 1500,
      "errorRate": 0.02,
      "successRate": 0.98,
      "totalTasks": 150,
      "averageResponseTime": 1100,
      "userSatisfaction": 4.8,
      "accuracyScore": 0.95
    },

    "usage": {
      "totalRequests": 500,
      "activeUsers": 25,
      "peakConcurrency": 10,
      "resourceUtilization": 0.65
    },

    "skillDevelopment": {
      "currentLevel": 3,
      "targetLevel": 5,
      "learningPath": [
        "Basic Code Analysis",
        "Advanced Debugging",
        "System Architecture"
      ],
      "progress": 0.6,
      "adaptiveCapabilities": ["learning_from_feedback"],
      "learningStyle": "interactive"
    },

    "relationships": {
      "collaborators": ["agent-uuid-1", "agent-uuid-2"],
      "dependencies": ["web-service-1", "database-1"],
      "integrations": [
        {
          "service": "github",
          "status": "active",
          "permissions": ["read", "write"]
        }
      ]
    },

    "state": {
      "currentContext": "code-review-session",
      "activeProcesses": ["file-analysis", "lint-check"],
      "memoryUtilization": 0.45,
      "systemLoad": 0.30
    }
  },

  "accessibility": {
    "ariaLabels": true,
    "keyboardFocusable": true,
    "responsiveUI": true,
    "highContrast": true,
    "keyboardShortcuts": {
      "activate": "Ctrl+A",
      "configure": "Ctrl+C", 
      "help": "Ctrl+H"
    }
  },

  "timestamps": {
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "deletedAt": null
  },

  "ownership": {
    "userId": "user-uuid",
    "organizationId": "org-uuid",
    "permissions": ["read", "write", "delete"]
  }
}
```

## Sample Agent Configurations

### 1. Marketing Agent Example
```json
{
  "name": "Marketing Agent",
  "type": "ASSISTANT",
  "role": "ASSISTANT",
  "capabilities": ["CONTENT_GENERATION", "SOCIAL_MEDIA_MANAGEMENT"],
  "tools": ["WEB_SEARCH", "SAVE_FILE"],
  "personalityTraits": [
    "Creative",
    "Persuasive", 
    "Accessibility-Conscious",
    "Responsive"
  ],
  "expertiseAreas": [
    "Content Generation",
    "Social Media Management", 
    "Brand Strategy"
  ],
  "accessibility": {
    "ariaLabels": true,
    "keyboardFocusable": true,
    "responsiveUI": true,
    "keyboardShortcuts": {
      "contentCreate": "Ctrl+N",
      "schedule": "Ctrl+S",
      "preview": "Ctrl+P"
    }
  }
}
```

### 2. Customer Support Agent Example
```json
{
  "name": "Customer Support Agent", 
  "type": "CONVERSATIONAL",
  "role": "ASSISTANT",
  "capabilities": ["NATURAL_LANGUAGE_PROCESSING", "SENTIMENT_ANALYSIS"],
  "tools": ["WEB_SEARCH", "REMEMBER"],
  "personalityTraits": ["Empathetic", "Patient"],
  "expertiseAreas": [
    "Customer Service",
    "Problem Resolution",
    "Communication"
  ]
}
```

## API Endpoints & Data Transfer Objects

### Create Agent DTO
```typescript
interface CreateAgentDto {
  name: string;
  type: AgentType;
  role: AgentRole;
  framework: AgentFramework;
  provider: string;
  capabilities: AgentCapability[];
  description?: string;
  systemPrompt?: string;
  configuration?: Record<string, unknown>;
}
```

### Update Agent DTO
```typescript
interface UpdateAgentDto {
  name?: string;
  description?: string;
  systemPrompt?: string;
  capabilities?: AgentCapability[];
  configuration?: Record<string, unknown>;
  status?: AgentStatus;
}
```

## Validation & API Schemas

The system includes comprehensive validation:

- **UUID validation** for agent IDs
- **String length limits** (2-100 characters for names)
- **Enum validation** for all status/type fields
- **JSON schema validation** for configuration objects
- **Required field validation** for core properties

## Key Features

✅ **Standardized JSON Structure** - Consistent format across all agents  
✅ **Comprehensive Type System** - Full TypeScript definitions  
✅ **Database Integration** - Drizzle ORM with PostgreSQL  
✅ **Performance Tracking** - Built-in metrics and analytics  
✅ **Accessibility Support** - ARIA labels, keyboard navigation  
✅ **Multi-Framework Support** - VSCode, WebIDE, CLI deployment  
✅ **Flexible Configuration** - JSON-based config system  
✅ **Version Control** - Built-in versioning and change tracking  
✅ **Soft Delete Support** - Non-destructive data management  
✅ **User Ownership** - Multi-tenant agent management  

This represents a production-ready, enterprise-grade AI Agent metadata system with full standardization and extensibility.

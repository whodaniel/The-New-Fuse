# Centralized Definitions

## Core Types and Interfaces

### Memory System
```typescript
interface Memory {
  id: string;
  name: string;
  description: string;
  content: string;
  type: string;
  importance: number;
  source: string;
  category?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  status?: string;
  userId?: string;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
  size?: number;
}

interface MemoryHierarchy {
  shortTerm: VectorMemory;
  longTerm: GraphMemory;
  episodic: TemporalMemory;
  semantic: KnowledgeGraph;
}
```

### Task Management
```typescript
interface Task {
  id: string;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  dependencies: string[];
  metadata: TaskMetadata;
}

enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SCHEDULED = 'SCHEDULED'
}
```

### Learning System
```typescript
interface LearningData {
  input: string;
  output: string;
  feedback?: string;
  metadata: Record<string, any>;
}

interface NeuralPathway {
  synapticStrength: number;
  plasticityFactor: number;
  temporalDynamics: TemporalPattern;
  adaptiveThreshold: number;
}
```

### Communication
```typescript
interface Message {
  id: string;
  type: MessageType;
  source: string;
  target: string;
  content: any;
  metadata: MessageMetadata;
}

enum MessageType {
  SYSTEM = 'SYSTEM',
  TASK = 'TASK',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}
```

### Monitoring
```typescript
interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
}

interface AuditLog {
  timestamp: Date;
  action: string;
  userId: string;
  resource: string;
  details: any;
  ip: string;
  userAgent: string;
}
```

### Configuration
```typescript
interface AuthConfig {
  jwtSecret: string;
  tokenExpiration: number;
  refreshTokenExpiration: number;
  maxLoginAttempts: number;
}

interface RateLimitConfig {
  window: number;
  max: number;
  keyGenerator: (req: Request) => string;
}

interface CacheConfig {
  ttl: number;
  maxSize: number;
  updateInterval: number;
}

interface PoolConfig {
  min: number;
  max: number;
  idleTimeout: number;
}
```

### Advanced Features
```typescript
interface CollectiveNode {
  id: string;
  knowledge: KnowledgeBase;
  connections: Connection[];
  state: NodeState;
}

interface EvolutionConfig {
  learningRate: number;
  mutationFactor: number;
  stabilityThreshold: number;
  emergencyLimits: Limits;
}

interface SecurityProtocol {
  encryption: EncryptionConfig;
  monitoring: MonitorConfig;
  containment: ContainmentRules;
  emergency: EmergencyProcedures;
}

interface OptimizationConfig {
  neuralAcceleration: boolean;
  distributedProcessing: boolean;
  quantumHybrid: boolean;
  resourceLimits: ResourceLimits;
}
```

### Agent System
```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  capabilities: AgentCapability[];
  role: AgentRole;
  framework: AgentFramework;
  parameters?: Record<string, any>;
  handler?: (params: any) => Promise<any>;
  metadata?: Record<string, any>;
}

interface AgentProfile {
  name: string;
  description?: string;
  type: AgentType;
  capabilities: AgentCapability[];
  role: AgentRole;
  framework: AgentFramework;
  status: AgentStatus;
  metadata?: Record<string, any>;
}
```

### Communication System
```typescript
// Chat Components
interface ChatProps {
  initialMessages: Message[];
  storeMessageHistory: (messages: Message[]) => Promise<void>;
  importChat: (description: string, messages: Message[]) => Promise<void>;
  exportChat: () => void;
  description?: string;
}

interface MessagesProps {
  id?: string;
  className?: string;
  isStreaming?: boolean;
  messages?: Message[];
}

interface UserMessageProps {
  content: string | Array<{ type: string; text?: string; image?: string }>;
  type: string;
  text?: string;
  image?: string;
}
```

### UI Components
```typescript
interface MessageCardProps {
  message: Message;
  onDelete: (id: string) => void;
  onEdit: (message: Message) => void;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  onSendMessage: (content: string, files?: File[]) => Promise<void>;
}

interface MessageListProps {
  messages: Message[];
  onLoadMore: () => Promise<void>;
  isLoading?: boolean;
  groupByDate?: boolean;
}

# TNF MASTER SCHEMA v4.0: THE LOGICAL DNA

`[CLASS:PRIME] [STATUS:VERIFIED]`

This document is the definitive logical mapping of The New Fuse ecosystem. It details the interconnected "DNA" of the monorepo, mapping specific class methods to system-wide intelligence flows.

### ProtoA2ATaskNotFoundError
**Location:** `/packages/a2a-core/src/types.ts`
**DNA Heritage:** Extends `ProtoA2AError`
**Logical Capabilities:** 

### AGUIAgent
**Location:** `/packages/ag-ui-core/examples/nodejs-agent-example.ts`
**Logical Capabilities:** `main()`

### AgentSyncBridge
**Location:** `/packages/agent/src/bridges/agent_sync_bridge.ts`
**DNA Heritage:** Extends `BaseBridge`
**Logical Capabilities:** 

### ProtocolBridge
**Location:** `/packages/agent/src/bridges/protocol_bridge.ts`
**DNA Heritage:** Extends `BaseBridge`
**Logical Capabilities:** 

### AgentProcessor
**Location:** `/packages/agent/src/core/AgentProcessor.ts`
**Logical Capabilities:** 

### AgentSystem
**Location:** `/packages/agent/src/core/AgentSystem.ts`
**Logical Capabilities:** 

### BaseAgent
**Location:** `/packages/agent/src/core/BaseAgent.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### CascadeAgent
**Location:** `/packages/agent/src/implementations/cascade_agent.ts`
**Logical Capabilities:** 

### ClineAgent
**Location:** `/packages/agent/src/implementations/cline_agent.ts`
**Logical Capabilities:** `main()`

### EnhancedAgent
**Location:** `/packages/agent/src/implementations/enhanced_agent.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### ExampleAgent
**Location:** `/packages/agent/src/implementations/example_agent.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### InteractiveAgent
**Location:** `/packages/agent/src/implementations/interactive_agent.ts`
**Logical Capabilities:** 

### LLMChatAgent
**Location:** `/packages/agent/src/implementations/llm_chat_agent.ts`
**Logical Capabilities:** 

### ResearchAgent
**Location:** `/packages/agent/src/implementations/research_agent.ts`
**Logical Capabilities:** 

### SimpleEnhancedAgent
**Location:** `/packages/agent/src/implementations/simple_enhanced_agent.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### UnifiedAgent
**Location:** `/packages/agent/src/implementations/unified_agent.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### WorkflowAgent
**Location:** `/packages/agent/src/implementations/workflow_agent.ts`
**Logical Capabilities:** 

### MetricsRegistry
**Location:** `/packages/agent/src/monitoring/metrics.ts`
**Logical Capabilities:** 

### ProtocolRegistry
**Location:** `/packages/agent/src/protocols/ProtocolRegistry.ts`
**Logical Capabilities:** `registerProtocol()`

### WebSocketCommunicationProtocol
**Location:** `/packages/agent/src/protocols/WebSocketCommunicationProtocol.ts`
**Logical Capabilities:** `setup()`, `registerAgent()`, `unregisterAgent()`, `sendMessage()`, `broadcast()`

### RedisAgentRegistry
**Location:** `/packages/agent/src/registry/redis-agent-registry.ts`
**Logical Capabilities:** 

### AgentPool
**Location:** `/packages/agent-coordination/src/core/AgentPool.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### TaskAssigner
**Location:** `/packages/agent-coordination/src/core/TaskAssigner.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### TaskQueue
**Location:** `/packages/agent-coordination/src/core/TaskQueue.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### Coordinator
**Location:** `/packages/agent-coordination/src/orchestration/Coordinator.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** `getStatistics()`

### TaskDecomposer
**Location:** `/packages/agent-coordination/src/orchestration/TaskDecomposer.ts`
**Logical Capabilities:** 

### TaskQueueManager
**Location:** `/packages/agent-coordination/src/queues/task-queue-manager.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### RedisCoordinator
**Location:** `/packages/agent-coordination/src/redis-coordinator.ts`
**Logical Capabilities:** `acquireStateLock()`

### Ap2ProtocolController
**Location:** `/packages/ap2-protocol/src/ap2-protocol.controller.ts`
**Logical Capabilities:** 

### Ap2ProtocolModule
**Location:** `/packages/ap2-protocol/src/ap2-protocol.module.ts`
**Logical Capabilities:** 

### Ap2ProtocolService
**Location:** `/packages/ap2-protocol/src/ap2-protocol.service.ts`
**Logical Capabilities:** 

### AgentController
**Location:** `/packages/api/src/controllers/AgentController.ts`
**Logical Capabilities:** 

### CreateAgentDto
**Location:** `/packages/api/src/dto/agent.dto.ts`
**Logical Capabilities:** 

### UpdateAgentDto
**Location:** `/packages/api/src/dto/agent.dto.ts`
**Logical Capabilities:** 

### AgentResponseDto
**Location:** `/packages/api/src/dto/agent.dto.ts`
**Logical Capabilities:** 

### MCPBrokerService
**Location:** `/packages/api/src/mcp/services/mcp-broker.service.ts`
**Logical Capabilities:** 

### AgentModule
**Location:** `/packages/api/src/modules/agent.module.ts`
**Logical Capabilities:** 

### CreateAgentDtoZod
**Location:** `/packages/api/src/modules/controllers/dto/agent-validation.dto.ts`
**Logical Capabilities:** 

### UpdateAgentDtoZod
**Location:** `/packages/api/src/modules/controllers/dto/agent-validation.dto.ts`
**Logical Capabilities:** 

### AgentDto
**Location:** `/packages/api/src/modules/controllers/dto/agent.dto.ts`
**Logical Capabilities:** 

### CreateWorkflowDto
**Location:** `/packages/api/src/modules/controllers/dto/create-workflow.dto.ts`
**Logical Capabilities:** 

### WorkflowDto
**Location:** `/packages/api/src/modules/controllers/dto/swagger-dto.ts`
**Logical Capabilities:** 

### WorkflowExecutionDto
**Location:** `/packages/api/src/modules/controllers/dto/swagger-dto.ts`
**Logical Capabilities:** 

### UpdateWorkflowDto
**Location:** `/packages/api/src/modules/controllers/dto/update-workflow.dto.ts`
**Logical Capabilities:** 

### WorkflowController
**Location:** `/packages/api/src/modules/controllers/workflow.controller.ts`
**DNA Heritage:** Extends `BaseController`
**Logical Capabilities:** 

### WorkflowModule
**Location:** `/packages/api/src/modules/workflow.module.ts`
**Logical Capabilities:** 

### AgentRepository
**Location:** `/packages/api/src/repositories/agent.repository.ts`
**Logical Capabilities:** 

### WorkflowRepository
**Location:** `/packages/api/src/repositories/workflow.repository.ts`
**Logical Capabilities:** 

### WorkflowExecutionRepository
**Location:** `/packages/api/src/repositories/workflow.repository.ts`
**Logical Capabilities:** 

### WorkflowBuilder
**Location:** `/packages/api/src/services/WorkflowBuilder.ts`
**Logical Capabilities:** 

### AgentDiscoveryRegistry
**Location:** `/packages/api/src/services/agent-discovery-registry.service.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### AgentService
**Location:** `/packages/api/src/services/agent.service.ts`
**Logical Capabilities:** 

### WorkflowService
**Location:** `/packages/api/src/services/index.ts`
**DNA Heritage:** Extends `BaseService`
**Logical Capabilities:** `createServices()`

### AgentsClient
**Location:** `/packages/api-client/src/agents.client.ts`
**DNA Heritage:** Extends `ApiClient`
**Logical Capabilities:** 

### IntegrationRegistryImpl
**Location:** `/packages/api-client/src/integrations/IntegrationRegistry.ts`
**Logical Capabilities:** `info()`, `warn()`, `error()`, `debug()`, `createLogger()`

### IntegrationRegistry
**Location:** `/packages/api-client/src/integrations/registry.ts`
**Logical Capabilities:** 

### AgentsController
**Location:** `/packages/api-gateway/src/agents/agents.controller.ts`
**Logical Capabilities:** `getAgents()`

### AgentsModule
**Location:** `/packages/api-gateway/src/agents/agents.module.ts`
**Logical Capabilities:** 

### AgentsService
**Location:** `/packages/api-gateway/src/agents/agents.service.ts`
**Logical Capabilities:** `getAgents()`, `getAgent()`

### AgentOrchestrationController
**Location:** `/packages/api-gateway/src/gateway/agent-orchestration.controller.ts`
**Logical Capabilities:** `getOrchestrationStatus()`

### AgentAuthService
**Location:** `/packages/auth/src/jwt/AgentAuthService.ts`
**Logical Capabilities:** 

### SkillExecutor
**Location:** `/packages/claude-skills/src/executor/SkillExecutor.ts`
**Logical Capabilities:** 

### SkillRegistry
**Location:** `/packages/claude-skills/src/registry/SkillRegistry.ts`
**Logical Capabilities:** 

### AgentCommunicationBridge
**Location:** `/packages/core/src/agents/AgentCommunicationBridge.ts`
**Logical Capabilities:** 

### AgentCommunicationManager
**Location:** `/packages/core/src/agents/AgentCommunicationManager.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### AgentSwarmOrchestrationService
**Location:** `/packages/core/src/agents/AgentSwarmOrchestrationService.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### AgentWorkflowManager
**Location:** `/packages/core/src/agents/AgentWorkflowManager.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### WorkflowValidator
**Location:** `/packages/core/src/agents/WorkflowValidator.ts`
**Logical Capabilities:** 

### AgentInitializationService
**Location:** `/packages/core/src/agents/integration/initialization.ts`
**Logical Capabilities:** 

### SubTaskLifecycleManager
**Location:** `/packages/core/src/agents/sub-task-lifecycle-manager.ts`
**Logical Capabilities:** 

### AgentWorkflowService
**Location:** `/packages/core/src/agents/workflow/agent-workflow.service.ts`
**Logical Capabilities:** 

### ProviderRegistry
**Location:** `/packages/core/src/api-management/provider-registry.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### AssetRegistry
**Location:** `/packages/core/src/classification/assetRegistry.ts`
**Logical Capabilities:** 

### CommunicationProtocol
**Location:** `/packages/core/src/communication/CommunicationProtocol.ts`
**Logical Capabilities:** 

### MessageBroker
**Location:** `/packages/core/src/communication/MessageBroker.ts`
**Logical Capabilities:** 

### Task
**Location:** `/packages/core/src/database/entities/Task.ts`
**Logical Capabilities:** 

### CallbackHandlerRegistry
**Location:** `/packages/core/src/delegation/CallbackHandlerRegistry.ts`
**Logical Capabilities:** `handleSubtaskCompleted()`

### AgentPrompt
**Location:** `/packages/core/src/entities/agent-prompt.entity.ts`
**Logical Capabilities:** 

### Agent
**Location:** `/packages/core/src/entities/agent.entity.ts`
**Logical Capabilities:** 

### IntegrationRegistryService
**Location:** `/packages/core/src/integration/services/integration-registry.service.ts`
**Logical Capabilities:** 

### AgentCardService
**Location:** `/packages/core/src/services/AgentCardService.ts`
**Logical Capabilities:** 

### AgentFactory
**Location:** `/packages/core/src/services/AgentFactory.ts`
**Logical Capabilities:** `createAgent()`

### AgentLLMService
**Location:** `/packages/core/src/services/AgentLLMService.ts`
**Logical Capabilities:** 

### TaskService
**Location:** `/packages/core/src/services/TaskService.ts`
**Logical Capabilities:** 

### MultiAgentChatLlmService
**Location:** `/packages/core/src/services/multi-agent-chat-llm.service.ts`
**Logical Capabilities:** 

### WorkflowOrchestratorService
**Location:** `/packages/core/src/services/orchestration/workflow-orchestrator.service.ts`
**Logical Capabilities:** 

### ProtocolTranslatorService
**Location:** `/packages/core/src/services/protocol/protocol-translator.service.ts`
**Logical Capabilities:** 

### AgentInbox
**Location:** `/packages/core/src/task/AgentInbox.ts`
**Logical Capabilities:** 

### TaskExecutor
**Location:** `/packages/core/src/task/TaskExecutor.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### TaskScheduler
**Location:** `/packages/core/src/task/TaskScheduler.ts`
**Logical Capabilities:** `handleCron()`

### TaskActivityService
**Location:** `/packages/core/src/task/services/TaskActivityService.ts`
**Logical Capabilities:** 

### TaskModule
**Location:** `/packages/core/src/task/task.module.ts`
**Logical Capabilities:** 

### ComponentAnalysisTask
**Location:** `/packages/core/src/task/tasks/ComponentAnalysisTask.ts`
**Logical Capabilities:** 

### AgentError
**Location:** `/packages/core/src/utils/errors.ts`
**DNA Heritage:** Extends `BaseError`
**Logical Capabilities:** 

### AgentNotFoundError
**Location:** `/packages/core/src/utils/errors.ts`
**DNA Heritage:** Extends `AgentError`
**Logical Capabilities:** 

### AgentTimeoutError
**Location:** `/packages/core/src/utils/errors.ts`
**DNA Heritage:** Extends `AgentError`
**Logical Capabilities:** 

### TaskError
**Location:** `/packages/core/src/utils/errors.ts`
**DNA Heritage:** Extends `BaseError`
**Logical Capabilities:** 

### TaskNotFoundError
**Location:** `/packages/core/src/utils/errors.ts`
**DNA Heritage:** Extends `TaskError`
**Logical Capabilities:** 

### WorkflowError
**Location:** `/packages/core/src/utils/errors.ts`
**DNA Heritage:** Extends `BaseError`
**Logical Capabilities:** 

### WorkflowNotFoundError
**Location:** `/packages/core/src/utils/errors.ts`
**DNA Heritage:** Extends `WorkflowError`
**Logical Capabilities:** 

### WorkflowEngine
**Location:** `/packages/core/src/workflow/WorkflowEngine.ts`
**DNA Heritage:** Extends `EventEmitter`
**Logical Capabilities:** 

### WorkflowExecutor
**Location:** `/packages/core/src/workflow/WorkflowExecutor.ts`
**Logical Capabilities:** `Function()`

### TaskStepExecutor
**Location:** `/packages/core/src/workflow/WorkflowExecutor.ts`
**Logical Capabilities:** `Function()`

### DecisionStepExecutor
**Location:** `/packages/core/src/workflow/WorkflowExecutor.ts`
**Logical Capabilities:** `Function()`

### WaitStepExecutor
**Location:** `/packages/core/src/workflow/WorkflowExecutor.ts`
**Logical Capabilities:** `Function()`

### ScriptStepExecutor
**Location:** `/packages/core/src/workflow/WorkflowExecutor.ts`
**Logical Capabilities:** `Function()`

### ParallelStepExecutor
**Location:** `/packages/core/src/workflow/WorkflowExecutor.ts`
**Logical Capabilities:** `Function()`

### WorkflowAnalytics
**Location:** `/packages/core/src/workflow/analytics.ts`
**Logical Capabilities:** 

### ComplianceRuleEngine
**Location:** `/packages/core/src/workflow/audit.ts`
**Logical Capabilities:** 

### WorkflowAuditSystem
**Location:** `/packages/core/src/workflow/audit.ts`
**Logical Capabilities:** 

### WorkflowDebugger
**Location:** `/packages/core/src/workflow/debugger.ts`
**Logical Capabilities:** 

### WorkflowGateway
**Location:** `/packages/core/src/workflow/gateway.ts`
**Logical Capabilities:** 

### WorkflowRecoverySystem
**Location:** `/packages/core/src/workflow/recovery.ts`
**Logical Capabilities:** 

### WorkflowResourceManager
**Location:** `/packages/core/src/workflow/resources.ts`
**Logical Capabilities:** 

### WorkflowSecurityManager
**Location:** `/packages/core/src/workflow/security.ts`
**Logical Capabilities:** 

### WorkflowTestFramework
**Location:** `/packages/core/src/workflow/testing.ts`
**Logical Capabilities:** 

### WorkflowVersionManager
**Location:** `/packages/core/src/workflow/versioning.ts`
**Logical Capabilities:** `migrate()`

### CryptoAgentExecutorService
**Location:** `/packages/crypto-agent-framework/bridge/crypto-agent-executor.service.ts`
**Logical Capabilities:** 

### CryptoAgentController
**Location:** `/packages/crypto-agent-framework/bridge/crypto-agent.controller.ts`
**Logical Capabilities:** `getStatus()`

### CryptoAgentService
**Location:** `/packages/crypto-agent-framework/bridge/crypto-agent.service.ts`
**Logical Capabilities:** 


## 🧬 Interactive Synaptic Map

```mermaid
flowchart TD
  classDef core fill:#2b6cb0,stroke:#1A365D,color:#fff,stroke-width:2px,rx:5px,ry:5px
  classDef logic fill:#805ad5,stroke:#553C9A,color:#fff,stroke-width:1px,rx:3px,ry:3px
  classDef persistence fill:#38a169,stroke:#22543D,color:#fff,stroke-width:2px,rx:5px,ry:5px

  ProtoA2ATaskNotFoundError[ProtoA2ATaskNotFoundError]:::core
  AGUIAgent[AGUIAgent]:::core
  AGUIAgent_main[main()]:::logic
  AGUIAgent --> AGUIAgent_main
  AgentSyncBridge[AgentSyncBridge]:::core
  ProtocolBridge[ProtocolBridge]:::core
  AgentProcessor[AgentProcessor]:::core
  AgentSystem[AgentSystem]:::core
  BaseAgent[BaseAgent]:::core
  CascadeAgent[CascadeAgent]:::core
  ClineAgent[ClineAgent]:::core
  ClineAgent_main[main()]:::logic
  ClineAgent --> ClineAgent_main
  EnhancedAgent[EnhancedAgent]:::core
  ExampleAgent[ExampleAgent]:::core
  InteractiveAgent[InteractiveAgent]:::core
  LLMChatAgent[LLMChatAgent]:::core
  ResearchAgent[ResearchAgent]:::core
  SimpleEnhancedAgent[SimpleEnhancedAgent]:::core
  UnifiedAgent[UnifiedAgent]:::core
  WorkflowAgent[WorkflowAgent]:::core
  MetricsRegistry[MetricsRegistry]:::core
  ProtocolRegistry[ProtocolRegistry]:::core
  ProtocolRegistry_registerProtocol[registerProtocol()]:::logic
  ProtocolRegistry --> ProtocolRegistry_registerProtocol
  WebSocketCommunicationProtocol[WebSocketCommunicationProtocol]:::core
  WebSocketCommunicationProtocol_setup[setup()]:::logic
  WebSocketCommunicationProtocol --> WebSocketCommunicationProtocol_setup
  WebSocketCommunicationProtocol_registerAgent[registerAgent()]:::logic
  WebSocketCommunicationProtocol --> WebSocketCommunicationProtocol_registerAgent
  WebSocketCommunicationProtocol_unregisterAgent[unregisterAgent()]:::logic
  WebSocketCommunicationProtocol --> WebSocketCommunicationProtocol_unregisterAgent
  WebSocketCommunicationProtocol_sendMessage[sendMessage()]:::logic
  WebSocketCommunicationProtocol --> WebSocketCommunicationProtocol_sendMessage
  WebSocketCommunicationProtocol_broadcast[broadcast()]:::logic
  WebSocketCommunicationProtocol --> WebSocketCommunicationProtocol_broadcast
  RedisAgentRegistry[RedisAgentRegistry]:::core
  AgentPool[AgentPool]:::core
  TaskAssigner[TaskAssigner]:::core
  TaskQueue[TaskQueue]:::core
  Coordinator[Coordinator]:::core
  Coordinator_getStatistics[getStatistics()]:::logic
  Coordinator --> Coordinator_getStatistics
  TaskDecomposer[TaskDecomposer]:::core
  TaskQueueManager[TaskQueueManager]:::core
  RedisCoordinator[RedisCoordinator]:::core
  RedisCoordinator_acquireStateLock[acquireStateLock()]:::logic
  RedisCoordinator --> RedisCoordinator_acquireStateLock
  Ap2ProtocolController[Ap2ProtocolController]:::core
  Ap2ProtocolModule[Ap2ProtocolModule]:::core
  Ap2ProtocolService[Ap2ProtocolService]:::core
  AgentController[AgentController]:::core
  CreateAgentDto[CreateAgentDto]:::core
  UpdateAgentDto[UpdateAgentDto]:::core
  AgentResponseDto[AgentResponseDto]:::core
  MCPBrokerService[MCPBrokerService]:::core
  AgentModule[AgentModule]:::core
  CreateAgentDtoZod[CreateAgentDtoZod]:::core
  UpdateAgentDtoZod[UpdateAgentDtoZod]:::core
  AgentDto[AgentDto]:::core
  CreateWorkflowDto[CreateWorkflowDto]:::core
  WorkflowDto[WorkflowDto]:::core
  WorkflowExecutionDto[WorkflowExecutionDto]:::core
  UpdateWorkflowDto[UpdateWorkflowDto]:::core
  WorkflowController[WorkflowController]:::core
  WorkflowModule[WorkflowModule]:::core
  AgentRepository[AgentRepository]:::core
  WorkflowRepository[WorkflowRepository]:::core
  WorkflowExecutionRepository[WorkflowExecutionRepository]:::core
  WorkflowBuilder[WorkflowBuilder]:::core
  AgentDiscoveryRegistry[AgentDiscoveryRegistry]:::core
  AgentService[AgentService]:::core
  WorkflowService[WorkflowService]:::core
  WorkflowService_createServices[createServices()]:::logic
  WorkflowService --> WorkflowService_createServices
  AgentsClient[AgentsClient]:::core
  IntegrationRegistryImpl[IntegrationRegistryImpl]:::core
  IntegrationRegistryImpl_info[info()]:::logic
  IntegrationRegistryImpl --> IntegrationRegistryImpl_info
  IntegrationRegistryImpl_warn[warn()]:::logic
  IntegrationRegistryImpl --> IntegrationRegistryImpl_warn
  IntegrationRegistryImpl_error[error()]:::logic
  IntegrationRegistryImpl --> IntegrationRegistryImpl_error
  IntegrationRegistryImpl_debug[debug()]:::logic
  IntegrationRegistryImpl --> IntegrationRegistryImpl_debug
  IntegrationRegistryImpl_createLogger[createLogger()]:::logic
  IntegrationRegistryImpl --> IntegrationRegistryImpl_createLogger
  IntegrationRegistry[IntegrationRegistry]:::core
  AgentsController[AgentsController]:::core
  AgentsController_getAgents[getAgents()]:::logic
  AgentsController --> AgentsController_getAgents
  AgentsModule[AgentsModule]:::core
  AgentsService[AgentsService]:::core
  AgentsService_getAgents[getAgents()]:::logic
  AgentsService --> AgentsService_getAgents
  AgentsService_getAgent[getAgent()]:::logic
  AgentsService --> AgentsService_getAgent
  AgentOrchestrationController[AgentOrchestrationController]:::core
  AgentOrchestrationController_getOrchestrationStatus[getOrchestrationStatus()]:::logic
  AgentOrchestrationController --> AgentOrchestrationController_getOrchestrationStatus
  AgentAuthService[AgentAuthService]:::core
  SkillExecutor[SkillExecutor]:::core
  SkillRegistry[SkillRegistry]:::core
  AgentCommunicationBridge[AgentCommunicationBridge]:::core
  AgentCommunicationManager[AgentCommunicationManager]:::core
  AgentSwarmOrchestrationService[AgentSwarmOrchestrationService]:::core
  AgentWorkflowManager[AgentWorkflowManager]:::core
  WorkflowValidator[WorkflowValidator]:::core
  AgentInitializationService[AgentInitializationService]:::core
  SubTaskLifecycleManager[SubTaskLifecycleManager]:::core
  AgentWorkflowService[AgentWorkflowService]:::core
  ProviderRegistry[ProviderRegistry]:::core
  AssetRegistry[AssetRegistry]:::core
  CommunicationProtocol[CommunicationProtocol]:::core
  MessageBroker[MessageBroker]:::core
  Task[Task]:::core
  CallbackHandlerRegistry[CallbackHandlerRegistry]:::core
  CallbackHandlerRegistry_handleSubtaskCompleted[handleSubtaskCompleted()]:::logic
  CallbackHandlerRegistry --> CallbackHandlerRegistry_handleSubtaskCompleted
  AgentPrompt[AgentPrompt]:::core
  Agent[Agent]:::core
  IntegrationRegistryService[IntegrationRegistryService]:::core
  AgentCardService[AgentCardService]:::core
  AgentFactory[AgentFactory]:::core
  AgentFactory_createAgent[createAgent()]:::logic
  AgentFactory --> AgentFactory_createAgent
  AgentLLMService[AgentLLMService]:::core
  TaskService[TaskService]:::core
  MultiAgentChatLlmService[MultiAgentChatLlmService]:::core
  WorkflowOrchestratorService[WorkflowOrchestratorService]:::core
  ProtocolTranslatorService[ProtocolTranslatorService]:::core
  AgentInbox[AgentInbox]:::core
  TaskExecutor[TaskExecutor]:::core
  TaskScheduler[TaskScheduler]:::core
  TaskScheduler_handleCron[handleCron()]:::logic
  TaskScheduler --> TaskScheduler_handleCron
  TaskActivityService[TaskActivityService]:::core
  TaskModule[TaskModule]:::core
  ComponentAnalysisTask[ComponentAnalysisTask]:::core
  AgentError[AgentError]:::core
  AgentNotFoundError[AgentNotFoundError]:::core
  AgentNotFoundError --|> AgentError
  AgentTimeoutError[AgentTimeoutError]:::core
  AgentTimeoutError --|> AgentError
  TaskError[TaskError]:::core
  TaskNotFoundError[TaskNotFoundError]:::core
  TaskNotFoundError --|> TaskError
  WorkflowError[WorkflowError]:::core
  WorkflowNotFoundError[WorkflowNotFoundError]:::core
  WorkflowNotFoundError --|> WorkflowError
  WorkflowEngine[WorkflowEngine]:::core
  WorkflowExecutor[WorkflowExecutor]:::core
  WorkflowExecutor_Function[Function()]:::logic
  WorkflowExecutor --> WorkflowExecutor_Function
  TaskStepExecutor[TaskStepExecutor]:::core
  TaskStepExecutor_Function[Function()]:::logic
  TaskStepExecutor --> TaskStepExecutor_Function
  DecisionStepExecutor[DecisionStepExecutor]:::core
  DecisionStepExecutor_Function[Function()]:::logic
  DecisionStepExecutor --> DecisionStepExecutor_Function
  WaitStepExecutor[WaitStepExecutor]:::core
  WaitStepExecutor_Function[Function()]:::logic
  WaitStepExecutor --> WaitStepExecutor_Function
  ScriptStepExecutor[ScriptStepExecutor]:::core
  ScriptStepExecutor_Function[Function()]:::logic
  ScriptStepExecutor --> ScriptStepExecutor_Function
  ParallelStepExecutor[ParallelStepExecutor]:::core
  ParallelStepExecutor_Function[Function()]:::logic
  ParallelStepExecutor --> ParallelStepExecutor_Function
  WorkflowAnalytics[WorkflowAnalytics]:::core
  ComplianceRuleEngine[ComplianceRuleEngine]:::core
  WorkflowAuditSystem[WorkflowAuditSystem]:::core
  WorkflowDebugger[WorkflowDebugger]:::core
  WorkflowGateway[WorkflowGateway]:::core
  WorkflowRecoverySystem[WorkflowRecoverySystem]:::core
  WorkflowResourceManager[WorkflowResourceManager]:::core
  WorkflowSecurityManager[WorkflowSecurityManager]:::core
  WorkflowTestFramework[WorkflowTestFramework]:::core
  WorkflowVersionManager[WorkflowVersionManager]:::core
  WorkflowVersionManager_migrate[migrate()]:::logic
  WorkflowVersionManager --> WorkflowVersionManager_migrate
  CryptoAgentExecutorService[CryptoAgentExecutorService]:::core
  CryptoAgentController[CryptoAgentController]:::core
  CryptoAgentController_getStatus[getStatus()]:::logic
  CryptoAgentController --> CryptoAgentController_getStatus
  CryptoAgentService[CryptoAgentService]:::core

  %% TNF High-Level Logic Bus
  UnifiedWorkflowEngine -->|Orchestrates| WorkflowExecutor
  WorkflowExecutor -->|Binds to| MasterAgentRegistry
  TaskAssigner -->|Allocates| AgentPool
  Coordinator -->|Syncs| SharedCache
```

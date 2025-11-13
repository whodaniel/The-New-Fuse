/**
 * DACC Protocol Schema Definitions
 * TypeScript interfaces equivalent to the Pydantic schemas in the specification
 */
import { ParseStrategy, StreamEventType, ToolType, ExecutionEnvironment, DACCStatus } from './enums';
/**
 * POML Template Definition - Microsoft POML integration
 */
export interface POMTemplateDefinition {
    template_name: string;
    template_content: string;
    data_bindings?: Record<string, string>;
    validation_schema?: string;
    hint_metadata?: Record<string, any>;
}
/**
 * POML Data Component for dynamic data resolution
 */
export interface POMDataComponent {
    component_name: string;
    data_source: string;
    resolver_config: Record<string, any>;
    cache_ttl_seconds?: number;
    validation_hints?: string[];
}
/**
 * POML Execution Context for enhanced agent interactions
 */
export interface POMExecutionContext {
    template_data: Record<string, any>;
    resolved_components: Record<string, any>;
    validation_hints: string[];
    rendering_metadata: Record<string, any>;
}
/**
 * Core AgentDefinition schema - defines a single specialized agent
 * Enhanced v2.0 with POML integration support
 */
export interface AgentDefinition {
    agent_name: string;
    description: string;
    persona: string;
    output_schema_code: string;
    parsing_grammar: string;
    parsing_strategy?: ParseStrategy;
    poml_template?: POMTemplateDefinition;
    data_components?: POMDataComponent[];
    enable_poml_rendering?: boolean;
    hint_validation_enabled?: boolean;
}
/**
 * Conditional step for workflow branching
 */
export interface ConditionalNextStep {
    condition: string;
    next_step_name: string;
}
/**
 * Individual step in a workflow
 */
export interface WorkflowStep {
    step_name: string;
    agent_name: string;
    input_mapping?: Record<string, string>;
    next_steps?: ConditionalNextStep[];
    default_next_step?: string;
}
/**
 * Complete workflow definition
 */
export interface WorkflowDefinition {
    workflow_name: string;
    description: string;
    start_step: string;
    steps: WorkflowStep[];
}
/**
 * System blueprint containing agents and workflow for autonomous creation
 */
export interface SystemBlueprint {
    new_agents_to_create: AgentDefinition[];
    workflow: WorkflowDefinition;
}
/**
 * Real-time stream packet for SSE communication
 */
export interface StreamPacket {
    event_type: StreamEventType;
    data: Record<string, any>;
    step_name: string;
    timestamp?: string;
    session_id?: string;
}
/**
 * Base tool request interface
 */
export interface ToolRequest {
    tool_name: ToolType;
}
/**
 * Code execution request
 */
export interface CodeExecutionRequest extends ToolRequest {
    tool_name: ToolType.CODE_EXECUTOR;
    environment_type: ExecutionEnvironment;
    code_to_execute: string;
    packages_to_install?: string[];
}
/**
 * Firebase function call request
 */
export interface FirebaseFunctionCall extends ToolRequest {
    tool_name: ToolType.FIREBASE_FUNCTION;
    function_name: string;
    payload?: Record<string, any>;
}
/**
 * MCP command request
 */
export interface McpCommand extends ToolRequest {
    tool_name: ToolType.MCP_COMMAND;
    command: string;
    arguments?: Record<string, any>;
}
/**
 * DACC execution state for orchestration
 */
export interface DACCExecutionState {
    workflow_id: string;
    current_step: string;
    step_data: Record<string, any>;
    global_context: Record<string, any>;
    status: DACCStatus;
    started_at: string;
    completed_at?: string;
    error?: string;
}
/**
 * Agent factory configuration
 */
export interface AgentFactoryConfig {
    max_concurrent_agents: number;
    default_parsing_strategy: ParseStrategy;
    schema_validation_enabled: boolean;
    cache_compiled_schemas: boolean;
}
/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
    max_concurrent_workflows: number;
    step_timeout_ms: number;
    enable_state_persistence: boolean;
    stream_events: boolean;
    redis_channel_prefix: string;
}
/**
 * Tool execution result
 */
export interface ToolExecutionResult {
    tool_name: string;
    success: boolean;
    output?: any;
    error?: string;
    execution_time_ms?: number;
    metadata?: Record<string, any>;
}
/**
 * Agent execution result
 */
export interface AgentExecutionResult {
    agent_name: string;
    step_name: string;
    success: boolean;
    output?: any;
    parsed_output?: any;
    tool_calls?: ToolRequest[];
    tool_results?: ToolExecutionResult[];
    error?: string;
    execution_time_ms?: number;
    stream_packets?: StreamPacket[];
}
//# sourceMappingURL=schemas.d.ts.map
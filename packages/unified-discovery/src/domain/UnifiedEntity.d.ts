/**
 * Unified Entity Domain Model
 *
 * Core domain model for all discoverable entities in The New Fuse system.
 * Uses Domain-Driven Design principles with rich domain logic.
 */
import { AggregateRoot } from '@nestjs/cqrs';
export declare class EntityId {
    readonly value: string;
    constructor(value: string);
    static generate(): EntityId;
    static fromString(value: string): EntityId;
    equals(other: EntityId): boolean;
    toString(): string;
}
export declare class EntityIdentity {
    readonly name: string;
    readonly displayName: string;
    readonly description: string;
    readonly version?: string | undefined;
    readonly namespace?: string | undefined;
    constructor(name: string, displayName: string, description: string, version?: string | undefined, namespace?: string | undefined);
    getFullyQualifiedName(): string;
}
export declare enum EntityArchetype {
    REASONING_AGENT = "reasoning_agent",
    PLANNING_AGENT = "planning_agent",
    LEARNING_AGENT = "learning_agent",
    CREATIVE_AGENT = "creative_agent",
    EXECUTION_AGENT = "execution_agent",
    COORDINATION_AGENT = "coordination_agent",
    MONITORING_AGENT = "monitoring_agent",
    OPTIMIZATION_AGENT = "optimization_agent",
    PROTOCOL_BRIDGE = "protocol_bridge",
    SERVICE_MESH_NODE = "service_mesh_node",
    CAPABILITY_PROVIDER = "capability_provider",
    RESOURCE_MANAGER = "resource_manager",
    AGENT_SERVICE_HYBRID = "agent_service_hybrid",
    TOOL_AGENT_HYBRID = "tool_agent_hybrid",
    EXTENSION_AGENT_HYBRID = "extension_agent_hybrid",
    CLI_AGENT = "cli_agent",
    API_AGENT = "api_agent",
    SUB_AGENT = "sub_agent",
    PYDANTIC_AGENT = "pydantic_agent",
    MCP_SERVER = "mcp_server"
}
export declare enum CapabilityType {
    REASONING = "reasoning",
    PLANNING = "planning",
    LEARNING = "learning",
    MEMORY = "memory",
    DECISION_MAKING = "decision_making",
    CODE_GENERATION = "code_generation",
    CODE_ANALYSIS = "code_analysis",
    CONTENT_CREATION = "content_creation",
    DATA_ANALYSIS = "data_analysis",
    WORKFLOW_ORCHESTRATION = "workflow_orchestration",
    EXECUTION_AGENT = "execution_agent",
    API_INTEGRATION = "api_integration",
    FILE_OPERATIONS = "file_operations",
    SYSTEM_COMMANDS = "system_commands",
    PROTOCOL_TRANSLATION = "protocol_translation",
    DATABASE_OPERATIONS = "database_operations",
    NATURAL_LANGUAGE = "natural_language",
    MULTIMODAL = "multimodal",
    REAL_TIME_CHAT = "real_time_chat",
    ASYNC_MESSAGING = "async_messaging",
    SECURITY_ANALYSIS = "security_analysis",
    PERFORMANCE_OPTIMIZATION = "performance_optimization",
    ERROR_HANDLING = "error_handling",
    MONITORING = "monitoring"
}
export declare class Capability {
    readonly type: CapabilityType;
    readonly level: 'basic' | 'intermediate' | 'advanced' | 'expert';
    readonly confidence: number;
    readonly metadata: Record<string, any>;
    constructor(type: CapabilityType, level: 'basic' | 'intermediate' | 'advanced' | 'expert', confidence: number, // 0-1
    metadata?: Record<string, any>);
    isCompatibleWith(other: Capability): boolean;
}
export declare class CapabilitySet {
    private capabilities;
    constructor(capabilities?: Capability[]);
    addCapability(capability: Capability): void;
    hasCapability(type: CapabilityType): boolean;
    getCapability(type: CapabilityType): Capability | undefined;
    getAllCapabilities(): Capability[];
    calculateOverlapWith(other: CapabilitySet): number;
    getCapabilityScore(): number;
}
export declare enum DiscoverySource {
    CLAUDE_MARKDOWN = "claude_markdown",
    PYDANTIC_PYTHON = "pydantic_python",
    MCP_SERVER = "mcp_server",
    VSCODE_EXTENSION = "vscode_extension",
    API_SERVICE = "api_service",
    CONFIGURATION_FILE = "configuration_file",
    RUNTIME_DISCOVERY = "runtime_discovery",
    MANUAL_REGISTRATION = "manual_registration"
}
export declare class EntityMetadata {
    readonly discoverySource: DiscoverySource;
    readonly discoveredAt: Date;
    readonly lastUpdated: Date;
    readonly filePath?: string | undefined;
    readonly sourceCode?: string | undefined;
    readonly configuration?: Record<string, any> | undefined;
    readonly tags: string[];
    readonly customProperties: Record<string, any>;
    constructor(discoverySource: DiscoverySource, discoveredAt: Date, lastUpdated: Date, filePath?: string | undefined, sourceCode?: string | undefined, configuration?: Record<string, any> | undefined, tags?: string[], customProperties?: Record<string, any>);
    addTag(tag: string): EntityMetadata;
    updateProperty(key: string, value: any): EntityMetadata;
}
export declare class EntityDiscoveredEvent {
    readonly entityId: EntityId;
    readonly discoverySource: DiscoverySource;
    readonly timestamp: Date;
    constructor(entityId: EntityId, discoverySource: DiscoverySource, timestamp?: Date);
}
export declare class EntityCapabilitiesUpdatedEvent {
    readonly entityId: EntityId;
    readonly oldCapabilities: CapabilitySet;
    readonly newCapabilities: CapabilitySet;
    readonly timestamp: Date;
    constructor(entityId: EntityId, oldCapabilities: CapabilitySet, newCapabilities: CapabilitySet, timestamp?: Date);
}
export declare class EntityRelationshipDetectedEvent {
    readonly sourceEntityId: EntityId;
    readonly targetEntityId: EntityId;
    readonly relationshipType: string;
    readonly confidence: number;
    readonly timestamp: Date;
    constructor(sourceEntityId: EntityId, targetEntityId: EntityId, relationshipType: string, confidence: number, timestamp?: Date);
}
export declare class UnifiedEntity extends AggregateRoot {
    readonly id: EntityId;
    readonly identity: EntityIdentity;
    readonly archetype: EntityArchetype;
    readonly capabilities: CapabilitySet;
    readonly metadata: EntityMetadata;
    readonly semanticEmbedding?: number[] | undefined;
    readonly isActive: boolean;
    constructor(id: EntityId, identity: EntityIdentity, archetype: EntityArchetype, capabilities: CapabilitySet, metadata: EntityMetadata, semanticEmbedding?: number[] | undefined, isActive?: boolean);
    static create(identity: EntityIdentity, archetype: EntityArchetype, capabilities: CapabilitySet, metadata: EntityMetadata): UnifiedEntity;
    updateCapabilities(newCapabilities: CapabilitySet): void;
    calculateSimilarityWith(other: UnifiedEntity): number;
    isCompatibleWith(other: UnifiedEntity): boolean;
    canCollaborateWith(other: UnifiedEntity): boolean;
    private areCapabilitiesComplementary;
    deactivate(): void;
    toJSON(): any;
}
//# sourceMappingURL=UnifiedEntity.d.ts.map
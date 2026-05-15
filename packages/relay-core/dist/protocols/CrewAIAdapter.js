"use strict";
/**
 * CrewAI Protocol Adapter
 *
 * Handles CrewAI's multi-agent framework format
 * Converts between CrewAI crew/agent messages and The New Fuse's A2A protocol
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrewAIAdapter = void 0;
class CrewAIAdapter {
    constructor(logger) {
        this.name = 'crewai';
        this.version = '1.0.0';
        this.supportedProtocols = ['crewai-v1.0', 'a2a-v2.0'];
        this.logger = logger;
    }
    canTranslate(from, to) {
        return this.supportedProtocols.includes(from) && this.supportedProtocols.includes(to);
    }
    async translate(message, sourceProtocol, targetProtocol) {
        if (sourceProtocol === 'crewai-v1.0' && targetProtocol === 'a2a-v2.0') {
            return this.crewaiToA2A(message);
        }
        else if (sourceProtocol === 'a2a-v2.0' && targetProtocol === 'crewai-v1.0') {
            return this.a2aToCrewAI(message);
        }
        throw new Error(`Unsupported translation: ${sourceProtocol} -> ${targetProtocol}`);
    }
    crewaiToA2A(message) {
        const { payload } = message;
        // Handle CrewAI task execution
        if (this.isCrewAITaskExecution(payload)) {
            return {
                ...message,
                type: 'TASK_EXECUTION',
                payload: {
                    task: {
                        id: payload.task_id || payload.task?.id,
                        description: payload.task?.description || payload.description,
                        expectedOutput: payload.task?.expected_output,
                        agentRole: payload.agent?.role || payload.agent_role,
                        tools: payload.task?.tools || payload.tools || [],
                    },
                    agent: {
                        role: payload.agent?.role,
                        goal: payload.agent?.goal,
                        backstory: payload.agent?.backstory,
                        capabilities: payload.agent?.tools || [],
                    },
                    result: payload.result || payload.output,
                    status: payload.status || 'completed',
                    executionTime: payload.execution_time,
                },
                metadata: {
                    ...message.metadata,
                    protocol: 'a2a-v2.0',
                    originalProtocol: 'crewai-v1.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Handle CrewAI crew coordination
        if (this.isCrewAICrewCoordination(payload)) {
            return {
                ...message,
                type: 'CREW_COORDINATION',
                payload: {
                    crew: {
                        id: payload.crew_id,
                        name: payload.crew_name,
                        agents: payload.agents || [],
                        tasks: payload.tasks || [],
                        process: payload.process || 'sequential',
                    },
                    coordination: {
                        type: payload.coordination_type || 'task_assignment',
                        agentAssignments: payload.agent_assignments || {},
                        taskDependencies: payload.task_dependencies || [],
                        status: payload.status || 'active',
                    },
                    progress: payload.progress || {},
                },
                metadata: {
                    ...message.metadata,
                    protocol: 'a2a-v2.0',
                    originalProtocol: 'crewai-v1.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Handle CrewAI agent collaboration
        if (this.isCrewAIAgentCollaboration(payload)) {
            return {
                ...message,
                type: 'AGENT_COLLABORATION',
                payload: {
                    collaboration: {
                        type: payload.collaboration_type || 'delegation',
                        requestingAgent: payload.requesting_agent,
                        targetAgent: payload.target_agent,
                        request: payload.request || payload.delegation_request,
                        context: payload.context || {},
                    },
                    result: payload.result,
                    feedback: payload.feedback || payload.review,
                    status: payload.status || 'pending',
                },
                metadata: {
                    ...message.metadata,
                    protocol: 'a2a-v2.0',
                    originalProtocol: 'crewai-v1.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Handle CrewAI tool usage
        if (this.isCrewAIToolUsage(payload)) {
            return {
                ...message,
                type: 'TOOL_USAGE',
                payload: {
                    tool: {
                        name: payload.tool_name || payload.tool?.name,
                        description: payload.tool?.description,
                        parameters: payload.tool_parameters || payload.parameters,
                    },
                    agent: payload.agent_role || payload.agent?.role,
                    input: payload.input,
                    output: payload.output,
                    success: !payload.error,
                    error: payload.error,
                },
                metadata: {
                    ...message.metadata,
                    protocol: 'a2a-v2.0',
                    originalProtocol: 'crewai-v1.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Handle CrewAI memory sharing
        if (this.isCrewAIMemorySharing(payload)) {
            return {
                ...message,
                type: 'MEMORY_SHARING',
                payload: {
                    memory: {
                        type: payload.memory_type || 'shared',
                        content: payload.memory_content || payload.content,
                        scope: payload.scope || 'crew', // crew, agent, task
                        permissions: payload.permissions || ['read', 'write'],
                    },
                    sharingAgent: payload.sharing_agent,
                    accessingAgents: payload.accessing_agents || [],
                    timestamp: payload.timestamp || new Date().toISOString(),
                },
                metadata: {
                    ...message.metadata,
                    protocol: 'a2a-v2.0',
                    originalProtocol: 'crewai-v1.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Generic CrewAI message
        return {
            ...message,
            payload: {
                content: this.extractCrewAIContent(payload),
                agent: payload.agent || payload.agent_role,
                crew: payload.crew || payload.crew_id,
                metadata: this.extractCrewAIMetadata(payload),
            },
            metadata: {
                ...message.metadata,
                protocol: 'a2a-v2.0',
                originalProtocol: 'crewai-v1.0',
                translatedAt: new Date().toISOString(),
            },
        };
    }
    a2aToCrewAI(message) {
        const { payload } = message;
        // Convert A2A task execution to CrewAI format
        if (message.type === 'TASK_EXECUTION') {
            return {
                ...message,
                payload: this.createCrewAITaskExecution(payload),
                metadata: {
                    ...message.metadata,
                    protocol: 'crewai-v1.0',
                    originalProtocol: 'a2a-v2.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Convert A2A crew coordination to CrewAI format
        if (message.type === 'CREW_COORDINATION') {
            return {
                ...message,
                payload: this.createCrewAICrewCoordination(payload),
                metadata: {
                    ...message.metadata,
                    protocol: 'crewai-v1.0',
                    originalProtocol: 'a2a-v2.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Convert A2A agent collaboration to CrewAI format
        if (message.type === 'AGENT_COLLABORATION') {
            return {
                ...message,
                payload: this.createCrewAIAgentCollaboration(payload),
                metadata: {
                    ...message.metadata,
                    protocol: 'crewai-v1.0',
                    originalProtocol: 'a2a-v2.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Convert A2A tool usage to CrewAI format
        if (message.type === 'TOOL_USAGE') {
            return {
                ...message,
                payload: this.createCrewAIToolUsage(payload),
                metadata: {
                    ...message.metadata,
                    protocol: 'crewai-v1.0',
                    originalProtocol: 'a2a-v2.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Convert A2A memory sharing to CrewAI format
        if (message.type === 'MEMORY_SHARING') {
            return {
                ...message,
                payload: this.createCrewAIMemorySharing(payload),
                metadata: {
                    ...message.metadata,
                    protocol: 'crewai-v1.0',
                    originalProtocol: 'a2a-v2.0',
                    translatedAt: new Date().toISOString(),
                },
            };
        }
        // Generic A2A to CrewAI conversion
        return {
            ...message,
            payload: this.createCrewAIMessage(payload),
            metadata: {
                ...message.metadata,
                protocol: 'crewai-v1.0',
                originalProtocol: 'a2a-v2.0',
                translatedAt: new Date().toISOString(),
            },
        };
    }
    // CrewAI format detection helpers
    isCrewAITaskExecution(payload) {
        return !!(payload.task || payload.task_id) && !!(payload.agent || payload.agent_role);
    }
    isCrewAICrewCoordination(payload) {
        return !!(payload.crew || payload.crew_id) && !!(payload.agents || payload.tasks);
    }
    isCrewAIAgentCollaboration(payload) {
        return !!(payload.requesting_agent && payload.target_agent) || !!payload.delegation_request;
    }
    isCrewAIToolUsage(payload) {
        return !!(payload.tool_name || payload.tool) && payload.input !== undefined;
    }
    isCrewAIMemorySharing(payload) {
        return !!(payload.memory_content || payload.sharing_agent);
    }
    // CrewAI parsing helpers
    extractCrewAIContent(payload) {
        return (payload.content ||
            payload.output ||
            payload.result ||
            payload.message ||
            JSON.stringify(payload));
    }
    extractCrewAIMetadata(payload) {
        return {
            crewId: payload.crew_id,
            agentRole: payload.agent?.role || payload.agent_role,
            taskId: payload.task_id || payload.task?.id,
            process: payload.process,
            executionTime: payload.execution_time,
            tools: payload.tools?.map((tool) => tool.name || tool),
            status: payload.status,
        };
    }
    // CrewAI format generation helpers
    createCrewAITaskExecution(payload) {
        return {
            task_id: payload.task?.id,
            task: {
                id: payload.task?.id,
                description: payload.task?.description,
                expected_output: payload.task?.expectedOutput,
                tools: payload.task?.tools || [],
            },
            agent: {
                role: payload.agent?.role || payload.task?.agentRole,
                goal: payload.agent?.goal,
                backstory: payload.agent?.backstory,
                tools: payload.agent?.capabilities || [],
            },
            result: payload.result,
            status: payload.status || 'completed',
            execution_time: payload.executionTime,
        };
    }
    createCrewAICrewCoordination(payload) {
        return {
            crew_id: payload.crew?.id,
            crew_name: payload.crew?.name,
            agents: payload.crew?.agents || [],
            tasks: payload.crew?.tasks || [],
            process: payload.crew?.process || 'sequential',
            coordination_type: payload.coordination?.type || 'task_assignment',
            agent_assignments: payload.coordination?.agentAssignments || {},
            task_dependencies: payload.coordination?.taskDependencies || [],
            status: payload.coordination?.status || 'active',
            progress: payload.progress || {},
        };
    }
    createCrewAIAgentCollaboration(payload) {
        return {
            collaboration_type: payload.collaboration?.type || 'delegation',
            requesting_agent: payload.collaboration?.requestingAgent,
            target_agent: payload.collaboration?.targetAgent,
            delegation_request: payload.collaboration?.request,
            context: payload.collaboration?.context || {},
            result: payload.result,
            feedback: payload.feedback,
            status: payload.status || 'pending',
        };
    }
    createCrewAIToolUsage(payload) {
        return {
            tool_name: payload.tool?.name,
            tool: {
                name: payload.tool?.name,
                description: payload.tool?.description,
            },
            tool_parameters: payload.tool?.parameters,
            agent_role: payload.agent,
            input: payload.input,
            output: payload.output,
            error: payload.success === false ? payload.error : undefined,
        };
    }
    createCrewAIMemorySharing(payload) {
        return {
            memory_type: payload.memory?.type || 'shared',
            memory_content: payload.memory?.content,
            scope: payload.memory?.scope || 'crew',
            permissions: payload.memory?.permissions || ['read', 'write'],
            sharing_agent: payload.sharingAgent,
            accessing_agents: payload.accessingAgents || [],
            timestamp: payload.timestamp || new Date().toISOString(),
        };
    }
    createCrewAIMessage(payload) {
        return {
            content: payload.content || payload.message,
            agent_role: payload.agent,
            crew_id: payload.crew,
            metadata: payload.metadata || {},
        };
    }
}
exports.CrewAIAdapter = CrewAIAdapter;
//# sourceMappingURL=CrewAIAdapter.js.map
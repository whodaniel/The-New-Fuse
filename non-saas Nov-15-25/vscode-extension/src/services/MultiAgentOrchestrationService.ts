/**
 * Advanced Multi-Agent Orchestration Service
 * Provides sophisticated coordination patterns for agent collaboration:
 * - Workflow orchestration with DAGs
 * - Consensus mechanisms
 * - Load balancing and task distribution
 * - Fault tolerance and recovery
 * - Performance monitoring and optimization
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { AgentCommunicationService } from './AgentCommunicationService';
import { A2AProtocolClient } from '../protocols/A2AProtocol';
import { AgentMessageType } from '../types/agent-communication'; // Added import

export interface Agent {
    id: string;
    name: string;
    capabilities: string[];
    status: 'idle' | 'busy' | 'offline' | 'error';
    load: number; // 0-100
    lastSeen: Date;
    metadata: Record<string, any>;
}

export interface WorkflowTask {
    id: string;
    type: string;
    description: string;
    input: any;
    output?: any;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    assignedAgent?: string;
    dependencies: string[]; // Task IDs this task depends on
    retryCount: number;
    maxRetries: number;
    timeout: number; // milliseconds
    priority: 'low' | 'normal' | 'high' | 'critical';
    metadata: Record<string, any>;
    startTime?: Date;
    endTime?: Date;
    error?: string;
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    tasks: Map<string, WorkflowTask>;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number; // 0-100
    startTime?: Date;
    endTime?: Date;
    metadata: Record<string, any>;
}

export interface OrchestrationStrategy {
    name: string;
    description: string;
    selectAgent: (agents: Agent[], task: WorkflowTask) => Agent | null;
    handleFailure: (task: WorkflowTask, agent: Agent, error: any) => 'retry' | 'reassign' | 'fail';
    balanceLoad: (agents: Agent[], tasks: WorkflowTask[]) => Map<string, string[]>; // agentId -> taskIds
}

export interface ConsensusConfig {
    type: 'majority' | 'unanimous' | 'weighted' | 'byzantine';
    threshold: number; // For majority/weighted consensus
    timeout: number; // milliseconds
    retries: number;
}

export interface ConsensusRequest {
    id: string;
    topic: string;
    proposal: any;
    participants: string[]; // Agent IDs
    config: ConsensusConfig;
    responses: Map<string, { vote: boolean; weight?: number; reason?: string }>;
    status: 'pending' | 'reached' | 'failed' | 'timeout';
    result?: boolean;
    startTime: Date;
    endTime?: Date;
}

export class MultiAgentOrchestrationService extends EventEmitter {
    private agents: Map<string, Agent> = new Map();
    private workflows: Map<string, Workflow> = new Map();
    private runningTasks: Map<string, WorkflowTask> = new Map();
    private strategies: Map<string, OrchestrationStrategy> = new Map();
    private consensusRequests: Map<string, ConsensusRequest> = new Map();
    private agentCommunication: AgentCommunicationService;
    private a2aClient: A2AProtocolClient;
    private orchestrationTimer: NodeJS.Timeout | null = null;
    private metrics: Map<string, any> = new Map();

    constructor(
        agentCommunication: AgentCommunicationService,
        a2aClient: A2AProtocolClient
    ) {
        super();
        this.agentCommunication = agentCommunication;
        this.a2aClient = a2aClient;
        this.setupDefaultStrategies();
        this.initializeMetrics();
        this.startOrchestrationLoop();
        this.setupEventHandlers();
    }

    private setupDefaultStrategies(): void {
        // Round Robin Strategy
        this.strategies.set('round-robin', {
            name: 'Round Robin',
            description: 'Distributes tasks evenly across available agents',
            selectAgent: (agents: Agent[], task: WorkflowTask) => {
                const availableAgents = agents.filter(a => 
                    a.status === 'idle' && 
                    task.type === 'any' || a.capabilities.includes(task.type)
                );
                
                if (availableAgents.length === 0) {
                    return null;
                }
                
                // Simple round-robin selection
                const sorted = availableAgents.sort((a, b) => a.load - b.load);
                return sorted[0];
            },
            handleFailure: (task, agent, error) => {
                if (task.retryCount < task.maxRetries) {
                    return 'retry';
                }
                return 'reassign';
            },
            balanceLoad: (agents: Agent[], tasks: WorkflowTask[]) => {
                const assignment = new Map<string, string[]>();
                const availableAgents = agents.filter(a => a.status === 'idle');
                
                tasks.forEach((task, index) => {
                    const agentIndex = index % availableAgents.length;
                    const agent = availableAgents[agentIndex];
                    if (agent) {
                        if (!assignment.has(agent.id)) {
                            assignment.set(agent.id, []);
                        }
                        assignment.get(agent.id)!.push(task.id);
                    }
                });
                
                return assignment;
            }
        });

        // Load Balanced Strategy
        this.strategies.set('load-balanced', {
            name: 'Load Balanced',
            description: 'Assigns tasks based on current agent load',
            selectAgent: (agents: Agent[], task: WorkflowTask) => {
                const availableAgents = agents.filter(a => 
                    a.status === 'idle' && 
                    a.load < 80 &&
                    (task.type === 'any' || a.capabilities.includes(task.type))
                );
                
                if (availableAgents.length === 0) {
                    return null;
                }
                
                // Select agent with lowest load
                return availableAgents.reduce((min, agent) => 
                    agent.load < min.load ? agent : min
                );
            },
            handleFailure: (task, agent, error) => {
                // Increase agent load penalty on failure
                agent.load = Math.min(100, agent.load + 20);
                return task.retryCount < task.maxRetries ? 'retry' : 'reassign';
            },
            balanceLoad: (agents: Agent[], tasks: WorkflowTask[]) => {
                const assignment = new Map<string, string[]>();
                const sortedAgents = agents
                    .filter(a => a.status === 'idle')
                    .sort((a, b) => a.load - b.load);
                
                const sortedTasks = tasks.sort((a, b) => {
                    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                });
                
                for (const task of sortedTasks) {
                    const availableAgent = sortedAgents.find(a => 
                        a.load < 80 && 
                        (task.type === 'any' || a.capabilities.includes(task.type))
                    );
                    
                    if (availableAgent) {
                        if (!assignment.has(availableAgent.id)) {
                            assignment.set(availableAgent.id, []);
                        }
                        assignment.get(availableAgent.id)!.push(task.id);
                        availableAgent.load += 20; // Simulate load increase
                    }
                }
                
                return assignment;
            }
        });

        // Capability-Based Strategy
        this.strategies.set('capability-based', {
            name: 'Capability Based',
            description: 'Matches tasks to agents based on specific capabilities',
            selectAgent: (agents: Agent[], task: WorkflowTask) => {
                const capableAgents = agents.filter(a => 
                    a.status === 'idle' && 
                    a.capabilities.includes(task.type)
                );
                
                if (capableAgents.length === 0) {
                    return null;
                }
                
                // Prefer agents with more specific capabilities
                return capableAgents.reduce((best, agent) => {
                    const relevantCaps = agent.capabilities.filter(cap => 
                        task.metadata.requiredCapabilities?.includes(cap)
                    ).length;
                    const bestRelevantCaps = best.capabilities.filter(cap => 
                        task.metadata.requiredCapabilities?.includes(cap)
                    ).length;
                    
                    return relevantCaps > bestRelevantCaps ? agent : best;
                });
            },
            handleFailure: (task, agent, error) => {
                return 'reassign'; // Try different capable agent
            },
            balanceLoad: (agents: Agent[], tasks: WorkflowTask[]) => {
                const assignment = new Map<string, string[]>();
                
                for (const task of tasks) {
                    const capableAgents = agents.filter(a => 
                        a.status === 'idle' && 
                        a.capabilities.includes(task.type)
                    );
                    
                    if (capableAgents.length > 0) {
                        const bestAgent = capableAgents.reduce((best, agent) => 
                            agent.load < best.load ? agent : best
                        );
                        
                        if (!assignment.has(bestAgent.id)) {
                            assignment.set(bestAgent.id, []);
                        }
                        assignment.get(bestAgent.id)!.push(task.id);
                    }
                }
                
                return assignment;
            }
        });
    }

    private initializeMetrics(): void {
        this.metrics.set('workflows_total', 0);
        this.metrics.set('workflows_completed', 0);
        this.metrics.set('workflows_failed', 0);
        this.metrics.set('tasks_total', 0);
        this.metrics.set('tasks_completed', 0);
        this.metrics.set('tasks_failed', 0);
        this.metrics.set('agents_active', 0);
        this.metrics.set('average_task_duration', 0);
        this.metrics.set('consensus_requests', 0);
        this.metrics.set('consensus_successful', 0);
    }

    private setupEventHandlers(): void {
        // AgentCommunicationService uses `subscribe`
        this.agentCommunication.subscribe(async (message: import('../types/agent-communication').AgentMessage) => {
            // Assuming 'agentJoined' and 'agentLeft' are signaled via specific message actions or types
            if (message.action === 'agentJoined' && message.payload) {
                const agentData = message.payload as any; // Cast or validate payload
                this.registerAgent({
                    id: agentData.id,
                    name: agentData.name || agentData.id,
                    capabilities: agentData.capabilities || [],
                    status: 'idle',
                    load: 0,
                    lastSeen: new Date(),
                    metadata: agentData.metadata || {}
                });
            } else if (message.action === 'agentLeft' && message.payload) {
                 const agentData = message.payload as any;
                this.unregisterAgent(agentData.id);
            } else if (message.source && message.type !== AgentMessageType.SYSTEM) { // Use imported enum
                this.handleAgentMessage(message.source, message);
            }
        });

        this.a2aClient.on('taskDelegated', (task: import('../protocols/A2AProtocol').A2ATask) => {
            this.handleDelegatedTask(task);
        });

        this.a2aClient.on('taskCompleted', (taskId: string, result: any) => {
            this.handleTaskCompletion(taskId, result);
        });

        // This assumes a2aClient emits 'taskFailed'. If not, failure handling needs to be
        // integrated with how a2aClient signals task errors (e.g., via task_response with an error).
        // For now, keeping it as is, assuming the event exists or will be added.
        this.a2aClient.on('taskFailed', (taskId: string, error: any) => {
            this.handleTaskFailure(taskId, error);
        });
    }

    registerAgent(agent: Agent): void {
        this.agents.set(agent.id, agent);
        this.metrics.set('agents_active', this.agents.size);
        this.emit('agentRegistered', agent);
    }

    unregisterAgent(agentId: string): void {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = 'offline';
            // Reassign any running tasks
            for (const [taskId, task] of this.runningTasks.entries()) {
                if (task.assignedAgent === agentId) {
                    this.reassignTask(task);
                }
            }
            this.agents.delete(agentId);
            this.metrics.set('agents_active', this.agents.size);
            this.emit('agentUnregistered', agentId);
        }
    }

    updateAgentStatus(agentId: string, status: Agent['status'], load?: number): void {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = status;
            agent.lastSeen = new Date();
            if (load !== undefined) {
                agent.load = load;
            }
            this.emit('agentStatusUpdated', agent);
        }
    }

    // Workflow Management
    createWorkflow(
        name: string, 
        description: string, 
        tasks: Omit<WorkflowTask, 'id' | 'status' | 'retryCount'>[]
    ): string {
        const workflowId = this.generateId();
        const taskMap = new Map<string, WorkflowTask>();

        tasks.forEach(taskData => {
            const task: WorkflowTask = {
                ...taskData,
                id: this.generateId(),
                status: 'pending',
                retryCount: 0
            };
            taskMap.set(task.id, task);
        });

        const workflow: Workflow = {
            id: workflowId,
            name,
            description,
            tasks: taskMap,
            status: 'pending',
            progress: 0,
            metadata: {}
        };

        this.workflows.set(workflowId, workflow);
        this.metrics.set('workflows_total', this.metrics.get('workflows_total') + 1);
        this.emit('workflowCreated', workflow);
        
        return workflowId;
    }

    startWorkflow(workflowId: string, strategy: string = 'load-balanced'): void {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }

        workflow.status = 'running';
        workflow.startTime = new Date();
        
        this.emit('workflowStarted', workflow);
        this.scheduleWorkflowTasks(workflow, strategy);
    }

    private scheduleWorkflowTasks(workflow: Workflow, strategyName: string): void {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Strategy ${strategyName} not found`);
        }

        const readyTasks = this.getReadyTasks(workflow);
        const availableAgents = Array.from(this.agents.values()).filter(a => a.status === 'idle');

        for (const task of readyTasks) {
            const agent = strategy.selectAgent(availableAgents, task);
            if (agent) {
                this.assignTask(task, agent);
            }
        }
    }

    private getReadyTasks(workflow: Workflow): WorkflowTask[] {
        const readyTasks: WorkflowTask[] = [];
        
        for (const task of workflow.tasks.values()) {
            if (task.status === 'pending') {
                // Check if all dependencies are completed
                const dependenciesCompleted = task.dependencies.every(depId => {
                    const depTask = workflow.tasks.get(depId);
                    return depTask?.status === 'completed';
                });
                
                if (dependenciesCompleted) {
                    readyTasks.push(task);
                }
            }
        }
        
        return readyTasks;
    }

    private assignTask(task: WorkflowTask, agent: Agent): void {
        task.status = 'running';
        task.assignedAgent = agent.id;
        task.startTime = new Date();
        
        agent.status = 'busy';
        agent.load = Math.min(100, agent.load + 20);
        
        this.runningTasks.set(task.id, task);
        
        // Send task to agent via A2A protocol
        // A2AProtocolClient.delegateTask expects: targetAgentId, capability, payload, options
        // Assuming task.type is the capability name.
        this.a2aClient.delegateTask(
            agent.id,       // targetAgentId
            task.type,      // capability (e.g., task.type or a specific capability string)
            {               // payload for the A2A task
                taskId: task.id, // Include original task ID for context if needed by the agent
                description: task.description,
                input: task.input,
                // any other data the agent needs from the WorkflowTask
            },
            {               // options for A2A delegation
                timeout: task.timeout,
                priority: task.priority === 'critical' ? 'urgent' : task.priority
            }
        );
        
        this.emit('taskAssigned', task, agent);
    }

    private reassignTask(task: WorkflowTask): void {
        if (task.assignedAgent) {
            const agent = this.agents.get(task.assignedAgent);
            if (agent) {
                agent.status = 'idle';
                agent.load = Math.max(0, agent.load - 20);
            }
        }
        
        task.status = 'pending';
        task.assignedAgent = undefined;
        this.runningTasks.delete(task.id);
        
        // Find the workflow this task belongs to and reschedule
        for (const workflow of this.workflows.values()) {
            if (workflow.tasks.has(task.id)) {
                this.scheduleWorkflowTasks(workflow, 'load-balanced');
                break;
            }
        }
    }

    private handleTaskCompletion(taskId: string, result: any): void {
        const task = this.runningTasks.get(taskId);
        if (!task) {
            return;
        }

        task.status = 'completed';
        task.output = result;
        task.endTime = new Date();
        
        if (task.assignedAgent) {
            const agent = this.agents.get(task.assignedAgent);
            if (agent) {
                agent.status = 'idle';
                agent.load = Math.max(0, agent.load - 20);
            }
        }
        
        this.runningTasks.delete(taskId);
        this.metrics.set('tasks_completed', this.metrics.get('tasks_completed') + 1);
        
        // Update workflow progress
        this.updateWorkflowProgress(taskId);
        
        this.emit('taskCompleted', task);
    }

    private handleTaskFailure(taskId: string, error: any): void {
        const task = this.runningTasks.get(taskId);
        if (!task) {
            return;
        }

        task.retryCount++;
        task.error = error.message || 'Unknown error';
        
        const agent = task.assignedAgent ? this.agents.get(task.assignedAgent) : null;
        const strategy = this.strategies.get('load-balanced');
        
        if (agent && strategy) {
            const action = strategy.handleFailure(task, agent, error);
            
            switch (action) {
                case 'retry':
                    // Reset task for retry
                    task.status = 'pending';
                    task.assignedAgent = undefined;
                    setTimeout(() => this.reassignTask(task), 1000);
                    break;
                    
                case 'reassign':
                    this.reassignTask(task);
                    break;
                    
                case 'fail':
                    task.status = 'failed';
                    task.endTime = new Date();
                    this.runningTasks.delete(taskId);
                    this.metrics.set('tasks_failed', this.metrics.get('tasks_failed') + 1);
                    this.updateWorkflowProgress(taskId);
                    break;
            }
        }
        
        if (agent) {
            agent.status = 'idle';
            agent.load = Math.max(0, agent.load - 20);
        }
        
        this.emit('taskFailed', task, error);
    }

    private updateWorkflowProgress(taskId: string): void {
        // Find workflow containing this task
        for (const workflow of this.workflows.values()) {
            if (workflow.tasks.has(taskId)) {
                const totalTasks = workflow.tasks.size;
                const completedTasks = Array.from(workflow.tasks.values())
                    .filter(t => t.status === 'completed').length;
                const failedTasks = Array.from(workflow.tasks.values())
                    .filter(t => t.status === 'failed').length;
                
                workflow.progress = Math.round((completedTasks / totalTasks) * 100);
                
                // Check if workflow is complete
                if (completedTasks + failedTasks === totalTasks) {
                    workflow.status = failedTasks > 0 ? 'failed' : 'completed';
                    workflow.endTime = new Date();
                    
                    if (workflow.status === 'completed') {
                        this.metrics.set('workflows_completed', this.metrics.get('workflows_completed') + 1);
                    } else {
                        this.metrics.set('workflows_failed', this.metrics.get('workflows_failed') + 1);
                    }
                    
                    this.emit('workflowCompleted', workflow);
                } else {
                    // Schedule any newly ready tasks
                    this.scheduleWorkflowTasks(workflow, 'load-balanced');
                }
                
                this.emit('workflowProgressUpdated', workflow);
                break;
            }
        }
    }

    // Consensus Mechanisms
    requestConsensus(
        topic: string,
        proposal: any,
        participants: string[],
        config: ConsensusConfig
    ): string {
        const requestId = this.generateId();
        
        const consensusRequest: ConsensusRequest = {
            id: requestId,
            topic,
            proposal,
            participants,
            config,
            responses: new Map(),
            status: 'pending',
            startTime: new Date()
        };
        
        this.consensusRequests.set(requestId, consensusRequest);
        this.metrics.set('consensus_requests', this.metrics.get('consensus_requests') + 1);
        
        // Send consensus request to all participants
        for (const participantId of participants) {
            const agentMessage: import('../types/agent-communication').AgentMessage = {
                id: this.generateId(), // Unique ID for this specific message
                type: 'COMMAND' as import('../types/agent-communication').AgentMessageType, // Or a more specific type like 'CONSENSUS_REQUEST'
                source: this.a2aClient.getLocalAgent().id, // Use public getter
                recipient: participantId,
                action: 'consensus-request', // Define a clear action
                payload: { // The actual content for the consensus request
                    requestId, // ID of the consensus process
                    topic,
                    proposal,
                    config: { // Relevant parts of the consensus config for the agent
                        type: config.type,
                        timeout: config.timeout
                    }
                },
                timestamp: Date.now()
            };
            this.agentCommunication.sendMessage(agentMessage);
        }
        
        // Set timeout
        setTimeout(() => {
            const request = this.consensusRequests.get(requestId);
            if (request && request.status === 'pending') {
                request.status = 'timeout';
                request.endTime = new Date();
                this.emit('consensusTimeout', request);
            }
        }, config.timeout);
        
        this.emit('consensusRequested', consensusRequest);
        return requestId;
    }

    submitConsensusVote(
        requestId: string,
        agentId: string,
        vote: boolean,
        weight?: number,
        reason?: string
    ): void {
        const request = this.consensusRequests.get(requestId);
        if (!request || request.status !== 'pending') {
            return;
        }
        
        if (!request.participants.includes(agentId)) {
            return;
        }
        
        request.responses.set(agentId, { vote, weight, reason });
        
        // Check if consensus is reached
        if (request.responses.size === request.participants.length) {
            this.evaluateConsensus(request);
        }
    }

    private evaluateConsensus(request: ConsensusRequest): void {
        const votes = Array.from(request.responses.values());
        let consensusReached = false;
        
        switch (request.config.type) {
            case 'majority':
                const yesVotes = votes.filter(v => v.vote).length;
                consensusReached = yesVotes > votes.length / 2;
                break;
                
            case 'unanimous':
                consensusReached = votes.every(v => v.vote);
                break;
                
            case 'weighted':
                const totalWeight = votes.reduce((sum, v) => sum + (v.weight || 1), 0);
                const yesWeight = votes.filter(v => v.vote).reduce((sum, v) => sum + (v.weight || 1), 0);
                consensusReached = yesWeight >= totalWeight * (request.config.threshold / 100);
                break;
                
            case 'byzantine':
                // Simplified Byzantine fault tolerance
                const requiredVotes = Math.floor((votes.length * 2) / 3) + 1;
                const agreeingVotes = votes.filter(v => v.vote).length;
                consensusReached = agreeingVotes >= requiredVotes;
                break;
        }
        
        request.status = consensusReached ? 'reached' : 'failed';
        request.result = consensusReached;
        request.endTime = new Date();
        
        if (consensusReached) {
            this.metrics.set('consensus_successful', this.metrics.get('consensus_successful') + 1);
        }
        
        this.emit('consensusReached', request);
    }

    private handleAgentMessage(agentId: string, message: any): void {
        switch (message.type) {
            case 'consensus-vote':
                this.submitConsensusVote(
                    message.requestId,
                    agentId,
                    message.vote,
                    message.weight,
                    message.reason
                );
                break;
                
            case 'status-update':
                this.updateAgentStatus(agentId, message.status, message.load);
                break;
                
            case 'capability-update':
                const agent = this.agents.get(agentId);
                if (agent) {
                    agent.capabilities = message.capabilities;
                    this.emit('agentCapabilitiesUpdated', agent);
                }
                break;
        }
    }

    private handleDelegatedTask(task: any): void {
        // Handle tasks delegated from other agents
        const workflowId = this.createWorkflow(
            `Delegated: ${task.type}`,
            `Task delegated from external agent`,
            [{
                type: task.type,
                description: task.description,
                input: task.input,
                dependencies: [],
                maxRetries: 3,
                timeout: task.timeout || 30000,
                priority: task.priority || 'normal',
                metadata: { external: true, sourceAgent: task.sourceAgent }
            }]
        );
        
        this.startWorkflow(workflowId);
    }

    private startOrchestrationLoop(): void {
        this.orchestrationTimer = setInterval(() => {
            this.performHealthChecks();
            this.optimizeLoad();
            this.cleanupCompletedWorkflows();
        }, 5000); // Every 5 seconds
    }

    private performHealthChecks(): void {
        const now = new Date();
        const staleThreshold = 30000; // 30 seconds
        
        for (const [agentId, agent] of this.agents.entries()) {
            if (now.getTime() - agent.lastSeen.getTime() > staleThreshold) {
                agent.status = 'offline';
                this.unregisterAgent(agentId);
            }
        }
        
        // Check for stuck tasks
        for (const [taskId, task] of this.runningTasks.entries()) {
            if (task.startTime && now.getTime() - task.startTime.getTime() > task.timeout) {
                this.handleTaskFailure(taskId, new Error('Task timeout'));
            }
        }
    }

    private optimizeLoad(): void {
        const overloadedAgents = Array.from(this.agents.values()).filter(a => a.load > 80);
        const underloadedAgents = Array.from(this.agents.values()).filter(a => a.load < 20 && a.status === 'idle');
        
        if (overloadedAgents.length > 0 && underloadedAgents.length > 0) {
            // Could implement task migration logic here
            this.emit('loadImbalanceDetected', { overloaded: overloadedAgents, underloaded: underloadedAgents });
        }
    }

    private cleanupCompletedWorkflows(): void {
        const completedWorkflows = Array.from(this.workflows.values())
            .filter(w => (w.status === 'completed' || w.status === 'failed') && 
                         w.endTime && 
                         Date.now() - w.endTime.getTime() > 300000); // 5 minutes old
        
        for (const workflow of completedWorkflows) {
            this.workflows.delete(workflow.id);
        }
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public API methods
    getAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    getWorkflows(): Workflow[] {
        return Array.from(this.workflows.values());
    }

    getWorkflow(id: string): Workflow | undefined {
        return this.workflows.get(id);
    }

    cancelWorkflow(id: string): void {
        const workflow = this.workflows.get(id);
        if (workflow && workflow.status === 'running') {
            workflow.status = 'cancelled';
            workflow.endTime = new Date();
            
            // Cancel all running tasks
            for (const task of workflow.tasks.values()) {
                if (task.status === 'running') {
                    task.status = 'cancelled';
                    this.runningTasks.delete(task.id);
                    
                    if (task.assignedAgent) {
                        const agent = this.agents.get(task.assignedAgent);
                        if (agent) {
                            agent.status = 'idle';
                            agent.load = Math.max(0, agent.load - 20);
                        }
                    }
                }
            }
            
            this.emit('workflowCancelled', workflow);
        }
    }

    getMetrics(): Record<string, any> {
        return Object.fromEntries(this.metrics.entries());
    }

    getStrategies(): string[] {
        return Array.from(this.strategies.keys());
    }

    addStrategy(name: string, strategy: OrchestrationStrategy): void {
        this.strategies.set(name, strategy);
        this.emit('strategyAdded', name);
    }

    dispose(): void {
        if (this.orchestrationTimer) {
            clearInterval(this.orchestrationTimer);
            this.orchestrationTimer = null;
        }
        
        this.agents.clear();
        this.workflows.clear();
        this.runningTasks.clear();
        this.consensusRequests.clear();
        this.removeAllListeners();
    }
}

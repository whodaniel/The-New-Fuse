"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TopologyOptimizerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopologyOptimizerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../lib/prisma/prisma.service");
const prompt_optimizer_service_1 = require("./prompt-optimizer.service");
let TopologyOptimizerService = TopologyOptimizerService_1 = class TopologyOptimizerService {
    prisma;
    evaluationHarness;
    logger = new common_1.Logger(TopologyOptimizerService_1.name);
    constructor(prisma, evaluationHarness) {
        this.prisma = prisma;
        this.evaluationHarness = evaluationHarness;
    }
    async optimizeTopology(agentIds, config) {
        this.logger.log(`Starting Stage 2 topology optimization with ${agentIds.length} agents`);
        try {
            // Get optimized agents from Stage 1
            const agents = await this.getOptimizedAgents(agentIds, config.userId);
            // Calculate influence scores for each agent
            const influenceScores = await this.calculateInfluenceScores(agents, config);
            // Generate candidate topologies based on influence scores
            const candidateTopologies = await this.generateCandidateTopologies(agents, influenceScores, config);
            // Evaluate each topology candidate
            const evaluationResults = await Promise.all(candidateTopologies.map(async (topology, index) => {
                const metrics = await this.evaluateTopology(topology, config);
                return {
                    topology,
                    metrics,
                    candidateIndex: index
                };
            }));
            // Select best performing topology
            const bestTopology = this.selectBestTopology(evaluationResults);
            // Save the optimized topology
            const savedTopology = await this.saveTopology(bestTopology.topology, bestTopology.metrics, config.userId);
            this.logger.log(`Stage 2 optimization completed. Best topology accuracy: ${bestTopology.metrics.accuracy}`);
            return savedTopology;
        }
        catch (error) {
            this.logger.error('Stage 2 topology optimization failed:', error);
            throw error;
        }
    }
    async getOptimizedAgents(agentIds, userId) {
        return this.prisma.agent.findMany({
            where: {
                id: { in: agentIds },
                userId
            },
            include: {
                promptVersions: {
                    where: { massStage: 'block_level' },
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });
    }
    async calculateInfluenceScores(agents, config) {
        const scores = {};
        // Get validation dataset
        const dataset = await this.prisma.validationDataset.findUnique({
            where: { id: config.validationDatasetId }
        });
        if (!dataset) {
            throw new Error(`Validation dataset ${config.validationDatasetId} not found`);
        }
        // Baseline performance with just the first agent
        const baselineAgent = agents[0];
        const baselineMetrics = await this.evaluationHarness.evaluatePrompt(baselineAgent.id, this.getLatestPrompt(baselineAgent), dataset.items, config);
        // Calculate incremental influence for each agent
        for (const agent of agents) {
            try {
                const agentMetrics = await this.evaluationHarness.evaluatePrompt(agent.id, this.getLatestPrompt(agent), dataset.items, config);
                // Influence = (Agent Performance - Baseline Performance) / Baseline Performance
                const influence = baselineMetrics.accuracy > 0 ?
                    (agentMetrics.accuracy - baselineMetrics.accuracy) / baselineMetrics.accuracy : 0;
                scores[agent.id] = Math.max(0, influence); // Only positive influence
            }
            catch (error) {
                this.logger.warn(`Failed to calculate influence for agent ${agent.id}:`, error);
                scores[agent.id] = 0;
            }
        }
        return scores;
    }
    getLatestPrompt(agent) {
        const latestVersion = agent.promptVersions?.[0];
        if (latestVersion) {
            return {
                instruction: {
                    roleDefinition: latestVersion.instruction,
                    taskGuidance: '',
                    outputFormat: ''
                },
                exemplars: latestVersion.exemplars || []
            };
        }
        return {
            instruction: {
                roleDefinition: agent.systemPrompt || 'You are a helpful AI assistant.',
                taskGuidance: '',
                outputFormat: ''
            },
            exemplars: []
        };
    }
    async generateCandidateTopologies(agents, influenceScores, config) {
        const candidates = [];
        // Generate different topology patterns
        const patterns = [
            'linear',
            'parallel',
            'hierarchical',
            'debate',
            'reflect',
            'aggregate'
        ];
        for (const pattern of patterns) {
            try {
                const topology = await this.generateTopologyByPattern(pattern, agents, influenceScores, config);
                if (topology) {
                    candidates.push(topology);
                }
            }
            catch (error) {
                this.logger.warn(`Failed to generate ${pattern} topology:`, error);
            }
        }
        // Generate random combinations based on influence weights
        for (let i = 0; i < 3; i++) {
            try {
                const randomTopology = this.generateRandomTopology(agents, influenceScores, config);
                candidates.push(randomTopology);
            }
            catch (error) {
                this.logger.warn(`Failed to generate random topology ${i}:`, error);
            }
        }
        return candidates;
    }
    async generateTopologyByPattern(pattern, agents, influenceScores, config) {
        const topAgents = this.selectTopAgentsByInfluence(agents, influenceScores, config.maxAgents || 5);
        switch (pattern) {
            case 'linear':
                return this.createLinearTopology(topAgents, config);
            case 'parallel':
                return this.createParallelTopology(topAgents, config);
            case 'hierarchical':
                return this.createHierarchicalTopology(topAgents, config);
            case 'debate':
                return this.createDebateTopology(topAgents, config);
            case 'reflect':
                return this.createReflectTopology(topAgents, config);
            case 'aggregate':
                return this.createAggregateTopology(topAgents, config);
            default:
                return null;
        }
    }
    selectTopAgentsByInfluence(agents, influenceScores, maxAgents) {
        return agents
            .sort((a, b) => (influenceScores[b.id] || 0) - (influenceScores[a.id] || 0))
            .slice(0, maxAgents);
    }
    createLinearTopology(agents, config) {
        const nodes = agents.map((agent, index) => ({
            id: `node_${index}`,
            agentBlueprintId: agent.id,
            type: 'predictor',
            position: { x: index * 200, y: 100 }
        }));
        const edges = [];
        for (let i = 0; i < nodes.length - 1; i++) {
            edges.push({
                id: `edge_${i}`,
                sourceNodeId: nodes[i].id,
                targetNodeId: nodes[i + 1].id
            });
        }
        return {
            id: '', // Will be set when saved
            name: `Linear Topology (${agents.length} agents)`,
            description: 'Sequential processing through agents',
            nodes,
            edges,
            massOptimized: true,
            userId: config.userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    createParallelTopology(agents, config) {
        const nodes = agents.map((agent, index) => ({
            id: `node_${index}`,
            agentBlueprintId: agent.id,
            type: 'predictor',
            position: { x: 200, y: index * 100 }
        }));
        // Add aggregator node
        nodes.push({
            id: 'aggregator',
            agentBlueprintId: agents[0].id, // Use first agent as aggregator
            type: 'aggregate',
            nodeSpecificConfig: {
                agentIds: agents.map(a => a.id),
                aggregationStrategy: 'majority_vote',
                parallelExecution: true
            },
            position: { x: 400, y: (agents.length - 1) * 50 }
        });
        const edges = agents.map((_, index) => ({
            id: `edge_${index}`,
            sourceNodeId: `node_${index}`,
            targetNodeId: 'aggregator'
        }));
        return {
            id: '',
            name: `Parallel Topology (${agents.length} agents)`,
            description: 'Parallel processing with aggregation',
            nodes,
            edges,
            massOptimized: true,
            userId: config.userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    createDebateTopology(agents, config) {
        if (agents.length < 2) {
            throw new Error('Debate topology requires at least 2 agents');
        }
        const debateAgents = agents.slice(0, Math.min(4, agents.length)); // Max 4 debaters
        const nodes = [{
                id: 'debate_node',
                agentBlueprintId: debateAgents[0].id,
                type: 'debate',
                nodeSpecificConfig: {
                    debaterAgentIds: debateAgents.map(a => a.id),
                    debateRounds: 3,
                    votingStrategy: 'majority'
                },
                position: { x: 200, y: 200 }
            }];
        return {
            id: '',
            name: `Debate Topology (${debateAgents.length} debaters)`,
            description: 'Multi-agent debate for robust decisions',
            nodes,
            edges: [],
            massOptimized: true,
            userId: config.userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    createReflectTopology(agents, config) {
        if (agents.length < 2) {
            throw new Error('Reflect topology requires at least 2 agents');
        }
        const nodes = [{
                id: 'reflect_node',
                agentBlueprintId: agents[0].id,
                type: 'reflect',
                nodeSpecificConfig: {
                    predictorAgentId: agents[0].id,
                    reflectorAgentId: agents[1].id,
                    maxRounds: 3
                },
                position: { x: 200, y: 200 }
            }];
        return {
            id: '',
            name: 'Reflect Topology',
            description: 'Iterative refinement through reflection',
            nodes,
            edges: [],
            massOptimized: true,
            userId: config.userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    createAggregateTopology(agents, config) {
        const nodes = [{
                id: 'aggregate_node',
                agentBlueprintId: agents[0].id,
                type: 'aggregate',
                nodeSpecificConfig: {
                    agentIds: agents.map(a => a.id),
                    aggregationStrategy: 'weighted_average',
                    parallelExecution: true
                },
                position: { x: 200, y: 200 }
            }];
        return {
            id: '',
            name: `Aggregate Topology (${agents.length} agents)`,
            description: 'Weighted aggregation of agent outputs',
            nodes,
            edges: [],
            massOptimized: true,
            userId: config.userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    createHierarchicalTopology(agents, config) {
        const nodes = [];
        const edges = [];
        // Create layers: input processors, middle layer, final aggregator
        const inputLayer = agents.slice(0, Math.min(3, agents.length));
        const middleAgent = agents[Math.floor(agents.length / 2)];
        const finalAgent = agents[agents.length - 1];
        // Input layer nodes
        inputLayer.forEach((agent, index) => {
            nodes.push({
                id: `input_${index}`,
                agentBlueprintId: agent.id,
                type: 'predictor',
                position: { x: index * 150, y: 50 }
            });
        });
        // Middle layer node
        nodes.push({
            id: 'middle',
            agentBlueprintId: middleAgent.id,
            type: 'aggregate',
            nodeSpecificConfig: {
                agentIds: inputLayer.map(a => a.id),
                aggregationStrategy: 'weighted_average',
                parallelExecution: false
            },
            position: { x: 200, y: 200 }
        });
        // Final node
        nodes.push({
            id: 'final',
            agentBlueprintId: finalAgent.id,
            type: 'predictor',
            position: { x: 200, y: 350 }
        });
        // Connect input layer to middle
        inputLayer.forEach((_, index) => {
            edges.push({
                id: `edge_input_${index}`,
                sourceNodeId: `input_${index}`,
                targetNodeId: 'middle'
            });
        });
        // Connect middle to final
        edges.push({
            id: 'edge_middle_final',
            sourceNodeId: 'middle',
            targetNodeId: 'final'
        });
        return {
            id: '',
            name: 'Hierarchical Topology',
            description: 'Layered processing with aggregation',
            nodes,
            edges,
            massOptimized: true,
            userId: config.userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    generateRandomTopology(agents, influenceScores, config) {
        // Create weighted random selection based on influence scores
        const totalInfluence = Object.values(influenceScores).reduce((sum, score) => sum + score, 0);
        const selectedAgents = this.weightedRandomSelection(agents, influenceScores, Math.min(4, agents.length));
        // Randomly choose a pattern for the selected agents
        const patterns = ['linear', 'parallel', 'reflect', 'aggregate'];
        const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
        return this.generateTopologyByPattern(randomPattern, selectedAgents, influenceScores, config);
    }
    weightedRandomSelection(agents, influenceScores, count) {
        const selected = [];
        const available = [...agents];
        for (let i = 0; i < count && available.length > 0; i++) {
            const totalWeight = available.reduce((sum, agent) => sum + (influenceScores[agent.id] || 0.1), 0);
            let random = Math.random() * totalWeight;
            let selectedIndex = 0;
            for (let j = 0; j < available.length; j++) {
                random -= (influenceScores[available[j].id] || 0.1);
                if (random <= 0) {
                    selectedIndex = j;
                    break;
                }
            }
            selected.push(available[selectedIndex]);
            available.splice(selectedIndex, 1);
        }
        return selected;
    }
    async evaluateTopology(topology, config) {
        // Get validation dataset
        const dataset = await this.prisma.validationDataset.findUnique({
            where: { id: config.validationDatasetId }
        });
        if (!dataset) {
            throw new Error(`Validation dataset ${config.validationDatasetId} not found`);
        }
        // Use evaluation harness to evaluate the topology
        return this.evaluationHarness.evaluateTopology(topology.id || 'temp_topology', dataset.items, config);
    }
    selectBestTopology(evaluationResults) {
        // Select based on primary metric with tie-breaking
        const sorted = evaluationResults.sort((a, b) => {
            const aScore = a.metrics.accuracy || 0;
            const bScore = b.metrics.accuracy || 0;
            if (Math.abs(aScore - bScore) < 0.01) {
                // Tie-break by efficiency (lower latency + cost)
                const aEfficiency = (a.metrics.latency || 1000) + (a.metrics.cost || 1) * 1000;
                const bEfficiency = (b.metrics.latency || 1000) + (b.metrics.cost || 1) * 1000;
                return aEfficiency - bEfficiency;
            }
            return bScore - aScore;
        });
        return sorted[0];
    }
    async saveTopology(topology, metrics, userId) {
        const saved = await this.prisma.workflowTopology.create({
            data: {
                name: topology.name,
                description: topology.description,
                nodes: topology.nodes,
                edges: topology.edges,
                performanceMetrics: metrics,
                massOptimized: true,
                userId
            }
        });
        return {
            ...topology,
            id: saved.id,
            performanceMetrics: metrics
        };
    }
};
exports.TopologyOptimizerService = TopologyOptimizerService;
exports.TopologyOptimizerService = TopologyOptimizerService = TopologyOptimizerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        prompt_optimizer_service_1.EvaluationHarnessService])
], TopologyOptimizerService);

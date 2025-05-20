export {}
exports.WorkflowExecutor = void 0;
import types_1 from './types.js';
class WorkflowExecutor {
    constructor(executors, options = {}) {
        this.executors = executors;
        this.state = new Map();
        this.nodeStates = new Map();
        this.options = {
            maxConcurrency: 4,
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            logger: console,
            ...options,
        };
        this.logger = this.options.logger;
    }
    async execute(nodes: any[], edges: any[]): Promise<any> {
        try {
            this.initializeState(nodes);
            const executionOrder = this.determineExecutionOrder(nodes, edges);
            const result = await this.executeNodes(executionOrder, edges);
            return {
                success: true,
                state: this.state,
                nodeStates: this.nodeStates,
                errors: []
            };
        }
        catch (error) {
            const workflowError = {
                message: error instanceof Error ? error.message : String(error),
                nodeId: undefined,
                type: 'WORKFLOW_ERROR'
            };
            return {
                success: false,
                state: this.state,
                nodeStates: this.nodeStates,
                errors: [workflowError]
            };
        }
    }
    initializeState(nodes) {
        this.state.clear();
        this.nodeStates.clear();
        nodes.forEach(node => {
            this.nodeStates.set(node.id, {
                status: types_1.NodeStatus.PENDING,
                startTime: null,
                endTime: null,
                error: null,
                output: null
            });
        });
    }
    determineExecutionOrder(nodes, edges) {
        const adjacencyList = new Map();
        const inDegree = new Map();
        // Initialize
        nodes.forEach(node => {
            adjacencyList.set(node.id, new Set());
            inDegree.set(node.id, 0);
        });
        // Build adjacency list and calculate in-degrees
        edges.forEach(edge => {
            const sourceSet = adjacencyList.get(edge.source);
            if (sourceSet) {
                sourceSet.add(edge.target);
            }
            const currentInDegree = inDegree.get(edge.target) || 0;
            inDegree.set(edge.target, currentInDegree + 1);
        });
        // Topological sort
        const queue = nodes.filter(node => (inDegree.get(node.id) || 0) === 0);
        const result = [];
        while (queue.length > 0) {
            const currentNode = queue.shift();
            result.push(currentNode);
            const neighbors = adjacencyList.get(currentNode.id) || new Set();
            neighbors.forEach(neighborId => {
                const currentInDegree = inDegree.get(neighborId) || 0;
                inDegree.set(neighborId, currentInDegree - 1);
                if (currentInDegree - 1 === 0) {
                    queue.push(nodes.find(node => node.id === neighborId));
                }
            });
        }
        return result;
    }
    async executeNodes(orderedNodes: any[], edges: any[]): Promise<void> {
        const executingNodes = new Set();
        const completedNodes = new Set();
        while (orderedNodes.length > 0 || executingNodes.size > 0) {
            // Start new nodes if possible
            while (orderedNodes.length > 0 && executingNodes.size < this.options.maxConcurrency) {
                const node = orderedNodes[0];
                const dependencies = edges
                    .filter(edge => edge.target === node.id)
                    .map(edge => edge.source);
                if (dependencies.every(dep => completedNodes.has(dep))) {
                    orderedNodes.shift();
                    executingNodes.add(node.id);
                    this.executeNode(node).then(() => {
                        executingNodes.delete(node.id);
                        completedNodes.add(node.id);
                    }).catch(error => {
                        const nodeState = this.nodeStates.get(node.id);
                        if (nodeState) {
                            nodeState.status = types_1.NodeStatus.ERROR;
                            nodeState.error = error instanceof Error ? error.message : String(error);
                            nodeState.endTime = Date.now();
                        }
                        executingNodes.delete(node.id);
                        completedNodes.add(node.id);
                    });
                }
                else {
                    break;
                }
            }
            // Wait a bit before checking again
            if (executingNodes.size >= this.options.maxConcurrency || (orderedNodes.length > 0 && executingNodes.size > 0)) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }
    async executeNode(node): Promise<void> {
        const executor = this.executors.get(node.type);
        if (!executor) {
            throw new Error(`No executor found for node type: ${node.type}`);
        }
        const nodeState = this.nodeStates.get(node.id);
        if (!nodeState) {
            throw new Error(`No state found for node: ${node.id}`);
        }
        try {
            nodeState.status = types_1.NodeStatus.RUNNING;
            nodeState.startTime = Date.now();
            const context = {
                id: node.id,
                type: node.type,
                data: node.data,
                state: this.state,
                logger: this.logger
            };
            const output = await executor.execute(context);
            nodeState.status = types_1.NodeStatus.COMPLETED;
            nodeState.output = output;
            nodeState.endTime = Date.now();
            this.state.set(node.id, output);
        }
        catch (error) {
            nodeState.status = types_1.NodeStatus.ERROR;
            nodeState.error = error instanceof Error ? error.message : String(error);
            nodeState.endTime = Date.now();
            throw error;
        }
    }
}
exports.WorkflowExecutor = WorkflowExecutor;
//# sourceMappingURL=executor.js.mapexport {};

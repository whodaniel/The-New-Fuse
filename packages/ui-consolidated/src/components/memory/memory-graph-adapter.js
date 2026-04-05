export class MemoryGraphAdapter {
    constructor(options = {}) {
        Object.defineProperty(this, "nodes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "dimensions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.dimensions = options.dimensions || 128;
    }
    async addNodes(nodes) {
        for (const node of nodes) {
            this.nodes.set(node.id, node);
        }
    }
    async getSuggestedConnections(node) {
        // Simple implementation - in a real implementation this would use
        // vector similarity or other algorithms to suggest connections
        const suggestions = [];
        for (const [id, existingNode] of this.nodes) {
            if (id !== node.id) {
                // Simple heuristic: suggest connections based on type similarity
                if (existingNode.type === node.type) {
                    suggestions.push({
                        id: `suggested-${id}-${node.id}`,
                        source: id,
                        target: node.id,
                        type: 'default',
                        animated: true,
                    });
                }
            }
        }
        return suggestions;
    }
    async findSimilarNodes(node, threshold = 0.8) {
        // Simple implementation - would use vector embeddings in production
        const similar = [];
        for (const [id, existingNode] of this.nodes) {
            if (id !== node.id && existingNode.type === node.type) {
                similar.push(existingNode);
            }
        }
        return similar;
    }
    getNodes() {
        return Array.from(this.nodes.values());
    }
    getNode(id) {
        return this.nodes.get(id);
    }
    clear() {
        this.nodes.clear();
    }
}

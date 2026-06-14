import { FileVisualizer } from './fileVisualizer.js';
export class VisualizationManager {
    constructor() {
        this.cache = new Map();
        const defaultConfig = this.getDefaultConfig();
        this.fileVisualizer = new FileVisualizer(defaultConfig);
    }
    async createVisualization(request) {
        const id = this.generateId(request);
        // Check cache first
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }
        let data;
        const format = request.format || 'json';
        switch (request.type) {
            case 'file-tree':
                data = await this.fileVisualizer.generateFileTree(request.target);
                break;
            case 'dependency-graph':
                data = await this.fileVisualizer.generateDependencyGraph(request.target);
                break;
            case 'code-metrics':
                data = await this.fileVisualizer.generateCodeMetrics(request.target);
                break;
            default:
                throw new Error(`Unsupported visualization type: ${request.type}`);
        }
        const result = {
            id,
            type: request.type,
            data,
            format,
            createdAt: new Date(),
            metadata: {
                target: request.target,
                config: request.config
            }
        };
        this.cache.set(id, result);
        return result;
    }
    async getVisualization(id) {
        return this.cache.get(id) || null;
    }
    async exportVisualization(id, format) {
        const visualization = this.cache.get(id);
        if (!visualization) {
            throw new Error(`Visualization not found: ${id}`);
        }
        return this.fileVisualizer.exportVisualization(visualization.data, format);
    }
    async clearCache() {
        this.cache.clear();
    }
    async getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            totalMemory: JSON.stringify(Array.from(this.cache.values())).length
        };
    }
    generateId(request) {
        const hash = JSON.stringify(request).split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return Math.abs(hash).toString(36);
    }
    getDefaultConfig() {
        return {
            maxDepth: 5,
            includeHidden: false,
            groupByType: true
        };
    }
}
//# sourceMappingURL=VisualizationManager.js.map
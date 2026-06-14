var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LoadBalancer_1;
import { Injectable, Logger } from '@nestjs/common';
let LoadBalancer = LoadBalancer_1 = class LoadBalancer {
    constructor() {
        this.logger = new Logger(LoadBalancer_1.name);
        this.nodes = [];
        this.strategy = 'round-robin';
        this.currentIndex = -1;
    }
    addNode(node) {
        const newNode = { ...node, healthy: true, connections: 0 };
        this.nodes.push(newNode);
        this.logger.log(`Added node: ${newNode.id} (${newNode.address})`);
        return newNode;
    }
    removeNode(id) {
        const index = this.nodes.findIndex(n => n.id === id);
        if (index !== -1) {
            this.nodes.splice(index, 1);
            this.logger.log(`Removed node: ${id}`);
            return true;
        }
        return false;
    }
    setStrategy(strategy) {
        this.logger.log(`Setting load balancing strategy to: ${strategy}`);
        this.strategy = strategy;
        this.currentIndex = -1; // Reset index when strategy changes
    }
    async getNextNode() {
        const healthyNodes = this.nodes.filter(n => n.healthy);
        if (healthyNodes.length === 0) {
            this.logger.warn('No healthy nodes available.');
            return null;
        }
        let selectedNode;
        switch (this.strategy) {
            case 'least-connections':
                selectedNode = healthyNodes.sort((a, b) => a.connections - b.connections)[0];
                break;
            case 'weighted-random':
                selectedNode = this.getWeightedRandomNode(healthyNodes);
                break;
            case 'fastest-response':
                selectedNode = healthyNodes.sort((a, b) => (a.responseTime ?? Infinity) - (b.responseTime ?? Infinity))[0];
                break;
            case 'round-robin':
            default:
                this.currentIndex = (this.currentIndex + 1) % healthyNodes.length;
                selectedNode = healthyNodes[this.currentIndex];
                break;
        }
        selectedNode.connections++;
        this.logger.debug(`Selected node: ${selectedNode.id} using strategy: ${this.strategy}`);
        return selectedNode;
    }
    releaseNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node && node.connections > 0) {
            node.connections--;
            this.logger.debug(`Released node: ${nodeId}. Current connections: ${node.connections}`);
        }
    }
    updateNodeHealth(nodeId, healthy) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            node.healthy = healthy;
            this.logger.log(`Node ${nodeId} health status updated to: ${healthy ? 'healthy' : 'unhealthy'}`);
        }
    }
    getWeightedRandomNode(nodes) {
        const totalWeight = nodes.reduce((sum, node) => sum + (node.weight ?? 1), 0);
        let random = Math.random() * totalWeight;
        for (const node of nodes) {
            random -= (node.weight ?? 1);
            if (random <= 0) {
                return node;
            }
        }
        return nodes[nodes.length - 1]; // Fallback
    }
};
LoadBalancer = LoadBalancer_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], LoadBalancer);
export { LoadBalancer };
//# sourceMappingURL=LoadBalancer.js.map
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowEditor = void 0;
import jsplumb_1 from 'jsplumb';
class WorkflowEditor {
    constructor() {
        this.zoom = 1;
        this.isDragging = false;
        this.selectedNode = null;
        this.container = document.querySelector('.workflow-container');
        this.initializeJsPlumb();
        this.initializeEventListeners();
        this.workflow = this.createNewWorkflow();
    }
    static getInstance() {
        if (!WorkflowEditor.instance) {
            WorkflowEditor.instance = new WorkflowEditor();
        }
        return WorkflowEditor.instance;
    }
    initializeJsPlumb() {
        this.jsPlumbInstance = jsplumb_1.jsPlumb.getInstance({
            Container: this.container,
            Connector: ['Bezier', { curviness: 50 }],
            Endpoint: ['Dot', { radius: 5 }],
            PaintStyle: { stroke: '#3b82f6', strokeWidth: 2 },
            HoverPaintStyle: { stroke: '#2563eb', strokeWidth: 3 },
            ConnectionOverlays: [
                ['Arrow', { location: 1, width: 10, length: 10 }]
            ],
            DragOptions: { cursor: 'move' }
        });
        this.jsPlumbInstance.registerEndpointTypes({
            input: {
                paintStyle: { fill: '#3b82f6' },
                hoverPaintStyle: { fill: '#2563eb' },
                maxConnections: -1
            },
            output: {
                paintStyle: { fill: '#3b82f6' },
                hoverPaintStyle: { fill: '#2563eb' },
                maxConnections: -1
            }
        });
    }
    initializeEventListeners() {
        var _a, _b, _c, _d, _e, _f;
        document.querySelectorAll('.node-type').forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.createNode(type);
            });
        });
        (_a = document.querySelector('button[title="Zoom In"]')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.zoomIn());
        (_b = document.querySelector('button[title="Zoom Out"]')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => this.zoomOut());
        (_c = document.querySelector('button[title="Reset View"]')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => this.resetView());
        (_d = document.querySelector('button[title="Delete Selected"]')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => this.deleteSelected());
        (_e = document.querySelector('button:contains("Save Workflow")')) === null || _e === void 0 ? void 0 : _e.addEventListener('click', () => this.saveWorkflow());
        (_f = document.querySelector('button:contains("Export")')) === null || _f === void 0 ? void 0 : _f.addEventListener('click', () => this.exportWorkflow());
        this.container.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                this.zoom += e.deltaY > 0 ? -0.1 : 0.1;
                this.zoom = Math.max(0.5, Math.min(2, this.zoom));
                this.applyZoom();
            }
        });
        this.container.addEventListener('click', (e) => {
            const target = e.target;
            const node = target.closest('.workflow-node');
            if (node) {
                this.selectNode(node);
            }
            else {
                this.clearSelection();
            }
        });
    }
    createNewWorkflow() {
        return {
            id: crypto.randomUUID(),
            name: 'New Workflow',
            description: '',
            nodes: [],
            connections: [],
            metadata: {
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                version: '1.0'
            }
        };
    }
    createNode(type) {
        const node = {
            id: `node-${crypto.randomUUID()}`,
            type,
            name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            position: {
                x: 100,
                y: 100
            },
            data: {},
            inputs: ['default'],
            outputs: ['default']
        };
        this.workflow.nodes.push(node);
        const nodeElement = document.createElement('div');
        nodeElement.id = node.id;
        nodeElement.className = `workflow-node ${type}`;
        nodeElement.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="font-medium">${node.name}</span>
                <button class="text-gray-400 hover:text-gray-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>
            </div>
            <div class="text-sm text-gray-500">${type}</div>
        `;
        this.container.appendChild(nodeElement);
        this.makeNodeDraggable(nodeElement);
        this.addEndpoints(nodeElement, node);
    }
    makeNodeDraggable(element) {
        this.jsPlumbInstance.draggable(element, {
            grid: [10, 10],
            containment: true,
            start: () => {
                this.isDragging = true;
                this.selectNode(element);
            },
            stop: (e) => {
                this.isDragging = false;
                const nodeId = element.id;
                const node = this.workflow.nodes.find(n => n.id === nodeId);
                if (node) {
                    node.position = {
                        x: parseInt(element.style.left),
                        y: parseInt(element.style.top)
                    };
                }
                this.saveWorkflow();
            }
        });
    }
    addEndpoints(element, node) {
        node.inputs.forEach((input, index) => {
            this.jsPlumbInstance.addEndpoint(element, {
                anchor: [0, (index + 1) / (node.inputs.length + 1), -1, 0],
                uuid: `${node.id}-input-${input}`,
                isTarget: true,
                endpoint: 'Dot',
                maxConnections: -1,
                type: 'input'
            });
        });
        node.outputs.forEach((output, index) => {
            this.jsPlumbInstance.addEndpoint(element, {
                anchor: [1, (index + 1) / (node.outputs.length + 1), 1, 0],
                uuid: `${node.id}-output-${output}`,
                isSource: true,
                endpoint: 'Dot',
                maxConnections: -1,
                type: 'output'
            });
        });
    }
    selectNode(node) {
        this.clearSelection();
        this.selectedNode = node;
        node.classList.add('ring-2', 'ring-blue-500');
    }
    clearSelection() {
        if (this.selectedNode) {
            this.selectedNode.classList.remove('ring-2', 'ring-blue-500');
            this.selectedNode = null;
        }
    }
    deleteSelected() {
        if (this.selectedNode) {
            const nodeId = this.selectedNode.id;
            this.jsPlumbInstance.removeAllEndpoints(nodeId);
            this.workflow.connections = this.workflow.connections.filter(conn => conn.sourceId !== nodeId && conn.targetId !== nodeId);
            this.workflow.nodes = this.workflow.nodes.filter(nod(e: any) => node.id !== nodeId);
            this.selectedNode.remove();
            this.clearSelection();
            this.saveWorkflow();
        }
    }
    zoomIn() {
        this.zoom = Math.min(2, this.zoom + 0.1);
        this.applyZoom();
    }
    zoomOut() {
        this.zoom = Math.max(0.5, this.zoom - 0.1);
        this.applyZoom();
    }
    resetView() {
        this.zoom = 1;
        this.applyZoom();
    }
    applyZoom() {
        this.container.style.transform = `scale(${this.zoom})`;
        this.jsPlumbInstance.setZoom(this.zoom);
    }
    async saveWorkflow() {
        try {
            this.workflow.metadata.modified = new Date().toISOString();
            const response = await fetch('/api/workflows', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.workflow),
            });
            if (!response.ok)
                throw new Error('Failed to save workflow');
            this.showNotification('Workflow saved successfully', 'success');
        }
        catch (error) {
            console.error('Error saving workflow:', error);
            this.showNotification('Failed to save workflow', 'error');
        }
    }
    async exportWorkflow() {
        const workflowJson = JSON.stringify(this.workflow, null, 2);
        const blob = new Blob([workflowJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.workflow.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}
const workflowEditor = WorkflowEditor.getInstance();
exports.workflowEditor = workflowEditor;
export {};
//# sourceMappingURL=workflowEditor.js.map
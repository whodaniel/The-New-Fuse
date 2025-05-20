"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowPage = void 0;
import react_1 from 'react';
import reactflow_1 from 'reactflow';
import useFlowRouter_1 from '../../hooks/useFlowRouter.js';
import core_1 from '@/components/core';
import lucide_react_1 from 'lucide-react';
require("reactflow/dist/style.css");
const FlowPage = ({ initialNodes = [], initialEdges = [], onNodesChange, onEdgesChange, }) => {
    const [nodes, setNodes, onNodesChangeInternal] = (0, reactflow_1.useNodesState)(initialNodes);
    const [edges, setEdges, onEdgesChangeInternal] = (0, reactflow_1.useEdgesState)(initialEdges);
    const { registerNode, updateNode, removeNode, navigateToNode } = (0, useFlowRouter_1.useFlowRouter)();
    (0, react_1.useEffect)(() => {
        nodes.forEach((node) => {
            registerNode(node);
        });
    }, []);
    const handleNodesChange = (0, react_1.useCallback)((changes) => {
        onNodesChangeInternal(changes);
        changes.forEach((change) => {
            if (change.type === 'position' || change.type === 'dimensions') {
                const node = nodes.find((n) => n.id === change.id);
                if (node) {
                    updateNode(node);
                }
            }
            else if (change.type === 'remove') {
                removeNode(change.id);
            }
        });
        if (onNodesChange) {
            onNodesChange(nodes);
        }
    }, [nodes, onNodesChange, onNodesChangeInternal, updateNode, removeNode]);
    const handleEdgesChange = (0, react_1.useCallback)((changes) => {
        onEdgesChangeInternal(changes);
        if (onEdgesChange) {
            onEdgesChange(edges);
        }
    }, [edges, onEdgesChange, onEdgesChangeInternal]);
    const handleConnect = (0, react_1.useCallback)((connection) => {
        setEdges((eds) => (0, reactflow_1.addEdge)(connection, eds));
    }, [setEdges]);
    const handleNodeClick = (0, react_1.useCallback)((_, node) => {
        navigateToNode(node.id);
    }, [navigateToNode]);
    return (<div className="w-full h-screen bg-background">
      <reactflow_1.default nodes={nodes} edges={edges} onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange} onConnect={handleConnect} onNodeClick={handleNodeClick} fitView className="bg-background">
        <reactflow_1.Panel position="top-right" className="space-x-2">
          <core_1.Button size="sm" variant="outline">
            <lucide_react_1.ZoomIn className="h-4 w-4"/>
          </core_1.Button>
          <core_1.Button size="sm" variant="outline">
            <lucide_react_1.ZoomOut className="h-4 w-4"/>
          </core_1.Button>
          <core_1.Button size="sm" variant="outline">
            <lucide_react_1.Maximize2 className="h-4 w-4"/>
          </core_1.Button>
        </reactflow_1.Panel>
        <reactflow_1.Controls className="bg-card border rounded-lg shadow-sm"/>
        <reactflow_1.MiniMap className="bg-card border rounded-lg shadow-sm"/>
        <reactflow_1.Background className="bg-muted"/>
      </reactflow_1.default>
    </div>);
};
exports.FlowPage = FlowPage;
export {};
//# sourceMappingURL=FlowPage.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowContainer = void 0;
import react_1 from 'react';
import react_router_dom_1 from 'react-router-dom';
import lucide_react_1 from 'lucide-react';
import FlowPage_1 from './FlowPage.js';
import NodeDetails_1 from './NodeDetails.js';
import useFlowRouter_1 from '../../hooks/useFlowRouter.js';
import useFlowMemory_1 from '../../hooks/useFlowMemory.js';
import VectorMemoryContext_1 from '../../contexts/VectorMemoryContext.js';
import core_1 from '@/components/core';
const FlowContainer = ({ initialNodes = [], initialEdges = [], onSave, }) => {
    const [nodes, setNodes] = (0, react_1.useState)(initialNodes);
    const [edges, setEdges] = (0, react_1.useState)(initialEdges);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const memoryManager = (0, react_1.useContext)(VectorMemoryContext_1.VectorMemoryContext);
    const { currentNode, navigateToNode } = (0, useFlowRouter_1.useFlowRouter)();
    const { saveNodeMemory, loadNodeMemory, updateFlowMemoryGraph } = (0, useFlowMemory_1.useFlowMemory)(memoryManager);
    const handleNodesChange = (0, react_1.useCallback)(async (newNodes) => {
        setNodes(newNodes);
        await updateFlowMemoryGraph(newNodes, edges);
        if (onSave) {
            onSave(newNodes, edges);
        }
    }, [edges, onSave, updateFlowMemoryGraph]);
    const handleEdgesChange = (0, react_1.useCallback)(async (newEdges) => {
        setEdges(newEdges);
        await updateFlowMemoryGraph(nodes, newEdges);
        if (onSave) {
            onSave(nodes, newEdges);
        }
    }, [nodes, onSave, updateFlowMemoryGraph]);
    const handleNodeUpdate = (0, react_1.useCallback)(async (nodeId, updates) => {
        const updatedNodes = nodes.map((node) => node.id === nodeId
            ? Object.assign(Object.assign({}, node), updates) : node);
        setNodes(updatedNodes);
        const updatedNode = updatedNodes.find(n => n.id === nodeId);
        if (updatedNode) {
            await saveNodeMemory(updatedNode);
        }
    }, [nodes, saveNodeMemory]);
    const handleNodeSelect = (0, react_1.useCallback)(async (nodeId) => {
        const memory = await loadNodeMemory(nodeId);
        navigateToNode(nodeId);
    }, [loadNodeMemory, navigateToNode]);
    const handleAddNode = (0, react_1.useCallback)(() => {
        const newNode = {
            id: `node-${nodes.length + 1}`,
            type: 'default',
            position: { x: 100, y: 100 },
            data: {
                label: `Node ${nodes.length + 1}`,
                type: 'default',
                parameters: {},
            },
        };
        setNodes((prev) => [...prev, newNode]);
    }, [nodes]);
    return (<div className="h-screen flex">
      
      <core_1.Card className="w-64 border-r">
        <core_1.CardHeader>
          <core_1.CardTitle>Flow Editor</core_1.CardTitle>
        </core_1.CardHeader>
        <core_1.CardContent className="space-y-4">
          <core_1.Button onClick={handleAddNode} className="w-full">
            <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
            Add Node
          </core_1.Button>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Nodes</h3>
            <core_1.ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-1">
                {nodes.map((node) => {
            var _a;
            return (<core_1.Button key={node.id} variant="ghost" className="w-full justify-start" onClick={() => handleNodeSelect(node.id)}>
                    {((_a = node.data) === null || _a === void 0 ? void 0 : _a.label) || node.id}
                  </core_1.Button>);
        })}
              </div>
            </core_1.ScrollArea>
          </div>
        </core_1.CardContent>
      </core_1.Card>

      <div className="flex-1">
        <react_router_dom_1.Routes>
          <react_router_dom_1.Route path="/" element={<FlowPage_1.FlowPage initialNodes={nodes} initialEdges={edges} onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange}/>}/>
          <react_router_dom_1.Route path="/node/:nodeId" element={<NodeDetails_1.NodeDetails nodes={nodes} onNodeUpdate={handleNodeUpdate}/>}/>
        </react_router_dom_1.Routes>
      </div>
    </div>);
};
exports.FlowContainer = FlowContainer;
export {};
//# sourceMappingURL=FlowContainer.js.map
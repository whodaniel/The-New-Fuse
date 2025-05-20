"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfiniteCanvas = InfiniteCanvas;
import react_1 from 'react';
import framer_motion_1 from 'framer-motion';
import pipeline_node_1 from './pipeline-node.js';
import node_connection_1 from './node-connection.js';
import button_1 from '@/components/ui/button';
import lucide_react_1 from 'lucide-react';
function InfiniteCanvas() {
    const [nodes, setNodes] = (0, react_1.useState)([]);
    const [connections, setConnections] = (0, react_1.useState)([]);
    const [scale, setScale] = (0, react_1.useState)(1);
    const [position, setPosition] = (0, react_1.useState)({ x: 0, y: 0 });
    const canvasRef = (0, react_1.useRef)(null);
    const handleDragNode = (id, newPosition) => {
        setNodes(nodes.map(nod(e: any) => node.id === id ? Object.assign(Object.assign({}, node), { position: newPosition }) : node));
    };
    const handleConnect = (fromId, toId) => {
        setConnections([...connections, { from: fromId, to: toId }]);
    };
    const handleAddNode = (type) => {
        const newNode = {
            id: `node_${Date.now()}`,
            type,
            position: { x: 0, y: 0 },
        };
        setNodes([...nodes, newNode]);
    };
    const handleZoom = (delta) => {
        setScale(scal(e: any) => Math.max(0.1, Math.min(2, scale + delta * 0.1)));
    };
    const handlePan = (0, react_1.useCallback)((event, info) => {
        setPosition(pos => ({
            x: pos.x + info.delta.x / scale,
            y: pos.y + info.delta.y / scale,
        }));
    }, [scale]);
    return (<div className="w-full h-full overflow-hidden relative">
      <framer_motion_1.motion.div ref={canvasRef} className="w-full h-full absolute" style={{
            scale,
            x: position.x,
            y: position.y,
        }} drag dragMomentum={false} onDrag={handlePan}>
        {nodes.map(nod(e: any) => (<pipeline_node_1.PipelineNode key={node.id} node={node} onDrag={(newPosition) => handleDragNode(node.id, newPosition)} onConnect={handleConnect}/>))}
        {connections.map((connection, index) => (<node_connection_1.NodeConnection key={index} from={connection.from} to={connection.to}/>))}
      </framer_motion_1.motion.div>
      <div className="absolute top-4 left-4 space-x-2">
        <button_1.Button onClick={() => handleZoom(1)}><lucide_react_1.Plus className="h-4 w-4"/></button_1.Button>
        <button_1.Button onClick={() => handleZoom(-1)}><lucide_react_1.Minus className="h-4 w-4"/></button_1.Button>
      </div>
      <div className="absolute bottom-4 left-4 space-x-2">
        <button_1.Button onClick={() => handleAddNode('huggingface')}>Add HuggingFace Node</button_1.Button>
        <button_1.Button onClick={() => handleAddNode('langchain')}>Add LangChain Node</button_1.Button>
        <button_1.Button onClick={() => handleAddNode('comfyui')}>Add ComfyUI Node</button_1.Button>
        <button_1.Button onClick={() => handleAddNode('webhook')}>Add Webhook Node</button_1.Button>
        <button_1.Button onClick={() => handleAddNode('gpu')}>Add GPU Node</button_1.Button>
      </div>
    </div>);
}
export {};
//# sourceMappingURL=infinite-canvas.js.map
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeGraphViewer = KnowledgeGraphViewer;
import react_1 from 'react';
import reactflow_1 from 'reactflow';
require("reactflow/dist/style.css");
import material_1 from '@mui/material';
import icons_material_1 from '@mui/icons-material';
import WizardProvider_1 from './WizardProvider.js';
const nodeTypes = {
    concept: ConceptNode,
    relation: RelationNode,
    entity: EntityNode
};
function KnowledgeGraphViewer() {
    const { state } = (0, WizardProvider_1.useWizard)();
    const [nodes, setNodes, onNodesChange] = (0, reactflow_1.useNodesState)([]);
    const [edges, setEdges, onEdgesChange] = (0, reactflow_1.useEdgesState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [autoLayout, setAutoLayout] = (0, react_1.useState)(true);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [selectedNode, setSelectedNode] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        var _a;
        if ((_a = state.session) === null || _a === void 0 ? void 0 : _a.knowledge_graph) {
            loadGraphData(state.session.knowledge_graph);
        }
    }, [state.session]);
    const loadGraphData = async (graph) => {
        setLoading(true);
        try {
            const graphData = await graph.exportGraph();
            const formattedNodes = formatNodes(graphData.nodes);
            const formattedEdges = formatEdges(graphData.edges);
            if (autoLayout) {
                const layoutedElements = applyForceLayout(formattedNodes, formattedEdges);
                setNodes(layoutedElements.nodes);
                setEdges(layoutedElements.edges);
            }
            else {
                setNodes(formattedNodes);
                setEdges(formattedEdges);
            }
        }
        catch (error) {
            console.error('Error loading graph data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const formatNodes = (knowledgeNodes) => {
        return knowledgeNodes.map(nod(e: any) => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: Object.assign({ label: node.label }, node.data)
        }));
    };
    const formatEdges = (knowledgeEdges) => {
        return knowledgeEdges.map(edg(e: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            type: edge.type,
            markerEnd: {
                type: reactflow_1.MarkerType.ArrowClosed
            },
            style: { stroke: '#555' }
        }));
    };
    const applyForceLayout = (nodes, edges) => {
        const nodeSpacing = 150;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        nodes.forEach((node, index) => {
            const angle = (2 * Math.PI * index) / nodes.length;
            node.position = {
                x: centerX + Math.cos(angle) * nodeSpacing,
                y: centerY + Math.sin(angle) * nodeSpacing
            };
        });
        return { nodes, edges };
    };
    const handleNodeClick = (event, node) => {
        setSelectedNode(node);
    };
    const handleAddNode = () => {
        const newNode = {
            id: `node-${Date.now()}`,
            type: 'concept',
            position: { x: 100, y: 100 },
            data: { label: 'New Concept' }
        };
        setNodes([...nodes, newNode]);
    };
    const handleSearch = (0, react_1.useCallback)(() => {
        if (!searchTerm) {
            setNodes(nodes => nodes.map(nod(e: any) => (Object.assign(Object.assign({}, node), { style: undefined }))));
            return;
        }
        setNodes(nodes => nodes.map(nod(e: any) => (Object.assign(Object.assign({}, node), { style: node.data.label.toLowerCase().includes(searchTerm.toLowerCase())
                ? { background: '#ff8', border: '2px solid #aa5' }
                : { opacity: 0.3 } }))));
    }, [searchTerm]);
    if (loading) {
        return (<material_1.Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <material_1.CircularProgress />
            </material_1.Box>);
    }
    return (<material_1.Paper elevation={3} sx={{ height: '600px', position: 'relative' }}>
            <material_1.Box position="absolute" top={16} left={16} zIndex={5} display="flex" gap={2}>
                <material_1.TextField size="small" placeholder="Search nodes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && handleSearch()}/>
                <material_1.Button variant="contained" size="small" startIcon={<icons_material_1.Add />} onClick={handleAddNode}>
                    Add Node
                </material_1.Button>
                <material_1.FormControlLabel control={<material_1.Switch checked={autoLayout} onChange={(e) => setAutoLayout(e.target.checked)} size="small"/>} label="Auto Layout"/>
            </material_1.Box>

            <reactflow_1.default nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={handleNodeClick} nodeTypes={nodeTypes} connectionMode={reactflow_1.ConnectionMode.LOOSE} fitView>
                <reactflow_1.Background />
                <reactflow_1.Controls />
            </reactflow_1.default>

            {selectedNode && (<NodeDetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} onUpdate={(updatedData) => {
                setNodes(nodes.map(n => n.id === selectedNode.id
                    ? Object.assign(Object.assign({}, n), { data: Object.assign(Object.assign({}, n.data), updatedData) }) : n));
                setSelectedNode(null);
            }}/>)}
        </material_1.Paper>);
}
function ConceptNode({ data }) {
    return (<div className="concept-node">
            <div className="header">{data.label}</div>
            <div className="body">{data.description}</div>
        </div>);
}
function RelationNode({ data }) {
    return (<div className="relation-node">
            <div className="header">{data.label}</div>
            <div className="type">{data.relationType}</div>
        </div>);
}
function EntityNode({ data }) {
    return (<div className="entity-node">
            <div className="header">{data.label}</div>
            <div className="properties">
                {Object.entries(data.properties || {}).map(([key, value]) => (<div key={key} className="property">
                        {key}: {String(value)}
                    </div>))}
            </div>
        </div>);
}
function NodeDetailsPanel({ node, onClose, onUpdate }) {
    const [editData, setEditData] = (0, react_1.useState)(node.data);
    return (<material_1.Paper sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            width: 300,
            p: 2,
            zIndex: 10
        }}>
            <material_1.Typography variant="h6" gutterBottom>
                Node Details
                <material_1.IconButton size="small" onClick={onClose} sx={{ float: 'right' }}>
                    <icons_material_1.Delete />
                </material_1.IconButton>
            </material_1.Typography>

            <material_1.TextField fullWidth label="Label" value={editData.label} onChange={(e) => setEditData(Object.assign(Object.assign({}, editData), { label: e.target.value }))} margin="normal" size="small"/>

            <material_1.TextField fullWidth label="Description" value={editData.description || ''} onChange={(e) => setEditData(Object.assign(Object.assign({}, editData), { description: e.target.value }))} margin="normal" size="small" multiline rows={3}/>

            <material_1.Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                <material_1.Button variant="outlined" onClick={onClose}>
                    Cancel
                </material_1.Button>
                <material_1.Button variant="contained" onClick={() => onUpdate(editData)}>
                    Update
                </material_1.Button>
            </material_1.Box>
        </material_1.Paper>);
}
export {};
//# sourceMappingURL=KnowledgeGraphViewer.js.map
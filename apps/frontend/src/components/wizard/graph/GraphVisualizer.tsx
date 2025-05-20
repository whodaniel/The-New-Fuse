
export {}
exports.GraphVisualizer = GraphVisualizer;
import react_1 from 'react';
import reactflow_1 from 'reactflow';
require("reactflow/dist/style.css");
import material_1 from '@mui/material';
import icons_material_1 from '@mui/icons-material';
import DataCard_1 from '../../shared/DataCard.js';
import dagre_1 from 'dagre';
const layoutAlgorithms = {
    force: (nodes, edges) => {
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(edges).id((d) => d.id))
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter(0, 0));
        for (let i = 0; i < 300; ++i)
            simulation.tick();
        return { nodes, edges };
    },
    dagre: (nodes, edges) => {
        const g = new dagre_1.default.graphlib.Graph();
        g.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 70 });
        g.setDefaultEdgeLabel(() => ({}));
        nodes.forEach((node) => {
            g.setNode(node.id, { width: 150, height: 40 });
        });
        edges.forEach((edge) => {
            g.setEdge(edge.source, edge.target);
        });
        dagre_1.default.layout(g);
        return {
            nodes: nodes.map((node) => {
                const nodeWithPosition = g.node(node.id);
                return Object.assign(Object.assign({}, node), { position: {
                        x: nodeWithPosition.x,
                        y: nodeWithPosition.y
                    } });
            }),
            edges
        };
    },
    circular: (nodes, edges) => {
        const radius = Math.max(nodes.length * 30, 200);
        const angleStep = (2 * Math.PI) / nodes.length;
        return {
            nodes: nodes.map((node, i) => (Object.assign(Object.assign({}, node), { position: {
                    x: radius * Math.cos(angleStep * i),
                    y: radius * Math.sin(angleStep * i)
                } }))),
            edges
        };
    }
};
const clusterAlgorithms = {
    louvain: (nodes, edges) => {
        return { clusters: [], clusterMap: new Map() };
    },
    kMeans: (nodes, k) => {
        return { clusters: [], clusterMap: new Map() };
    }
};
const pathAlgorithms = {
    dijkstra: (nodes, edges, start, end) => {
        return [];
    },
    aStar: (nodes, edges, start, end) => {
        return [];
    }
};
function GraphVisualizer({ nodes: initialNodes, edges: initialEdges, config: initialConfig, onNodeClick, onEdgeClick, onLayoutChange, onConfigChange }): any {
    const [nodes, setNodes, onNodesChange] = (0, reactflow_1.useNodesState)([]);
    const [edges, setEdges, onEdgesChange] = (0, reactflow_1.useEdgesState)([]);
    const [config, setConfig] = (0, react_1.useState)({
        layout: { type: 'force' },
        physics: {
            enabled: true,
            stabilization: true,
            repulsion: 100,
            springLength: 100
        },
        interaction: {
            dragNodes: true,
            dragView: true,
            zoomView: true,
            selectable: true,
            multiselect: true
        },
        styles: {
            node: {},
            edge: {},
            selected: {}
        }
    });
    const [selectedNodes, setSelectedNodes] = (0, react_1.useState)([]);
    const [selectedEdges, setSelectedEdges] = (0, react_1.useState)([]);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [showSettings, setShowSettings] = (0, react_1.useState)(false);
    const [pathfindingMode, setPathfindingMode] = (0, react_1.useState)(false);
    const [startNode, setStartNode] = (0, react_1.useState)(null);
    const [endNode, setEndNode] = (0, react_1.useState)(null);
    const [clusteringEnabled, setClusteringEnabled] = (0, react_1.useState)(false);
    const [clusterAlgorithm, setClusterAlgorithm] = (0, react_1.useState)('louvain');
    const [menuAnchor, setMenuAnchor] = (0, react_1.useState)(null);
    const { fitView, zoomIn, zoomOut } = (0, reactflow_1.useReactFlow)();
    (0, react_1.useEffect)(() => {
        if (initialNodes && initialEdges) {
            applyLayout(config.layout.type, initialNodes, initialEdges);
        }
    }, [initialNodes, initialEdges]);
    const applyLayout = (0, react_1.useCallback)((layoutType, nodes, edges) => {
        const layout = layoutAlgorithms[layoutType];
        if (layout) {
            const { nodes: layoutedNodes, edges: layoutedEdges } = layout(nodes, edges);
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
            onLayoutChange === null || onLayoutChange === void 0 ? void 0 : onLayoutChange(layoutType);
            fitView();
        }
    }, [setNodes, setEdges, fitView, onLayoutChange]);
    const applyClustering = (0, react_1.useCallback)(() => {
        const { clusters, clusterMap } = clusterAlgorithms[clusterAlgorithm](nodes, edges);
        setNodes(nodes.map(nod(e: any) => (Object.assign(Object.assign({}, node), { data: Object.assign(Object.assign({}, node.data), { cluster: clusterMap.get(node.id) }), style: Object.assign(Object.assign({}, node.style), { backgroundColor: `hsl(${(clusterMap.get(node.id) || 0) * 137.5}, 50%, 50%)` }) }))));
    }, [nodes, edges, clusterAlgorithm]);
    const findPath = (0, react_1.useCallback)(() => {
        if (!startNode || !endNode)
            return;
        const path = pathAlgorithms.aStar(nodes, edges, startNode, endNode);
        setEdges(edges.map(edg(e: any) => (Object.assign(Object.assign({}, edge), { style: Object.assign(Object.assign({}, edge.style), { stroke: path.includes(edge.id) ? '#ff0000' : '#000000', strokeWidth: path.includes(edge.id) ? 3 : 1 }) }))));
    }, [nodes, edges, startNode, endNode]);
    const handleSearch = (0, react_1.useCallback)(() => {
        if (!searchTerm) {
            setNodes(nodes => nodes.map(nod(e: any) => (Object.assign(Object.assign({}, node), { style: undefined }))));
            return;
        }
        setNodes(nodes => nodes.map(nod(e: any) => (Object.assign(Object.assign({}, node), { style: Object.assign(Object.assign({}, node.style), { opacity: node.data.label.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0.2 }) }))));
    }, [searchTerm]);
    const handleNodeClick = (0, react_1.useCallback)((event, node) => {
        if (pathfindingMode) {
            if (!startNode) {
                setStartNode(node.id);
            }
            else if (!endNode) {
                setEndNode(node.id);
                findPath();
            }
        }
        else {
            onNodeClick === null || onNodeClick === void 0 ? void 0 : onNodeClick(node);
        }
    }, [pathfindingMode, startNode, endNode, findPath, onNodeClick]);
    return (<reactflow_1.ReactFlowProvider>
            <material_1.Box sx={{ height: '100%', position: 'relative' }}>
                <DataCard_1.DataCard title="Knowledge Graph" tooltip="Interactive visualization of the knowledge graph" data={{ nodes, edges }} isLoading={false} renderContent={() => (<material_1.Box sx={{ height: 600 }}>
                            <reactflow_1.default nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={handleNodeClick} onEdgeClick={(_, edge) => onEdgeClick === null || onEdgeClick === void 0 ? void 0 : onEdgeClick(edge)} connectionMode={reactflow_1.ConnectionMode.LOOSE} fitView>
                                <reactflow_1.Background />
                                <reactflow_1.Controls />
                                <reactflow_1.Panel position="top-left">
                                    <material_1.Box display="flex" gap={1}>
                                        <material_1.Tooltip title="Zoom In">
                                            <material_1.IconButton onClick={() => zoomIn()}>
                                                <icons_material_1.ZoomIn />
                                            </material_1.IconButton>
                                        </material_1.Tooltip>
                                        <material_1.Tooltip title="Zoom Out">
                                            <material_1.IconButton onClick={() => zoomOut()}>
                                                <icons_material_1.ZoomOut />
                                            </material_1.IconButton>
                                        </material_1.Tooltip>
                                        <material_1.Tooltip title="Fit View">
                                            <material_1.IconButton onClick={() => fitView()}>
                                                <icons_material_1.CenterFocusStrong />
                                            </material_1.IconButton>
                                        </material_1.Tooltip>
                                        <material_1.Tooltip title="Layout Options">
                                            <material_1.IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                                                <icons_material_1.AccountTree />
                                            </material_1.IconButton>
                                        </material_1.Tooltip>
                                        <material_1.Tooltip title="Settings">
                                            <material_1.IconButton onClick={() => setShowSettings(true)}>
                                                <icons_material_1.Settings />
                                            </material_1.IconButton>
                                        </material_1.Tooltip>
                                    </material_1.Box>
                                </reactflow_1.Panel>

                                <reactflow_1.Panel position="top-right">
                                    <material_1.Box display="flex" gap={1}>
                                        <material_1.TextField size="small" placeholder="Search nodes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && handleSearch()} InputProps={{
                endAdornment: (<material_1.IconButton size="small" onClick={handleSearch}>
                                                        <icons_material_1.Search />
                                                    </material_1.IconButton>)
            }}/>
                                    </material_1.Box>
                                </reactflow_1.Panel>

                                <reactflow_1.Panel position="bottom-left">
                                    <material_1.Box display="flex" gap={1}>
                                        <material_1.Button variant="contained" size="small" startIcon={<icons_material_1.Route />} onClick={() => setPathfindingMode(!pathfindingMode)} color={pathfindingMode ? 'primary' : 'inherit'}>
                                            Path Finding
                                        </material_1.Button>
                                        <material_1.Button variant="contained" size="small" startIcon={<icons_material_1.Hub />} onClick={() => {
                setClusteringEnabled(!clusteringEnabled);
                if (!clusteringEnabled) {
                    applyClustering();
                }
            }} color={clusteringEnabled ? 'primary' : 'inherit'}>
                                            Clustering
                                        </material_1.Button>
                                    </material_1.Box>
                                </reactflow_1.Panel>
                            </reactflow_1.default>
                        </material_1.Box>)}/>

                <material_1.Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                    <material_1.MenuItem onClick={() => {
            applyLayout('force', nodes, edges);
            setMenuAnchor(null);
        }}>
                        <material_1.ListItemIcon><icons_material_1.AccountTree /></material_1.ListItemIcon>
                        <material_1.ListItemText>Force Layout</material_1.ListItemText>
                    </material_1.MenuItem>
                    <material_1.MenuItem onClick={() => {
            applyLayout('dagre', nodes, edges);
            setMenuAnchor(null);
        }}>
                        <material_1.ListItemIcon><icons_material_1.AccountTree /></material_1.ListItemIcon>
                        <material_1.ListItemText>Hierarchical Layout</material_1.ListItemText>
                    </material_1.MenuItem>
                    <material_1.MenuItem onClick={() => {
            applyLayout('circular', nodes, edges);
            setMenuAnchor(null);
        }}>
                        <material_1.ListItemIcon><icons_material_1.AccountTree /></material_1.ListItemIcon>
                        <material_1.ListItemText>Circular Layout</material_1.ListItemText>
                    </material_1.MenuItem>
                </material_1.Menu>

                <material_1.Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
                    <material_1.DialogTitle>Graph Settings</material_1.DialogTitle>
                    <material_1.DialogContent>
                        <material_1.Box display="flex" flexDirection="column" gap={2}>
                            <material_1.Typography variant="h6">Physics</material_1.Typography>
                            <material_1.FormControlLabel control={<material_1.Switch checked={config.physics.enabled} onChange={(e) => setConfig((prev: any) => (Object.assign(Object.assign({}, prev), { physics: Object.assign(Object.assign({}, prev.physics), { enabled: e.target.checked }) })))}/>} label="Enable Physics"/>
                            <material_1.Typography>Repulsion Force</material_1.Typography>
                            <material_1.Slider value={config.physics.repulsion} onChange={(_, value) => setConfig((prev: any) => (Object.assign(Object.assign({}, prev), { physics: Object.assign(Object.assign({}, prev.physics), { repulsion: value }) })))} min={0} max={1000} step={10}/>
                            <material_1.Typography>Spring Length</material_1.Typography>
                            <material_1.Slider value={config.physics.springLength} onChange={(_, value) => setConfig((prev: any) => (Object.assign(Object.assign({}, prev), { physics: Object.assign(Object.assign({}, prev.physics), { springLength: value }) })))} min={0} max={500} step={10}/>

                            <material_1.Typography variant="h6">Clustering</material_1.Typography>
                            <material_1.FormControl fullWidth>
                                <material_1.InputLabel>Algorithm</material_1.InputLabel>
                                <material_1.Select value={clusterAlgorithm} onChange={(e) => setClusterAlgorithm(e.target.value)}>
                                    <material_1.MenuItem value="louvain">Louvain</material_1.MenuItem>
                                    <material_1.MenuItem value="kMeans">K-Means</material_1.MenuItem>
                                </material_1.Select>
                            </material_1.FormControl>
                        </material_1.Box>
                    </material_1.DialogContent>
                    <material_1.DialogActions>
                        <material_1.Button onClick={() => setShowSettings(false)}>Cancel</material_1.Button>
                        <material_1.Button onClick={() => {
            onConfigChange === null || onConfigChange === void 0 ? void 0 : onConfigChange(config);
            setShowSettings(false);
        }} variant="contained">
                            Apply
                        </material_1.Button>
                    </material_1.DialogActions>
                </material_1.Dialog>
            </material_1.Box>
        </reactflow_1.ReactFlowProvider>);
}
export {};
//# sourceMappingURL=GraphVisualizer.js.map
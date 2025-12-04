import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
exports.GraphVisualizer = GraphVisualizer;
import react_1 from 'react';
import reactflow_1 from 'reactflow';
require("reactflow/dist/style.css");
import { Box } from '@chakra-ui/react';
import DataCard_1 from '../../shared/DataCard';
import dagre_1 from 'dagre';
var layoutAlgorithms = {
    force: function (nodes, edges) {
        var simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(edges).id(function (d) { return d.id; }))
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter(0, 0));
        for (var i = 0; i < 300; ++i)
            simulation.tick();
        return { nodes: nodes, edges: edges };
    },
    dagre: function (nodes, edges) {
        var g = new dagre_1.default.graphlib.Graph();
        g.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 70 });
        g.setDefaultEdgeLabel(function () { return ({}); });
        nodes.forEach(function (node) {
            g.setNode(node.id, { width: 150, height: 40 });
        });
        edges.forEach(function (edge) {
            g.setEdge(edge.source, edge.target);
        });
        dagre_1.default.layout(g);
        return {
            nodes: nodes.map(function (node) {
                var nodeWithPosition = g.node(node.id);
                return Object.assign(Object.assign({}, node), { position: {
                        x: nodeWithPosition.x,
                        y: nodeWithPosition.y
                    } });
            }),
            edges: edges
        };
    },
    circular: function (nodes, edges) {
        var radius = Math.max(nodes.length * 30, 200);
        var angleStep = (2 * Math.PI) / nodes.length;
        return {
            nodes: nodes.map(function (node, i) { return (Object.assign(Object.assign({}, node), { position: {
                    x: radius * Math.cos(angleStep * i),
                    y: radius * Math.sin(angleStep * i)
                } })); }),
            edges: edges
        };
    }
};
var clusterAlgorithms = {
    louvain: function (nodes, edges) {
        return { clusters: [], clusterMap: new Map() };
    },
    kMeans: function (nodes, k) {
        return { clusters: [], clusterMap: new Map() };
    }
};
var pathAlgorithms = {
    dijkstra: function (nodes, edges, start, end) {
        return [];
    },
    aStar: function (nodes, edges, start, end) {
        return [];
    }
};
function GraphVisualizer(_a) {
    var initialNodes = _a.nodes, initialEdges = _a.edges, initialConfig = _a.config, onNodeClick = _a.onNodeClick, onEdgeClick = _a.onEdgeClick, onLayoutChange = _a.onLayoutChange, onConfigChange = _a.onConfigChange;
    var _b = (0, reactflow_1.useNodesState)([]), nodes = _b[0], setNodes = _b[1], onNodesChange = _b[2];
    var _c = (0, reactflow_1.useEdgesState)([]), edges = _c[0], setEdges = _c[1], onEdgesChange = _c[2];
    var _d = (0, react_1.useState)({
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
    }), config = _d[0], setConfig = _d[1];
    var _e = (0, react_1.useState)([]), selectedNodes = _e[0], setSelectedNodes = _e[1];
    var _f = (0, react_1.useState)([]), selectedEdges = _f[0], setSelectedEdges = _f[1];
    var _g = (0, react_1.useState)(''), searchTerm = _g[0], setSearchTerm = _g[1];
    var _h = (0, react_1.useState)(false), showSettings = _h[0], setShowSettings = _h[1];
    var _j = (0, react_1.useState)(false), pathfindingMode = _j[0], setPathfindingMode = _j[1];
    var _k = (0, react_1.useState)(null), startNode = _k[0], setStartNode = _k[1];
    var _l = (0, react_1.useState)(null), endNode = _l[0], setEndNode = _l[1];
    var _m = (0, react_1.useState)(false), clusteringEnabled = _m[0], setClusteringEnabled = _m[1];
    var _o = (0, react_1.useState)('louvain'), clusterAlgorithm = _o[0], setClusterAlgorithm = _o[1];
    var _p = (0, react_1.useState)(null), menuAnchor = _p[0], setMenuAnchor = _p[1];
    var _q = (0, reactflow_1.useReactFlow)(), fitView = _q.fitView, zoomIn = _q.zoomIn, zoomOut = _q.zoomOut;
    (0, react_1.useEffect)(function () {
        if (initialNodes && initialEdges) {
            applyLayout(config.layout.type, initialNodes, initialEdges);
        }
    }, [initialNodes, initialEdges]);
    var applyLayout = (0, react_1.useCallback)(function (layoutType, nodes, edges) {
        var layout = layoutAlgorithms[layoutType];
        if (layout) {
            var _a = layout(nodes, edges), layoutedNodes = _a.nodes, layoutedEdges = _a.edges;
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
            onLayoutChange === null || onLayoutChange === void 0 ? void 0 : onLayoutChange(layoutType);
            fitView();
        }
    }, [setNodes, setEdges, fitView, onLayoutChange]);
    var applyClustering = (0, react_1.useCallback)(function () {
        var _a = clusterAlgorithms[clusterAlgorithm](nodes, edges), clusters = _a.clusters, clusterMap = _a.clusterMap;
        setNodes(nodes.map(function (node) { return (Object.assign(Object.assign({}, node), { data: Object.assign(Object.assign({}, node.data), { cluster: clusterMap.get(node.id) }), style: Object.assign(Object.assign({}, node.style), { backgroundColor: "hsl(".concat((clusterMap.get(node.id) || 0) * 137.5, ", 50%, 50%)") }) })); }));
    }, [nodes, edges, clusterAlgorithm]);
    var findPath = (0, react_1.useCallback)(function () {
        if (!startNode || !endNode)
            return;
        var path = pathAlgorithms.aStar(nodes, edges, startNode, endNode);
        setEdges(edges.map(function (edge) { return (Object.assign(Object.assign({}, edge), { style: Object.assign(Object.assign({}, edge.style), { stroke: path.includes(edge.id) ? '#ff0000' : '#000000', strokeWidth: path.includes(edge.id) ? 3 : 1 }) })); }));
    }, [nodes, edges, startNode, endNode]);
    var handleSearch = (0, react_1.useCallback)(function () {
        if (!searchTerm) {
            setNodes(function (nodes) { return nodes.map(function (node) { return (Object.assign(Object.assign({}, node), { style: undefined })); }); });
            return;
        }
        setNodes(function (nodes) { return nodes.map(function (node) { return (Object.assign(Object.assign({}, node), { style: Object.assign(Object.assign({}, node.style), { opacity: node.data.label.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0.2 }) })); }); });
    }, [searchTerm]);
    var handleNodeClick = (0, react_1.useCallback)(function (event, node) {
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
    return (_jsx(reactflow_1.ReactFlowProvider, { children: _jsxs(Box, { style: { height: '100%', position: 'relative' }, children: [_jsx(DataCard_1.DataCard, { title: "Knowledge Graph", tooltip: "Interactive visualization of the knowledge graph", data: { nodes: nodes, edges: edges }, isLoading: false, renderContent: function () { return (_jsx(Box, { style: { height: 600 }, children: _jsxs(reactflow_1.default, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onNodeClick: handleNodeClick, onEdgeClick: function (_, edge) { return onEdgeClick === null || onEdgeClick === void 0 ? void 0 : onEdgeClick(edge); }, connectionMode: reactflow_1.ConnectionMode.LOOSE, fitView: true, children: [_jsx(reactflow_1.Background, {}), _jsx(reactflow_1.Controls, {}), _jsx(reactflow_1.Panel, { position: "top-left", children: _jsxs(material_1.Box, { display: "flex", gap: 1, children: [_jsx(material_1.Tooltip, { title: "Zoom In", children: _jsx(material_1.IconButton, { onClick: function () { return zoomIn(); }, children: _jsx(icons_material_1.ZoomIn, {}) }) }), _jsx(material_1.Tooltip, { title: "Zoom Out", children: _jsx(material_1.IconButton, { onClick: function () { return zoomOut(); }, children: _jsx(icons_material_1.ZoomOut, {}) }) }), _jsx(material_1.Tooltip, { title: "Fit View", children: _jsx(material_1.IconButton, { onClick: function () { return fitView(); }, children: _jsx(icons_material_1.CenterFocusStrong, {}) }) }), _jsx(material_1.Tooltip, { title: "Layout Options", children: _jsx(material_1.IconButton, { onClick: function (e) { return setMenuAnchor(e.currentTarget); }, children: _jsx(icons_material_1.AccountTree, {}) }) }), _jsx(material_1.Tooltip, { title: "Settings", children: _jsx(material_1.IconButton, { onClick: function () { return setShowSettings(true); }, children: _jsx(icons_material_1.Settings, {}) }) })] }) }), _jsx(reactflow_1.Panel, { position: "top-right", children: _jsx(material_1.Box, { display: "flex", gap: 1, children: _jsx(material_1.TextField, { size: "small", placeholder: "Search nodes...", value: searchTerm, onChange: function (e) { return setSearchTerm(e.target.value); }, onKeyUp: function (e) { return e.key === 'Enter' && handleSearch(); }, InputProps: {
                                                endAdornment: (_jsx(material_1.IconButton, { size: "small", onClick: handleSearch, children: _jsx(icons_material_1.Search, {}) }))
                                            } }) }) }), _jsx(reactflow_1.Panel, { position: "bottom-left", children: _jsxs(material_1.Box, { display: "flex", gap: 1, children: [_jsx(material_1.Button, { variant: "contained", size: "small", startIcon: _jsx(icons_material_1.Route, {}), onClick: function () { return setPathfindingMode(!pathfindingMode); }, color: pathfindingMode ? 'primary' : 'inherit', children: "Path Finding" }), _jsx(material_1.Button, { variant: "contained", size: "small", startIcon: _jsx(icons_material_1.Hub, {}), onClick: function () {
                                                    setClusteringEnabled(!clusteringEnabled);
                                                    if (!clusteringEnabled) {
                                                        applyClustering();
                                                    }
                                                }, color: clusteringEnabled ? 'primary' : 'inherit', children: "Clustering" })] }) })] }) })); } }), _jsxs(material_1.Menu, { anchorEl: menuAnchor, open: Boolean(menuAnchor), onClose: function () { return setMenuAnchor(null); }, children: [_jsxs(material_1.MenuItem, { onClick: function () {
                                applyLayout('force', nodes, edges);
                                setMenuAnchor(null);
                            }, children: [_jsx(material_1.ListItemIcon, { children: _jsx(icons_material_1.AccountTree, {}) }), _jsx(material_1.ListItemText, { children: "Force Layout" })] }), _jsxs(material_1.MenuItem, { onClick: function () {
                                applyLayout('dagre', nodes, edges);
                                setMenuAnchor(null);
                            }, children: [_jsx(material_1.ListItemIcon, { children: _jsx(icons_material_1.AccountTree, {}) }), _jsx(material_1.ListItemText, { children: "Hierarchical Layout" })] }), _jsxs(material_1.MenuItem, { onClick: function () {
                                applyLayout('circular', nodes, edges);
                                setMenuAnchor(null);
                            }, children: [_jsx(material_1.ListItemIcon, { children: _jsx(icons_material_1.AccountTree, {}) }), _jsx(material_1.ListItemText, { children: "Circular Layout" })] })] }), _jsxs(material_1.Dialog, { open: showSettings, onClose: function () { return setShowSettings(false); }, maxWidth: "sm", fullWidth: true, children: [_jsx(material_1.DialogTitle, { children: "Graph Settings" }), _jsx(material_1.DialogContent, { children: _jsxs(material_1.Box, { display: "flex", flexDirection: "column", gap: 2, children: [_jsx(material_1.Typography, { variant: "h6", children: "Physics" }), _jsx(material_1.FormControlLabel, { control: _jsx(material_1.Switch, { checked: config.physics.enabled, onChange: function (e) { return setConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { physics: Object.assign(Object.assign({}, prev.physics), { enabled: e.target.checked }) })); }); } }), label: "Enable Physics" }), _jsx(material_1.Typography, { children: "Repulsion Force" }), _jsx(material_1.Slider, { value: config.physics.repulsion, onChange: function (_, value) { return setConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { physics: Object.assign(Object.assign({}, prev.physics), { repulsion: value }) })); }); }, min: 0, max: 1000, step: 10 }), _jsx(material_1.Typography, { children: "Spring Length" }), _jsx(material_1.Slider, { value: config.physics.springLength, onChange: function (_, value) { return setConfig(function (prev) { return (Object.assign(Object.assign({}, prev), { physics: Object.assign(Object.assign({}, prev.physics), { springLength: value }) })); }); }, min: 0, max: 500, step: 10 }), _jsx(material_1.Typography, { variant: "h6", children: "Clustering" }), _jsxs(material_1.FormControl, { fullWidth: true, children: [_jsx(material_1.InputLabel, { children: "Algorithm" }), _jsxs(material_1.Select, { value: clusterAlgorithm, onChange: function (e) { return setClusterAlgorithm(e.target.value); }, children: [_jsx(material_1.MenuItem, { value: "louvain", children: "Louvain" }), _jsx(material_1.MenuItem, { value: "kMeans", children: "K-Means" })] })] })] }) }), _jsxs(material_1.DialogActions, { children: [_jsx(material_1.Button, { onClick: function () { return setShowSettings(false); }, children: "Cancel" }), _jsx(material_1.Button, { onClick: function () {
                                        onConfigChange === null || onConfigChange === void 0 ? void 0 : onConfigChange(config);
                                        setShowSettings(false);
                                    }, variant: "contained", children: "Apply" })] })] })] }) }));
}

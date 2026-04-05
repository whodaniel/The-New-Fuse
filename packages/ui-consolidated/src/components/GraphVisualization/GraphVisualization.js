import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback, useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap, Panel, useReactFlow, } from "reactflow";
import "reactflow/dist/style.css";
import { useGraphWebSocket } from '../hooks/useGraphWebSocket';
import { MemoryGraphAdapter } from '../memory/memory-graph-adapter';
import styles from './graph-visualization.module.css';
const DefaultNode = ({ data }) => {
    const nodeClass = `${styles.defaultNode} ${data.status === "running" ? "animate-pulse" : ""} ${data.status === "error" ? "border-red-500" : ""} ${data.priority === "high" ? "ring-2 ring-yellow-400" : ""}`;
    return (_jsxs("div", { className: nodeClass, children: [_jsx("div", { className: "font-medium", children: data.label }), data.metadata && (_jsx("div", { className: styles.metadataList, children: Object.entries(data.metadata).map(([key, value]) => (_jsxs("div", { children: [key, ": ", value] }, key))) }))] }));
};
const TaskNode = ({ data }) => {
    const nodeClass = `${styles.taskNode} ${data.status === "running" ? "animate-pulse" : ""} ${data.status === "error" ? "border-red-500" : ""}`;
    return (_jsxs("div", { className: nodeClass, children: [_jsx("div", { className: "font-medium", children: data.label }), data.metadata && (_jsx("div", { className: styles.metadataList, children: Object.entries(data.metadata).map(([key, value]) => (_jsxs("div", { children: [key, ": ", value] }, key))) }))] }));
};
const AgentNode = ({ data }) => {
    return (_jsxs("div", { className: styles.agentNode, children: [_jsx("div", { className: "font-medium", children: data.label }), data.status && (_jsxs("div", { className: "text-xs mt-1 flex items-center gap-2", children: [_jsx("div", { className: `${styles.statusIndicator} ${data.status === "running" ? styles.statusRunning : styles.statusIdle}` }), data.status] }))] }));
};
const nodeTypes = {
    default: DefaultNode,
    task: TaskNode,
    agent: AgentNode,
};
function toReactFlowNode(node) {
    return {
        id: node.id,
        type: node.type || "default",
        position: node.position || { x: 0, y: 0 },
        data: node.data,
    };
}
function toReactFlowEdge(edge) {
    return {
        id: edge.id || `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: edge.type || "default",
        animated: edge.animated,
        style: edge.style,
        label: edge.label,
    };
}
export function GraphVisualization({ websocketUrl = "ws://localhost:3000/graph", className = "", showMiniMap = true, showControls = true, darkMode = false, }) {
    const { data, config, loading, error, updateLayout, selectNodes, expandNode, filterGraph, } = useGraphWebSocket({
        url: websocketUrl,
        autoConnect: true,
    });
    const { fitView } = useReactFlow();
    const [memoryAdapter] = useState(() => new MemoryGraphAdapter({ dimensions: 128 }));
    const [suggestedConnections, setSuggestedConnections] = useState([]);
    useEffect(() => {
        const initializeMemory = async () => {
            await memoryAdapter.addNodes(data.nodes);
        };
        initializeMemory();
    }, [data.nodes, memoryAdapter]);
    useEffect(() => {
        const updateSuggestions = async () => {
            if (data.nodes.length === 0)
                return;
            const latestNode = data.nodes[data.nodes.length - 1];
            const suggestions = await memoryAdapter.getSuggestedConnections(latestNode);
            setSuggestedConnections(suggestions);
        };
        updateSuggestions();
    }, [data.nodes, memoryAdapter]);
    const allEdges = useMemo(() => {
        return [...data.edges.map(toReactFlowEdge), ...suggestedConnections];
    }, [data.edges, suggestedConnections]);
    const onNodesChange = useCallback((changes) => {
        changes.forEach((change) => {
            if (change.type === "select") {
                selectNodes(changes
                    .filter((c) => c.type === "select" && 'selected' in c && c.selected)
                    .map((c) => 'id' in c ? c.id : '')
                    .filter(Boolean));
            }
        });
    }, [selectNodes]);
    const onNodeClick = useCallback((_, node) => {
        expandNode(node.id, !node.data.expanded);
    }, [expandNode]);
    const onLayout = useCallback((type) => {
        updateLayout(type);
        setTimeout(() => fitView(), 200);
    }, [updateLayout, fitView]);
    const graphStyles = useMemo(() => ({
        background: darkMode ? "#1a1a1a" : "#ffffff",
        width: "100%",
        height: "100%",
    }), [darkMode]);
    const nodes = useMemo(() => {
        return data.nodes.map((node) => toReactFlowNode(node));
    }, [data.nodes]);
    if (loading) {
        return (_jsx("div", { className: styles.loading, children: _jsx("div", { className: styles.loadingSpinner }) }));
    }
    if (error) {
        return (_jsxs("div", { className: "flex items-center justify-center h-full text-red-500", children: ["Error: ", error.message] }));
    }
    const containerClass = `${styles.graphContainer} ${className} ${darkMode ? styles.darkMode : ""}`;
    return (_jsx("div", { className: containerClass, children: _jsxs(ReactFlow, { nodes: nodes, edges: allEdges, onNodesChange: onNodesChange, onNodeClick: onNodeClick, nodeTypes: nodeTypes, fitView: true, style: graphStyles, defaultViewport: { x: 0, y: 0, zoom: 1 }, minZoom: 0.1, maxZoom: 4, snapToGrid: config.snapToGrid, snapGrid: config.snapGrid, nodesDraggable: config.nodesDraggable, nodesConnectable: config.nodesConnectable, elementsSelectable: config.elementsSelectable, children: [_jsx(Background, { color: darkMode ? "#333333" : "#aaaaaa", gap: 16 }), showControls && _jsx(Controls, {}), showMiniMap && (_jsx(MiniMap, { nodeColor: (n) => {
                        const data = n.data;
                        return data.status === "running" ? "#34d399" : "#3b82f6";
                    }, maskColor: darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)" })), _jsxs(Panel, { position: "top-right", className: "space-y-2", children: [_jsxs("select", { className: styles.layoutSelect, onChange: (e) => onLayout(e.target.value), value: config.layout?.type, "aria-label": "Select layout type", children: [_jsx("option", { value: "dagre", children: "Hierarchical" }), _jsx("option", { value: "force", children: "Force-Directed" }), _jsx("option", { value: "layered", children: "Layered" })] }), _jsxs("select", { className: styles.layoutSelect, onChange: (e) => filterGraph({ types: e.target.value ? [e.target.value] : undefined }), defaultValue: "", "aria-label": "Filter by node type", children: [_jsx("option", { value: "", children: "All Types" }), _jsx("option", { value: "task", children: "Tasks" }), _jsx("option", { value: "agent", children: "Agents" }), _jsx("option", { value: "tool", children: "Tools" }), _jsx("option", { value: "message", children: "Messages" }), _jsx("option", { value: "data", children: "Data" }), _jsx("option", { value: "service", children: "Services" }), _jsx("option", { value: "event", children: "Events" }), _jsx("option", { value: "state", children: "States" })] })] })] }) }));
}

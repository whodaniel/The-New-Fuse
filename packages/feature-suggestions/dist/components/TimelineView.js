"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const date_fns_1 = require("date-fns");
const d3 = __importStar(require("d3"));
const TimelineView = ({ events, branches: _branches, workflows: _workflows, onEventClick, onCreateBranch, onMergeBranch: _onMergeBranch }) => {
    const svgRef = (0, react_1.useRef)(null);
    const [selectedEvent, setSelectedEvent] = (0, react_1.useState)(null);
    const [showBranchForm, setShowBranchForm] = (0, react_1.useState)(false);
    const [newBranchName, setNewBranchName] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        if (!svgRef.current || !events.length)
            return;
        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        // Create hierarchy
        const hierarchy = d3.hierarchy({ id: "root", type: "root", timestamp: "", data: { title: "Root" }, children: events }, d => d.children);
        // Create tree layout
        const treeLayout = d3.tree()
            .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
        const root = treeLayout(hierarchy);
        // Draw links
        const link = d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x);
        g.selectAll("path.link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#999")
            .attr("d", link);
        // Draw nodes
        const nodes = g.selectAll("g.node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.y},${d.x})`);
        // Add circles for nodes
        nodes.append("circle")
            .attr("r", 5)
            .attr("fill", d => {
            switch (d.data.type) {
                case 'SUGGESTION': return '#3b82f6';
                case 'TODO': return '#10b981';
                case 'FEATURE': return '#f59e0b';
                case 'WORKFLOW_STEP': return '#8b5cf6';
                default: return '#6b7280';
            }
        });
        // Add text labels
        nodes.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.children ? -6 : 6)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .text(d => d.data.data.title.substring(0, 20));
        // Add timestamp labels
        nodes.append("text")
            .attr("dy", "1.31em")
            .attr("x", d => d.children ? -6 : 6)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .attr("font-size", "10px")
            .text(d => (0, date_fns_1.format)(new Date(d.data.timestamp), 'MMM d, yyyy'));
        // Filter workflow step nodes (for future use)
        const _workflowSteps = nodes.filter(d => d.data.type === 'WORKFLOW_STEP');
        // Handle node click events
        nodes.on("click", (_event, d) => {
            setSelectedEvent(d.data);
            onEventClick(d.data);
        });
    }, [events, onEventClick]);
    const handleCreateBranch = () => {
        if (selectedEvent && newBranchName) {
            onCreateBranch(selectedEvent.id, newBranchName);
            setShowBranchForm(false);
            setNewBranchName('');
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "relative w-full h-[600px]", children: [(0, jsx_runtime_1.jsx)("svg", { ref: svgRef, className: "w-full h-full" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute top-4 right-4 space-y-2", children: (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowBranchForm(true), disabled: !selectedEvent, className: "px-3 py-1 bg-blue-500 text-white rounded-md disabled:opacity-50", children: "Create Branch" }) }), showBranchForm && ((0, jsx_runtime_1.jsxs)("div", { className: "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium mb-4", children: "Create New Branch" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: newBranchName, onChange: (e) => setNewBranchName(e.target.value), placeholder: "Branch name", className: "block w-full px-3 py-2 border rounded-md mb-4" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end space-x-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowBranchForm(false), className: "px-3 py-1 border rounded-md", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleCreateBranch, className: "px-3 py-1 bg-blue-500 text-white rounded-md", children: "Create" })] })] }))] }));
};
exports.default = TimelineView;
//# sourceMappingURL=TimelineView.js.map
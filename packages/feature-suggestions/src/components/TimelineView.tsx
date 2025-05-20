import React, { useRef, useState, useEffect } from 'react';
import { format } from 'date-fns';
import * as d3 from 'd3';
import { WorkflowStep as TimelineWorkflowStep } from '../types/timeline.js';

interface TimelineEvent {
    id: string;
    parentId?: string;
    type: string;
    timestamp: string;
    mergedFrom?: string[];
    data: {
        title: string;
    };
}

interface TimelineBranch {
    id: string;
    name: string;
    events: string[];
}

interface TimelineWorkflow {
    id: string;
    name: string;
    // Map TimelineWorkflowStep to the expected structure
    steps: Array<{
        id: string;
        name: string;
        status: string;
    }>;
}

interface TimelineViewProps {
    events: TimelineEvent[];
    branches: TimelineBranch[];
    workflows: TimelineWorkflow[];
    onEventClick: (event: TimelineEvent) => void;
    onCreateBranch: (fromEventId: string, name: string) => void;
    onMergeBranch: (fromEventId: string, toEventId: string) => void;
}

// Extending the d3 hierarchy node with explicit x and y coordinates
interface _HierarchyNode extends d3.HierarchyPointNode<TimelineEvent> {
    x: number;
    y: number;
}

const TimelineView: React.FC<TimelineViewProps> = ({
    events,
    branches: _branches,
    workflows: _workflows,
    onEventClick,
    onCreateBranch,
    onMergeBranch: _onMergeBranch
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');

    useEffect(() => {
        if (!svgRef.current || !events.length) return;

        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create hierarchy
        const hierarchy = d3.hierarchy<TimelineEvent>(
            { id: "root", type: "root", timestamp: "", data: { title: "Root" }, children: events } as unknown as TimelineEvent & { children: TimelineEvent[] },
            d => (d as unknown as { children?: TimelineEvent[] }).children
        );

        // Create tree layout
        const treeLayout = d3.tree<TimelineEvent>()
            .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

        const root = treeLayout(hierarchy);

        // Draw links
        const link = d3.linkHorizontal<d3.HierarchyPointLink<TimelineEvent>, d3.HierarchyPointNode<TimelineEvent>>()
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
            .text(d => format(new Date(d.data.timestamp), 'MMM d, yyyy'));

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

    return (
        <div className="relative w-full h-[600px]">
            <svg ref={svgRef} className="w-full h-full" />

            <div className="absolute top-4 right-4 space-y-2">
                <button type="button" onClick={() => setShowBranchForm(true)} disabled={!selectedEvent} className="px-3 py-1 bg-blue-500 text-white rounded-md disabled:opacity-50">
                    Create Branch
                </button>
            </div>

            {showBranchForm && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg font-medium mb-4">Create New Branch</h3>
                    <input type="text" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} placeholder="Branch name" className="block w-full px-3 py-2 border rounded-md mb-4" />
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setShowBranchForm(false)} className="px-3 py-1 border rounded-md">
                            Cancel
                        </button>
                        <button type="button" onClick={handleCreateBranch} className="px-3 py-1 bg-blue-500 text-white rounded-md">
                            Create
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimelineView;

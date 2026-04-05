import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
const WorkflowVisualizer = ({ definition }) => {
    const { nodes, edges } = useMemo(() => {
        const visualizerNodes = [];
        const visualizerEdges = [];
        let yPos = 0;
        const xPosStep = 200;
        const yPosStep = 100;
        // Convert steps Record to array for iteration
        const stepsArray = Object.values(definition.steps || {});
        stepsArray.forEach((step, index) => {
            visualizerNodes.push({
                id: step.id,
                data: { label: `${step.name} (${step.action || step.type})`, type: step.type },
                position: { x: index * xPosStep, y: yPos }, // Simple horizontal layout
                parentIds: [], // Initialize empty array for dependencies
            });
            // Create edges based on workflow relationships
            // Check if this step has dependencies (from older schema) or connections
            if (Array.isArray(step.connections)) {
                step.connections.forEach((connection) => {
                    const parentId = typeof connection === 'string' ? connection : connection.stepId;
                    // Ensure the parent step exists before creating an edge
                    if (stepsArray.some((s) => s.id === parentId)) {
                        visualizerEdges.push({
                            id: `e-${parentId}-${step.id}`,
                            source: parentId,
                            target: step.id,
                        });
                    }
                });
            }
            // Handle conditional logic visualization (e.g., branching)
            if (step.conditions) {
                // Add logic to visualize conditional paths
                // This might involve different edge types or node styling
            }
            // Basic layout adjustment (very naive)
            yPos += yPosStep;
            if (yPos > 300) {
                // Wrap around simple layout
                yPos = 0;
                // Adjust x based on dependencies if needed - complex layout needed here
            }
        });
        // Here you would typically use a layout algorithm (e.g., Dagre)
        // For simplicity, we're using basic positioning above.
        return { nodes: visualizerNodes, edges: visualizerEdges };
    }, [definition]);
    // Render using a library like React Flow or a custom SVG implementation
    return (_jsxs("div", { style: { height: 500, border: '1px solid #ccc' }, children: [_jsx("p", { children: "Workflow Visualization Area" }), _jsx("pre", { children: JSON.stringify({ nodes, edges }, null, 2) })] }));
};
export { WorkflowVisualizer };

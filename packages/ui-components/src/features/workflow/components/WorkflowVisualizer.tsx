import React, { useMemo } from 'react';
import { WorkflowDefinition, WorkflowStep } from '../types.js'; // Added .js extension
import { Card, CardContent } from '../../../core/card/index.js'; // Added .js extension
import { Badge } from '../../../core/badge.js'; // Added .js extension
import { ArrowRight } from 'lucide-react';

interface VisualizerNode {
  id: string;
  data: { label: string; type?: string; status?: string };
  position: { x: number; y: number }; // Position might be calculated by layout algorithm
  // Add other properties needed by the graphing library
  parentIds?: string[]; // Added for dependency tracking
}

interface VisualizerEdge {
  id: string;
  source: string;
  target: string;
  // Add other properties needed by the graphing library
}

interface WorkflowVisualizerProps {
  definition: WorkflowDefinition;
}

const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ definition }) => {
  const { nodes, edges } = useMemo(() => {
    const visualizerNodes: VisualizerNode[] = [];
    const visualizerEdges: VisualizerEdge[] = [];
    let yPos = 0;
    const xPosStep = 200;
    const yPosStep = 100;

    definition.steps.forEach((step: WorkflowStep, index: number) => {
      visualizerNodes.push({
        id: step.id,
        data: { label: `${step.name} (${step.action})`, type: step.type },
        position: { x: index * xPosStep, y: yPos }, // Simple horizontal layout
        parentIds: [] // Initialize empty array for dependencies
      });

      // Create edges based on workflow relationships
      // Check if this step has dependencies (from older schema) or connections
      if (Array.isArray(step.dependencies)) {
        step.dependencies.forEach(parentId: string) => {
          // Ensure the parent step exists before creating an edge
          if (definition.steps.some(s: WorkflowStep) => s.id === parentId)) {
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
      if (yPos > 300) { // Wrap around simple layout
          yPos = 0;
          // Adjust x based on dependencies if needed - complex layout needed here
      }
    });

    // Here you would typically use a layout algorithm (e.g., Dagre)
    // For simplicity, we're using basic positioning above.

    return { nodes: visualizerNodes, edges: visualizerEdges };
  }, [definition]);

  // Render using a library like React Flow or a custom SVG implementation
  return (
    <div style={{ height: 500, border: '1px solid #ccc' }}>
      {/* Placeholder for actual graph rendering */}
      <p>Workflow Visualization Area</p>
      <pre>{JSON.stringify({ nodes, edges }, null, 2)}</pre>
      {/* Example: Render nodes simply */}
      {/* {nodes.map(node => (
        <Card key={node.id} style={{ position: 'absolute', left: node.position.x, top: node.position.y, padding: '10px', border: '1px solid black' }}>
          {node.data.label} <Badge>{node.data.type}</Badge>
        </Card>
      ))} */}
      {/* Example: Render edges simply (needs SVG) */}
    </div>
  );
};

export { WorkflowVisualizer };
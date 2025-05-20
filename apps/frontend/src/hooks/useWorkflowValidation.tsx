import { useCallback, useState } from 'react';
import type { Node, Edge } from '../types/workflow.js';

export const useWorkflowValidation = (): any => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateWorkflow = useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
    const errors: string[] = [];

    // Check for disconnected nodes
    nodes.forEach(nod(e: any) => {
      const hasInputs = edges.some(edg(e: any) => edge.target === node.id);
      const hasOutputs = edges.some(edg(e: any) => edge.source === node.id);

      if (!hasInputs && !hasOutputs) {
        errors.push(`Node "${node.data.label}" is disconnected`);
      }
    });

    // Check for cycles
    const hasCycle = detectCycle(nodes, edges);
    if (hasCycle) {
      errors.push('Workflow contains cycles');
    }

    // Check for required configurations
    nodes.forEach(nod(e: any) => {
      if (node.data.requiredConfig) {
        const missingConfig = node.data.requiredConfig.filter(
          config => !node.data.configuration?.[config]
        );
        if (missingConfig.length > 0) {
          errors.push(
            `Node "${node.data.label}" is missing required configuration: ${missingConfig.join(', ')}`
          );
        }
      }
    });

    setValidationErrors(errors);
  }, []);

  return {
    validationErrors,
    validateWorkflow,
  };
};
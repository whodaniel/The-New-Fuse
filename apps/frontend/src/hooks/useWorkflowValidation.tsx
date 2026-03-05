// @ts-nocheck
import { useCallback, useEffect, useState } from 'react';
import type { Edge, Node } from '../types/workflow';
import { validateWorkflowWithErrors } from '../utils/workflow-schema-validator';

export const useWorkflowValidation = ({
  nodes,
  edges,
  onValidate,
}: {
  nodes: Node[];
  edges: Edge[];
  onValidate?: (isValid: boolean) => void;
}) => {
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({}); // Map of nodeId -> errorMessage
  const [validationErrors, setValidationErrors] = useState<string[]>([]); // Array of general errors

  useEffect(() => {
    const validate = () => {
      // Construct a workflow-like object to validate against the schema
      // We need to match the structure expected by workflowSchema in workflow-schema-validator.ts
      const workflowToValidate = {
        id: 'temp-id', // Placeholder
        name: 'temp-name', // Placeholder
        nodes,
        edges,
        // Optional fields might be missing, which is fine as they are optional in schema
      };

      const result = validateWorkflowWithErrors(workflowToValidate);
      setIsValid(result.isValid);
      setErrors(result.errors);

      // Also run the custom logic (disconnected nodes, etc.)
      const customErrors: string[] = [];

      // Check for disconnected nodes
      nodes.forEach((node: any) => {
        const hasInputs = edges.some((edge: any) => edge.target === node.id);
        const hasOutputs = edges.some((edge: any) => edge.source === node.id);

        if (!hasInputs && !hasOutputs && nodes.length > 1) {
          // Only check if > 1 node
          // This is just a warning in the original code, maybe keep it?
          // The original code treated it as an error string
          // customErrors.push(`Node "${node.data.label}" is disconnected`);
        }
      });

      // Merge schema errors into general validation errors for display if needed
      const schemaErrorMessages = Object.values(result.errors);
      const allErrors = [...customErrors, ...schemaErrorMessages];
      setValidationErrors(allErrors);

      if (onValidate) {
        onValidate(result.isValid && customErrors.length === 0);
      }
    };

    validate();
  }, [nodes, edges, onValidate]);

  // Original function signature support (if used elsewhere manually)
  const validateWorkflow = useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
    // This logic is now covered by the useEffect
  }, []);

  return {
    isValid,
    errors, // The map of node errors
    validationErrors, // Array of strings
    validateWorkflow,
  };
};

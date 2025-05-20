export const nodeTypes = {
  AI_PROCESSING: {
    category: "AI",
    label: "AI Processing",
    isAI: true,
  },
  DATA_TRANSFORMATION: {
    category: "Data",
    label: "Data Transformation",
    isAI: false,
  },
  API_CALL: {
    category: "Integration",
    label: "API Call",
    isAI: false,
  },
  CONDITION: {
    category: "Control",
    label: "Condition",
    isAI: false,
  },
  OUTPUT: {
    category: "Output",
    label: "Output",
    isAI: false,
  },
};

export const connectionTypes = {
  DEFAULT: "default",
  SUCCESS: "success",
  FAILURE: "failure",
};

export interface NodeConfig {
  id: string;
  type: keyof typeof nodeTypes;
  category: string;
  label: string;
  isAI: boolean;
  position: { x: number; y: number };
  inputs?: string[];
  outputs?: string[];
}

export interface EdgeConfig {
  id: string;
  source: string;
  target: string;
  type: typeof connectionTypes;
  animated?: boolean;
  label?: string;
}

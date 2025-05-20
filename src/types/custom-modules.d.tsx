// Custom module declarations for missing types

// For @prisma/extension-accelerate
declare module "@prisma/extension-accelerate" {
  import { Prisma } from "@the-new-fuse/database/client";

  export function accelerate(): Prisma.Middleware;
}

// For d3
declare module "d3" {
  export * from "d3-selection";
  export * from "d3-scale";
  export * from "d3-axis";
  export * from "d3-array";
  export * from "d3-transition";
  export * from "d3-drag";
  export * from "d3-zoom";
  export * from "d3-shape";
}

// For reactflow
declare module "reactflow" {
  export interface Node {
    id: string;
    position: { x: number; y: number };
    data: unknown;
    type?: string;
  }

  export interface Edge {
    id: string;
    source: string;
    target: string;
    type?: string;
    label?: string;
    data?: unknown;
  }

  export interface ReactFlowProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange?: (changes: unknown) => void;
    onEdgesChange?: (changes: unknown) => void;
    onConnect?: (connection: unknown) => void;
  }

  export function ReactFlow(props: ReactFlowProps): JSX.Element;
}

// For @the-new-fuse/feature-tracker
declare module "@the-new-fuse/feature-tracker" {
  export interface Feature {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface TimelineEntry {
    id: string;
    featureId: string;
    timestamp: Date;
    event: string;
    details: Record<string, any>;
  }
}

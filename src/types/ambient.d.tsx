// Global ambient declarations for all external modules

// Fix module import issues
declare module "@the-new-fuse/types" {
  export enum TaskStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
  }

  export enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent",
  }

  export enum TaskType {
    ROUTINE = "routine",
    ONETIME = "onetime",
    RECURRING = "recurring",
    DEPENDENT = "dependent",
    BACKGROUND = "background",
  }

  export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    type: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface CreateTaskDto {
    title: string;
    description?: string;
    priority?: string;
    type?: string;
  }

  export interface User {
    token?: string;
    token?: string;
    id: string;
    email: string;
    token?: string;
  }
}

// Fix OpenAI type issues
declare module "openai" {
  interface OpenAIOptions {
    apiKey: string;
    [key: string]: unknown;
  }

  class OpenAI {
    constructor(options: OpenAIOptions);
    chat: {
      completions: {
        create: (options: unknown) => Promise<any>;
      };
    };
  }

  export default OpenAI;
}

// Fix React Flow type issues
declare module "reactflow" {
  import { ComponentType } from "react";

  export interface ReactFlowProps {
    nodes: unknown[];
    edges: unknown[];
    onNodesChange?: (changes: unknown) => void;
    onEdgesChange?: (changes: unknown) => void;
    onConnect?: (connection: unknown) => void;
    [key: string]: unknown;
  }

  export const ReactFlow: ComponentType<ReactFlowProps>;
  export const Background: ComponentType<any>;
  export const MiniMap: ComponentType<any>;
  export const Controls: ComponentType<any>;
  export const Panel: ComponentType<any>;

  export function useNodesState(
    initialNodes: unknown[],
  ): [any[], (nodes: unknown[]) => void];
  export function useEdgesState(
    initialEdges: unknown[],
  ): [any[], (edges: unknown[]) => void];

  export default ReactFlow;
}

// Fix missing modules by allowing any import
declare module "*";

// Fix browser API issues
interface Window {
  SpeechRecognition: unknown;
  webkitSpeechRecognition: unknown;
}

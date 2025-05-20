import { ReactNode } from 'react';
export interface AllTheProvidersProps {
    children: ReactNode;
}
export interface Position {
    x: number;
    y: number;
}
export interface NodeData {
    label: string;
    [key: string]: unknown;
}
export interface MockNode {
    id: string;
    type: string;
    position: Position;
    data: NodeData;
    selected?: boolean;
    dragging?: boolean;
}
export interface MockEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    selected?: boolean;
    animated?: boolean;
}
export interface MockUser {
    id: string;
    name: string;
    email: string;
    roles?: string[];
    preferences?: Record<string, unknown>;
}
export interface MockWorkflow {
    id: string;
    name: string;
    nodes: MockNode[];
    edges: MockEdge[];
    version?: string;
    metadata?: Record<string, unknown>;
}
export interface AuthContextValue {
    user: MockUser | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    error: Error | null;
}
export interface WorkflowContextValue {
    workflows: MockWorkflow[];
    currentWorkflow: MockWorkflow | null;
    setCurrentWorkflow: (workflow: MockWorkflow) => void;
    addWorkflow: (workflow: MockWorkflow) => Promise<void>;
    updateWorkflow: (id: string, workflow: Partial<MockWorkflow>) => Promise<void>;
    deleteWorkflow: (id: string) => Promise<void>;
    loading: boolean;
    error: Error | null;
}

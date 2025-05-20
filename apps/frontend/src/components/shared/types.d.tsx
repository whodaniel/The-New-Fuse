import { ReactNode } from 'react';
import { SxProps, Theme } from '@mui/material';
export interface BaseComponentProps {
    className?: string;
    sx?: SxProps<Theme>;
    children?: ReactNode;
}
export interface LoadingState {
    isLoading: boolean;
    loadingMessage?: string;
}
export interface ErrorState {
    hasError: boolean;
    errorMessage?: string;
}
export interface DataState<T> extends LoadingState, ErrorState {
    data?: T;
}
export interface PaginationState {
    page: number;
    pageSize: number;
    totalItems: number;
}
export interface SortState {
    sortBy: string;
    sortDirection: 'asc' | 'desc';
}
export interface FilterState {
    filters: Record<string, any>;
}
export interface TableState extends PaginationState, SortState, FilterState {
}
export interface GraphNode {
    id: string;
    label: string;
    type: string;
    data: Record<string, any>;
    position: {
        x: number;
        y: number;
    };
    style?: Record<string, any>;
    selected?: boolean;
    dragging?: boolean;
}
export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    type?: string;
    data?: Record<string, any>;
    style?: Record<string, any>;
    selected?: boolean;
}
export interface GraphLayout {
    type: 'force' | 'circular' | 'hierarchical' | 'grid';
    options?: Record<string, any>;
}
export interface GraphConfig {
    layout: GraphLayout;
    physics: {
        enabled: boolean;
        stabilization: boolean;
        repulsion: number;
        springLength: number;
    };
    interaction: {
        dragNodes: boolean;
        dragView: boolean;
        zoomView: boolean;
        selectable: boolean;
        multiselect: boolean;
    };
    styles: {
        node: Record<string, any>;
        edge: Record<string, any>;
        selected: Record<string, any>;
    };
}
export interface WizardStep {
    id: string;
    title: string;
    description?: string;
    component: ReactNode;
    isOptional?: boolean;
    isCompleted?: boolean;
    validation?: () => Promise<boolean>;
}
export interface WizardConfig {
    steps: WizardStep[];
    allowSkip?: boolean;
    allowBack?: boolean;
    showStepNumbers?: boolean;
    showProgress?: boolean;
}
export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    parameters: Record<string, any>;
    isEnabled: boolean;
}
export interface AgentMetrics {
    performance: number;
    accuracy: number;
    latency: number;
    resourceUsage: number;
}
export interface AgentConfig {
    id: string;
    name: string;
    type: string;
    capabilities: AgentCapability[];
    metrics: AgentMetrics;
    settings: Record<string, any>;
}

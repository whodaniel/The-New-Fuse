import React, { FC } from "react";
export interface BaseWorkspaceProps {
    header?: React.ReactNode;
    sidebar?: React.ReactNode;
    main: React.ReactNode;
    sidebarWidth?: string;
    className?: string;
    theme?: 'light' | 'dark';
    onLayoutChange?: (layout: WorkspaceLayout) => void;
    tools?: WorkspaceTool[];
}
export interface WorkspaceLayout {
    sidebarVisible: boolean;
    sidebarWidth: string;
    headerVisible: boolean;
}
export type WorkspaceTool = 'chat' | 'canvas' | 'flowchart' | 'codeEditor' | 'whiteboard' | 'documentViewer';
export declare const BaseWorkspace: FC<BaseWorkspaceProps>;

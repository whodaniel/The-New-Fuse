import React from 'react';

export interface BaseWorkspaceProps {
  children?: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export interface WorkspaceContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
}

declare const BaseWorkspace: React.FC<BaseWorkspaceProps>;

export default BaseWorkspace;

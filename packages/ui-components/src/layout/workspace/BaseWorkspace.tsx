import React, { FC } from "react";

// Create a mock Split component to replace the external import
interface SplitProps {
  children: React.ReactNode;
  onChange?: (sizes: number[]) => void;
}

const Split: FC<SplitProps> = ({ children, onChange }) => {
  // Simple mock implementation
  React.useEffect(() => {
    // Simulate initial sizes
    onChange?.([50, 50]);
  }, [onChange]);

  return (
    <div className="flex flex-row">
      {React.Children.map(children, (child, index) => (
        <div key={index} className="flex-1">
          {child}
        </div>
      ))}
    </div>
  );
};

// Create mock ThemeProvider and WorkspaceProvider components
interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

const ThemeProvider: FC<ThemeProviderProps> = ({ children, theme }) => {
  return (
    <div className={`theme-provider theme-${theme}`}>
      {children}
    </div>
  );
};

interface WorkspaceProviderProps {
  children: React.ReactNode;
  tools?: WorkspaceTool[];
}

const WorkspaceProvider: FC<WorkspaceProviderProps> = ({ children, tools }) => {
  return (
    <div className="workspace-provider">
      {children}
    </div>
  );
};

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

export type WorkspaceTool = 
  | 'chat'
  | 'canvas'
  | 'flowchart'
  | 'codeEditor'
  | 'whiteboard'
  | 'documentViewer';

export const BaseWorkspace: FC<BaseWorkspaceProps> = ({
  header,
  sidebar,
  main,
  sidebarWidth = 'w-1/4',
  className = '',
  theme = 'light',
  onLayoutChange,
  tools = []
}) => {
  return (
    <ThemeProvider theme={theme}>
      <WorkspaceProvider tools={tools}>
        <div className={`workspace ${className} bg-workspace-bg`}>
          {header && (
            <div className="workspace-header border-b border-workspace-border">
              {header}
            </div>
          )}
          <Split
            onChange={(sizes: number[]) => {
              onLayoutChange?.({
                sidebarVisible: !!sidebar,
                sidebarWidth: `w-[${sizes[1]}%]`,
                headerVisible: !!header
              });
            }}
          >
            <div className="workspace-main flex-1 bg-workspace-main">
              {main}
            </div>
            {sidebar && (
              <div className={`workspace-sidebar ${sidebarWidth} bg-workspace-sidebar`}>
                {sidebar}
              </div>
            )}
          </Split>
        </div>
      </WorkspaceProvider>
    </ThemeProvider>
  );
};
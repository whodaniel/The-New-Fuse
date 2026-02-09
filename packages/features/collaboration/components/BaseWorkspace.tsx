import React, { FC } from 'react';
import { Split } from '@/components/ui/split';

interface BaseWorkspaceProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  sidebarWidth?: string;
  className?: string;
}

export const BaseWorkspace: FC<BaseWorkspaceProps> = ({
  header,
  sidebar,
  main,
  sidebarWidth = 'w-1/4',
  className = ''
}) => {
  return (
    <div className={`workspace ${className}`}>
      {header && <div className="workspace-header">{header}</div>}
      <Split>
        <div className={`workspace-main flex-1`}>{main}</div>
        {sidebar && <div className={`workspace-sidebar ${sidebarWidth}`}>{sidebar}</div>}
      </Split>
    </div>
  );
};
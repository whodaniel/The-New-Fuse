import React, { FC } from 'react';
interface BaseWorkspaceProps {
    header?: React.ReactNode;
    sidebar?: React.ReactNode;
    main: React.ReactNode;
    sidebarWidth?: string;
    className?: string;
}
export declare const BaseWorkspace: FC<BaseWorkspaceProps>;
export {};

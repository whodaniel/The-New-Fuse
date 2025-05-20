import React from 'react';
import type { SidebarItem as SidebarItemType } from './types.js';
interface SidebarItemProps extends SidebarItemType {
    active?: boolean;
    expanded?: boolean;
}
export declare function SidebarItem({ icon: Icon, label, onClick, view, disabled, tooltip, active, expanded }: SidebarItemProps): React.JSX.Element;
export {};

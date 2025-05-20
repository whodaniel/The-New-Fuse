import { LucideIcon } from 'lucide-react';
export interface SidebarItem {
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
    view?: string;
    disabled?: boolean;
    tooltip?: string;
}
export interface SidebarProps {
    items: SidebarItem[];
    bottomItems?: SidebarItem[];
    activeView?: string;
    onViewChange?: (view: string) => void;
    className?: string;
    expanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    width?: {
        expanded: string;
        collapsed: string;
    };
}

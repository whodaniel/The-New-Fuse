import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Sidebar variants using class-variance-authority
 */
export declare const sidebarVariants: (props?: ({
    variant?: "default" | "ghost" | "elevated" | null | undefined;
    width?: "default" | "sm" | "lg" | "collapsed" | null | undefined;
    position?: "left" | "right" | null | undefined;
    mobile?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Sidebar component props
 */
export interface SidebarProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof sidebarVariants> {
    /**
     * Whether the sidebar is open (for mobile)
     */
    open?: boolean;
    /**
     * Callback when the sidebar is closed
     */
    onClose?: () => void;
    /**
     * Navigation items
     */
    items?: Array<{
        label: string;
        href: string;
        icon?: React.ReactNode;
        key?: string;
        active?: boolean;
    }>;
    /**
     * Callback when a navigation item is clicked
     */
    onNavigate?: (href: string) => void;
    /**
     * Whether the sidebar is collapsible
     */
    collapsible?: boolean;
    /**
     * Whether the sidebar is collapsed
     */
    collapsed?: boolean;
    /**
     * Callback when the sidebar is collapsed or expanded
     */
    onCollapse?: (collapsed: boolean) => void;
    /**
     * Header content
     */
    header?: React.ReactNode;
    /**
     * Footer content
     */
    footer?: React.ReactNode;
}
/**
 * Sidebar component for navigation
 *
 * @example
 * // Basic usage
 * <Sidebar>
 *   <nav>Navigation content</nav>
 * </Sidebar>
 *
 * // With navigation items
 * <Sidebar
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'About', href: '/about' },
 *   ]}
 *   onNavigate={(href) => navigate(href)}
 * />
 *
 * // Collapsible sidebar
 * <Sidebar
 *   collapsible
 *   collapsed={isCollapsed}
 *   onCollapse={(collapsed) => setIsCollapsed(collapsed)}
 * />
 *
 * // Mobile sidebar
 * <Sidebar
 *   mobile
 *   open={isSidebarOpen}
 *   onClose={() => setIsSidebarOpen(false)}
 * />
 */
declare const Sidebar: React.ForwardRefExoticComponent<SidebarProps & React.RefAttributes<HTMLElement>>;
export { Sidebar };
//# sourceMappingURL=Sidebar.d.ts.map
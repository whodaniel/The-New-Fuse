import * as React from 'react';
/**
 * Layout component props
 */
export interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Whether to show the sidebar
     * @default true
     */
    sidebar?: boolean | React.ReactNode;
    /**
     * Whether to show the header
     * @default true
     */
    header?: boolean | React.ReactNode;
    /**
     * Whether to show the footer
     * @default true
     */
    footer?: boolean | React.ReactNode;
    /**
     * Navigation items for the sidebar
     */
    navigation?: Array<{
        label: string;
        href: string;
        icon?: React.ReactNode;
        key?: string;
    }>;
    /**
     * Current path for highlighting active navigation item
     */
    currentPath?: string;
    /**
     * User object for the header
     */
    user?: {
        name?: string;
        email?: string;
        avatar?: string;
    };
    /**
     * Callback when navigation item is clicked
     */
    onNavigate?: (href: string) => void;
    /**
     * Callback when logout button is clicked
     */
    onLogout?: () => void;
    /**
     * Callback when profile button is clicked
     */
    onProfile?: () => void;
    /**
     * Callback when settings button is clicked
     */
    onSettings?: () => void;
    /**
     * Footer links
     */
    footerLinks?: Array<{
        label: string;
        href: string;
    }>;
}
/**
 * Layout component for creating a standard page layout with header, sidebar, and footer
 *
 * @example
 * // Basic usage
 * <Layout>
 *   <p>Content goes here</p>
 * </Layout>
 *
 * // With custom sidebar and header
 * <Layout
 *   sidebar={<CustomSidebar />}
 *   header={<CustomHeader />}
 * >
 *   <p>Content goes here</p>
 * </Layout>
 *
 * // With navigation
 * <Layout
 *   navigation={[
 *     { label: 'Home', href: '/' },
 *     { label: 'About', href: '/about' },
 *   ]}
 *   currentPath="/"
 *   onNavigate={(href) => navigate(href)}
 * >
 *   <p>Content goes here</p>
 * </Layout>
 */
declare const Layout: React.ForwardRefExoticComponent<LayoutProps & React.RefAttributes<HTMLDivElement>>;
export { Layout };
//# sourceMappingURL=Layout.d.ts.map
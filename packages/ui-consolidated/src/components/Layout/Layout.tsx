import * as React from 'react';
import { cn } from '../../utils';

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
const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({
    className,
    children,
    sidebar = true,
    header = true,
    footer = true,
    navigation = [],
    currentPath = '',
    user,
    onNavigate,
    onLogout,
    onProfile,
    onSettings,
    footerLinks = [],
    ...props
  }, ref) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    
    // Default header component
    const defaultHeader = (
      <header className="bg-background border-b h-16 flex items-center justify-between px-4">
        <div className="flex items-center">
          <button
            type="button"
            className="lg:hidden mr-2 p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="text-xl font-semibold">The New Fuse</div>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  {user.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden md:block">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
            
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={onSettings}
              >
                <span className="sr-only">Settings</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
            
            <button
              type="button"
              className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={onLogout}
            >
              <span className="sr-only">Logout</span>
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        )}
      </header>
    );
    
    // Default sidebar component
    const defaultSidebar = (
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="text-xl font-semibold">The New Fuse</div>
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sr-only">Close sidebar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <a
              key={item.key || item.href}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-2 text-sm font-medium rounded-md',
                currentPath === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.(item.href);
                setSidebarOpen(false);
              }}
            >
              {item.icon && <span className="mr-3">{item.icon}</span>}
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
    );
    
    // Default footer component
    const defaultFooter = (
      <footer className="bg-background border-t py-4 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} The New Fuse. All rights reserved.
          </div>
          
          {footerLinks.length > 0 && (
            <div className="flex space-x-4 mt-4 md:mt-0">
              {footerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.(link.href);
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>
    );
    
    return (
      <div
        ref={ref}
        className={cn('min-h-screen bg-background flex flex-col', className)}
        {...props}
      >
        {/* Header */}
        {header && (typeof header === 'boolean' ? defaultHeader : header)}
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {sidebar && (typeof sidebar === 'boolean' ? defaultSidebar : sidebar)}
          
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
        
        {/* Footer */}
        {footer && (typeof footer === 'boolean' ? defaultFooter : footer)}
        
        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    );
  }
);

Layout.displayName = 'Layout';

export { Layout };

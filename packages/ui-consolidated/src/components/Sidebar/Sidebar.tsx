import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

/**
 * Sidebar variants using class-variance-authority
 */
export const sidebarVariants = cva(
  'h-full bg-background border-r',
  {
    variants: {
      variant: {
        default: 'border-border',
        ghost: 'border-transparent',
        elevated: 'border-none shadow-lg',
      },
      width: {
        default: 'w-64',
        sm: 'w-48',
        lg: 'w-80',
        collapsed: 'w-16',
      },
      position: {
        left: 'left-0',
        right: 'right-0 border-l border-r-0',
      },
      mobile: {
        true: 'fixed inset-y-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto',
        false: 'relative',
      },
    },
    compoundVariants: [
      {
        mobile: true,
        position: 'left',
        className: 'left-0',
      },
      {
        mobile: true,
        position: 'right',
        className: 'right-0',
      },
    ],
    defaultVariants: {
      variant: 'default',
      width: 'default',
      position: 'left',
      mobile: false,
    },
  }
);

/**
 * Sidebar component props
 */
export interface SidebarProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sidebarVariants> {
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
const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({
    className,
    variant,
    width,
    position,
    mobile,
    open,
    onClose,
    items = [],
    onNavigate,
    collapsible = false,
    collapsed = false,
    onCollapse,
    header,
    footer,
    children,
    ...props
  }, ref) => {
    // Handle collapse toggle
    const handleCollapseToggle = () => {
      onCollapse?.(!collapsed);
    };
    
    // Default header
    const defaultHeader = (
      <div className="h-16 flex items-center justify-between px-4 border-b">
        {!collapsed && <div className="text-xl font-semibold">The New Fuse</div>}
        {mobile && (
          <button
            type="button"
            className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={onClose}
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
        )}
        {collapsible && !mobile && (
          <button
            type="button"
            className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleCollapseToggle}
          >
            <span className="sr-only">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {collapsed ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              )}
            </svg>
          </button>
        )}
      </div>
    );
    
    // Determine sidebar width based on collapsed state
    const sidebarWidth = collapsed ? 'collapsed' : width;
    
    // Determine mobile transform class
    const mobileTransformClass = mobile
      ? open
        ? 'translate-x-0'
        : position === 'left'
        ? '-translate-x-full'
        : 'translate-x-full'
      : '';
    
    return (
      <>
        <aside
          ref={ref}
          className={cn(
            sidebarVariants({ variant, width: sidebarWidth, position, mobile }),
            mobileTransformClass,
            className
          )}
          role="navigation"
          aria-label="Sidebar navigation"
          tabIndex={-1}
          {...props}
        >
          {/* Header */}
          {header || defaultHeader}
          
          {/* Navigation */}
          {items.length > 0 && (
            <nav className="p-4 space-y-1" aria-label="Sidebar main navigation">
              {items.map((item, itemIdx) => (
                <a
                  key={item.key || item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    item.active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.(item.href);
                    mobile && onClose?.();
                  }}
                  aria-current={item.active ? 'page' : undefined}
                  tabIndex={0}
                  role="menuitem"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigate?.(item.href);
                      mobile && onClose?.();
                    }
                  }}
                >
                  {item.icon && (
                    <span className={cn('flex-shrink-0', !collapsed && 'mr-3')} aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  {!collapsed && <span>{item.label}</span>}
                </a>
              ))}
            </nav>
          )}
          
          {/* Content */}
          {children && <div className="p-4">{children}</div>}
          
          {/* Footer */}
          {footer && <div className="mt-auto p-4 border-t">{footer}</div>}
        </aside>
        
        {/* Overlay for mobile */}
        {mobile && open && (
          <div
            className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
            onClick={onClose}
          />
        )}
      </>
    );
  }
);

Sidebar.displayName = 'Sidebar';

export { Sidebar };

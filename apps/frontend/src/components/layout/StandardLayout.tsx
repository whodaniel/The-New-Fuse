// @ts-nocheck
/**
 * Standard Layout System for The New Fuse
 * This layout provides consistent structure across all application pages
 */

import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import React, { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface StandardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; path: string }[];
  showSidebar?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  containerClass?: string;
}

const StandardLayout = ({
  children,
  title,
  subtitle,
  breadcrumbs,
  showSidebar = true,
  showHeader = true,
  showFooter = true,
  containerClass = 'max-w-6xl mx-auto',
}: StandardLayoutProps) => {
  // Safely get theme, defaulting to 'light' if ThemeProvider is not available
  let themeMode: 'light' | 'dark' | 'system' = 'light';
  try {
    const themeContext = useTheme();
    themeMode = themeContext?.theme?.mode || 'light';
  } catch {
    // ThemeProvider not available, use default theme
  }

  return (
    <div className={`min-h-screen bg-transparent ${themeMode === 'dark' ? 'dark' : ''}`}>
      {/* Header */}
      {showHeader && <Header />}

      <div className="flex flex-1">
        {/* Sidebar */}
        {showSidebar && (
          <div className="hidden md:block w-56 flex-shrink-0">
            <Sidebar />
          </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-auto ${showSidebar ? 'md:ml-56' : ''}`}>
          <div className="p-4 sm:p-4 lg:p-4">
            {/* Breadcrumb Navigation */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="mb-6">
                <BreadcrumbNavigation items={breadcrumbs} />
              </div>
            )}

            {/* Page Header */}
            {(title || subtitle) && (
              <div className="mb-6">
                <PageHeader title={title} subtitle={subtitle} />
              </div>
            )}

            {/* Content Container */}
            <div className={containerClass}>{children}</div>
          </div>
        </main>
      </div>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};

// Enhanced Sidebar Component
const EnhancedSidebar = () => {
  return (
    <div className="h-full bg-slate-950/30 backdrop-blur-xl border-r border-white/10 flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold">The New Fuse</h2>
      </div>

      <nav className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {/* Navigation items would go here */}
          <SidebarItem icon="🏠" label="Dashboard" path="/dashboard" />
          <SidebarItem icon="🤖" label="Agents" path="/agents" />
          <SidebarItem icon="📊" label="Analytics" path="/analytics" />
          <SidebarItem icon="⚙️" label="Settings" path="/settings" />
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <SidebarItem icon="👤" label="Profile" path="/profile" />
        <SidebarItem icon="🔒" label="Logout" path="/auth/logout" />
      </div>
    </div>
  );
};

// Sidebar Item Component
interface SidebarItemProps {
  icon: string;
  label: string;
  path: string;
  active?: boolean;
}

const SidebarItem = ({ icon, label, path, active = false }: SidebarItemProps) => {
  return (
    <a
      href={path}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </a>
  );
};

// Enhanced Header Component
const EnhancedHeader = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-900/40">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">The New Fuse</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* User menu and notifications would go here */}
          <button className="relative rounded-full w-8 h-8 bg-muted flex items-center justify-center">
            🔔
          </button>
          <button className="relative rounded-full w-8 h-8 bg-muted flex items-center justify-center">
            👤
          </button>
        </div>
      </div>
    </header>
  );
};

// Breadcrumb Navigation Component
interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
}

const BreadcrumbNavigation = ({ items }: BreadcrumbNavigationProps) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          <a href={item.path} className="hover:text-foreground transition-colors">
            {item.label}
          </a>
          {index < items.length - 1 && <span className="text-muted-foreground">/</span>}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Page Header Component
interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center space-x-2 mt-4 sm:mt-0">{actions}</div>}
    </div>
  );
};

// Responsive Grid System
interface GridProps {
  children: ReactNode;
  cols?: number | number[];
  _gap?: number;
  className?: string;
}

const ResponsiveGrid = ({ children, cols = [1, 2, 3, 4], _gap = 6, className }: GridProps) => {
  const gridClasses = Array.isArray(cols)
    ? `grid-cols-1 sm:grid-cols-${cols[1]} md:grid-cols-${cols[2]} lg:grid-cols-${cols[3]}`
    : `grid-cols-1 sm:grid-cols-${cols} md:grid-cols-${cols} lg:grid-cols-${cols}`;

  return <div className={cn('grid gap-4', gridClasses, className)}>{children}</div>;
};

// Empty State Component
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

const EmptyState = ({ title, description, icon, actions }: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">{icon || '📦'}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1">{description}</p>
      {actions && <div className="mt-4 flex justify-center">{actions}</div>}
    </div>
  );
};

// Loading State Component
const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
};

// Error State Component
interface ErrorStateProps {
  title?: string;
  message?: string;
  retryAction?: () => void;
}

const ErrorState = ({
  title = 'Error',
  message = 'Something went wrong',
  retryAction,
}: ErrorStateProps) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-4 h-12 w-12 text-danger">⚠️</div>
      <h3 className="text-lg font-semibold text-danger">{title}</h3>
      <p className="text-muted-foreground mt-1">{message}</p>
      {retryAction && (
        <button onClick={retryAction} className="mt-4 btn btn-outline btn-sm">
          Try Again
        </button>
      )}
    </div>
  );
};

// Export default
export default StandardLayout;

// Export named components (including StandardLayout for compatibility)
export {
  BreadcrumbNavigation,
  EmptyState,
  EnhancedHeader,
  EnhancedSidebar,
  ErrorState,
  LoadingState,
  PageHeader,
  ResponsiveGrid,
  StandardLayout,
};
